import { generatePtnPtsVokasiAdvice } from "@/lib/recommendation/advice";
import { majorsById, type Major as KnowledgeMajor } from "../../../data";
import { aspirationFlags } from "@/lib/recommendation/aspirationThemes";
import {
  geminiResponseSchema,
  getGeminiRequestConfig,
  parseGeminiNarrative,
  validateGeminiNarrative,
  withGeminiDeadline,
  type GeminiNarrativePayload,
} from "@/lib/recommendation/geminiResponse";
import type {
  CareerPersonalization,
  EnhancedNarrative,
  RecommendationReport,
  RecommendationResult,
  StudentAnswer,
} from "@/lib/types";

export const HEURISTIC_NARRATIVE_VERSION = "heuristic-template-v2.1.0";

export interface RecommendationNarrativeEnhancer {
  enhance(input: {
    answers: StudentAnswer;
    recommendations: RecommendationResult[];
  }): Promise<EnhancedNarrative>;
}

export class HeuristicTemplateNarrativeEnhancer implements RecommendationNarrativeEnhancer {
  async enhance({
    answers,
    recommendations,
  }: {
    answers: StudentAnswer;
    recommendations: RecommendationResult[];
  }): Promise<EnhancedNarrative> {
    const top = recommendations[0];
    return {
      summary: top
        ? `Rekomendasi utama untuk ${answers.fullName} adalah ${top.majorName} dengan skor kecocokan ${top.overallFitScore}/100.`
        : "Belum ada rekomendasi yang bisa ditampilkan.",
      studentStrengths: buildStudentStrengthHighlights(answers, top),
      recommendationReasons: Object.fromEntries(
        recommendations.map((recommendation) => [
          recommendation.majorId,
          recommendation.reasonBullets,
        ]),
      ),
      careerPersonalizations: Object.fromEntries(
        recommendations.map((recommendation) => [
          recommendation.majorId,
          fallbackCareerPersonalization(recommendation, answers),
        ]),
      ),
      source: "heuristic",
    };
  }
}

