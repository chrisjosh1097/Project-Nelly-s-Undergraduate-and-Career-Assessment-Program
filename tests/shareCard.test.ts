import { afterEach, describe, expect, it, vi } from "vitest";
import { createInstagramCardBlob } from "@/components/results/shareCard";
import { buildSubmission, techAnswer } from "./fixtures";

function synthetic() {
  const value = buildSubmission({ ...techAnswer, fullName: "Synthetic Export Student",
    email: "private-synthetic@example.test", school: "Private Synthetic School",
    dreamProfession: "Private synthetic aspiration", futureVision: "Private synthetic answer" });
  const top = value.report.topRecommendation;
  Object.assign(top, { rank: 7, majorName: "Teknik Sintetis", careerDirection: "Eksplorasi proyek mekanik sintetis.",
    personalizedCareerDirection: undefined, overallFitScore: 65, fitLabel: "Cukup Cocok" });
  Object.assign(value.report.recommendations[1], { rank: 9, majorName: "Alternatif Pertama", overallFitScore: 48, fitLabel: "Perlu Dipertimbangkan Lagi" });
  Object.assign(value.report.recommendations[2], { rank: 2, majorName: "Alternatif Kedua", overallFitScore: 90, fitLabel: "Sangat Cocok" });
  return value;
}
function freeze(value: unknown) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
}
function canvasRecorder() {
  const text: { value: string; x: number; y: number; width: number; size: number }[] = [];
  const ctx = {
    font: "10px Arial", fillStyle: "#000000", shadowColor: "", shadowBlur: 0, shadowOffsetY: 0,
    beginPath() {}, moveTo() {}, lineTo() {}, quadraticCurveTo() {}, closePath() {},
    fill() {}, fillRect() {}, save() {}, restore() {},
    measureText(value: string) { return { width: Array.from(value).length * (Number(this.font.match(/([\d.]+)px/)?.[1]) || 10) * 0.6 }; },
    fillText(value: string, x: number, y: number) {
      text.push({ value, x, y, width: this.measureText(value).width,
        size: Number(this.font.match(/([\d.]+)px/)?.[1]) || 10 });
    },
  };
  const canvas = { width: 0, height: 0, getContext: () => ctx,
    toBlob: (callback: BlobCallback) => callback(new Blob(["synthetic-png"], { type: "image/png" })) };
  vi.stubGlobal("document", { createElement: () => canvas });
  return { canvas, text };
}
afterEach(() => vi.unstubAllGlobals());

describe("saved-result Story export", () => {
  it("exports 1080x1920 PNG with all meaningful text inside 250px safe areas", async () => {
    const { canvas, text } = canvasRecorder();
    const result = await createInstagramCardBlob(synthetic());
    expect([canvas.width, canvas.height]).toEqual([1080, 1920]);
    expect(result.type).toBe("image/png");
    expect(text.length).toBeGreaterThan(10);
    for (const line of text) {
      expect(line.x).toBeGreaterThanOrEqual(64);
      expect(line.x + line.width).toBeLessThanOrEqual(1016);
      expect(line.y - line.size * 0.8).toBeGreaterThanOrEqual(250);
      expect(line.y + line.size * 0.2).toBeLessThanOrEqual(1670);
    }
  });
  it("keeps long names, unbroken majors and career text bounded without overlapping text", async () => {
    const value = synthetic();
    value.fullName = "SyntheticLongName".repeat(35);
    value.report.topRecommendation.majorName = "ProgramTanpaSpasi".repeat(80);
    value.report.topRecommendation.careerDirection = "Arah panjang sintetis ".repeat(160);
    value.report.recommendations[1].majorName = "AlternatifTanpaSpasi".repeat(60);
    const { text } = canvasRecorder();
    await createInstagramCardBlob(value);
    for (const line of text) {
      expect(line.x + line.width).toBeLessThanOrEqual(1016);
      expect(line.y + line.size * 0.2).toBeLessThanOrEqual(1670);
    }
    for (let i = 0; i < text.length; i++) for (const other of text.slice(i + 1)) {
      const a = text[i];
      const horizontal = a.x < other.x + other.width && other.x < a.x + a.width;
      const vertical = a.y - a.size * 0.8 < other.y + other.size * 0.2 && other.y - other.size * 0.8 < a.y + a.size * 0.2;
      expect(horizontal && vertical, `${a.value} overlaps ${other.value}`).toBe(false);
    }
    expect(text.some(line => /\.\.\.|…/.test(line.value))).toBe(true);
  });
  it("uses saved rank/score/order, separates AI from fit, and qualifies moderate and weak matches", async () => {
    const { text } = canvasRecorder();
    const value = synthetic(); const before = structuredClone(value); freeze(value);
    await createInstagramCardBlob(value);
    const content = text.map(line => line.value).join("\n");
    expect(content).toContain("#7 Rekomendasi utama");
    expect(content).toContain("65/100");
    expect(content).toContain("Kecocokan sedang");
    expect(content).toContain("Alternatif eksplorasi");
    expect(content).not.toContain("Kenapa cocok");
    expect(content).toContain("Ketahanan AI");
    expect(content).toMatch(/bukan jaminan (kerja|pekerjaan)/);
    expect(content.indexOf("Alternatif Pertama")).toBeLessThan(content.indexOf("Alternatif Kedua"));
    expect(content).toContain("#9"); expect(content).toContain("#2");
    expect(content).toContain("48/100"); expect(content).toContain("90/100");
    expect(value).toEqual(before);
  });
  it("does not publish school, email or private answer text and tolerates optional legacy fields", async () => {
    const value = synthetic(); delete value.answers.educationPathway; delete value.report.narrative;
    delete value.report.topRecommendation.degreeTypes;
    delete value.report.topRecommendation.personalizedCareerDirection;
    const { text } = canvasRecorder();
    await createInstagramCardBlob(value);
    const content = text.map(line => line.value).join("\n");
    expect(content).toContain(value.fullName);
    expect(content).not.toContain(value.email); expect(content).not.toContain(value.school);
    expect(content).not.toContain(value.answers.dreamProfession); expect(content).not.toContain(value.answers.futureVision);
    expect(content).not.toMatch(/undefined|NaN/);
  });
});
