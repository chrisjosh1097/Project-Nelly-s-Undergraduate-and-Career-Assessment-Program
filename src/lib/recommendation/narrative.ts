import type { Major as KnowledgeMajor } from "../../../data";
import type {
  CareerPersonalization,
  EnhancedNarrative,
  RecommendationReport,
  RecommendationResult,
  StudentAnswer
} from "@/lib/types";

export interface RecommendationNarrativeEnhancer {
  enhance(input: {
    answers: StudentAnswer;
    recommendations: RecommendationResult[];
  }): Promise<EnhancedNarrative>;
}

export class HeuristicTemplateNarrativeEnhancer implements RecommendationNarrativeEnhancer {
  async enhance({
    answers,
    recommendations
  }: {
    answers: StudentAnswer;
    recommendations: RecommendationResult[];
  }): Promise<EnhancedNarrative> {
    const top = recommendations[0];
      return {
      summary: top
        ? `Rekomendasi utama untuk ${answers.fullName} adalah ${top.majorName} dengan skor kecocokan ${top.overallFitScore}/100.`
        : "Belum ada rekomendasi yang bisa ditampilkan.",
      recommendationReasons: Object.fromEntries(recommendations.map((recommendation) => [recommendation.majorId, recommendation.reasonBullets])),
      careerPersonalizations: Object.fromEntries(
        recommendations.map((recommendation) => [
          recommendation.majorId,
          fallbackCareerPersonalization(recommendation, answers)
        ])
      ),
      source: "heuristic"
    };
  }
}