export class GeminiNarrativeEnhancer implements RecommendationNarrativeEnhancer {
  async enhance({
    answers,
    recommendations,
  }: {
    answers: StudentAnswer;
    recommendations: RecommendationResult[];
  }): Promise<EnhancedNarrative> {
    if (process.env.ENABLE_GEMINI_ENHANCEMENT !== "true") {
      throw new Error("Gemini enhancement is disabled for the MVP.");
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
    const { timeoutMs, maxOutputTokens } = getGeminiRequestConfig();
    return withGeminiDeadline(async signal => {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          signal,
          headers: {
            "content-type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text: "Kamu adalah konselor jurusan untuk siswa SMA/SMK Indonesia. Kamu hanya boleh menulis ulang analisis naratif. Jangan mengubah ranking, majorId, skor, label, atau rekomendasi. Nada harus hangat, konstruktif, tidak menakut-nakuti tentang AI, dan semua teks dalam Bahasa Indonesia.",
                },
              ],
            },
            contents: [
              {
                role: "user",
                parts: [{ text: buildGeminiPrompt(answers, recommendations) }],
              },
            ],
            generationConfig: {
              temperature: 0.35,
              maxOutputTokens,
              responseMimeType: "application/json",
              responseSchema: geminiResponseSchema(recommendations.map(r => r.majorId)),
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Gemini request failed: ${response.status}`,
        );
      }

      const data = (await response.json().catch(() => {
        throw new Error("Gemini response envelope is not valid JSON.");
      })) as GeminiGenerateContentResponse;
      const candidate = data?.candidates?.[0];
      if (candidate?.finishReason === "MAX_TOKENS")
        throw new Error("Gemini finish reason MAX_TOKENS: narrative output was incomplete; retry with concise output within the existing budget.");
      if (candidate?.finishReason !== "STOP")
        throw new Error("Gemini response did not finish with STOP; no complete narrative was accepted.");
      const parts = candidate.content?.parts;
      if (!Array.isArray(parts) || parts.some(part => !part || typeof part.text !== "string"))
        throw new Error("Gemini returned missing or invalid narrative text parts.");
      const text = parts.map((part) => part.text ?? "")
        .join("\n")
        .trim();
      if (!text) throw new Error("Gemini returned empty narrative.");

      const parsed = parseGeminiNarrative(text, recommendations.map(r => r.majorId));
      return sanitizeGeminiNarrative(parsed, recommendations, model);
    }, timeoutMs);
  }
}

export async function enhanceRecommendationReport(
  answers: StudentAnswer,
  report: RecommendationReport,
): Promise<RecommendationReport> {
  const enhancer =
    process.env.ENABLE_GEMINI_ENHANCEMENT === "true"
      ? new GeminiNarrativeEnhancer()
      : new HeuristicTemplateNarrativeEnhancer();

  try {
    const narrative = await enhancer.enhance({
      answers,
      recommendations: report.recommendations,
    });

    return applyNarrativeToReport(report, narrative);
  } catch (error) {
    console.warn(
      "[WARN] Narrative enhancement failed, using heuristic template.",
      error,
    );
    const fallback = await new HeuristicTemplateNarrativeEnhancer().enhance({
      answers,
      recommendations: report.recommendations,
    });
    return applyNarrativeToReport(report, fallback);
  }
}

export async function buildHeuristicNarrativeReport(
  answers: StudentAnswer,
  report: RecommendationReport,
): Promise<RecommendationReport> {
  const narrative = await new HeuristicTemplateNarrativeEnhancer().enhance({
    answers,
    recommendations: report.recommendations,
  });
  return applyNarrativeToReport(report, narrative);
}

export async function enhanceRecommendationReportWithGemini(
  answers: StudentAnswer,
  report: RecommendationReport,
): Promise<RecommendationReport> {
  const narrative = await new GeminiNarrativeEnhancer().enhance({
    answers,
    recommendations: report.recommendations,
  });
  return applyNarrativeToReport(report, narrative);
}

export function applyNarrativeToReport(
  report: RecommendationReport,
  narrative: EnhancedNarrative,
): RecommendationReport {
  const recommendations = report.recommendations.map((recommendation) => {
    const personalization =
      narrative.careerPersonalizations?.[recommendation.majorId];

    return {
      ...recommendation,
      reasonBullets:
        narrative.recommendationReasons[recommendation.majorId] ??
        recommendation.reasonBullets,
      personalizedCareerDirection:
        personalization?.personalizedCareerDirection ??
        recommendation.personalizedCareerDirection,
      nicheCareerPaths:
        personalization?.nicheCareerPaths ?? recommendation.nicheCareerPaths,
      careerPersonalizationReason:
        personalization?.reason ?? recommendation.careerPersonalizationReason,
      aspirationReflection:
        personalization?.aspirationReflection ??
        recommendation.aspirationReflection,
      careerPathwayAdvice:
        personalization?.pathwayAdvice ?? recommendation.careerPathwayAdvice,
      careerCautions:
        personalization?.cautions ?? recommendation.careerCautions,
    };
  });

  return {
    ...report,
    topRecommendation: recommendations[0],
    recommendations,
    narrativeVersion:
      narrative.source === "gemini"
        ? `gemini:${narrative.model ?? "unknown"}`
        : report.narrativeVersion?.startsWith("gemini:")
          ? HEURISTIC_NARRATIVE_VERSION : report.narrativeVersion,
    narrative,
  };
}

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    finishReason?: string;
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

function buildGeminiPrompt(
  answers: StudentAnswer,
  recommendations: RecommendationResult[],
) {
  const compactRecommendations = recommendations.map((recommendation) => ({
    rank: recommendation.rank,
    degreeTypes: recommendation.degreeTypes ?? [],
    majorId: recommendation.majorId,
    majorName: recommendation.majorName,
    cluster: recommendation.cluster,
    careerDirection: recommendation.careerDirection,
    relatedCareers: recommendation.relatedCareers.slice(0, 5),
    overallFitScore: recommendation.overallFitScore,
    fitLabel: recommendation.fitLabel,
    aiFutureResilienceScore: recommendation.aiFutureResilienceScore,
    aiFutureResilienceLabel: recommendation.aiFutureResilienceLabel,
    existingReasons: recommendation.reasonBullets.slice(0, 4),
    skillGaps: recommendation.skillGaps.slice(0, 4),
    nextSteps: recommendation.recommendedNextSteps.slice(0, 4),
  }));

  return JSON.stringify(
    {
      task: "Buat analisis personal untuk hasil rekomendasi jurusan. Ranking dan skor sudah final dari heuristic engine, jangan diubah. Tulis output JSON valid saja.",
      outputSchema: {
        summary: "1 paragraf singkat, 1-2 kalimat, personal untuk siswa.",
        studentStrengths:
          "Array tepat 3 poin singkat tentang kelebihan siswa berdasarkan jawaban yang diisi. Fokus pada kekuatan, minat, gaya belajar/kerja, dan potensi berkembang. Jangan berlebihan atau memberi label kepribadian mutlak.",
        recommendationReasons:
          "Object dengan key majorId. Untuk setiap majorId, isi 2-3 bullet alasan singkat. Jangan lebih dari 26 kata per bullet.",
        careerPersonalizations:
          "Object dengan key majorId untuk semua rekomendasi #1 sampai #10. Setiap item wajib punya personalizedCareerDirection, nicheCareerPaths tepat 3 item, reason 1 kalimat, aspirationReflection 1 kalimat, pathwayAdvice tepat 3 item, dan cautions 0-2 item.",
      },
      copyRules: [
        "Tulis ringkas untuk seluruh 10 rekomendasi: summary maksimal 35 kata; strengths maksimal 12 kata per poin; alasan maksimal 12 kata per poin; arah karier maksimal 10 kata; reason dan aspirationReflection masing-masing maksimal 18 kata; niche maksimal 6 kata; pathwayAdvice dan cautions maksimal 15 kata per poin. Jangan ulangi skor atau metadata.",
        "Skor di bawah 58 adalah alternatif eksplorasi dengan kecocokan terbatas; 58-69 hanya cukup cocok dan perlu diuji. Jangan menyebut pilihan lemah sebagai sangat cocok.",
        "Refleksikan tema aspirasi aktual; jangan memaksakan isu sosial atau lingkungan. Aspirasi luar negeri bukan jaminan visa, pekerjaan, lisensi, atau penerimaan program. Berikan langkah verifikasi resmi tanpa mengarang persyaratan.",
        "Jangan menyatakan hasil sebagai fakta mutlak.",
        "Gunakan kalimat: berdasarkan jawaban yang kamu isi.",
        "Jangan menulis pekerjaan akan hilang, jurusan tidak aman, atau AI akan menggantikan kamu.",
        "Tekankan AI sebagai alat bantu dan skill manusia tetap penting.",
        "Jangan menyebut bahwa kamu AI atau Gemini.",
        "Jangan menambah jurusan baru dan jangan mengubah urutan.",
        "Ikuti educationPathway dan degreeTypes yang diberikan. Sertifikasi adalah pelengkap; jangan mengganti jalur S1 atau D3/D4 pilihan siswa.",
        "Karier niche boleh lebih spesifik, tetapi harus tetap masuk akal untuk jurusan dan cluster yang diberikan.",
        "Jangan menulis karier yang membutuhkan profesi berlisensi tanpa catatan jalur lanjut. Contoh: lawyer/advokat harus terkait jurusan hukum atau diberi konteks compliance/policy.",
        "Untuk rekomendasi #1, jika dreamProfession, futureVision, favoriteSubjectsOther, atau collegePathPreferenceOther terisi, aspirationReflection wajib menyebut minimal satu tema spesifik dari teks siswa.",
        "Untuk rekomendasi #1, pathwayAdvice harus memberi arah awal menuju karier niche sesuai jurusan utama, misalnya organisasi, magang, portofolio, sertifikasi, riset kecil, atau mata kuliah pendukung.",
        "Untuk rekomendasi #2 sampai #10, pathwayAdvice tetap harus berisi tepat 3 poin singkat tentang cara mengarahkan jurusan itu ke cita-cita/minat siswa; jika aspirasi kosong, gunakan mata pelajaran, aktivitas, dan skill yang diisi.",
        "Untuk rekomendasi #2 sampai #10, tetap berikan tepat 3 nicheCareerPaths per rekomendasi.",
        "studentStrengths harus menyebut kekuatan dari jawaban siswa, bukan pujian generik. Contoh: ketelitian, empati, logika, kerja praktik, komunikasi, rasa ingin tahu, konsistensi.",
      ],
      studentAnswers: {
        name: promptText(answers.fullName, 100),
        school: promptText(answers.school, 120),
        className: promptText(answers.className, 40),
        schoolMajor: answers.currentSchoolMajor,
        educationPathway: answers.educationPathway ?? "unrecorded",
        favoriteSubjects: promptArray(answers.favoriteSubjects),
        favoriteSubjectsOther: promptText(answers.favoriteSubjectsOther, 80),
        favoriteActivities: promptArray(answers.favoriteActivities),
        skillStrengths: promptArray(answers.skillStrengths),
        workStyle: answers.workStyle,
        problemAreas: promptArray(answers.problemAreas),
        collegePathPreferences: promptArray(answers.collegePathPreferences),
        collegePathPreferenceOther: promptText(
          answers.collegePathPreferenceOther,
          120,
        ),
        personalConstraints: promptArray(answers.personalConstraints),
        techComfort: answers.techComfort,
        dreamProfession: promptText(answers.dreamProfession, 240),
        futureVision: promptText(answers.futureVision, 480),
      },
      recommendations: compactRecommendations,
    },
    null,
    2,
  );
}

function promptText(value: unknown, maxLength: number) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function promptArray(values: unknown[], maxItems = 12, maxLength = 80) {
  return values
    .map((value) => promptText(value, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function sanitizeSentence(value: unknown, fallback = "") {
  return String(value ?? fallback)
    .replace(/\s+/g, " ")
    .replace(
      /pekerjaan ini akan hilang/gi,
      "cara kerja bidang ini akan berubah",
    )
    .replace(/AI akan menggantikan kamu/gi, "AI dapat menjadi alat bantu")
    .replace(/jurusan ini tidak aman/gi, "bidang ini perlu adaptasi")
    .trim()
    .slice(0, 360);
}

function sanitizeShortLabel(value: unknown, fallback = "") {
  return sanitizeSentence(value, fallback)
    .replace(/[|{}[\]"`]/g, "")
    .slice(0, 72);
}

function truncateAtWord(value: string, maxLength: number) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  const sliced = clean.slice(0, maxLength + 1);
  const lastSpace = sliced.lastIndexOf(" ");
  const trimmed = (
    lastSpace > maxLength * 0.65
      ? sliced.slice(0, lastSpace)
      : clean.slice(0, maxLength)
  ).trim();
  return `${trimmed.replace(/[.,;:!?-]+$/, "")}...`;
}

