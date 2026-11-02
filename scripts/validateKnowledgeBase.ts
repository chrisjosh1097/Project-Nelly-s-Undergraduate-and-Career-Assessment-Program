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
  studentGuidance,
  type Major,
  type SampleStudentProfile,
  type WeightedTag,
  type StudentGuidanceCatalog,
  type WeekAction,
} from "../data";
import { validatePathwayCapacity } from "../src/lib/recommendation/eligibility";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { campusMajorMap } from "../data/campusMajorMap";
import { programsForRule } from "../src/lib/campus/catalog";
import { problemAreaOptionTags } from "../src/lib/assessment/options";

/** Every major must share a tag with at least one current problem-area option. */
export function validateProblemAreaReachability(): ValidationIssue[] {
  const known = new Set(problemAreas.map((area) => area.id));
  const reachable = new Set(Object.values(problemAreaOptionTags).flat());
  const issues: ValidationIssue[] = [];
  for (const tag of reachable) {
    if (!known.has(tag)) issues.push({ path: "problemAreaOptionTags", message: `unknown tag "${tag}"` });
  }
  for (const major of majors) {
    if (!major.relatedProblemAreas.some((tag) => reachable.has(tag.id))) {
      issues.push({ path: `majors.${major.id}.relatedProblemAreas`, message: "not reachable from any problem-area option" });
    }
  }
  return issues;
}

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
      profile.nonRoutineWork * 0.05,
  );
}

function setOf(items: { id: string }[]) {
  return new Set(items.map((item) => item.id));
}

function hasDuplicates(items: string[]) {
  return items.some((item, index) => items.indexOf(item) !== index);
}

function validateUnique(
  name: string,
  items: { id: string }[],
  issues: ValidationIssue[],
) {
  const ids = items.map((item) => item.id);
  if (hasDuplicates(ids)) {
    issues.push({ path: name, message: "Terdapat ID duplikat." });
  }
}

function validateTextArray(
  path: string,
  items: string[],
  min: number,
  issues: ValidationIssue[],
) {
  if (items.length < min) {
    issues.push({ path, message: `Minimal ${min} item.` });
  }
  for (const [index, item] of items.entries()) {
    if (!item.trim())
      issues.push({
        path: `${path}.${index}`,
        message: "Teks tidak boleh kosong.",
      });
  }
}

function validateWeightedTags(
  path: string,
  tags: WeightedTag[],
  allowedIds: Set<string>,
  min: number,
  issues: ValidationIssue[],
) {
  if (tags.length < min) {
    issues.push({ path, message: `Minimal ${min} weighted tag.` });
  }
  for (const tag of tags) {
    if (!allowedIds.has(tag.id)) {
      issues.push({
        path,
        message: `WeightedTag id tidak dikenal: ${tag.id}.`,
      });
    }
    if (tag.weight < 0 || tag.weight > 100) {
      issues.push({ path, message: `Weight harus 0-100 untuk ${tag.id}.` });
    }
    if (!tag.label.trim()) {
      issues.push({ path, message: `Label kosong untuk ${tag.id}.` });
    }
  }
}

