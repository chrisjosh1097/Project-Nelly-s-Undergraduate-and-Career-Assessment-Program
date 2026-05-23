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

export type SubmissionStatus = "processing" | "completed" | "failed";

export type FitLabel =
  | "Sangat Cocok"
  | "Cocok"
  | "Cukup Cocok"
  | "Perlu Dipertimbangkan Lagi";

export type AIFutureResilienceLabel =
  | "Tinggi"
  | "Sedang"
  | "Perlu Adaptasi Tinggi";

export interface StudentAnswer {
  fullName: string;
  email: string;
  school: string;
  className: string;
  currentSchoolMajor: SchoolMajor;
  favoriteSubjects: string[];
  favoriteActivities: string[];
  skillStrengths: string[];
  workStyle: WorkStyle;
  problemAreas: string[];
  collegePathPreferences: string[];
  personalConstraints: string[];
  techComfort: TechComfort;
  dreamProfession: string;
  futureVision: string;
}

export interface NormalizedStudentAnswer {
  fullName: string;
  email: string;
  school: string;
  className: string;
  currentSchoolMajor: SchoolMajor;
  favoriteSubjectIds: string[];
  interestIds: string[];
  skillIds: string[];
  workStyleId: string;
  problemAreaIds: string[];
  collegePreferenceIds: string[];
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
  rank: number;
  majorId: string;
  majorName: string;
  cluster: string;
  careerDirection: string;
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
}

export interface RecommendationReport {
  generatedAt: string;
  topRecommendation: RecommendationResult;
  recommendations: RecommendationResult[];
  scoringVersion: string;
  narrativeVersion: string;
  ptnPtsVokasiAdvice?: string[];
  answerPatternNotes?: string[];
}

export interface Submission {
  id: string;
  email: string;
  fullName: string;
  school: string;
  className: string;
  status: SubmissionStatus;
  answers: StudentAnswer;
  report: RecommendationReport;
  createdAt: string;
  updatedAt: string;
}