function uniqueItems(items: string[], maxLength = 72) {
  return items
    .map((item) =>
      truncateAtWord(
        sanitizeSentence(item).replace(/[|{}[\]"`]/g, ""),
        maxLength,
      ),
    )
    .filter(Boolean)
    .filter((item, index, allItems) => allItems.indexOf(item) === index);
}

function readableList(items: string[], fallback: string) {
  const values = items
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
  if (values.length === 0) return fallback;
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} dan ${values[1]}`;
  return `${values[0]}, ${values[1]}, dan ${values[2]}`;
}

function buildStudentStrengthHighlights(
  answers: StudentAnswer,
  top?: RecommendationResult,
) {
  const selectedSkills = answers.skillStrengths.filter(Boolean);
  const matchedSkills = top?.skillStrengthMatches ?? [];
  const subjects = [
    ...answers.favoriteSubjects.filter((item) => item !== "Lainnya"),
    answers.favoriteSubjectsOther,
  ].filter(Boolean);
  const activities = answers.favoriteActivities.filter(Boolean);
  const problemAreas = answers.problemAreas.filter(Boolean);
  const strengths: string[] = [];

  const skillText = readableList(
    matchedSkills.length > 0 ? matchedSkills : selectedSkills,
    "kekuatan utama yang kamu pilih",
  );
  strengths.push(
    `Kamu punya modal awal di ${skillText}, yang membantu kamu belajar dan memecahkan masalah dengan lebih terarah.`,
  );

  if (subjects.length > 0 || activities.length > 0) {
    const signalText =
      subjects.length > 0 && activities.length > 0
        ? `${readableList(subjects, "mata pelajaran pilihanmu")} serta aktivitas seperti ${readableList(activities, "aktivitas pilihanmu")}`
        : subjects.length > 0
          ? readableList(subjects, "mata pelajaran pilihanmu")
          : `aktivitas seperti ${readableList(activities, "aktivitas pilihanmu")}`;
    strengths.push(
      `Minatmu pada ${signalText} memberi sinyal bahwa kamu bisa berkembang lewat latihan dan eksplorasi yang konsisten.`,
    );
  }

  strengths.push(
    `Gaya kerja ${answers.workStyle.toLowerCase()} bisa menjadi kelebihan kalau kamu menggunakannya untuk membangun kebiasaan belajar dan portofolio.`,
  );

  if (problemAreas.length > 0) {
    strengths.push(
      `Kamu tertarik membantu area seperti ${readableList(problemAreas, "masalah yang kamu pilih")}, jadi hasil ini bisa diarahkan ke proyek yang punya dampak nyata.`,
    );
  }

  return uniqueItems(strengths, 150).slice(0, 3);
}

function aspirationThemeSummary(answers?: StudentAnswer) {
  const flags = aspirationFlags(answers);
  const themes = [
    flags.hasEngineering ? "teknik/engineering" : "",
    flags.hasMaritime ? "maritim" : "",
    flags.hasMining ? "pertambangan" : "",
    flags.hasJapan ? "Jepang" : "",
    flags.hasOverseas ? "karier di luar negeri" : "",
    flags.hasHelping ? "membantu orang" : "",
    flags.hasRights ? "HAM, keadilan, advokasi, atau kebijakan" : "",
    flags.hasEnvironment ? "lingkungan dan keberlanjutan" : "",
    flags.hasEducation ? "pendidikan" : "",
    flags.hasHealth ? "kesehatan" : "",
  ].filter(Boolean);

  return themes.length > 0
    ? themes.join(", ")
    : "arah masa depan yang kamu ceritakan";
}

function compactAspirationTheme(answers?: StudentAnswer) {
  const flags = aspirationFlags(answers);
  if (flags.hasEngineering || flags.hasMaritime || flags.hasMining || flags.hasJapan || flags.hasOverseas)
    return aspirationThemeSummary(answers);
  if (flags.hasRights && flags.hasEnvironment && flags.hasHelping)
    return "HAM, lingkungan, dan dampak sosial";
  if (flags.hasRights && flags.hasEnvironment) return "HAM dan lingkungan";
  if (flags.hasRights && flags.hasHelping) return "advokasi dan dampak sosial";
  if (flags.hasEnvironment && flags.hasHelping)
    return "lingkungan dan komunitas";
  if (flags.hasRights) return "HAM, hukum, atau kebijakan";
  if (flags.hasEnvironment) return "lingkungan dan sustainability";
  if (flags.hasEducation) return "pendidikan";
  if (flags.hasHealth) return "kesehatan";
  if (flags.hasHelping) return "membantu orang";
  return "minat yang kamu ceritakan";
}

function aspirationNicheCareers(
  recommendation: RecommendationResult,
  answers?: StudentAnswer,
) {
  const flags = aspirationFlags(answers);
  if (!flags.hasText) return [];

  const id = recommendation.majorId;
  const cluster = canonicalCluster(recommendation);
  const isLaw = id.includes("hukum") || id.includes("kriminologi");
  const isGovernance =
    id.includes("administrasi_publik") ||
    id.includes("ilmu_politik") ||
    id.includes("hubungan_internasional") ||
    cluster.includes("governance");
  const isEnvironment =
    id.includes("lingkungan") ||
    id.includes("kehutanan") ||
    id.includes("agro") ||
    id.includes("perikanan") ||
    id.includes("peternakan") ||
    cluster.includes("environment");
  const isSocial =
    id.includes("sosiologi") ||
    id.includes("psikologi") ||
    id.includes("kesejahteraan") ||
    id.includes("bimbingan") ||
    cluster.includes("social");
  const isBusiness =
    cluster.includes("business") || cluster.includes("finance");
  const isTechnology = cluster.includes("technology");

  if (flags.hasRights && flags.hasEnvironment) {
    if (isLaw)
      return [
        "Environmental Lawyer",
        "Legal Officer ESG",
        "Advokasi Kebijakan Lingkungan",
      ];
    if (isGovernance)
      return [
        "Policy Analyst Lingkungan",
        "Pegawai NGO/Nonprofit",
        "Program Officer Advokasi HAM dan Lingkungan",
      ];
    if (isEnvironment)
      return [
        "Environmental Policy Analyst",
        "Sustainability Program Officer",
        "ESG Community Specialist",
      ];
    if (isSocial)
      return [
        "NGO Program Officer",
        "Community Development Officer",
        "Social Impact Researcher",
      ];
    if (isBusiness)
      return [
        "ESG Program Officer",
        "CSR & Sustainability Specialist",
        "Social Impact Analyst",
      ];
    if (isTechnology)
      return [
        "Civic Tech Product Analyst",
        "Data Analyst untuk NGO",
        "Sustainability Tech Specialist",
      ];
    return [
      "Pegawai NGO/Nonprofit",
      "Sustainability Program Officer",
      "Community Impact Coordinator",
    ];
  }

  if (flags.hasEnvironment) {
    if (isLaw)
      return [
        "Legal Officer ESG",
        "Environmental Compliance Specialist",
        "Advokasi Kebijakan Lingkungan",
      ];
    if (isGovernance)
      return [
        "Policy Analyst Lingkungan",
        "Sustainability Policy Associate",
        "Program Officer Lingkungan",
      ];
    if (isEnvironment)
      return [
        "Sustainability Officer",
        "Environmental Field Officer",
        "Conservation Program Officer",
      ];
    if (isBusiness)
      return [
        "ESG Analyst",
        "CSR Program Officer",
        "Sustainable Business Analyst",
      ];
    if (isTechnology)
      return [
        "Climate Data Analyst",
        "Sustainability Tech Specialist",
        "Product Analyst Green Tech",
      ];
    return [
      "Sustainability Program Officer",
      "Pegawai NGO Lingkungan",
      "Community Impact Coordinator",
    ];
  }

  if (flags.hasRights || flags.hasHelping) {
    if (isLaw)
      return [
        "Legal Aid Officer",
        "Human Rights Advocacy Officer",
        "Policy Compliance Analyst",
      ];
    if (isGovernance)
      return [
        "Policy Analyst",
        "Pegawai NGO/Nonprofit",
        "Program Officer Advokasi Publik",
      ];
    if (isSocial)
      return [
        "Community Development Officer",
        "Social Impact Researcher",
        "NGO Program Officer",
      ];
    if (isTechnology)
      return [
        "Civic Tech Product Analyst",
        "Data Analyst untuk Program Sosial",
        "Digital Campaign Strategist",
      ];
    return [
      "Pegawai NGO/Nonprofit",
      "Program Officer Komunitas",
      "Social Impact Coordinator",
    ];
  }

  if (flags.hasEducation)
    return [
      "Education Program Officer",
      "Learning Designer",
      "Community Education Facilitator",
    ];
  if (flags.hasHealth)
    return [
      "Health Program Officer",
      "Public Health Educator",
      "Community Health Coordinator",
    ];

  return [];
}

function aspirationReflectionFor(
  recommendation: RecommendationResult,
  answers?: StudentAnswer,
) {
  if (!aspirationFlags(answers).hasText) return "";
  return `Kamu menulis tentang ${aspirationThemeSummary(answers)}. Bandingkan kurikulum ${recommendation.majorName} dan pengalaman praktik dengan keterampilan yang dibutuhkan untuk tujuan itu.`;
}

function canonicalCluster(recommendation: RecommendationResult) {
  return (majorsById[recommendation.majorId]?.cluster ?? recommendation.cluster).toLowerCase();
}

function isTechnicalField(recommendation: RecommendationResult) {
  const cluster = canonicalCluster(recommendation);
  return cluster.includes("engineering") || cluster.includes("technology") ||
    (cluster.includes("vocational") && /teknik|automation|network|informatics|informatika|development|data|support/.test(recommendation.majorId));
}

function profileSignalSummary(answers?: StudentAnswer) {
  if (!answers) return "minat dan kekuatan yang kamu pilih";

  const subjects = [
    ...answers.favoriteSubjects.filter((item) => item !== "Lainnya"),
    answers.favoriteSubjectsOther,
  ].filter(Boolean);
  const activities = answers.favoriteActivities.filter(Boolean);
  const skills = answers.skillStrengths.filter(Boolean);

  if (subjects.length > 0 && skills.length > 0) {
    return `mata pelajaran seperti ${subjects.slice(0, 2).join(", ")} dan kekuatan seperti ${skills.slice(0, 2).join(", ")}`;
  }
  if (activities.length > 0 && skills.length > 0) {
    return `aktivitas seperti ${activities.slice(0, 2).join(", ")} dan kekuatan seperti ${skills.slice(0, 2).join(", ")}`;
  }
  if (subjects.length > 0)
    return `mata pelajaran seperti ${subjects.slice(0, 3).join(", ")}`;
  if (activities.length > 0)
    return `aktivitas seperti ${activities.slice(0, 3).join(", ")}`;
  if (skills.length > 0)
    return `kekuatan seperti ${skills.slice(0, 3).join(", ")}`;

  return "minat dan kekuatan yang kamu pilih";
}

function clusterPathwayAdviceFor(
  recommendation: RecommendationResult,
  answers?: StudentAnswer,
) {
  const flags = aspirationFlags(answers);
  const cluster = canonicalCluster(recommendation);
  const major = recommendation.majorName;
  const theme = compactAspirationTheme(answers);
  const nicheCareer =
    aspirationNicheCareers(recommendation, answers)[0] ??
    recommendation.relatedCareers[0] ??
    recommendation.careerDirection;

  if (
    cluster.includes("law") ||
    cluster.includes("governance") ||
    recommendation.majorId.includes("hukum")
  ) {
    return [
      `Arahkan ${major} ke ${nicheCareer} lewat fokus HAM, lingkungan, regulasi, atau kebijakan publik.`,
      "Cari pengalaman legal aid, debat, organisasi advokasi, riset kebijakan, atau magang lembaga publik/NGO.",
      "Buat portofolio policy brief, opini, ringkasan regulasi, atau analisis kasus sederhana.",
    ];
  }

  if (cluster.includes("social") || cluster.includes("education")) {
    return [
      `Gunakan ${major} untuk memahami komunitas dan masalah sosial yang dekat dengan ${theme}.`,
      "Cari volunteer, riset lapangan kecil, mentoring, program komunitas, atau magang NGO/lembaga sosial.",
      "Bangun portofolio dokumentasi program, survei kecil, refleksi kasus, atau proposal kegiatan.",
    ];
  }

  if (
    cluster.includes("environment") ||
    recommendation.majorId.includes("lingkungan")
  ) {
    return [
      `Arahkan ${major} ke ${theme} lewat proyek konservasi, ESG, pangan, atau pengelolaan lingkungan.`,
      "Cari pengalaman komunitas lingkungan, kampanye iklim, riset lapangan, lab, atau magang sustainability.",
      "Bangun portofolio observasi, peta masalah lingkungan, data sederhana, atau proposal solusi.",
    ];
  }

  if (cluster.includes("business") || cluster.includes("finance")) {
    return [
      `Gunakan ${major} untuk masuk ke ${nicheCareer} yang menghubungkan bisnis dan dampak sosial.`,
      "Cari proyek kewirausahaan sosial, CSR, ESG, fundraising, riset pasar komunitas, atau magang berdampak.",
      "Bangun portofolio campaign plan, business case, laporan dampak, dashboard, atau proposal program.",
    ];
  }

  if (cluster.includes("technology")) {
    return [
      `Arahkan ${major} ke civic tech, data sosial, atau produk digital untuk isu ${theme}.`,
      "Cari proyek coding/data untuk NGO, kampanye publik, pemetaan masalah, dashboard, atau aplikasi edukasi.",
      "Bangun portofolio GitHub, dashboard, prototype, analisis data, atau studi kasus produk.",
    ];
  }

  if (cluster.includes("creative") || cluster.includes("media")) {
    return [
      `Gunakan ${major} untuk mengangkat isu ${theme} lewat konten, kampanye publik, atau storytelling.`,
      "Cari pengalaman konten edukasi, kampanye sosial, dokumentasi komunitas, poster, video pendek, atau media sekolah.",
      "Bangun portofolio campaign deck, carousel, video, artikel, atau identitas visual isu sosial.",
    ];
  }

  if (cluster.includes("health")) {
    return [
      `Gunakan ${major} untuk membantu orang lewat edukasi kesehatan, komunitas, riset, atau pencegahan.`,
      "Cari pengalaman relawan kesehatan, edukasi publik, organisasi sekolah, atau observasi program.",
      "Bangun portofolio materi edukasi, ringkasan isu kesehatan, dokumentasi program, atau kampanye sehat.",
    ];
  }

  return [
    `Gunakan ${major} sebagai pintu masuk ke ${nicheCareer} yang dekat dengan ${theme}.`,
    "Cari organisasi, volunteer, proyek kecil, magang, atau komunitas yang dekat dengan isu itu.",
    "Bangun portofolio tulisan, riset mini, karya, dokumentasi proyek, atau pengalaman praktik.",
  ];
}

function pathwayAdviceFor(
  recommendation: RecommendationResult,
  answers?: StudentAnswer,
) {
  const flags = aspirationFlags(answers);
  const direction = answers?.educationPathway
    ? generatePtnPtsVokasiAdvice(answers)[0]
    : undefined;
  if (flags.hasEngineering || flags.hasMaritime || flags.hasMining || flags.hasJapan || flags.hasOverseas) {
    const sectors = [flags.hasMaritime ? "maritim" : "", flags.hasMining ? "pertambangan" : ""]
      .filter(Boolean).join(" atau ");
    return uniqueItems([
      direction ?? `Bandingkan kurikulum ${recommendation.majorName} dengan bidang kerja yang kamu tuju.`,
      isTechnicalField(recommendation)
        ? `Coba proyek teknik atau lab kecil; cari magang ${sectors ? `di bidang ${sectors}` : "sesuai bidang kerja tujuanmu"}.`
        : flags.hasEngineering || flags.hasMaritime || flags.hasMining
          ? "Coba proyek sesuai jurusan ini; bandingkan peran pendukung di industri tujuan dengan pekerjaan teknik yang kamu bayangkan."
          : "Coba proyek dan magang sesuai jurusan ini; bandingkan keterampilannya dengan peran yang kamu tuju.",
      flags.hasJapan || flags.hasOverseas
        ? `Latih bahasa ${flags.hasJapan ? "Jepang dan Inggris" : "negara tujuan"}; periksa persyaratan resmi program, profesi, dan kerja di negara tujuan.`
        : "Periksa persyaratan resmi peran, keselamatan kerja, dan pendidikan lanjutan sebelum memilih program.",
    ], 150).slice(0, 3);
  }
  if (!flags.hasText) {
    return uniqueItems(
      [
        direction ??
          `Gunakan ${recommendation.majorName} untuk mengubah ${profileSignalSummary(answers)} menjadi skill yang terarah.`,
        `Cari proyek kecil, lomba, organisasi, magang, atau sertifikasi yang relevan dengan ${recommendation.careerDirection}.`,
        "Bangun portofolio dari tugas, riset mini, karya, atau pengalaman praktik yang bisa ditunjukkan.",
      ],
      135,
    ).slice(0, 3);
  }

  const steps = [
    direction ??
      `Gunakan ${recommendation.majorName} untuk membangun dasar yang relevan dengan ${compactAspirationTheme(answers)}.`,
  ];

  if (flags.hasRights || flags.hasEnvironment || flags.hasHelping) {
    return uniqueItems(
      clusterPathwayAdviceFor(recommendation, answers),
      135,
    ).slice(0, 3);
  } else if (flags.hasEducation) {
    steps.push(
      "Cari pengalaman mengajar, mentoring, komunitas literasi, atau proyek edukasi kecil.",
    );
    steps.push(
      "Bangun portofolio materi belajar, modul, konten edukasi, atau dokumentasi mengajar.",
    );
  } else if (flags.hasHealth) {
    steps.push(
      "Cari pengalaman relawan kesehatan, edukasi publik, atau kegiatan yang melatih empati.",
    );
    steps.push(
      "Buat rangkuman edukatif sederhana tentang isu kesehatan sebagai portofolio awal.",
    );
  } else {
    steps.push(...recommendation.recommendedNextSteps.slice(0, 2));
  }

  return uniqueItems(steps, 135).slice(0, 3);
}

function fallbackCareerPersonalization(
  recommendation: RecommendationResult,
  answers?: StudentAnswer,
): CareerPersonalization {
  const flags = aspirationFlags(answers);
  const nicheCareerPaths = uniqueItems([
    ...aspirationNicheCareers(recommendation, answers),
    ...recommendation.relatedCareers.slice(0, 5),
  ]).slice(0, 3);

  return {
    personalizedCareerDirection: recommendation.careerDirection,
    nicheCareerPaths,
    reason: recommendation.overallFitScore < 58
      ? "Kecocokan dari jawabanmu masih terbatas; pilihan ini perlu diuji melalui eksplorasi kurikulum dan proyek kecil."
      : recommendation.overallFitScore < 70
      ? "Sebagian jawabanmu mendukung pilihan ini; uji kecocokannya melalui kurikulum, latihan, dan pengalaman praktik."
      : flags.hasText
      ? `Jurusan ini masih bisa menjadi jalur menuju minat dan cita-cita yang kamu ceritakan, terutama lewat pilihan karier niche dan pengalaman pendukung.`
      : `Jurusan ini selaras dengan minat, pelajaran, dan kekuatan yang kamu isi, lalu bisa diarahkan melalui langkah kecil yang konkret.`,
    aspirationReflection: aspirationReflectionFor(recommendation, answers),
    pathwayAdvice: pathwayAdviceFor(recommendation, answers),
    cautions: [
      ...(flags.hasEngineering || flags.hasMaritime || flags.hasMining
        ? [isTechnicalField(recommendation)
          ? "Periksa persyaratan resmi pendidikan, kompetensi, keselamatan, dan lisensi untuk peran teknik yang dituju."
          : "Jurusan ini tidak otomatis menjadi jalur ke profesi engineer; bandingkan peran pendukung dan pendidikan yang diperlukan."] : []),
      ...(flags.hasJapan || flags.hasOverseas
        ? ["Ambisi bekerja di luar negeri perlu diverifikasi melalui persyaratan resmi; hasil ini bukan jaminan kerja, visa, atau lisensi."] : []),
    ],
  };
}

function sanitizeGeminiNarrative(
  parsed: GeminiNarrativePayload,
  recommendations: RecommendationResult[],
  model: string,
): EnhancedNarrative {
  const recommendationReasons: Record<string, string[]> = {};
  const careerPersonalizations: Record<string, CareerPersonalization> = {};
  const sentences = (items: string[]) => items.map(item => sanitizeSentence(item));
  for (const recommendation of recommendations) {
    const id = recommendation.majorId;
    const raw = parsed.careerPersonalizations[id];
    recommendationReasons[id] = sentences(parsed.recommendationReasons[id]);
    careerPersonalizations[id] = {
      personalizedCareerDirection: sanitizeSentence(raw.personalizedCareerDirection),
      nicheCareerPaths: raw.nicheCareerPaths.map(item => sanitizeShortLabel(item)),
      reason: sanitizeSentence(raw.reason),
      aspirationReflection: sanitizeSentence(raw.aspirationReflection),
      pathwayAdvice: sentences(raw.pathwayAdvice),
      cautions: sentences(raw.cautions),
    };
  }
  // Sanitizing must not turn a complete response into empty or duplicate items.
  const validated = validateGeminiNarrative({
    summary: sanitizeSentence(parsed.summary),
    studentStrengths: sentences(parsed.studentStrengths),
    recommendationReasons,
    careerPersonalizations,
  }, recommendations.map(r => r.majorId));
  return { ...validated, source: "gemini", model };
}

function joinPreview(items: string[], fallback: string) {
  if (items.length === 0) return fallback;
  return items.slice(0, 3).join(", ");
}

export function buildRecommendationNarrative(
  answer: StudentAnswer,
  major: KnowledgeMajor,
  recommendation: RecommendationResult,
) {
  const topInterests = joinPreview(
    recommendation.scoringBreakdown.matchedInterests,
    answer.favoriteActivities.slice(0, 2).join(", ") || "minat yang kamu pilih",
  );
  const topSkills = joinPreview(
    recommendation.scoringBreakdown.matchedSkills,
    answer.skillStrengths.slice(0, 2).join(", ") || "kekuatan utama kamu",
  );
  const matchedSubjects = joinPreview(
    recommendation.scoringBreakdown.matchedSubjects,
    "mata pelajaran pilihanmu",
  );
  const preferenceNote = recommendation.scoringBreakdown.preferenceNotes[0];
  const aspirationSignals = joinPreview(
    recommendation.scoringBreakdown.matchedAspirationMajorSignals ?? [],
    "",
  );
  const requiredSkills = joinPreview(
    major.relatedSkills.map((skill) => skill.label),
    "kombinasi skill teknis dan manusia",
  );

  const evidence = [
    recommendation.scoringBreakdown.matchedInterests.length ? `minat pada ${topInterests}` : "",
    recommendation.scoringBreakdown.matchedSkills.length ? `kekuatan di ${topSkills}` : "",
  ].filter(Boolean).join(" dan ");
  const fit = recommendation.overallFitScore < 58
    ? "merupakan alternatif eksplorasi dengan kecocokan yang masih terbatas"
    : recommendation.overallFitScore < 70 ? "cukup selaras dengan sebagian jawabanmu; kecocokannya masih perlu diuji"
    : "selaras dengan pola jawabanmu";
  const bullets = [
    `${major.name} ${fit}.${evidence ? ` Sinyal yang cocok: ${evidence}.` : " Belum ada kecocokan langsung pada minat dan skill yang dipilih."} Bidang ini membutuhkan ${requiredSkills}.`,
    recommendation.scoringBreakdown.matchedSubjects.length
      ? `Mata pelajaran seperti ${matchedSubjects} memberi sinyal awal yang relevan dengan arah ${recommendation.cluster}.`
      : "Belum ada kecocokan langsung pada mata pelajaran pilihanmu; periksa tuntutan kurikulum dan coba materi pengantar.",
    `Arah karier yang bisa kamu pertimbangkan adalah ${recommendation.careerDirection}.`,
    `Di era AI, bidang ini memiliki ketahanan ${recommendation.aiFutureResilienceLabel.toLowerCase()} karena ${major.aiFutureResilienceReason}`,
    "AI dapat menjadi alat bantu untuk meningkatkan produktivitas.",
    "Skill manusia seperti komunikasi, empati, kreativitas, dan judgement tetap penting.",
  ];

  if (preferenceNote) {
    bullets.splice(
      3,
      0,
      `Dari sisi preferensi dan batasan, ${preferenceNote}.`,
    );
  }
  if (aspirationSignals) {
    bullets.splice(
      2,
      0,
      `Aspirasi yang kamu tulis menyebut ${aspirationSignals}, jadi jurusan ini mendapat sinyal tambahan kecil.`,
    );
  }

  return bullets.slice(0, 6);
}
