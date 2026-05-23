import type {
  AIFutureResilienceProfile,
  AIResilienceLabel,
  Career,
  ConstraintRule,
  CostLevel,
  DegreeType,
  KnowledgeDimension,
  Level,
  Major,
  WeightedTag
} from "./types";
import { subjects } from "./subjects";
import { interests } from "./interests";
import { skills } from "./skills";
import { workStyles } from "./workStyles";
import { problemAreas } from "./problemAreas";
import { aiResilienceProfilesById } from "./aiResilienceProfiles";

export const CLUSTERS = [
  "Technology & Data",
  "Business & Management",
  "Finance & Accounting",
  "Health & Life Sciences",
  "Engineering & Infrastructure",
  "Creative & Media",
  "Social, Psychology & Education",
  "Law, Governance & International",
  "Hospitality, Tourism & Culinary",
  "Agriculture, Food & Environment",
  "Language & Culture",
  "Sports & Physical Performance",
  "Vocational & Applied Skills"
] as const;

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function weighted(ids: string[], dimensions: KnowledgeDimension[], startWeight = 95): WeightedTag[] {
  const byId = new Map(dimensions.map((dimension) => [dimension.id, dimension]));
  return ids.map((id, index) => {
    const dimension = byId.get(id);
    return {
      id,
      label: dimension?.label ?? id,
      weight: Math.max(50, startWeight - index * 7)
    };
  });
}