export function validateStudentGuidance(catalog: StudentGuidanceCatalog = studentGuidance): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const normalize = (text: string) => text.normalize("NFKC").trim().toLocaleLowerCase("id-ID");
  const issue = (path: string, message: string) => issues.push({ path: `studentGuidance.${path}`, message });
  const text = (path: string, value: string) => {
    if (!value.trim()) issue(path, "Teks tidak boleh kosong.");
    for (const sentence of value.split(/[.!?]+/).filter(item => item.trim())) {
      if (sentence.trim().split(/\s+/).length > 20) issue(path, "Gunakan kalimat paling banyak 20 kata.");
    }
  };
  const action = (path: string, value: string) => {
    text(path, value);
    if (!/^(?:Pelajari|Buat|Tanyakan|Bandingkan|Cek|Periksa|Cari|Tentukan|Diskusikan|Ringkas|Pilih|Baca|Coba|Uji|Catat|Tunjukkan|Simpan|Tulis|Gambar|Minta|Susun|Gunakan|Tandai|Gambarkan|Cantumkan|Ulangi)\b/.test(value))
      issue(path, "Mulai tindakan dengan kata kerja yang jelas.");
  };
  const unique = (path: string, values: string[]) => {
    const normalized = values.map(normalize);
    if (new Set(normalized).size !== normalized.length) issue(path, "Terdapat entri duplikat.");
  };
  const frequency = new Map<string, number>();
  for (const major of majors) for (const gap of new Set([
    ...major.relatedSkills.map(skill => skill.label), ...major.certificationSuggestions, ...major.portfolioSuggestions,
  ])) frequency.set(gap, (frequency.get(gap) ?? 0) + 1);
  const topGaps = [...frequency].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "id-ID")).slice(0, 40);
  unique("skillTargets", catalog.skillTargets.map(item => item.gap));
  const targets = new Set(catalog.skillTargets.map(item => item.gap));
  for (const [gap] of topGaps) if (!targets.has(gap)) issue("skillTargets", `Target untuk label sering muncul belum ada: ${gap}`);
  for (const [index, entry] of catalog.skillTargets.entries()) {
    const path = `skillTargets.${index}`;
    if (!frequency.has(entry.gap)) issue(`${path}.gap`, "Label target tidak ditemukan dalam sumber gap katalog.");
    text(`${path}.target`, entry.target);
    if (!/^Bisa\s/.test(entry.target)) issue(`${path}.target`, "Target harus diawali Bisa dan dapat diamati.");
    action(`${path}.proof`, entry.proof);
  }

  for (const [key, rows] of Object.entries(catalog.skillTargetsBySubCluster)) {
    if (!majors.some(major => major.subCluster === key)) issue(`skillTargetsBySubCluster.${key}`, "Bidang tidak dikenal dalam katalog.");
    unique(`skillTargetsBySubCluster.${key}`, rows.map(item => item.gap));
    for (const [index, entry] of rows.entries()) {
      const path = `skillTargetsBySubCluster.${key}.${index}`;
      text(`${path}.target`, entry.target);
      if (!/^Bisa\s/.test(entry.target)) issue(`${path}.target`, "Target harus diawali Bisa dan dapat diamati.");
      action(`${path}.proof`, entry.proof);
    }
  }

  const checkPlan = (path: string, plan: WeekAction[]) => {
    if (plan.length !== 4 || plan.some((item, index) => item.week !== index + 1))
      issue(path, "Rencana harus berisi minggu 1, 2, 3, dan 4 secara berurutan.");
    for (const [index, item] of plan.entries()) {
      action(`${path}.${index}.action`, item.action);
      action(`${path}.${index}.proof`, item.proof);
      if (!/^\d+(?:[–-]\d+)? (jam|menit)$/.test(item.durationLabel))
        issue(`${path}.${index}.durationLabel`, "Cantumkan durasi latihan dalam jam atau menit.");
    }
  };
  const clusters = new Set(majors.map(major => major.cluster));
  const subClusters = new Set(majors.map(major => major.subCluster));
  for (const [field, expected] of [["weekPlansByCluster", clusters], ["weekPlansBySubCluster", subClusters]] as const) {
    for (const key of expected) if (!catalog[field][key]) issue(`${field}.${key}`, "Rencana bidang belum ada.");
    for (const [key, plan] of Object.entries(catalog[field])) {
      if (!expected.has(key)) issue(`${field}.${key}`, "Bidang tidak dikenal dalam katalog.");
      checkPlan(`${field}.${key}`, plan);
    }
  }
  checkPlan("genericWeekPlan", catalog.genericWeekPlan);

  unique("aspirationRoutes", catalog.aspirationRoutes.map(route => route.id));
  const routes = new Map(catalog.aspirationRoutes.map(route => [route.id, route]));
  for (const [index, route] of catalog.aspirationRoutes.entries()) {
    const path = `aspirationRoutes.${index}`;
    text(`${path}.id`, route.id); text(`${path}.title`, route.title);
    if (!route.keywords.length || !route.steps.length) issue(path, "Rute perlu kata kunci dan langkah eksplorasi.");
    unique(`${path}.keywords`, route.keywords);
    route.keywords.forEach((word, i) => text(`${path}.keywords.${i}`, word));
    route.steps.forEach((step, i) => action(`${path}.steps.${i}`, step));
    action(`${path}.verify`, route.verify);
    if (!route.verify.startsWith("Cek sumber resmi")) issue(`${path}.verify`, "Cantumkan instruksi cek sumber resmi.");
    if (!catalog.aspirationRouteKeywordRules.some(rule => rule.routeId === route.id && rule.keywords.length))
      issue(path, "Rute tidak dirujuk aturan kata kunci.");
  }
  for (const [index, rule] of catalog.aspirationRouteKeywordRules.entries()) {
    const route = routes.get(rule.routeId);
    if (!route) issue(`aspirationRouteKeywordRules.${index}.routeId`, "Rute kata kunci tidak dikenal.");
    if (!rule.keywords.length) issue(`aspirationRouteKeywordRules.${index}.keywords`, "Aturan perlu kata kunci.");
    for (const word of rule.keywords) if (!route?.keywords.includes(word))
      issue(`aspirationRouteKeywordRules.${index}.keywords`, "Kata kunci tidak sesuai definisi rute.");
  }

  const glossaryNames: string[] = [];
  catalog.glossary.forEach((entry, index) => {
    text(`glossary.${index}.term`, entry.term); text(`glossary.${index}.plain`, entry.plain);
    glossaryNames.push(entry.term, ...(entry.aliases ?? []));
    entry.aliases?.forEach((alias, i) => text(`glossary.${index}.aliases.${i}`, alias));
  });
  unique("glossary", glossaryNames);
  unique("fieldAiNotes.cluster", catalog.fieldAiNotes.map(entry => entry.cluster));
  unique("fieldAiNotes.note", catalog.fieldAiNotes.map(entry => entry.note.replace(/[^\p{L}\p{N}]/gu, "")));
  for (const cluster of clusters) if (!catalog.fieldAiNotes.some(entry => entry.cluster === cluster))
    issue("fieldAiNotes", `Catatan AI belum ada untuk ${cluster}.`);
  catalog.fieldAiNotes.forEach((entry, index) => {
    if (!clusters.has(entry.cluster)) issue(`fieldAiNotes.${index}.cluster`, "Cluster catatan AI tidak dikenal.");
    text(`fieldAiNotes.${index}.note`, entry.note);
    if (entry.note.split(/[.!?]+/).filter(sentence => sentence.trim()).length > 2)
      issue(`fieldAiNotes.${index}.note`, "Catatan AI paling banyak dua kalimat.");
  });
  return issues;
}

