import type { NormalizedStudentAnswer, StudentAnswer } from "@/lib/types";
import { unique } from "@/lib/utils";

const subjectMap: Record<string, string> = {
  Matematika: "mathematics",
  Fisika: "physics",
  Biologi: "biology",
  Kimia: "chemistry",
  Ekonomi: "economics",
  Bahasa: "language",
  "Seni/Desain": "arts_design",
  "Komputer/TIK": "computer",
  Olahraga: "sports",
  Sosiologi: "sociology",
  Sejarah: "history",
  Lainnya: "other"
};

const interestMap: Record<string, string[]> = {
  "Membuat desain/konten": ["design_visual", "content_media"],
  "Coding/teknologi": ["coding", "tech_ai"],
  "Membantu orang": ["helping_people"],
  "Berjualan/bisnis": ["business_selling"],
  "Menghitung/analisis data": ["data_analysis", "finance_numbers"],
  "Menulis/berbicara": ["speaking_writing"],
  "Eksperimen/lab": ["lab_experiment"],
  "Kerja lapangan": ["field_work"],
  "Mengorganisir acara": ["organizing"],
  "Memperbaiki barang/mesin": ["engineering_machines"]
};

const skillMap: Record<string, string> = {
  Komunikasi: "communication",
  Kreativitas: "creativity",
  Logika: "logic",
  Empati: "empathy",
  Leadership: "leadership",
  Ketelitian: "detail_orientation",
  "Problem solving": "problem_solving",
  "Public speaking": "public_speaking",
  "Numerik/hitung-hitungan": "numeracy",
  "Bahasa asing": "foreign_language",
  Teknologi: "technology",
  "Kerja praktik": "practical_work"
};

const workStyleMap: Record<string, string> = {
  "Banyak bertemu orang": "people_facing",
  "Banyak analisis sendiri": "independent_analysis",
  "Praktik langsung": "hands_on",
  "Kreatif dan fleksibel": "creative_flexible",
  "Terstruktur dan detail": "structured_detail",
  "Dinamis di lapangan": "dynamic_field"
};

const problemAreaMap: Record<string, string> = {
  Pendidikan: "education",
  Kesehatan: "health",
  Bisnis: "business",
  Teknologi: "technology",
  Lingkungan: "environment",
  Sosial: "social",
  Keuangan: "finance",
  Hukum: "law",
  "Kreatif/media": "creative_media",
  Infrastruktur: "infrastructure"
};

const constraintMap: Record<string, string> = {
  Biaya: "cost_sensitive",
  "Izin orang tua": "parent_permission",
  "Lokasi jauh": "far_location",
  "Persaingan masuk": "competitive_admission",
  "Belum tahu minat": "unsure_interest",
  "Takut salah jurusan": "afraid_wrong_major",
  "Ingin cepat kerja": "wants_fast_employment",
  "Ingin beasiswa": "wants_scholarship"
};

const collegePreferenceMap: Record<string, string> = {
  "PTN di Jawa": "prefers_ptn_java",
  "PTN luar Jawa": "prefers_ptn_outside_java",
  "PTS bagus di kota besar": "prefers_good_private_university",
  "Kuliah dekat rumah": "prefers_near_home",
  "Diploma/vokasi": "prefers_vocational",
  "Sertifikasi/bootcamp": "prefers_certification",
  "Belum tahu": "unsure_interest"
};

export function normalizeSubjectAnswer(value: string) {
  return subjectMap[value] ?? "other";
}

export function normalizeInterestAnswer(value: string) {
  return interestMap[value] ?? ["other"];
}

export function normalizeSkillAnswer(value: string) {
  return skillMap[value] ?? "other";
}

export function normalizeWorkStyleAnswer(value: string) {
  return workStyleMap[value] ?? "structured_detail";
}

export function normalizeProblemAreaAnswer(value: string) {
  return problemAreaMap[value] ?? "other";
}

export function normalizeConstraintAnswer(value: string) {
  return constraintMap[value] ?? "other";
}

export function normalizeCollegePreferenceAnswer(value: string) {
  return collegePreferenceMap[value] ?? "other";
}

export function normalizeStudentAnswer(answer: StudentAnswer): NormalizedStudentAnswer {
  const collegePreferenceIds = unique(answer.collegePathPreferences.map(normalizeCollegePreferenceAnswer));
  const explicitConstraintIds = answer.personalConstraints.map(normalizeConstraintAnswer);

  return {
    fullName: answer.fullName,
    email: answer.email,
    school: answer.school,
    className: answer.className,
    currentSchoolMajor: answer.currentSchoolMajor,
    favoriteSubjectIds: unique(answer.favoriteSubjects.map(normalizeSubjectAnswer)),
    interestIds: unique(answer.favoriteActivities.flatMap(normalizeInterestAnswer)),
    skillIds: unique(answer.skillStrengths.map(normalizeSkillAnswer)),
    workStyleId: normalizeWorkStyleAnswer(answer.workStyle),
    problemAreaIds: unique(answer.problemAreas.map(normalizeProblemAreaAnswer)),
    collegePreferenceIds,
    constraintIds: unique([...explicitConstraintIds, ...collegePreferenceIds]),
    techComfort: answer.techComfort,
    dreamProfession: answer.dreamProfession,
    futureVision: answer.futureVision
  };
}
