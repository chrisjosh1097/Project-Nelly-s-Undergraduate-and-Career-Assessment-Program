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

type TextSignals = {
  interestIds: string[];
  skillIds: string[];
  problemAreaIds: string[];
};

const textSignalRules: Array<{
  patterns: RegExp[];
  interestIds?: string[];
  skillIds?: string[];
  problemAreaIds?: string[];
}> = [
  {
    patterns: [/\bmembantu\b/, /\bbantu\b/, /\bmenolong\b/, /\bmendampingi\b/, /\bmelayani\b/, /\bpelayanan\b/],
    interestIds: ["helping_people"],
    skillIds: ["empathy", "communication"],
    problemAreaIds: ["social"]
  },
  {
    patterns: [/\bham\b/, /hak asasi/, /\bkeadilan\b/, /\badvokasi\b/, /\bmemperjuangkan\b/, /\bhukum\b/, /\bkebijakan\b/, /\bregulasi\b/],
    interestIds: ["law_debate", "speaking_writing"],
    skillIds: ["critical_thinking", "communication", "public_speaking"],
    problemAreaIds: ["law", "social", "public_service"]
  },
  {
    patterns: [/\blingkungan\b/, /\biklim\b/, /\bclimate\b/, /\bsustainability\b/, /\bkeberlanjutan\b/, /\bkonservasi\b/, /\bhutan\b/, /\blimbah\b/, /\balam\b/],
    interestIds: ["nature_environment", "field_work"],
    skillIds: ["research", "critical_thinking"],
    problemAreaIds: ["environment", "public_service"]
  },
  {
    patterns: [/\bpendidikan\b/, /\bmengajar\b/, /\bguru\b/, /\bsekolah\b/, /\banak\b/],
    interestIds: ["teaching", "helping_people"],
    skillIds: ["communication", "public_speaking"],
    problemAreaIds: ["education", "social"]
  },
  {
    patterns: [/\bkesehatan\b/, /\bmedis\b/, /\brumah sakit\b/, /\bpasien\b/, /\bgizi\b/],
    interestIds: ["health_care", "helping_people"],
    skillIds: ["empathy", "detail_orientation"],
    problemAreaIds: ["health", "social"]
  }
];

function normalizeFreeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferTextSignals(answer: StudentAnswer): TextSignals {
  const text = normalizeFreeText(
    [
      answer.favoriteSubjectsOther,
      answer.collegePathPreferenceOther,
      answer.dreamProfession,
      answer.futureVision
    ].join(" ")
  );

  const signals: TextSignals = {
    interestIds: [],
    skillIds: [],
    problemAreaIds: []
  };

  if (!text) return signals;

  for (const rule of textSignalRules) {
    if (!rule.patterns.some((pattern) => pattern.test(text))) continue;
    signals.interestIds.push(...(rule.interestIds ?? []));
    signals.skillIds.push(...(rule.skillIds ?? []));
    signals.problemAreaIds.push(...(rule.problemAreaIds ?? []));
  }

  return {
    interestIds: unique(signals.interestIds).slice(0, 6),
    skillIds: unique(signals.skillIds).slice(0, 6),
    problemAreaIds: unique(signals.problemAreaIds).slice(0, 6)
  };
}

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
  const textSignals = inferTextSignals(answer);

  return {
    fullName: answer.fullName,
    email: answer.email,
    gender: answer.gender,
    age: answer.age,
    school: answer.school,
    className: answer.className,
    currentSchoolMajor: answer.currentSchoolMajor,
    favoriteSubjectIds: unique(answer.favoriteSubjects.map(normalizeSubjectAnswer)),
    favoriteSubjectsOther: answer.favoriteSubjectsOther,
    interestIds: unique([...answer.favoriteActivities.flatMap(normalizeInterestAnswer), ...textSignals.interestIds]),
    skillIds: unique([...answer.skillStrengths.map(normalizeSkillAnswer), ...textSignals.skillIds]),
    workStyleId: normalizeWorkStyleAnswer(answer.workStyle),
    problemAreaIds: unique([...answer.problemAreas.map(normalizeProblemAreaAnswer), ...textSignals.problemAreaIds]),
    collegePreferenceIds,
    collegePathPreferenceOther: answer.collegePathPreferenceOther,
    constraintIds: unique([...explicitConstraintIds, ...collegePreferenceIds]),
    techComfort: answer.techComfort,
    dreamProfession: answer.dreamProfession,
    futureVision: answer.futureVision
  };
}