export function validateKnowledgeBase(): ValidationIssue[] {
  const issues: ValidationIssue[] = validatePathwayCapacity(majors).map(
    (message) => ({ path: "majors.degreeTypes", message }),
  );
  issues.push(...validateStudentGuidance());
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

  if (majors.length < 60)
    issues.push({ path: "majors", message: "Minimal 60 major/program." });
  if (careers.length < 100)
    issues.push({ path: "careers", message: "Minimal 100 career." });

  for (const profile of aiResilienceProfiles) {
    const calculated = calculateAIScore(profile);
    if (profile.finalScore !== calculated) {
      issues.push({
        path: `aiResilienceProfiles.${profile.id}.finalScore`,
        message: `finalScore ${profile.finalScore} tidak sesuai formula ${calculated}.`,
      });
    }
    if (profile.finalScore < 0 || profile.finalScore > 100) {
      issues.push({
        path: `aiResilienceProfiles.${profile.id}.finalScore`,
        message: "Skor harus 0-100.",
      });
    }
  }

  for (const major of majors) {
    const path = `majors.${major.id}`;
    validateWeightedTags(
      `${path}.relatedSubjects`,
      major.relatedSubjects,
      subjectIds,
      3,
      issues,
    );
    validateWeightedTags(
      `${path}.relatedInterests`,
      major.relatedInterests,
      interestIds,
      3,
      issues,
    );
    validateWeightedTags(
      `${path}.relatedSkills`,
      major.relatedSkills,
      skillIds,
      3,
      issues,
    );
    validateWeightedTags(
      `${path}.relatedWorkStyles`,
      major.relatedWorkStyles,
      workStyleIds,
      2,
      issues,
    );
    validateWeightedTags(
      `${path}.relatedProblemAreas`,
      major.relatedProblemAreas,
      problemAreaIds,
      2,
      issues,
    );
    validateTextArray(
      `${path}.portfolioSuggestions`,
      major.portfolioSuggestions,
      3,
      issues,
    );
    validateTextArray(
      `${path}.certificationSuggestions`,
      major.certificationSuggestions,
      3,
      issues,
    );
    validateTextArray(
      `${path}.internshipSuggestions`,
      major.internshipSuggestions,
      3,
      issues,
    );
    validateTextArray(
      `${path}.beginnerFriendlyNextSteps`,
      major.beginnerFriendlyNextSteps,
      3,
      issues,
    );
    if (!profileIds.has(major.aiFutureResilienceProfileId)) {
      issues.push({
        path,
        message: `AI profile tidak ditemukan: ${major.aiFutureResilienceProfileId}.`,
      });
    }
    if (
      major.aiFutureResilienceScore < 0 ||
      major.aiFutureResilienceScore > 100
    ) {
      issues.push({
        path: `${path}.aiFutureResilienceScore`,
        message: "Skor harus 0-100.",
      });
    }
    if (major.relatedCareers.length < 3) {
      issues.push({
        path: `${path}.relatedCareers`,
        message: "Minimal 3 career terkait.",
      });
    }
    for (const careerId of major.relatedCareers) {
      if (!careerIds.has(careerId)) {
        issues.push({
          path: `${path}.relatedCareers`,
          message: `Career tidak ditemukan: ${careerId}.`,
        });
      }
    }
    for (const constraintId of [
      ...major.recommendedForConstraints,
      ...major.notRecommendedForConstraints,
    ]) {
      if (!constraintIds.has(constraintId)) {
        issues.push({
          path,
          message: `Constraint tidak ditemukan: ${constraintId}.`,
        });
      }
    }
  }

  for (const career of careers) {
    const path = `careers.${career.id}`;
    if (career.relatedMajorIds.length < 1) {
      issues.push({
        path,
        message: "Career harus terhubung ke minimal 1 major.",
      });
    }
    for (const majorId of career.relatedMajorIds) {
      if (!majorIds.has(majorId)) {
        issues.push({ path, message: `Major tidak ditemukan: ${majorId}.` });
      }
    }
    validateWeightedTags(
      `${path}.requiredSkills`,
      career.requiredSkills,
      skillIds,
      3,
      issues,
    );
    validateWeightedTags(
      `${path}.niceToHaveSkills`,
      career.niceToHaveSkills,
      skillIds,
      1,
      issues,
    );
    if (
      career.aiFutureResilienceScore < 0 ||
      career.aiFutureResilienceScore > 100
    ) {
      issues.push({
        path: `${path}.aiFutureResilienceScore`,
        message: "Skor harus 0-100.",
      });
    }
  }

  for (const rule of constraintRules) {
    const path = `constraintRules.${rule.id}`;
    if (!constraintIds.has(rule.id)) {
      issues.push({
        path,
        message: "Rule tidak punya constraint dimension yang cocok.",
      });
    }
    for (const majorId of [
      ...rule.boostMajorIds,
      ...rule.cautionMajorIds,
      ...rule.alternativeMajorIds,
    ]) {
      if (!majorIds.has(majorId)) {
        issues.push({
          path,
          message: `Major pada rule tidak ditemukan: ${majorId}.`,
        });
      }
    }
  }

  for (const sample of sampleScoringExamples) {
    for (const id of sample.subjectIds)
      if (!subjectIds.has(id))
        issues.push({
          path: sample.id,
          message: `Subject sample tidak valid: ${id}.`,
        });
    for (const id of sample.interestIds)
      if (!interestIds.has(id))
        issues.push({
          path: sample.id,
          message: `Interest sample tidak valid: ${id}.`,
        });
    for (const id of sample.skillIds)
      if (!skillIds.has(id))
        issues.push({
          path: sample.id,
          message: `Skill sample tidak valid: ${id}.`,
        });
    for (const id of sample.workStyleIds)
      if (!workStyleIds.has(id))
        issues.push({
          path: sample.id,
          message: `Work style sample tidak valid: ${id}.`,
        });
    for (const id of sample.problemAreaIds)
      if (!problemAreaIds.has(id))
        issues.push({
          path: sample.id,
          message: `Problem area sample tidak valid: ${id}.`,
        });
    for (const id of sample.constraintIds)
      if (!constraintIds.has(id))
        issues.push({
          path: sample.id,
          message: `Constraint sample tidak valid: ${id}.`,
        });
    for (const id of sample.expectedTopMajorIds)
      if (!majorIds.has(id))
        issues.push({
          path: sample.id,
          message: `Expected major sample tidak valid: ${id}.`,
        });
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
    if (
      rule.boostMajorIds.includes(major.id) ||
      major.recommendedForConstraints.includes(constraintId)
    ) {
      score += 12;
    }
    if (
      rule.cautionMajorIds.includes(major.id) ||
      major.notRecommendedForConstraints.includes(constraintId)
    ) {
      score -= 14;
    }
  }
  return Math.max(0, Math.min(100, score));
}

