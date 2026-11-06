import { describe, expect, it } from "vitest";
import { majors } from "../data/majors";
import {
  studentGuidance, skillTargets, weekPlansBySubCluster, weekPlansByCluster,
  genericWeekPlan, aspirationRoutes, aspirationRouteKeywordRules, glossary, fieldAiNotes,
} from "../data/studentGuidance";
import { validateStudentGuidance, validateKnowledgeBase } from "../scripts/validateKnowledgeBase";

const normalize = (text: string) => text.trim().toLocaleLowerCase("id-ID");
function candidateFrequency() {
  const counts = new Map<string, number>();
  for (const major of majors) for (const gap of new Set([
    ...major.relatedSkills.map(skill => skill.label), ...major.certificationSuggestions, ...major.portfolioSuggestions,
  ])) counts.set(gap, (counts.get(gap) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "id-ID"));
}

describe("curated student guidance", () => {
  it("covers the top forty possible gap labels and all core skill labels with observable targets", () => {
    expect(skillTargets.length).toBeGreaterThanOrEqual(40);
    const byGap = new Map(skillTargets.map(item => [item.gap, item]));
    for (const [gap] of candidateFrequency().slice(0, 40)) expect(byGap.has(gap), gap).toBe(true);
    for (const label of ["Teknologi", "Problem solving", "Ketelitian", "Komunikasi", "K3 dasar"])
      expect(byGap.has(label), label).toBe(true);
    for (const item of skillTargets) {
      expect(item.target).toMatch(/^Bisa\s/);
      expect(item.target.trim().split(/\s+/).length).toBeLessThanOrEqual(20);
      expect(item.proof.trim()).not.toBe("");
      expect(item.target).not.toBe(`Bisa ${item.gap}`);
    }
  });
  it("provides four timed weeks for every subcluster, each cluster and unknown-field fallback", () => {
    for (const sub of new Set(majors.map(m => m.subCluster))) expect(weekPlansBySubCluster[sub], sub).toBeDefined();
    for (const cluster of new Set(majors.map(m => m.cluster))) expect(weekPlansByCluster[cluster], cluster).toBeDefined();
    for (const plan of [...Object.values(weekPlansBySubCluster), ...Object.values(weekPlansByCluster), genericWeekPlan]) {
      expect(plan.map(item => item.week)).toEqual([1, 2, 3, 4]);
      expect(plan[0].action).toMatch(/gratis/);
      expect(plan[1].action).toMatch(/^Buat /);
      expect(plan[2].action).toMatch(/^Tanyakan /);
      expect(plan[3].action).toMatch(/^Ulangi .*minggu 3/);
      expect(plan[3].proof).toMatch(/nikmati.*berat/);
      for (const item of plan) {
        expect(item.action.trim().split(/\s+/).length).toBeLessThanOrEqual(20);
        expect(item.durationLabel).toMatch(/^\d+(?:[–-]\d+)? (jam|menit)$/);
        expect(item.proof.trim()).not.toBe("");
      }
    }
    expect(weekPlansBySubCluster["Otomasi dan instrumentasi"][1].action).toMatch(/sensor/);
    expect(weekPlansBySubCluster["Pelayanan keperawatan"][1].action).not.toMatch(/sensor/);
  });
  it("links every route to keywords and keeps overseas/maritime/mining guidance verifiable", () => {
    const ids = new Set(aspirationRoutes.map(route => route.id));
    expect(ids).toEqual(new Set(["abroad", "japan", "maritime", "mining", "engineering", "helping", "rights", "environment", "education", "health"]));
    for (const route of aspirationRoutes) {
      expect(aspirationRouteKeywordRules.some(rule => rule.routeId === route.id && rule.keywords.length > 0)).toBe(true);
      expect(route.verify).toMatch(/^Cek sumber resmi/);
      expect(route.steps.length).toBeGreaterThanOrEqual(2);
      expect(route.steps.join(" ")).not.toMatch(/visa pasti|jaminan kerja|gaji|Rp\s*\d|JLPT\s*N\d|wajib.*sertifikat/i);
    }
    for (const id of ["maritime", "mining"]) {
      const route = aspirationRoutes.find(item => item.id === id)!;
      expect(route.steps.join(" ")).toMatch(/D3\/D4/);
      expect(route.steps.join(" ")).toMatch(/bukan|jangan anggap/);
      expect(route.verify).toMatch(/sekolah|lembaga/);
    }
    expect(aspirationRoutes.find(item => item.id === "mining")!.steps.join(" ")).toMatch(/D3.*D4/);
  });
  it("defines unique plain-language jargon and one distinct short AI note per existing cluster", () => {
    const names = glossary.flatMap(item => [item.term, ...(item.aliases ?? [])]).map(normalize);
    expect(new Set(names).size).toBe(names.length);
    for (const term of ["PLC", "K3", "HVAC", "D3", "D4", "S1", "instrumentasi", "GIS", "portofolio", "magang", "sertifikasi", "CAD"])
      expect(glossary.some(item => normalize(item.term) === normalize(term)), term).toBe(true);
    expect(new Set(fieldAiNotes.map(item => item.cluster))).toEqual(new Set(majors.map(m => m.cluster)));
    const notes = fieldAiNotes.map(item => normalize(item.note).replace(/[^\p{L}\p{N}]/gu, ""));
    expect(new Set(notes).size).toBe(notes.length);
    for (const entry of [...glossary.map(item => item.plain), ...fieldAiNotes.map(item => item.note)]) expect(entry.trim()).not.toBe("");
    for (const { note } of fieldAiNotes) {
      expect(note.split(/[.!?]+/).filter(sentence => sentence.trim()).length).toBeLessThanOrEqual(2);
      expect(note).not.toMatch(/pekerjaan.*hilang|AI.*menggantikan kamu/i);
    }
  });
  it("passes the extended KB validator", () => {
    expect(validateStudentGuidance()).toEqual([]);
    expect(validateKnowledgeBase()).toEqual([]);
  });
  it("rejects blank/nonobservable targets and duplicated glossary aliases", () => {
    const bad = structuredClone(studentGuidance);
    bad.skillTargets[0].target = "Teknologi";
    bad.skillTargets[0].proof = " ";
    bad.glossary[1].aliases = [bad.glossary[0].term.toLowerCase()];
    const issues = validateStudentGuidance(bad);
    expect(issues.some(issue => issue.path.includes("skillTargets.0.target"))).toBe(true);
    expect(issues.some(issue => issue.path.includes("skillTargets.0.proof"))).toBe(true);
    expect(issues.some(issue => issue.path.includes("glossary"))).toBe(true);
  });
  it("rejects incomplete plans, unreferenced routes, missing verification and unknown note clusters", () => {
    const bad = structuredClone(studentGuidance);
    bad.genericWeekPlan[0].durationLabel = "";
    bad.genericWeekPlan[1].week = 1;
    bad.aspirationRoutes[0].verify = "";
    bad.aspirationRouteKeywordRules[0].routeId = "unknown-route";
    bad.fieldAiNotes[0].cluster = "unknown-cluster";
    const issues = validateStudentGuidance(bad);
    for (const field of ["genericWeekPlan", "aspirationRoutes", "aspirationRouteKeywordRules", "fieldAiNotes"])
      expect(issues.some(issue => issue.path.includes(field)), field).toBe(true);
  });
});
