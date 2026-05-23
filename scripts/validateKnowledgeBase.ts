import {
  aiResilienceProfiles,
  careers,
  constraintRules,
  constraints,
  interests,
  majors,
  problemAreas,
  sampleScoringExamples,
  skills,
  subjects,
  workStyles,
  type Major,
  type SampleStudentProfile,
  type WeightedTag
} from "../data";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ScoredMajor {
  major: Major;
  score: number;
}

function calculateAIScore(profile: {
  humanInteraction: number;
  creativity: number;
  physicalPractical: number;
  ethicalJudgment: number;
  complexProblemSolving: number;
  professionalAccountability: number;
  aiAugmentationPotential: number;
  industryGrowth: number;
  nonRoutineWork: number;
}) {
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

function setOf(items: { id: string }[]) {
  return new Set(items.map((item) => item.id));
}

function hasDuplicates(items: string[]) {
  return items.some((item, index) => items.indexOf(item) !== index);
}

function validateUnique(name: string, items: { id: string }[], issues: ValidationIssue[]) {
  const ids = items.map((item) => item.id);
  if (hasDuplicates(ids)) {
    issues.push({ path: name, message: "Terdapat ID duplikat." });
  }
}

function validateTextArray(path: string, items: string[], min: number, issues: ValidationIssue[]) {
  if (items.length < min) {
    issues.push({ path, message: `Minimal ${min} item.` });
  }
  for (const [index, item] of items.entries()) {
    if (!item.trim()) issues.push({ path: `${path}.${index}`, message: "Teks tidak boleh kosong." });
  }
}

function validateWeightedTags(
  path: string,
  tags: WeightedTag[],
  allowedIds: Set<string>,
  min: number,
  issues: ValidationIssue[]
) {
  if (tags.length < min) {
    issues.push({ path, message: `Minimal ${min} weighted tag.` });
  }
  for (const tag of tags) {
    if (!allowedIds.has(tag.id)) {
      issues.push({ path, message: `WeightedTag id tidak dikenal: ${tag.id}.` });
    }
    if (tag.weight < 0 || tag.weight > 100) {
      issues.push({ path, message: `Weight harus 0-100 untuk ${tag.id}.` });
    }
    if (!tag.label.trim()) {
      issues.push({ path, message: `Label kosong untuk ${tag.id}.` });
    }
  }
}

export function validateKnowledgeBase(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const majorIds = setOf(majors);
  const careerIds = setOf(careers);
  const profileIds = setOf(aiResilienceProfiles);
  const subjectIds = setOf(subjects);
  const interestIds = setOf(interests);
  const skillIds = setOf(skills);
  const workStyleIds = setOf(workStyles);
  const problemAreaIds = setOf(problemAreas);
  const constraintIds = setOf(constraints);

  validateUnique("majors", majors, issues);
  validateUnique("careers", careers, issues);
  validateUnique("skills", skills, issues);
  validateUnique("interests", interests, issues);
  validateUnique("subjects", subjects, issues);
  validateUnique("workStyles", workStyles, issues);
  validateUnique("problemAreas", problemAreas, issues);
  validateUnique("constraints", constraints, issues);
  validateUnique("aiResilienceProfiles", aiResilienceProfiles, issues);

  if (majors.length < 60) issues.push({ path: "majors", message: "Minimal 60 major/program." });
  if (careers.length < 100) issues.push({ path: "careers", message: "Minimal 100 career." });

  for (const profile of aiResilienceProfiles) {
    const calculated = calculateAIScore(profile);
    if (profile.finalScore !== calculated) {
      issues.push({
        path: `aiResilienceProfiles.${profile.id}.finalScore`,
        message: `finalScore ${profile.finalScore} tidak sesuai formula ${calculated}.`
      });
    }
    if (profile.finalScore < 0 || profile.finalScore > 100) {
      issues.push({ path: `aiResilienceProfiles.${profile.id}.finalScore`, message: "Skor harus 0-100." });
    }
  }

  for (const major of majors) {
    const path = `majors.${major.id}`;
    validateWeightedTags(`${path}.relatedSubjects`, major.relatedSubjects, subjectIds, 3, issues);
    validateWeightedTags(`${path}.relatedInterests`, major.relatedInterests, interestIds, 3, issues);
    validateWeightedTags(`${path}.relatedSkills`, major.relatedSkills, skillIds, 3, issues);
    validateWeightedTags(`${path}.relatedWorkStyles`, major.relatedWorkStyles, workStyleIds, 2, issues);
    validateWeightedTags(`${path}.relatedProblemAreas`, major.relatedProblemAreas, problemAreaIds, 2, issues);
    validateTextArray(`${path}.portfolioSuggestions`, major.portfolioSuggestions, 3, issues);
    validateTextArray(`${path}.certificationSuggestions`, major.certificationSuggestions, 3, issues);
    validateTextArray(`${path}.internshipSuggestions`, major.internshipSuggestions, 3, issues);
    validateTextArray(`${path}.beginnerFriendlyNextSteps`, major.beginnerFriendlyNextSteps, 3, issues);
    if (!profileIds.has(major.aiFutureResilienceProfileId)) {
      issues.push({ path, message: `AI profile tidak ditemukan: ${major.aiFutureResilienceProfileId}.` });
    }
    if (major.aiFutureResilienceScore < 0 || major.aiFutureResilienceScore > 100) {
      issues.push({ path: `${path}.aiFutureResilienceScore`, message: "Skor harus 0-100." });
    }
    if (major.relatedCareers.length < 3) {
      issues.push({ path: `${path}.relatedCareers`, message: "Minimal 3 career terkait." });
    }
    for (const careerId of major.relatedCareers) {
      if (!careerIds.has(careerId)) {
        issues.push({ path: `${path}.relatedCareers`, message: `Career tidak ditemukan: ${careerId}.` });
      }
    }
    for (const constraintId of [...major.recommendedForConstraints, ...major.notRecommendedForConstraints]) {
      if (!constraintIds.has(constraintId)) {
        issues.push({ path, message: `Constraint tidak ditemukan: ${constraintId}.` });
      }
    }
  }

  for (const career of careers) {
    const path = `careers.${career.id}`;
    if (career.relatedMajorIds.length < 1) {
      issues.push({ path, message: "Career harus terhubung ke minimal 1 major." });
    }
    for (const majorId of career.relatedMajorIds) {
      if (!majorIds.has(majorId)) {
        issues.push({ path, message: `Major tidak ditemukan: ${majorId}.` });
      }
    }
    validateWeightedTags(`${path}.requiredSkills`, career.requiredSkills, skillIds, 3, issues);
    validateWeightedTags(`${path}.niceToHaveSkills`, career.niceToHaveSkills, skillIds, 1, issues);
    if (career.aiFutureResilienceScore < 0 || career.aiFutureResilienceScore > 100) {
      issues.push({ path: `${path}.aiFutureResilienceScore`, message: "Skor harus 0-100." });
    }
  }

  for (const rule of constraintRules) {
    const path = `constraintRules.${rule.id}`;
    if (!constraintIds.has(rule.id)) {
      issues.push({ path, message: "Rule tidak punya constraint dimension yang cocok." });
    }
    for (const majorId of [...rule.boostMajorIds, ...rule.cautionMajorIds, ...rule.alternativeMajorIds]) {
      if (!majorIds.has(majorId)) {
        issues.push({ path, message: `Major pada rule tidak ditemukan: ${majorId}.` });
      }
    }
  }

  for (const sample of sampleScoringExamples) {
    for (const id of sample.subjectIds) if (!subjectIds.has(id)) issues.push({ path: sample.id, message: `Subject sample tidak valid: ${id}.` });
    for (const id of sample.interestIds) if (!interestIds.has(id)) issues.push({ path: sample.id, message: `Interest sample tidak valid: ${id}.` });
    for (const id of sample.skillIds) if (!skillIds.has(id)) issues.push({ path: sample.id, message: `Skill sample tidak valid: ${id}.` });
    for (const id of sample.workStyleIds) if (!workStyleIds.has(id)) issues.push({ path: sample.id, message: `Work style sample tidak valid: ${id}.` });
    for (const id of sample.problemAreaIds) if (!problemAreaIds.has(id)) issues.push({ path: sample.id, message: `Problem area sample tidak valid: ${id}.` });
    for (const id of sample.constraintIds) if (!constraintIds.has(id)) issues.push({ path: sample.id, message: `Constraint sample tidak valid: ${id}.` });
    for (const id of sample.expectedTopMajorIds) if (!majorIds.has(id)) issues.push({ path: sample.id, message: `Expected major sample tidak valid: ${id}.` });
  }

  return issues;
}

function tagScore(tags: WeightedTag[], selectedIds: string[]) {
  if (selectedIds.length === 0) return 0;
  const byId = new Map(tags.map((tag) => [tag.id, tag.weight]));
  const matched = selectedIds.reduce((sum, id) => sum + (byId.get(id) ?? 0), 0);
  return Math.min(100, matched / selectedIds.length);
}

function constraintScore(major: Major, constraintIds: string[]) {
  let score = 65;
  for (const constraintId of constraintIds) {
    const rule = constraintRules.find((item) => item.id === constraintId);
    if (!rule) continue;
    if (rule.boostMajorIds.includes(major.id) || major.recommendedForConstraints.includes(constraintId)) {
      score += 12;
    }
    if (rule.cautionMajorIds.includes(major.id) || major.notRecommendedForConstraints.includes(constraintId)) {
      score -= 14;
    }
  }
  return Math.max(0, Math.min(100, score));
}

export function scoreMajorForSample(major: Major, profile: SampleStudentProfile) {
  return Math.round(
    tagScore(major.relatedInterests, profile.interestIds) * 0.3 +
      tagScore(major.relatedSkills, profile.skillIds) * 0.25 +
      tagScore(major.relatedSubjects, profile.subjectIds) * 0.15 +
      tagScore(major.relatedWorkStyles, profile.workStyleIds) * 0.1 +
      tagScore(major.relatedProblemAreas, profile.problemAreaIds) * 0.1 +
      constraintScore(major, profile.constraintIds) * 0.1
  );
}

export function scoreSampleProfile(profile: SampleStudentProfile): ScoredMajor[] {
  return majors
    .map((major) => ({ major, score: scoreMajorForSample(major, profile) }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (right.major.aiFutureResilienceScore !== left.major.aiFutureResilienceScore) {
        return right.major.aiFutureResilienceScore - left.major.aiFutureResilienceScore;
      }
      return left.major.name.localeCompare(right.major.name, "id-ID");
    });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const issues = validateKnowledgeBase();
  if (issues.length > 0) {
    console.error(`Knowledge base invalid: ${issues.length} issue(s)`);
    for (const issue of issues) {
      console.error(`- ${issue.path}: ${issue.message}`);
    }
    process.exit(1);
  }

  console.log(`Knowledge base valid: ${majors.length} majors, ${careers.length} careers.`);
}