export function scoreMajorForSample(
  major: Major,
  profile: SampleStudentProfile,
) {
  return Math.round(
    tagScore(major.relatedInterests, profile.interestIds) * 0.3 +
      tagScore(major.relatedSkills, profile.skillIds) * 0.25 +
      tagScore(major.relatedSubjects, profile.subjectIds) * 0.15 +
      tagScore(major.relatedWorkStyles, profile.workStyleIds) * 0.1 +
      tagScore(major.relatedProblemAreas, profile.problemAreaIds) * 0.1 +
      constraintScore(major, profile.constraintIds) * 0.1,
  );
}

export function scoreSampleProfile(
  profile: SampleStudentProfile,
): ScoredMajor[] {
  return majors
    .map((major) => ({ major, score: scoreMajorForSample(major, profile) }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (
        right.major.aiFutureResilienceScore !==
        left.major.aiFutureResilienceScore
      ) {
        return (
          right.major.aiFutureResilienceScore -
          left.major.aiFutureResilienceScore
        );
      }
      return left.major.name.localeCompare(right.major.name, "id-ID");
    });
}

export function validateCampusMap(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const major of majors) {
    const rule = campusMajorMap[major.id];
    if (!rule) {
      issues.push({ path: `campusMajorMap.${major.id}`, message: "missing campus mapping" });
      continue;
    }
    if ("none" in rule) continue;
    for (const phrase of rule.include) {
      if (programsForRule({ include: [phrase], exclude: rule.exclude }).length === 0) {
        issues.push({ path: `campusMajorMap.${major.id}`, message: `include "${phrase}" matches 0 programs` });
      }
    }
  }
  return issues;
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  const issues = [...validateKnowledgeBase(), ...validateCampusMap(), ...validateProblemAreaReachability()];
  if (issues.length > 0) {
    console.error(`Knowledge base invalid: ${issues.length} issue(s)`);
    for (const issue of issues) {
      console.error(`- ${issue.path}: ${issue.message}`);
    }
    process.exit(1);
  }

  console.log(
    `Knowledge base valid: ${majors.length} majors, ${careers.length} careers.`,
  );
  const noneCount = majors.filter((major) => "none" in (campusMajorMap[major.id] ?? {})).length;
  console.log(`campus map: ${majors.length - noneCount} mapped, ${noneCount} none`);
}