export function calculateAIResilienceScore(profile: Omit<AIFutureResilienceProfile, "finalScore" | "label">) {
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

export function aiLabel(score: number): AIResilienceLabel {
  if (score >= 75) return "Tinggi";
  if (score >= 58) return "Sedang";
  return "Perlu Adaptasi Tinggi";
}

export function createAIProfile(
  profile: Omit<AIFutureResilienceProfile, "finalScore" | "label">
): AIFutureResilienceProfile {
  const finalScore = calculateAIResilienceScore(profile);
  return {
    ...profile,
    finalScore,
    label: aiLabel(finalScore)
  };
}

export interface MajorSeed {
  id: string;
  name: string;
  alternativeNames?: string[];
  degreeTypes?: DegreeType[];
  cluster: string;
  subCluster: string;
  description: string;
  subjectIds: string[];
  interestIds: string[];
  skillIds: string[];
  workStyleIds: string[];
  problemAreaIds: string[];
  careerIds: string[];
  careerDirections: string[];
  industries?: string[];
  portfolioSuggestions?: string[];
  certificationSuggestions?: string[];
  internshipSuggestions?: string[];
  beginnerFriendlyNextSteps?: string[];
  aiProfileId: string;
  automationRiskLevel?: Level;
  aiAugmentationPotential?: Level;
  educationCostLevel?: CostLevel;
  mathIntensity?: Level;
  scienceIntensity?: Level;
  communicationIntensity?: Level;
  creativityIntensity?: Level;
  fieldWorkIntensity?: Level;
  industryPracticality?: Level;
  jobMarketFlexibility?: Level;
  ptnPtsVokasiNotes?: string;
  cautionNotes?: string[];
  recommendedForConstraints?: string[];
  notRecommendedForConstraints?: string[];
  suitableFor?: string[];
  lessSuitableFor?: string[];
}

const clusterIndustries: Record<string, string[]> = {
  "Technology & Data": ["teknologi", "startup digital", "konsultan IT", "fintech", "edtech"],
  "Business & Management": ["ritel", "startup", "konsultan bisnis", "manufaktur", "UMKM"],
  "Finance & Accounting": ["perbankan", "audit", "pajak", "asuransi", "investasi"],
  "Health & Life Sciences": ["rumah sakit", "klinik", "laboratorium", "farmasi", "kesehatan masyarakat"],
  "Engineering & Infrastructure": ["konstruksi", "energi", "manufaktur", "transportasi", "konsultan teknik"],
  "Creative & Media": ["agensi kreatif", "media", "periklanan", "hiburan", "produk digital"],
  "Social, Psychology & Education": ["sekolah", "lembaga sosial", "HR", "konseling", "riset sosial"],
  "Law, Governance & International": ["firma hukum", "pemerintahan", "NGO", "kebijakan publik", "organisasi internasional"],
  "Hospitality, Tourism & Culinary": ["hotel", "restoran", "pariwisata", "event", "travel"],
  "Agriculture, Food & Environment": ["agrikultur", "pangan", "lingkungan", "kehutanan", "perikanan"],
  "Language & Culture": ["penerjemahan", "pendidikan bahasa", "media", "lokalisasi", "hubungan budaya"],
  "Sports & Physical Performance": ["olahraga", "kebugaran", "sekolah", "klub olahraga", "sport analytics"],
  "Vocational & Applied Skills": ["industri terapan", "jasa profesional", "manufaktur", "klinik", "kantor"]
};

function ensureThree(items: string[], fallback: string[]) {
  return [...items, ...fallback].filter(Boolean).slice(0, 3);
}

export function createMajor(seed: MajorSeed): Major {
  const profile = aiResilienceProfilesById[seed.aiProfileId];
  return {
    id: seed.id,
    name: seed.name,
    alternativeNames: seed.alternativeNames ?? [],
    degreeTypes: seed.degreeTypes ?? ["S1"],
    cluster: seed.cluster,
    subCluster: seed.subCluster,
    description: seed.description,
    suitableFor:
      seed.suitableFor ??
      [
        `Siswa yang tertarik pada ${seed.interestIds.slice(0, 2).join(" dan ")}.`,
        `Siswa yang nyaman mengembangkan ${seed.skillIds.slice(0, 2).join(" dan ")}.`,
        "Siswa yang mau belajar bertahap dan membangun portofolio sejak sekolah."
      ],
    lessSuitableFor:
      seed.lessSuitableFor ??
      [
        "Kurang cocok jika kamu tidak ingin belajar konsep dasar bidang ini.",
        "Kurang cocok jika kamu menghindari latihan rutin dan evaluasi karya.",
        "Perlu dipertimbangkan lagi jika pilihan ini hanya ikut teman tanpa eksplorasi."
      ],
    relatedSubjects: weighted(seed.subjectIds, subjects),
    relatedInterests: weighted(seed.interestIds, interests),
    relatedSkills: weighted(seed.skillIds, skills),
    relatedWorkStyles: weighted(seed.workStyleIds, workStyles),
    relatedProblemAreas: weighted(seed.problemAreaIds, problemAreas),
    relatedCareers: seed.careerIds,
    careerDirections: seed.careerDirections,
    commonIndustries: seed.industries ?? clusterIndustries[seed.cluster] ?? ["industri umum", "pendidikan", "layanan profesional"],
    portfolioSuggestions: ensureThree(seed.portfolioSuggestions ?? [], [
      "Buat studi kasus sederhana yang menunjukkan proses berpikir.",
      "Dokumentasikan proyek sekolah, lomba, atau kegiatan organisasi.",
      "Susun portofolio digital berisi hasil karya dan refleksi belajar."
    ]),
    certificationSuggestions: ensureThree(seed.certificationSuggestions ?? [], [
      "Ikuti kursus dasar sesuai bidang minat.",
      "Ambil sertifikasi pengantar atau workshop dari lembaga tepercaya.",
      "Latih penggunaan alat kerja standar yang sering dipakai industri."
    ]),
    internshipSuggestions: ensureThree(seed.internshipSuggestions ?? [], [
      "Cari magang, job shadowing, atau kunjungan industri.",
      "Ikut proyek komunitas yang relevan dengan bidang ini.",
      "Wawancarai mahasiswa atau praktisi untuk memahami rutinitas kerja."
    ]),
    beginnerFriendlyNextSteps: ensureThree(seed.beginnerFriendlyNextSteps ?? [], [
      "Coba mini project selama 2 minggu untuk menguji minat.",
      "Diskusikan hasil eksplorasi dengan guru BK atau mentor.",
      "Bandingkan kurikulum PTN, PTS, vokasi, dan sertifikasi."
    ]),
    aiFutureResilienceProfileId: seed.aiProfileId,
    aiFutureResilienceScore: profile.finalScore,
    aiFutureResilienceReason: profile.explanation,
    automationRiskLevel: seed.automationRiskLevel ?? "Sedang",
    aiAugmentationPotential: seed.aiAugmentationPotential ?? "Tinggi",
    educationCostLevel: seed.educationCostLevel ?? "Sedang",
    mathIntensity: seed.mathIntensity ?? "Sedang",
    scienceIntensity: seed.scienceIntensity ?? "Sedang",
    communicationIntensity: seed.communicationIntensity ?? "Sedang",
    creativityIntensity: seed.creativityIntensity ?? "Sedang",
    fieldWorkIntensity: seed.fieldWorkIntensity ?? "Sedang",
    industryPracticality: seed.industryPracticality ?? "Tinggi",
    jobMarketFlexibility: seed.jobMarketFlexibility ?? "Sedang",
    ptnPtsVokasiNotes:
      seed.ptnPtsVokasiNotes ??
      "Bandingkan kurikulum, akreditasi, biaya, peluang magang, dan koneksi industri. PTN, PTS, vokasi, dan sertifikasi bisa sama-sama relevan jika cocok dengan tujuanmu.",
    cautionNotes:
      seed.cautionNotes ??
      [
        "Pekerjaan ini tidak hilang, tetapi cara kerjanya akan berubah.",
        "AI bisa menjadi alat bantu, bukan pengganti penuh.",
        "Tetap bangun skill manusia seperti komunikasi, empati, kreativitas, dan judgement."
      ],
    recommendedForConstraints: seed.recommendedForConstraints ?? [],
    notRecommendedForConstraints: seed.notRecommendedForConstraints ?? []
  };
}

export interface CareerSeed {
  id: string;
  title: string;
  cluster: string;
  description: string;
  relatedMajorIds: string[];
  requiredSkillIds: string[];
  niceSkillIds?: string[];
  typicalTasks: string[];
  industries?: string[];
  aiProfileId: string;
  automationRiskLevel?: Level;
  aiAugmentationPotential?: Level;
  entryPathways?: string[];
  portfolioExamples?: string[];
  beginnerFriendlyNextSteps?: string[];
}

export function createCareer(seed: CareerSeed): Career {
  const profile = aiResilienceProfilesById[seed.aiProfileId];
  return {
    id: seed.id,
    title: seed.title,
    cluster: seed.cluster,
    description: seed.description,
    relatedMajorIds: seed.relatedMajorIds,
    requiredSkills: weighted(seed.requiredSkillIds, skills),
    niceToHaveSkills: weighted(seed.niceSkillIds ?? ["communication", "teamwork", "critical_thinking"], skills, 82),
    typicalTasks: seed.typicalTasks,
    industries: seed.industries ?? clusterIndustries[seed.cluster] ?? ["industri umum"],
    aiImpactSummary: profile.explanation,
    aiFutureResilienceScore: profile.finalScore,
    automationRiskLevel: seed.automationRiskLevel ?? "Sedang",
    aiAugmentationPotential: seed.aiAugmentationPotential ?? "Tinggi",
    entryPathways:
      seed.entryPathways ??
      ["Kuliah sesuai rumpun jurusan", "Magang atau proyek nyata", "Portofolio dan sertifikasi dasar"],
    portfolioExamples:
      seed.portfolioExamples ??
      ["Studi kasus sederhana", "Dokumentasi proyek", "Ringkasan proses belajar dan hasil"],
    beginnerFriendlyNextSteps:
      seed.beginnerFriendlyNextSteps ??
      ["Pelajari pengantar bidang ini", "Ikuti kelas dasar", "Cari mentor atau komunitas belajar"]
  };
}

export const commonConstraintIds = [
  "cost_sensitive",
  "parent_permission",
  "far_location",
  "competitive_admission",
  "unsure_interest",
  "afraid_wrong_major",
  "wants_fast_employment",
  "wants_scholarship",
  "prefers_ptn_java",
  "prefers_ptn_outside_java",
  "prefers_good_private_university",
  "prefers_near_home",
  "prefers_vocational",
  "prefers_certification"
];

export function createConstraintRule(rule: ConstraintRule): ConstraintRule {
  return rule;
}
