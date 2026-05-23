export type DegreeType = "S1" | "D3" | "D4" | "Vokasi" | "Sertifikasi";

export type Level = "Rendah" | "Sedang" | "Tinggi";
export type CostLevel = "Rendah" | "Sedang" | "Tinggi" | "Sangat Tinggi";
export type AIResilienceLabel = "Tinggi" | "Sedang" | "Perlu Adaptasi Tinggi";

export interface WeightedTag {
  id: string;
  label: string;
  weight: number;
}

export interface KnowledgeDimension {
  id: string;
  label: string;
  description: string;
}

export interface Major {
  id: string;
  name: string;
  alternativeNames: string[];
  degreeTypes: DegreeType[];
  cluster: string;
  subCluster: string;
  description: string;
  suitableFor: string[];
  lessSuitableFor: string[];
  relatedSubjects: WeightedTag[];
  relatedInterests: WeightedTag[];
  relatedSkills: WeightedTag[];
  relatedWorkStyles: WeightedTag[];
  relatedProblemAreas: WeightedTag[];
  relatedCareers: string[];
  careerDirections: string[];
  commonIndustries: string[];
  portfolioSuggestions: string[];
  certificationSuggestions: string[];
  internshipSuggestions: string[];
  beginnerFriendlyNextSteps: string[];
  aiFutureResilienceProfileId: string;
  aiFutureResilienceScore: number;
  aiFutureResilienceReason: string;
  automationRiskLevel: Level;
  aiAugmentationPotential: Level;
  educationCostLevel: CostLevel;
  mathIntensity: Level;
  scienceIntensity: Level;
  communicationIntensity: Level;
  creativityIntensity: Level;
  fieldWorkIntensity: Level;
  industryPracticality: Level;
  jobMarketFlexibility: Level;
  ptnPtsVokasiNotes: string;
  cautionNotes: string[];
  recommendedForConstraints: string[];
  notRecommendedForConstraints: string[];
}

export interface Career {
  id: string;
  title: string;
  cluster: string;
  description: string;
  relatedMajorIds: string[];
  requiredSkills: WeightedTag[];
  niceToHaveSkills: WeightedTag[];
  typicalTasks: string[];
  industries: string[];
  aiImpactSummary: string;
  aiFutureResilienceScore: number;
  automationRiskLevel: Level;
  aiAugmentationPotential: Level;
  entryPathways: string[];
  portfolioExamples: string[];
  beginnerFriendlyNextSteps: string[];
}

export interface AIFutureResilienceProfile {
  id: string;
  name: string;
  humanInteraction: number;
  creativity: number;
  physicalPractical: number;
  ethicalJudgment: number;
  complexProblemSolving: number;
  professionalAccountability: number;
  aiAugmentationPotential: number;
  industryGrowth: number;
  nonRoutineWork: number;
  repetitiveTaskRisk: number;
  routineDigitalAutomationRisk: number;
  finalScore: number;
  label: AIResilienceLabel;
  explanation: string;
}

export interface ConstraintRule {
  id: string;
  label: string;
  description: string;
  boostMajorIds: string[];
  cautionMajorIds: string[];
  alternativeMajorIds: string[];
  scoringModifier: number;
  advice: string[];
}

export interface RecommendationTemplates {
  topRecommendationTemplate: string;
  alternativeRecommendationTemplate: string;
  aiResilienceTemplate: string;
  skillGapTemplate: string;
  ptnPtsVokasiAdviceTemplate: string;
  uncertainStudentTemplate: string;
  costSensitiveTemplate: string;
  fastEmploymentTemplate: string;
}

export interface SampleStudentProfile {
  id: string;
  label: string;
  subjectIds: string[];
  interestIds: string[];
  skillIds: string[];
  workStyleIds: string[];
  problemAreaIds: string[];
  constraintIds: string[];
  expectedTopMajorIds: string[];
}