export class GeminiNarrativeEnhancer implements RecommendationNarrativeEnhancer {
  async enhance({
    answers,
    recommendations
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
    const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS ?? 9000);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      signal: AbortSignal.timeout(Number.isFinite(timeoutMs) ? timeoutMs : 9000),
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                "Kamu adalah konselor jurusan untuk siswa SMA/SMK Indonesia. Kamu hanya boleh menulis ulang analisis naratif. Jangan mengubah ranking, majorId, skor, label, atau rekomendasi. Nada harus hangat, konstruktif, tidak menakut-nakuti tentang AI, dan semua teks dalam Bahasa Indonesia."
            }
          ]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: buildGeminiPrompt(answers, recommendations) }]
          }
        ],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 3200,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Gemini request failed: ${response.status} ${detail.slice(0, 240)}`);
    }

    const data = (await response.json()) as GeminiGenerateContentResponse;
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n").trim();
    if (!text) throw new Error("Gemini returned empty narrative.");

    const parsed = parseGeminiNarrative(text);
    return sanitizeGeminiNarrative(parsed, recommendations, model, answers);
  }
}

export async function enhanceRecommendationReport(
  answers: StudentAnswer,
  report: RecommendationReport
): Promise<RecommendationReport> {
  const enhancer =
    process.env.ENABLE_GEMINI_ENHANCEMENT === "true"
      ? new GeminiNarrativeEnhancer()
      : new HeuristicTemplateNarrativeEnhancer();

  try {
    const narrative = await enhancer.enhance({
      answers,
      recommendations: report.recommendations
    });

    return applyNarrativeToReport(report, narrative);
  } catch (error) {
    console.warn("[WARN] Narrative enhancement failed, using heuristic template.", error);
    const fallback = await new HeuristicTemplateNarrativeEnhancer().enhance({
      answers,
      recommendations: report.recommendations
    });
    return applyNarrativeToReport(report, fallback);
  }
}

function applyNarrativeToReport(report: RecommendationReport, narrative: EnhancedNarrative): RecommendationReport {
  const recommendations = report.recommendations.map((recommendation) => {
    const personalization = narrative.careerPersonalizations?.[recommendation.majorId];

    return {
      ...recommendation,
      reasonBullets: narrative.recommendationReasons[recommendation.majorId] ?? recommendation.reasonBullets,
      personalizedCareerDirection: personalization?.personalizedCareerDirection ?? recommendation.personalizedCareerDirection,
      nicheCareerPaths: personalization?.nicheCareerPaths ?? recommendation.nicheCareerPaths,
      careerPersonalizationReason: personalization?.reason ?? recommendation.careerPersonalizationReason,
      aspirationReflection: personalization?.aspirationReflection ?? recommendation.aspirationReflection,
      careerPathwayAdvice: personalization?.pathwayAdvice ?? recommendation.careerPathwayAdvice,
      careerCautions: personalization?.cautions ?? recommendation.careerCautions
    };
  });

  return {
    ...report,
    topRecommendation: recommendations[0],
    recommendations,
    narrativeVersion: narrative.source === "gemini" ? `gemini:${narrative.model ?? "unknown"}` : report.narrativeVersion,
    narrative
  };
}

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

function buildGeminiPrompt(answers: StudentAnswer, recommendations: RecommendationResult[]) {
    const compactRecommendations = recommendations.map((recommendation) => ({
    rank: recommendation.rank,
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
    nextSteps: recommendation.recommendedNextSteps.slice(0, 4)
  }));

  return JSON.stringify(
    {
      task:
        "Buat analisis personal untuk hasil rekomendasi jurusan. Ranking dan skor sudah final dari heuristic engine, jangan diubah. Tulis output JSON valid saja.",
      outputSchema: {
        summary: "1 paragraf singkat, 1-2 kalimat, personal untuk siswa.",
        recommendationReasons:
          "Object dengan key majorId. Untuk setiap majorId, isi 2-3 bullet alasan singkat. Jangan lebih dari 26 kata per bullet.",
        careerPersonalizations:
          "Object dengan key majorId untuk semua rekomendasi #1 sampai #10. Setiap item wajib punya personalizedCareerDirection, nicheCareerPaths tepat 3 item, reason 1 kalimat, aspirationReflection 1 kalimat, pathwayAdvice 2-3 item, dan cautions 0-2 item."
      },
      copyRules: [
        "Jangan menyatakan hasil sebagai fakta mutlak.",
        "Gunakan kalimat: berdasarkan jawaban yang kamu isi.",
        "Jangan menulis pekerjaan akan hilang, jurusan tidak aman, atau AI akan menggantikan kamu.",
        "Tekankan AI sebagai alat bantu dan skill manusia tetap penting.",
        "Jangan menyebut bahwa kamu AI atau Gemini.",
        "Jangan menambah jurusan baru dan jangan mengubah urutan.",
        "Karier niche boleh lebih spesifik, tetapi harus tetap masuk akal untuk jurusan dan cluster yang diberikan.",
        "Jangan menulis karier yang membutuhkan profesi berlisensi tanpa catatan jalur lanjut. Contoh: lawyer/advokat harus terkait jurusan hukum atau diberi konteks compliance/policy.",
        "Untuk rekomendasi #1, jika dreamProfession, futureVision, favoriteSubjectsOther, atau collegePathPreferenceOther terisi, aspirationReflection wajib menyebut minimal satu tema spesifik dari teks siswa.",
        "Untuk rekomendasi #1, pathwayAdvice harus memberi arah awal menuju karier niche sesuai jurusan utama, misalnya organisasi, magang, portofolio, sertifikasi, riset kecil, atau mata kuliah pendukung.",
        "Contoh karier niche seperti Environmental Lawyer, pegawai NGO/nonprofit, sustainability policy analyst, atau legal officer ESG boleh dipakai jika selaras dengan jurusan.",
        "Untuk rekomendasi #2 sampai #10, tetap berikan tepat 3 nicheCareerPaths per rekomendasi."
      ],
      studentAnswers: {
        name: promptText(answers.fullName, 100),
        school: promptText(answers.school, 120),
        className: promptText(answers.className, 40),
        schoolMajor: answers.currentSchoolMajor,
        favoriteSubjects: promptArray(answers.favoriteSubjects),
        favoriteSubjectsOther: promptText(answers.favoriteSubjectsOther, 80),
        favoriteActivities: promptArray(answers.favoriteActivities),
        skillStrengths: promptArray(answers.skillStrengths),
        workStyle: answers.workStyle,
        problemAreas: promptArray(answers.problemAreas),
        collegePathPreferences: promptArray(answers.collegePathPreferences),
        collegePathPreferenceOther: promptText(answers.collegePathPreferenceOther, 120),
        personalConstraints: promptArray(answers.personalConstraints),
        techComfort: answers.techComfort,
        dreamProfession: promptText(answers.dreamProfession, 240),
        futureVision: promptText(answers.futureVision, 480)
      },
      recommendations: compactRecommendations
    },
    null,
    2
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
  return values.map((value) => promptText(value, maxLength)).filter(Boolean).slice(0, maxItems);
}

function parseGeminiNarrative(text: string) {
  try {
    return JSON.parse(text) as Partial<EnhancedNarrative>;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Gemini narrative is not valid JSON.");
    return JSON.parse(match[0]) as Partial<EnhancedNarrative>;
  }
}

function sanitizeSentence(value: unknown, fallback = "") {
  return String(value ?? fallback)
    .replace(/\s+/g, " ")
    .replace(/pekerjaan ini akan hilang/gi, "cara kerja bidang ini akan berubah")
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

function aspirationText(answers?: StudentAnswer) {
  if (!answers) return "";
  return [
    answers.favoriteSubjectsOther,
    answers.collegePathPreferenceOther,
    answers.dreamProfession,
    answers.futureVision
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function aspirationFlags(answers?: StudentAnswer) {
  const text = aspirationText(answers).toLowerCase();

  return {
    hasText: text.length > 0,
    hasHelping: /\b(membantu|bantu|menolong|mendampingi|melayani|pelayanan|berdampak|impact)\b/i.test(text),
    hasRights: /(ham|hak asasi|keadilan|advokasi|memperjuangkan|hukum|legal|kebijakan|policy|regulasi)/i.test(text),
    hasEnvironment: /(lingkungan|iklim|climate|sustainability|sustainable|keberlanjutan|konservasi|hutan|limbah|alam|esg)/i.test(text),
    hasEducation: /(pendidikan|mengajar|guru|sekolah|anak|literasi)/i.test(text),
    hasHealth: /(kesehatan|medis|rumah sakit|dokter|perawat|gizi|mental)/i.test(text)
  };
}

function uniqueItems(items: string[], maxLength = 72) {
  return items
    .map((item) =>
      sanitizeSentence(item)
        .replace(/[|{}[\]"`]/g, "")
        .slice(0, maxLength)
    )
    .filter(Boolean)
    .filter((item, index, allItems) => allItems.indexOf(item) === index);
}

