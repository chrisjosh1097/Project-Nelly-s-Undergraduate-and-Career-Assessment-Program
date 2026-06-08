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
          {
            personalizedCareerDirection: recommendation.careerDirection,
            nicheCareerPaths: recommendation.relatedCareers.slice(0, 3),
            reason: `Arah karier ini masih selaras dengan jurusan ${recommendation.majorName} dan jawaban yang kamu isi.`,
            cautions: []
          }
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
          maxOutputTokens: 2600,
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
    return sanitizeGeminiNarrative(parsed, recommendations, model);
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

    const recommendations = report.recommendations.map((recommendation) => ({
      ...recommendation,
      reasonBullets: narrative.recommendationReasons[recommendation.majorId] ?? recommendation.reasonBullets,
      personalizedCareerDirection:
        narrative.careerPersonalizations?.[recommendation.majorId]?.personalizedCareerDirection ??
        recommendation.personalizedCareerDirection,
      nicheCareerPaths: narrative.careerPersonalizations?.[recommendation.majorId]?.nicheCareerPaths ?? recommendation.nicheCareerPaths,
      careerPersonalizationReason:
        narrative.careerPersonalizations?.[recommendation.majorId]?.reason ?? recommendation.careerPersonalizationReason,
      careerCautions: narrative.careerPersonalizations?.[recommendation.majorId]?.cautions ?? recommendation.careerCautions
    }));

    return {
      ...report,
      topRecommendation: recommendations[0],
      recommendations,
      narrativeVersion: narrative.source === "gemini" ? `gemini:${narrative.model ?? "unknown"}` : report.narrativeVersion,
      narrative
    };
  } catch (error) {
    console.warn("[WARN] Narrative enhancement failed, using heuristic template.", error);
    const fallback = await new HeuristicTemplateNarrativeEnhancer().enhance({
      answers,
      recommendations: report.recommendations
    });
    return {
      ...report,
      narrative: fallback
    };
  }
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
          "Object dengan key majorId untuk semua rekomendasi #1 sampai #10. Setiap item wajib punya personalizedCareerDirection, nicheCareerPaths tepat 3 item, reason 1 kalimat, dan cautions 0-2 item."
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

function fallbackCareerPersonalization(recommendation: RecommendationResult): CareerPersonalization {
  return {
    personalizedCareerDirection: recommendation.careerDirection,
    nicheCareerPaths: recommendation.relatedCareers.slice(0, 3),
    reason: `Arah karier ini masih selaras dengan jurusan ${recommendation.majorName} dan jawaban yang kamu isi.`,
    cautions: []
  };
}

function sanitizeCareerPersonalization(
  value: unknown,
  recommendation: RecommendationResult
): CareerPersonalization {
  const fallback = fallbackCareerPersonalization(recommendation);
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

  return {
    personalizedCareerDirection: sanitizeSentence(raw.personalizedCareerDirection, fallback.personalizedCareerDirection).slice(0, 150),
    nicheCareerPaths: paddedNicheCareers,
    reason: sanitizeSentence(raw.reason, fallback.reason),
    cautions: rawCautions.map((item) => sanitizeSentence(item)).filter(Boolean).slice(0, 2)
  };
}

function sanitizeGeminiNarrative(
  parsed: Partial<EnhancedNarrative>,
  recommendations: RecommendationResult[],
  model: string
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
      recommendation
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
