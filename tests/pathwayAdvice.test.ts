import { describe, it, expect, vi, afterEach } from "vitest";
import { generatePtnPtsVokasiAdvice } from "@/lib/recommendation/advice";
import { generateRecommendations } from "@/lib/recommendation/scoring";
import { enhanceRecommendationReport, enhanceRecommendationReportWithGemini } from "@/lib/recommendation/narrative";
import { techAnswer } from "./fixtures";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe("pathway advice", () => {
  it.each([["university", "S1"], ["vocational", "D3"], ["exploring", "S1"]] as const)("explains %s learning routes", (educationPathway, degree) => {
    expect(generatePtnPtsVokasiAdvice({...techAnswer, educationPathway}).join(" ")).toContain(degree);
  });
  it("lets explicit university direction override an old vocational preference", () => {
    const advice = generatePtnPtsVokasiAdvice({...techAnswer, educationPathway:"university",collegePathPreferences:["Diploma/vokasi","Sertifikasi/bootcamp"],personalConstraints:["Biaya"]}).join(" ");
    expect(advice).not.toContain("Jalur vokasi cocok");
    expect(advice).toContain("pelengkap");
    expect(advice).toContain("biaya");
  });
  it("passes direction to Gemini and cannot overwrite ranked data", async () => {
    vi.stubEnv("ENABLE_GEMINI_ENHANCEMENT", "true"); vi.stubEnv("GEMINI_API_KEY", "test-only-key");
    const answers = {...techAnswer,educationPathway:"vocational" as const};
    const report = generateRecommendations(answers);
    let prompt: any;
    vi.stubGlobal("fetch", async (_url: unknown, init: RequestInit) => {
      prompt=JSON.parse(JSON.parse(String(init.body)).contents[0].parts[0].text);
      return Response.json({candidates:[{content:{parts:[{text:JSON.stringify({summary:"Berdasarkan jawaban yang kamu isi.",recommendationReasons:{}, recommendations:[{majorId:"fake",overallFitScore:100}]})}]}}]});
    });
    const enhanced=await enhanceRecommendationReportWithGemini(answers, report);
    expect(prompt.studentAnswers.educationPathway).toBe("vocational");
    expect(prompt.recommendations[0].degreeTypes.length).toBeGreaterThan(0);
    expect(enhanced.recommendations.map(({majorId,rank,overallFitScore,degreeTypes})=>({majorId,rank,overallFitScore,degreeTypes}))).toEqual(report.recommendations.map(({majorId,rank,overallFitScore,degreeTypes})=>({majorId,rank,overallFitScore,degreeTypes})));
  });
  it("retains heuristic results if Gemini fails", async () => {
    vi.stubEnv("ENABLE_GEMINI_ENHANCEMENT", "true"); vi.stubEnv("GEMINI_API_KEY", "test-only-key");
    vi.spyOn(console,"warn").mockImplementation(()=>{});
    vi.stubGlobal("fetch", async () => { throw new Error("offline"); });
    const result=await enhanceRecommendationReport(techAnswer,generateRecommendations(techAnswer));
    expect(result.recommendations).toHaveLength(10);
    expect(result.narrative?.source).toBe("heuristic");
  });
});
