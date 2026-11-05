export type EducationPathway = "university" | "vocational" | "exploring";

export type SchoolMajor =
  | "IPA"
  | "IPS"
  | "Bahasa"
  | "SMK Teknik"
  | "SMK Bisnis"
  | "SMK Kesehatan"
  | "SMK Kreatif/Multimedia"
  | "Lainnya";

export type WorkStyle =
  | "Banyak bertemu orang"
  | "Banyak analisis sendiri"
  | "Praktik langsung"
  | "Kreatif dan fleksibel"
  | "Terstruktur dan detail"
  | "Dinamis di lapangan";

export type TechComfort =
  | "Sangat nyaman"
  | "Cukup nyaman"
  | "Biasa saja"
  | "Kurang nyaman"
  | "Belum pernah mencoba";

export type Gender = "Pria" | "Wanita";

export type SubmissionStatus = "processing" | "completed" | "failed";

export type NarrativeStatus =
  "pending" | "processing" | "completed" | "failed" | "skipped";

export type FitLabel =
  "Sangat Cocok" | "Cocok" | "Cukup Cocok" | "Perlu Dipertimbangkan Lagi";

export type AIFutureResilienceLabel =
  "Tinggi" | "Sedang" | "Perlu Adaptasi Tinggi";

export interface StudentAnswer {
  educationPathway?: EducationPathway;
  fullName: string;
  email: string;
  gender: Gender | "";
  age: string;
  school: string;
  className: string;
  currentSchoolMajor: SchoolMajor;
  /** Free text when currentSchoolMajor is "Lainnya". Display only; optional for old answers. */
  currentSchoolMajorOther?: string;
  favoriteSubjects: string[];
  favoriteSubjectsOther: string;
  favoriteActivities: string[];
  skillStrengths: string[];
  workStyle: WorkStyle;
  problemAreas: string[];
  collegePathPreferences: string[];
  collegePathPreferenceOther: string;
  personalConstraints: string[];
  techComfort: TechComfort;
  dreamProfession: string;
  futureVision: string;
}

export interface NormalizedStudentAnswer {
  educationPathway?: EducationPathway;
  fullName: string;
  email: string;
  gender: Gender | "";
  age: string;
  school: string;
  className: string;
  currentSchoolMajor: SchoolMajor;
  favoriteSubjectIds: string[];
  favoriteSubjectsOther: string;
  interestIds: string[];
  skillIds: string[];
  workStyleId: string;
  problemAreaIds: string[];
  /** v3.2.0+: ranked new-option answers (weight 1.0 / 0.8 / 0.6). */
  problemAreaRanked?: { label: string; weight: number; tagIds: string[] }[];
  textProblemAreaIds?: string[];
  collegePreferenceIds: string[];
  collegePathPreferenceOther: string;
  constraintIds: string[];
  techComfort: TechComfort;
  dreamProfession: string;
  futureVision: string;
}

export interface AIFutureResilienceProfile {
  humanInteraction: number;
  creativity: number;
  physicalPractical: number;
  ethicalJudgment: number;
  complexProblemSolving: number;
  professionalAccountability: number;
  aiAugmentationPotential: number;
  industryGrowth: number;
  nonRoutineWork: number;
  aiReason: string;
}

export interface Career {
  id: string;
  title: string;
  direction: string;
  cluster: string;
}

export interface Major {
  id: string;
  name: string;
  cluster: string;
  careerDirection: string;
  relatedCareers: string[];
  subjects: string[];
  interests: string[];
  skills: string[];
  workStyles: WorkStyle[];
  problemAreas: string[];
  schoolBackgrounds: SchoolMajor[];
  pathwayTags: string[];
  flexible: boolean;
  applied: boolean;
  expensive: boolean;
  competitive: boolean;
  skillGaps: string[];
  nextSteps: string[];
  cautionNotes: string[];
  aiProfile: AIFutureResilienceProfile;
}

export interface ScoringBreakdown {
  interestScore: number;
  skillScore: number;
  subjectScore: number;
  workStyleScore: number;
  problemAreaScore: number;
  constraintFitScore: number;
  aspirationMajorBoost?: number;
  matchedAspirationMajorSignals?: string[];
  matchedSubjects: string[];
  matchedInterests: string[];
  matchedSkills: string[];
  matchedProblemAreas: string[];
  preferenceNotes: string[];
  normalizedSubjectIds?: string[];
  normalizedInterestIds?: string[];
  normalizedSkillIds?: string[];
  normalizedWorkStyleId?: string;
  normalizedProblemAreaIds?: string[];
  normalizedConstraintIds?: string[];
}

export interface RecommendationResult {
  degreeTypes?: string[];
  rank: number;
  majorId: string;
  majorName: string;
  cluster: string;
  careerDirection: string;
  personalizedCareerDirection?: string;
  nicheCareerPaths?: string[];
  careerPersonalizationReason?: string;
  aspirationReflection?: string;
  careerPathwayAdvice?: string[];
  careerCautions?: string[];
  relatedCareers: string[];
  overallFitScore: number;
  fitLabel: FitLabel;
  aiFutureResilienceScore: number;
  aiFutureResilienceLabel: AIFutureResilienceLabel;
  reasonBullets: string[];
  skillStrengthMatches: string[];
  skillGaps: string[];
  recommendedNextSteps: string[];
  cautionNotes: string[];
  scoringBreakdown: ScoringBreakdown;
  /** Optional curated guidance; absent on reports saved before guidance existed. */
  actionGuidance?: ActionGuidance;
}

export interface GuidanceSkillTarget { gap: string; target: string; proof: string }
export interface GuidanceWeekAction { week: 1 | 2 | 3 | 4; action: string; durationLabel: string; proof: string }
export interface GuidanceGlossaryTerm { term: string; plain: string; aliases?: string[] }

export interface ActionGuidance {
  skillTargets: GuidanceSkillTarget[];
  weekPlan: GuidanceWeekAction[];
  aiNote?: string;
  comparisonNote?: string;
}

export interface StudentGuidance {
  evidenceSummary: string;
  tensions: string[];
  aspirationRoutes: { title: string; steps: string[]; verify: string }[];
  glossary: GuidanceGlossaryTerm[];
}

export interface CareerPersonalization {
  personalizedCareerDirection: string;
  nicheCareerPaths: string[];
  reason: string;
  aspirationReflection: string;
  pathwayAdvice: string[];
  cautions: string[];
}

export interface EnhancedNarrative {
  summary: string;
  studentStrengths?: string[];
  recommendationReasons: Record<string, string[]>;
  careerPersonalizations?: Record<string, CareerPersonalization>;
  source: "heuristic" | "gemini";
  model?: string;
}

export interface RecommendationReport {
  generatedAt: string;
  topRecommendation: RecommendationResult;
  recommendations: RecommendationResult[];
  scoringVersion: string;
  narrativeVersion: string;
  ptnPtsVokasiAdvice?: string[];
  answerPatternNotes?: string[];
  narrative?: EnhancedNarrative;
  studentGuidance?: StudentGuidance;
}

export interface Submission {
  id: string;
  email: string;
  fullName: string;
  school: string;
  className: string;
  status: SubmissionStatus;
  narrativeStatus?: NarrativeStatus;
  narrativeUpdatedAt?: string;
  narrativeError?: string;
  answers: StudentAnswer;
  report: RecommendationReport;
  createdAt: string;
  updatedAt: string;
}
