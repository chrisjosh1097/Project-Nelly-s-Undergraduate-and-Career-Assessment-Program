import type { SampleStudentProfile } from "./types";

export const sampleScoringExamples: SampleStudentProfile[] = [
  {
    id: "coding_math_ai",
    label: "Siswa tertarik coding, matematika, logika, dan AI",
    subjectIds: ["mathematics", "computer", "physics"],
    interestIds: ["coding", "data_analysis", "tech_ai"],
    skillIds: ["logic", "problem_solving", "technology", "numeracy"],
    workStyleIds: ["independent_analysis", "structured_detail"],
    problemAreaIds: ["technology", "business"],
    constraintIds: ["prefers_certification"],
    expectedTopMajorIds: ["informatika", "data_science", "sistem_informasi"]
  },
  {
    id: "helping_empathy_biology",
    label: "Siswa tertarik membantu orang, empati, dan biologi",
    subjectIds: ["biology", "language", "sociology"],
    interestIds: ["helping_people", "health_care", "teaching"],
    skillIds: ["empathy", "communication", "problem_solving"],
    workStyleIds: ["people_facing", "structured_detail"],
    problemAreaIds: ["health", "social", "education"],
    constraintIds: ["cost_sensitive"],
    expectedTopMajorIds: ["psikologi", "keperawatan", "kesehatan_masyarakat"]
  },
  {
    id: "design_content_creativity",
    label: "Siswa tertarik desain, konten, dan kreativitas",
    subjectIds: ["arts_design", "computer", "language"],
    interestIds: ["design_visual", "content_media", "speaking_writing"],
    skillIds: ["creativity", "visual_design", "communication", "technology"],
    workStyleIds: ["creative_flexible", "structured_detail"],
    problemAreaIds: ["creative_media", "business"],
    constraintIds: ["prefers_good_private_university"],
    expectedTopMajorIds: ["desain_komunikasi_visual", "animasi", "komunikasi"]
  },
  {
    id: "business_selling_leadership",
    label: "Siswa tertarik bisnis, jualan, dan leadership",
    subjectIds: ["economics", "entrepreneurship", "language"],
    interestIds: ["business_selling", "organizing", "speaking_writing"],
    skillIds: ["leadership", "communication", "negotiation", "problem_solving"],
    workStyleIds: ["people_facing", "dynamic_field"],
    problemAreaIds: ["business", "finance"],
    constraintIds: ["unsure_interest"],
    expectedTopMajorIds: ["manajemen", "bisnis_digital", "marketing"]
  },
  {
    id: "machines_physics_practical",
    label: "Siswa tertarik mesin, fisika, dan praktik langsung",
    subjectIds: ["physics", "mathematics", "computer"],
    interestIds: ["engineering_machines", "field_work", "lab_experiment"],
    skillIds: ["practical_work", "problem_solving", "logic", "discipline"],
    workStyleIds: ["hands_on", "dynamic_field"],
    problemAreaIds: ["infrastructure", "technology"],
    constraintIds: ["wants_fast_employment"],
    expectedTopMajorIds: ["teknik_mesin", "teknik_elektro", "teknik_industri"]
  }
];