function aspirationThemeSummary(answers?: StudentAnswer) {
  const flags = aspirationFlags(answers);
  const themes = [
    flags.hasHelping ? "membantu orang" : "",
    flags.hasRights ? "HAM, keadilan, advokasi, atau kebijakan" : "",
    flags.hasEnvironment ? "lingkungan dan keberlanjutan" : "",
    flags.hasEducation ? "pendidikan" : "",
    flags.hasHealth ? "kesehatan" : ""
  ].filter(Boolean);

  return themes.length > 0 ? themes.join(", ") : "arah masa depan yang kamu ceritakan";
}

function aspirationNicheCareers(recommendation: RecommendationResult, answers?: StudentAnswer) {
  const flags = aspirationFlags(answers);
  if (!flags.hasText) return [];

  const id = recommendation.majorId;
  const cluster = recommendation.cluster.toLowerCase();
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
  const isBusiness = cluster.includes("business") || cluster.includes("finance");
  const isTechnology = cluster.includes("technology");

  if (flags.hasRights && flags.hasEnvironment) {
    if (isLaw) return ["Environmental Lawyer", "Legal Officer ESG", "Advokasi Kebijakan Lingkungan"];
    if (isGovernance) return ["Policy Analyst Lingkungan", "Pegawai NGO/Nonprofit", "Program Officer Advokasi HAM dan Lingkungan"];
    if (isEnvironment) return ["Environmental Policy Analyst", "Sustainability Program Officer", "ESG Community Specialist"];
    if (isSocial) return ["NGO Program Officer", "Community Development Officer", "Social Impact Researcher"];
    if (isBusiness) return ["ESG Program Officer", "CSR & Sustainability Specialist", "Social Impact Analyst"];
    if (isTechnology) return ["Civic Tech Product Analyst", "Data Analyst untuk NGO", "Sustainability Tech Specialist"];
    return ["Pegawai NGO/Nonprofit", "Sustainability Program Officer", "Community Impact Coordinator"];
  }

  if (flags.hasEnvironment) {
    if (isLaw) return ["Legal Officer ESG", "Environmental Compliance Specialist", "Advokasi Kebijakan Lingkungan"];
    if (isGovernance) return ["Policy Analyst Lingkungan", "Sustainability Policy Associate", "Program Officer Lingkungan"];
    if (isEnvironment) return ["Sustainability Officer", "Environmental Field Officer", "Conservation Program Officer"];
    if (isBusiness) return ["ESG Analyst", "CSR Program Officer", "Sustainable Business Analyst"];
    if (isTechnology) return ["Climate Data Analyst", "Sustainability Tech Specialist", "Product Analyst Green Tech"];
    return ["Sustainability Program Officer", "Pegawai NGO Lingkungan", "Community Impact Coordinator"];
  }

  if (flags.hasRights || flags.hasHelping) {
    if (isLaw) return ["Legal Aid Officer", "Human Rights Advocacy Officer", "Policy Compliance Analyst"];
    if (isGovernance) return ["Policy Analyst", "Pegawai NGO/Nonprofit", "Program Officer Advokasi Publik"];
    if (isSocial) return ["Community Development Officer", "Social Impact Researcher", "NGO Program Officer"];
    if (isTechnology) return ["Civic Tech Product Analyst", "Data Analyst untuk Program Sosial", "Digital Campaign Strategist"];
    return ["Pegawai NGO/Nonprofit", "Program Officer Komunitas", "Social Impact Coordinator"];
  }

  if (flags.hasEducation) return ["Education Program Officer", "Learning Designer", "Community Education Facilitator"];
  if (flags.hasHealth) return ["Health Program Officer", "Public Health Educator", "Community Health Coordinator"];

  return [];
}

