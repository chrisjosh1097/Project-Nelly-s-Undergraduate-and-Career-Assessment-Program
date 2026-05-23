import type { AIFutureResilienceProfile, AIResilienceLabel } from "./types";

function calculateFinalScore(profile: Omit<AIFutureResilienceProfile, "finalScore" | "label">) {
  return Math.round(
    profile.humanInteraction * 0.15 +
      profile.creativity * 0.12 +
      profile.physicalPractical * 0.1 +
      profile.ethicalJudgment * 0.12 +
      profile.complexProblemSolving * 0.15 +
      profile.professionalAccountability * 0.1 +
      profile.aiAugmentationPotential * 0.12 +
      profile.industryGrowth * 0.09 +
      profile.nonRoutineWork * 0.05
  );
}

function labelFor(score: number): AIResilienceLabel {
  if (score >= 75) return "Tinggi";
  if (score >= 58) return "Sedang";
  return "Perlu Adaptasi Tinggi";
}

function profile(input: Omit<AIFutureResilienceProfile, "finalScore" | "label">): AIFutureResilienceProfile {
  const finalScore = calculateFinalScore(input);
  return { ...input, finalScore, label: labelFor(finalScore) };
}

export const aiResilienceProfiles: AIFutureResilienceProfile[] = [
  profile({
    id: "tech_product_builder",
    name: "Pembangun Produk Teknologi",
    humanInteraction: 58,
    creativity: 72,
    physicalPractical: 24,
    ethicalJudgment: 70,
    complexProblemSolving: 90,
    professionalAccountability: 72,
    aiAugmentationPotential: 95,
    industryGrowth: 92,
    nonRoutineWork: 76,
    repetitiveTaskRisk: 38,
    routineDigitalAutomationRisk: 64,
    explanation:
      "AI akan mempercepat coding dan dokumentasi, tetapi desain sistem, keamanan, kebutuhan pengguna, dan problem solving tetap membutuhkan manusia."
  }),
  profile({
    id: "data_ai_analytics",
    name: "Data, AI, dan Analitik",
    humanInteraction: 52,
    creativity: 62,
    physicalPractical: 18,
    ethicalJudgment: 76,
    complexProblemSolving: 88,
    professionalAccountability: 74,
    aiAugmentationPotential: 97,
    industryGrowth: 93,
    nonRoutineWork: 70,
    repetitiveTaskRisk: 46,
    routineDigitalAutomationRisk: 70,
    explanation:
      "Analisis rutin bisa dibantu AI, namun pemilihan data, interpretasi, etika, dan komunikasi insight tetap menjadi pembeda manusia."
  }),
  profile({
    id: "cyber_risk_security",
    name: "Keamanan Digital dan Risiko",
    humanInteraction: 56,
    creativity: 60,
    physicalPractical: 28,
    ethicalJudgment: 88,
    complexProblemSolving: 92,
    professionalAccountability: 88,
    aiAugmentationPotential: 90,
    industryGrowth: 92,
    nonRoutineWork: 84,
    repetitiveTaskRisk: 30,
    routineDigitalAutomationRisk: 52,
    explanation:
      "Serangan digital terus berubah, sehingga judgement etis, investigasi, dan respons terhadap kasus nyata tetap kuat meski alat AI makin banyak."
  }),
  profile({
    id: "business_strategy",
    name: "Strategi Bisnis dan Manajemen",
    humanInteraction: 78,
    creativity: 70,
    physicalPractical: 25,
    ethicalJudgment: 70,
    complexProblemSolving: 78,
    professionalAccountability: 74,
    aiAugmentationPotential: 86,
    industryGrowth: 80,
    nonRoutineWork: 72,
    repetitiveTaskRisk: 42,
    routineDigitalAutomationRisk: 60,
    explanation:
      "AI membantu riset dan analisis, tetapi keputusan bisnis, negosiasi, kepemimpinan, dan pemahaman pelanggan tetap membutuhkan manusia."
  }),
  profile({
    id: "finance_accountability",
    name: "Keuangan, Akuntabilitas, dan Risiko",
    humanInteraction: 56,
    creativity: 38,
    physicalPractical: 12,
    ethicalJudgment: 88,
    complexProblemSolving: 76,
    professionalAccountability: 92,
    aiAugmentationPotential: 86,
    industryGrowth: 74,
    nonRoutineWork: 60,
    repetitiveTaskRisk: 66,
    routineDigitalAutomationRisk: 76,
    explanation:
      "Pencatatan rutin makin otomatis, tetapi audit, kepatuhan, interpretasi risiko, dan tanggung jawab profesional tetap penting."
  }),
  profile({
    id: "clinical_health",
    name: "Kesehatan Klinis",
    humanInteraction: 94,
    creativity: 46,
    physicalPractical: 88,
    ethicalJudgment: 96,
    complexProblemSolving: 84,
    professionalAccountability: 98,
    aiAugmentationPotential: 78,
    industryGrowth: 88,
    nonRoutineWork: 86,
    repetitiveTaskRisk: 24,
    routineDigitalAutomationRisk: 34,
    explanation:
      "Bidang klinis kuat karena membutuhkan empati, pemeriksaan langsung, keputusan etis, dan tanggung jawab profesional kepada pasien."
  }),
  profile({
    id: "life_science_lab",
    name: "Sains Hayati dan Laboratorium",
    humanInteraction: 48,
    creativity: 58,
    physicalPractical: 82,
    ethicalJudgment: 82,
    complexProblemSolving: 82,
    professionalAccountability: 86,
    aiAugmentationPotential: 76,
    industryGrowth: 82,
    nonRoutineWork: 78,
    repetitiveTaskRisk: 38,
    routineDigitalAutomationRisk: 44,
    explanation:
      "AI membantu analisis, tetapi riset, eksperimen, kontrol kualitas, dan interpretasi hasil lab masih membutuhkan ketelitian manusia."
  }),
  profile({
    id: "engineering_field",
    name: "Teknik, Lapangan, dan Infrastruktur",
    humanInteraction: 60,
    creativity: 64,
    physicalPractical: 90,
    ethicalJudgment: 80,
    complexProblemSolving: 88,
    professionalAccountability: 92,
    aiAugmentationPotential: 78,
    industryGrowth: 84,
    nonRoutineWork: 86,
    repetitiveTaskRisk: 28,
    routineDigitalAutomationRisk: 42,
    explanation:
      "AI membantu desain dan simulasi, tetapi keputusan lapangan, keselamatan, material, dan tanggung jawab teknis tetap sangat manusiawi."
  }),
  profile({
    id: "creative_media",
    name: "Kreatif, Media, dan Komunikasi",
    humanInteraction: 68,
    creativity: 94,
    physicalPractical: 42,
    ethicalJudgment: 64,
    complexProblemSolving: 72,
    professionalAccountability: 62,
    aiAugmentationPotential: 90,
    industryGrowth: 76,
    nonRoutineWork: 80,
    repetitiveTaskRisk: 42,
    routineDigitalAutomationRisk: 68,
    explanation:
      "AI bisa membuat draft dan aset cepat, tetapi arah kreatif, rasa, konteks budaya, dan strategi komunikasi tetap menjadi nilai manusia."
  }),
  profile({
    id: "social_education",
    name: "Sosial, Psikologi, dan Pendidikan",
    humanInteraction: 92,
    creativity: 68,
    physicalPractical: 38,
    ethicalJudgment: 90,
    complexProblemSolving: 78,
    professionalAccountability: 84,
    aiAugmentationPotential: 72,
    industryGrowth: 76,
    nonRoutineWork: 82,
    repetitiveTaskRisk: 30,
    routineDigitalAutomationRisk: 42,
    explanation:
      "Pekerjaan ini bertumpu pada empati, konteks sosial, komunikasi, dan judgement sehingga AI lebih cocok menjadi alat bantu."
  }),
  profile({
    id: "law_governance",
    name: "Hukum, Pemerintahan, dan Kebijakan",
    humanInteraction: 84,
    creativity: 58,
    physicalPractical: 20,
    ethicalJudgment: 96,
    complexProblemSolving: 82,
    professionalAccountability: 94,
    aiAugmentationPotential: 78,
    industryGrowth: 72,
    nonRoutineWork: 84,
    repetitiveTaskRisk: 36,
    routineDigitalAutomationRisk: 62,
    explanation:
      "Riset dokumen bisa dibantu AI, tetapi advokasi, negosiasi, etika, dan interpretasi konteks hukum tetap membutuhkan manusia."
  }),
  profile({
    id: "hospitality_service",
    name: "Hospitality, Pariwisata, dan Layanan",
    humanInteraction: 90,
    creativity: 66,
    physicalPractical: 72,
    ethicalJudgment: 66,
    complexProblemSolving: 70,
    professionalAccountability: 70,
    aiAugmentationPotential: 68,
    industryGrowth: 76,
    nonRoutineWork: 78,
    repetitiveTaskRisk: 46,
    routineDigitalAutomationRisk: 44,
    explanation:
      "Pengalaman tamu, rasa layanan, koordinasi acara, dan kualitas hospitality masih sangat bergantung pada sentuhan manusia."
  }),
  profile({
    id: "agri_environment",
    name: "Agrikultur, Pangan, dan Lingkungan",
    humanInteraction: 58,
    creativity: 58,
    physicalPractical: 86,
    ethicalJudgment: 78,
    complexProblemSolving: 80,
    professionalAccountability: 78,
    aiAugmentationPotential: 74,
    industryGrowth: 84,
    nonRoutineWork: 82,
    repetitiveTaskRisk: 34,
    routineDigitalAutomationRisk: 38,
    explanation:
      "Teknologi membantu pemantauan dan analisis, tetapi kondisi alam, lapangan, pangan, dan keberlanjutan membutuhkan keputusan kontekstual."
  }),
  profile({
    id: "language_culture",
    name: "Bahasa, Budaya, dan Lokalisasi",
    humanInteraction: 70,
    creativity: 74,
    physicalPractical: 18,
    ethicalJudgment: 68,
    complexProblemSolving: 70,
    professionalAccountability: 64,
    aiAugmentationPotential: 86,
    industryGrowth: 68,
    nonRoutineWork: 70,
    repetitiveTaskRisk: 54,
    routineDigitalAutomationRisk: 76,
    explanation:
      "Terjemahan rutin bisa dibantu AI, tetapi nuansa budaya, konteks, gaya bahasa, dan komunikasi lintas budaya tetap perlu manusia."
  }),
  profile({
    id: "sports_performance",
    name: "Olahraga dan Performa Fisik",
    humanInteraction: 84,
    creativity: 54,
    physicalPractical: 95,
    ethicalJudgment: 68,
    complexProblemSolving: 72,
    professionalAccountability: 74,
    aiAugmentationPotential: 66,
    industryGrowth: 72,
    nonRoutineWork: 86,
    repetitiveTaskRisk: 28,
    routineDigitalAutomationRisk: 24,
    explanation:
      "Latihan, teknik tubuh, motivasi, dan pembinaan fisik tetap membutuhkan observasi langsung dan interaksi manusia."
  }),
  profile({
    id: "vocational_applied",
    name: "Vokasi dan Keahlian Terapan",
    humanInteraction: 66,
    creativity: 58,
    physicalPractical: 92,
    ethicalJudgment: 70,
    complexProblemSolving: 76,
    professionalAccountability: 78,
    aiAugmentationPotential: 70,
    industryGrowth: 78,
    nonRoutineWork: 84,
    repetitiveTaskRisk: 36,
    routineDigitalAutomationRisk: 34,
    explanation:
      "Keahlian praktik, alat, prosedur, dan layanan langsung membuat jalur vokasi tetap kuat jika terus mengikuti teknologi industri."
  })
];

export const aiResilienceProfilesById = Object.fromEntries(
  aiResilienceProfiles.map((item) => [item.id, item])
) as Record<string, AIFutureResilienceProfile>;