function aspirationReflectionFor(recommendation: RecommendationResult, answers?: StudentAnswer) {
  if (!aspirationFlags(answers).hasText) return "";
  return `Kamu menulis tentang ${aspirationThemeSummary(answers)}; melalui jurusan ${recommendation.majorName}, arah ini bisa dieksplorasi lewat karier yang menggabungkan ilmu jurusan, isu sosial, dan pengalaman lapangan.`;
}

function pathwayAdviceFor(recommendation: RecommendationResult, answers?: StudentAnswer) {
  const flags = aspirationFlags(answers);
  if (!flags.hasText) return recommendation.recommendedNextSteps.slice(0, 3);

  const steps = [
    `Gunakan jurusan ${recommendation.majorName} untuk membangun dasar akademik yang relevan dengan ${aspirationThemeSummary(answers)}.`
  ];

  if (flags.hasRights || flags.hasEnvironment || flags.hasHelping) {
    steps.push("Cari pengalaman organisasi, volunteer, atau magang di NGO, komunitas sosial, lembaga advokasi, kampanye lingkungan, atau program public policy.");
    steps.push("Bangun portofolio kecil seperti tulisan isu publik, riset mini, kampanye sosial, proyek komunitas, atau dokumentasi kegiatan advokasi.");
  } else if (flags.hasEducation) {
    steps.push("Cari pengalaman mengajar, mentoring, komunitas literasi, atau proyek edukasi kecil untuk menguji minatmu secara nyata.");
    steps.push("Bangun portofolio materi belajar, modul, konten edukasi, atau dokumentasi kegiatan mengajar.");
  } else if (flags.hasHealth) {
    steps.push("Cari pengalaman relawan kesehatan, edukasi publik, organisasi sekolah, atau kegiatan yang melatih empati dan komunikasi.");
    steps.push("Bangun kebiasaan membaca isu kesehatan dan buat rangkuman edukatif sederhana sebagai portofolio awal.");
  } else {
    steps.push(...recommendation.recommendedNextSteps.slice(0, 2));
  }

  return uniqueItems(steps, 180).slice(0, 3);
}

function fallbackCareerPersonalization(recommendation: RecommendationResult, answers?: StudentAnswer): CareerPersonalization {
  const nicheCareerPaths = uniqueItems([
    ...aspirationNicheCareers(recommendation, answers),
    ...recommendation.relatedCareers.slice(0, 5)
  ]).slice(0, 3);

  return {
    personalizedCareerDirection: recommendation.careerDirection,
    nicheCareerPaths,
    reason: aspirationFlags(answers).hasText
      ? `Arah karier ini tetap mengikuti ranking heuristic, lalu diperkaya dari aspirasi yang kamu tulis agar lebih spesifik.`
      : `Arah karier ini masih selaras dengan jurusan ${recommendation.majorName} dan jawaban yang kamu isi.`,
    aspirationReflection: aspirationReflectionFor(recommendation, answers),
    pathwayAdvice: pathwayAdviceFor(recommendation, answers),
    cautions: []
  };
}

function sanitizeCareerPersonalization(
  value: unknown,
  recommendation: RecommendationResult,
  answers?: StudentAnswer
): CareerPersonalization {
  const fallback = fallbackCareerPersonalization(recommendation, answers);
  if (!value || typeof value !== "object") return fallback;

  const raw = value as Partial<CareerPersonalization>;
  const rawNicheCareers = Array.isArray(raw.nicheCareerPaths) ? raw.nicheCareerPaths : [];
  const nicheCareerPaths = rawNicheCareers
    .map((item) => sanitizeShortLabel(item))
    .filter(Boolean)
    .slice(0, 3);

  const paddedNicheCareers = [...nicheCareerPaths, ...fallback.nicheCareerPaths]
    .map((item) => sanitizeShortLabel(item))
    .filter(Boolean)
    .filter((item, index, items) => items.indexOf(item) === index)
    .slice(0, 3);

  const rawCautions = Array.isArray(raw.cautions) ? raw.cautions : [];
  const rawPathwayAdvice = Array.isArray(raw.pathwayAdvice) ? raw.pathwayAdvice : [];
  const pathwayAdvice = uniqueItems([
    ...rawPathwayAdvice.map((item) => sanitizeSentence(item).slice(0, 180)),
    ...fallback.pathwayAdvice
  ], 180).slice(0, 3);

  return {
    personalizedCareerDirection: sanitizeSentence(raw.personalizedCareerDirection, fallback.personalizedCareerDirection).slice(0, 150),
    nicheCareerPaths: paddedNicheCareers,
    reason: sanitizeSentence(raw.reason, fallback.reason),
    aspirationReflection: sanitizeSentence(raw.aspirationReflection, fallback.aspirationReflection).slice(0, 300),
    pathwayAdvice,
    cautions: rawCautions.map((item) => sanitizeSentence(item)).filter(Boolean).slice(0, 2)
  };
}

function sanitizeGeminiNarrative(
  parsed: Partial<EnhancedNarrative>,
  recommendations: RecommendationResult[],
  model: string,
  answers: StudentAnswer
): EnhancedNarrative {
  const recommendationReasons: Record<string, string[]> = {};
  const careerPersonalizations: Record<string, CareerPersonalization> = {};
  const rawReasons = parsed.recommendationReasons && typeof parsed.recommendationReasons === "object" ? parsed.recommendationReasons : {};
  const rawCareerPersonalizations =
    parsed.careerPersonalizations && typeof parsed.careerPersonalizations === "object" ? parsed.careerPersonalizations : {};

  for (const recommendation of recommendations) {
    const raw = rawReasons[recommendation.majorId];
    const items = Array.isArray(raw) ? raw : [];
    const sanitized = items
      .map((item) => sanitizeSentence(item))
      .filter(Boolean)
      .slice(0, recommendation.rank === 1 ? 5 : 2);

    recommendationReasons[recommendation.majorId] =
      sanitized.length > 0 ? sanitized : recommendation.reasonBullets.slice(0, recommendation.rank === 1 ? 5 : 2);
    careerPersonalizations[recommendation.majorId] = sanitizeCareerPersonalization(
      rawCareerPersonalizations[recommendation.majorId],
      recommendation,
      answers
    );
  }

  return {
    summary: sanitizeSentence(
      parsed.summary,
      recommendations[0]
        ? `Berdasarkan jawaban yang kamu isi, rekomendasi utama kamu adalah ${recommendations[0].majorName}.`
        : "Berdasarkan jawaban yang kamu isi, hasil ini bisa menjadi bahan refleksi awal."
    ),
    recommendationReasons,
    careerPersonalizations,
    source: "gemini",
    model
  };
}

function joinPreview(items: string[], fallback: string) {
  if (items.length === 0) return fallback;
  return items.slice(0, 3).join(", ");
}

export function buildRecommendationNarrative(
  answer: StudentAnswer,
  major: KnowledgeMajor,
  recommendation: RecommendationResult
) {
  const topInterests = joinPreview(
    recommendation.scoringBreakdown.matchedInterests,
    answer.favoriteActivities.slice(0, 2).join(", ") || "minat yang kamu pilih"
  );
  const topSkills = joinPreview(
    recommendation.scoringBreakdown.matchedSkills,
    answer.skillStrengths.slice(0, 2).join(", ") || "kekuatan utama kamu"
  );
  const matchedSubjects = joinPreview(recommendation.scoringBreakdown.matchedSubjects, "mata pelajaran pilihanmu");
  const preferenceNote = recommendation.scoringBreakdown.preferenceNotes[0];
  const requiredSkills = joinPreview(
    major.relatedSkills.map((skill) => skill.label),
    "kombinasi skill teknis dan manusia"
  );

  const bullets = [
    `Berdasarkan minat kamu pada ${topInterests} dan kekuatan kamu di ${topSkills}, jurusan ${major.name} cocok karena bidang ini membutuhkan ${requiredSkills}.`,
    `Mata pelajaran seperti ${matchedSubjects} memberi sinyal awal yang relevan dengan arah ${recommendation.cluster}.`,
    `Arah karier yang bisa kamu pertimbangkan adalah ${recommendation.careerDirection}.`,
    `Di era AI, bidang ini memiliki ketahanan ${recommendation.aiFutureResilienceLabel.toLowerCase()} karena ${major.aiFutureResilienceReason}`,
    "AI dapat menjadi alat bantu untuk meningkatkan produktivitas.",
    "Skill manusia seperti komunikasi, empati, kreativitas, dan judgement tetap penting."
  ];

  if (preferenceNote) {
    bullets.splice(3, 0, `Dari sisi preferensi dan batasan, ${preferenceNote}.`);
  }

  return bullets.slice(0, 6);
}
