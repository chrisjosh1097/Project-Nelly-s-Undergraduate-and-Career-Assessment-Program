import React from "react";
import { test, expect } from "@playwright/experimental-ct-react";
import { ResultLoader } from "../../src/components/results/ResultLoader";
import { ResultsView } from "../../src/components/results/ResultsView";
import { submission } from "./fixtures";
import type { Submission } from "../../src/lib/types";
test("ten matches expose accessible details and both downloads", async ({
  mount,
  page,
}) => {
  await mount(<ResultsView submission={submission} />);
  await expect(
    page.getByRole("heading", {
      name: submission.report.topRecommendation.majorName,
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator("details.recommendation-details")).toHaveCount(9);
  const summary = page
    .locator("details.recommendation-details summary")
    .first();
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.locator("details.recommendation-details").first(),
  ).toHaveAttribute("open", "");
  await expect(page.getByRole("button", { name: /Laporan PDF/ })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Kartu Instagram/ }),
  ).toBeVisible();
  await expect(
    page.getByText("Kecocokan profil", { exact: true }).first(),
  ).toBeVisible();
});
for (const narrativeStatus of [
  "pending",
  "processing",
  "failed",
  "skipped",
] as const)
  test(`heuristic results stay usable when narration is ${narrativeStatus}`, async ({
    mount,
    page,
  }) => {
    await page.route("**/api/submissions/me", (r) =>
      r.fulfill({ json: { submission: { ...submission, narrativeStatus } } }),
    );
    await mount(<ResultLoader />);
    await expect(
      page.getByRole("heading", {
        name: submission.report.topRecommendation.majorName,
        exact: true,
      }),
    ).toBeVisible();
  });
test("missing report is actionable, not an endless spinner", async ({
  mount,
  page,
}) => {
  await page.route("**/api/submissions/me", (r) =>
    r.fulfill({ status: 404, json: { error: "Submission belum ditemukan." } }),
  );
  await mount(<ResultLoader />);
  await expect(page.getByRole("link", { name: "Mulai asesmen" })).toBeVisible();
});
test("pending polling stops on unmount and retries recover failures", async ({
  mount,
  page,
}) => {
  await page.clock.install();
  let requests = 0;
  await page.route("**/api/submissions/me", (r) => {
    requests++;
    return r.fulfill({
      status: requests === 1 ? 500 : 200,
      json:
        requests === 1
          ? { error: "Hors ligne" }
          : { submission: { ...submission, narrativeStatus: "pending" } },
    });
  });
  const component = await mount(<ResultLoader />);
  await page.getByRole("button", { name: "Coba lagi" }).click();
  await expect(
    page.getByRole("heading", {
      name: submission.report.topRecommendation.majorName,
      exact: true,
    }),
  ).toBeVisible();
  await page.clock.fastForward(3501);
  await expect.poll(() => requests).toBe(3);
  await component.unmount();
  await page.clock.fastForward(10000);
  expect(requests).toBe(3);
});
for (const failure of [401, 500])
  test(`account change never retains another student's report after ${failure}`, async ({
    mount,
    page,
  }) => {
    let requests = 0;
    await page.route("**/api/submissions/me", (route) => {
      requests++;
      return route.fulfill(
        requests === 1
          ? { json: { submission } }
          : { status: failure, json: { error: "New account request failed" } },
      );
    });
    const component = await mount(<ResultLoader />);
    await expect(
      page.getByText(submission.fullName, { exact: false }).first(),
    ).toBeVisible();
    await page.evaluate(() => {
      (window as any).__auth = {
        user: { uid: "synthetic-user-b", email: "student-b@example.com" },
        loading: false,
        configured: true,
      };
    });
    await component.update(<ResultLoader alreadySubmitted />);
    await expect(page.getByRole("alert")).toContainText(
      "New account request failed",
    );
    await expect(
      page.getByRole("button", { name: "Kartu Instagram" }),
    ).toHaveCount(0);
    await expect(
      page.getByText(submission.fullName, { exact: false }),
    ).toHaveCount(0);
  });
test("authorization failure while polling clears the current private report", async ({
  mount,
  page,
}) => {
  await page.clock.install();
  let requests = 0;
  await page.route("**/api/submissions/me", (route) => {
    requests++;
    return route.fulfill(
      requests === 1
        ? {
            json: { submission: { ...submission, narrativeStatus: "pending" } },
          }
        : { status: 401, json: { error: "Session expired" } },
    );
  });
  await mount(<ResultLoader />);
  await expect(
    page.getByRole("button", { name: "Kartu Instagram" }),
  ).toBeVisible();
  await page.clock.fastForward(3501);
  await expect(page.getByRole("alert")).toContainText("Session expired");
  await expect(
    page.getByRole("button", { name: "Kartu Instagram" }),
  ).toHaveCount(0);
});
test("legacy results and previous-submission notice remain readable", async ({
  mount,
  page,
}) => {
  const old = structuredClone(submission);
  delete old.answers.educationPathway;
  old.report.recommendations.forEach((r) => delete r.degreeTypes);
  delete old.report.topRecommendation.degreeTypes;
  await page.route("**/api/submissions/me", (r) =>
    r.fulfill({ json: { submission: old } }),
  );
  await mount(<ResultLoader alreadySubmitted />);
  await expect(page.getByText("Belum tercatat", { exact: true })).toBeVisible();
  await expect(page.getByText(/tidak digenerasi ulang/)).toBeVisible();
});

// Authored synthetic content; do not copy a real student report into these cases.
function richerSubmission(): Submission {
  const value = structuredClone(submission);
  value.id = "synthetic-rich-results";
  value.fullName = "Synthetic Student"; value.email = "synthetic@example.test";
  value.school = "Synthetic School"; value.className = "XII";
  Object.assign(value.answers, {
    fullName: value.fullName, email: value.email, school: value.school, className: value.className,
    dreamProfession: "Mengeksplorasi engineering di Jepang.",
    futureVision: "Membandingkan bidang maritim dan pertambangan.",
    workStyle: "Praktik langsung", educationPathway: "university",
    favoriteSubjects: ["Fisika"], skillStrengths: ["Pemecahan masalah"],
  });
  value.report.recommendations = value.report.recommendations.map((r, i) => ({
    ...r, majorId: `synthetic-major-${i}`, rank: i === 0 ? 7 : i === 1 ? 9 : i,
    majorName: i === 0 ? "Teknik Sintetis" : `Alternatif Sintetis ${i}`,
    degreeTypes: ["S1"], overallFitScore: i === 1 ? 48 : i === 2 ? 90 : 65,
    fitLabel: i === 1 ? "Perlu Dipertimbangkan Lagi" : i === 2 ? "Sangat Cocok" : "Cukup Cocok",
    aiFutureResilienceScore: 78, aiFutureResilienceLabel: "Sedang",
    careerDirection: i === 0 ? "Eksplorasi proyek mekanik sintetis." : `Arah alternatif tersimpan ${i}.`,
    personalizedCareerDirection: undefined, careerPersonalizationReason: undefined,
    aspirationReflection: undefined, nicheCareerPaths: undefined,
    relatedCareers: ["Pendukung proyek teknik"], reasonBullets: ["Bandingkan tuntutan kurikulum."],
    skillStrengthMatches: ["Pemecahan masalah"], skillGaps: ["Latih membaca gambar teknik."],
    recommendedNextSteps: ["Buat model mekanik dari bahan sederhana."],
    careerPathwayAdvice: ["Diskusikan proyek dengan mentor."],
    cautionNotes: ["Bandingkan biaya praktik."],
    careerCautions: ["Periksa persyaratan resmi profesi dan kerja di negara tujuan."],
    scoringBreakdown: {
      interestScore: 70, skillScore: 60, subjectScore: 65, workStyleScore: 50,
      problemAreaScore: 40, constraintFitScore: 80,
      matchedInterests: ["Merakit"], matchedSkills: ["Pemecahan masalah"],
      matchedSubjects: ["Fisika"], matchedProblemAreas: ["Teknologi"],
      preferenceNotes: ["Biaya perlu dibandingkan."],
    },
  }));
  value.report.topRecommendation = value.report.recommendations[0];
  value.report.narrative = {
    source: "heuristic", recommendationReasons: {},
    summary: "Eksplorasi engineering di Jepang perlu diuji melalui proyek dan kurikulum.",
    studentStrengths: ["Pilihan fisika mendukung eksplorasi awal."],
  };
  return value;
}

test("saved summary, moderate fit, aspirations and component evidence are visible without expansion", async ({ mount, page }) => {
  const value = richerSubmission();
  const apiRequests: string[] = [];
  page.on("request", request => { const path = new URL(request.url()).pathname; if (path.startsWith("/api/") && !path.startsWith("/api/campus/")) apiRequests.push(request.url()); });
  await page.route("**/api/campus/**", route => route.fulfill({ json: { items: [], total: 0, maritimeNote: false, source: "" } }));
  await mount(<ResultsView submission={value} />);
  const overview = page.getByRole("region", { name: "Ringkasan arahmu" });
  await expect(overview.getByText(value.report.narrative!.summary, { exact: true })).toBeVisible();
  await expect(overview.getByText("Kecocokan sedang", { exact: true })).toBeVisible();
  await expect(overview.getByText("07 / Rekomendasi utama", { exact: true })).toBeVisible();
  await expect(overview.getByText(value.answers.dreamProfession, { exact: true })).toBeVisible();
  await expect(overview.getByText(value.answers.futureVision, { exact: true })).toBeVisible();
  await expect(page.getByText("Eksplorasi proyek mekanik sintetis.", { exact: true })).toHaveCount(1);
  const evidence = page.getByRole("region", { name: "Bukti dari jawabanmu" }).first();
  await expect(evidence.locator("dt")).toHaveText(["Minat", "Skill", "Mata pelajaran", "Gaya kerja", "Area masalah", "Pertimbangan pribadi"]);
  await expect(evidence.locator("dl > div > dd:first-of-type")).toHaveText(["70/100", "60/100", "65/100", "50/100", "40/100", "80/100"]);
  await expect(evidence.getByText("70/100", { exact: true })).toBeVisible();
  await expect(evidence.getByText("60/100", { exact: true })).toBeVisible();
  await expect(evidence.getByText("Fisika", { exact: true })).toBeVisible();
  await expect(evidence.getByText("Pilihanmu: Praktik langsung", { exact: true })).toBeVisible();
  await expect(evidence.getByText("Biaya perlu dibandingkan.", { exact: true })).toBeVisible();
  await expect(page.getByRole("article").getByText("Buat model mekanik dari bahan sederhana.", { exact: true })).toBeVisible();
  expect(apiRequests).toEqual([]);
});

test("weak comparison is honest and saved order/ranks survive higher-score later alternatives", async ({ mount, page }) => {
  await mount(<ResultsView submission={richerSubmission()} />);
  const alternatives = page.locator("details.recommendation-details");
  await expect(alternatives).toHaveCount(9);
  const first = alternatives.first();
  const summary = first.locator(":scope > summary");
  await expect(summary).toContainText("Alternatif Sintetis 1");
  await expect(summary).toContainText("09");
  await expect(summary).toContainText("48/100");
  await expect(summary).toContainText("Alternatif eksplorasi");
  await expect(summary).toContainText("Perlu dilatih: Latih membaca gambar teknik.");
  await expect(alternatives.nth(1).locator(":scope > summary")).toContainText("Alternatif Sintetis 2");
  await summary.focus(); await page.keyboard.press("Enter");
  await expect(first).toHaveAttribute("open", "");
  await expect(first.getByRole("heading", { name: "Dasar pertimbangan" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Kenapa cocok" })).toHaveCount(0);
  const mechanics = first.getByText("Bagaimana skor dibaca?", { exact: true });
  await mechanics.focus(); await page.keyboard.press("Space");
  await expect(first.getByText(/Bobot penilaian/)).toBeVisible();
  await summary.focus(); await page.keyboard.press("Space");
  await expect(first).not.toHaveAttribute("open", "");
});

test("conflicting historical label remains explicit alongside score interpretation", async ({ mount, page }) => {
  const value = richerSubmission(); value.report.topRecommendation.fitLabel = "Sangat Cocok";
  await mount(<ResultsView submission={value} />);
  const overview = page.getByRole("region", { name: "Ringkasan arahmu" });
  await expect(overview.getByText("Label laporan tersimpan: Sangat Cocok", { exact: true })).toBeVisible();
  await expect(overview.getByText("Kecocokan sedang", { exact: true })).toBeVisible();
});

for (const field of ["dreamProfession", "futureVision", "neither"] as const)
  test(`optional aspiration ${field} leaves no empty aspiration paragraphs`, async ({ mount, page }) => {
    const value = richerSubmission();
    value.answers.dreamProfession = field === "dreamProfession" ? "Eksplorasi bidang teknik." : " ";
    value.answers.futureVision = field === "futureVision" ? "Membandingkan maritim dan pertambangan." : "";
    await mount(<ResultsView submission={value} />);
    if (field === "neither") await expect(page.getByRole("heading", { name: "Aspirasi yang kamu tulis" })).toHaveCount(0);
    else {
      const aspirations = page.getByRole("region", { name: "Aspirasi yang kamu tulis" });
      await expect(aspirations.getByText(value.answers[field], { exact: true })).toBeVisible();
      await expect(aspirations.locator("p")).toHaveCount(1);
    }
  });

test("legacy optional narrative/evidence fields render safely in compact admin mode", async ({ mount, page }) => {
  const value = richerSubmission();
  delete value.report.narrative; delete value.answers.educationPathway;
  value.answers.dreamProfession = ""; value.answers.futureVision = "";
  for (const r of value.report.recommendations) {
    delete r.degreeTypes; delete r.careerPathwayAdvice; delete r.careerCautions;
    r.skillGaps = [" "]; r.recommendedNextSteps = [];
    r.scoringBreakdown.matchedSkills = []; r.scoringBreakdown.preferenceNotes = [];
  }
  await mount(<ResultsView submission={value} compact />);
  await expect(page.getByText("Belum tercatat", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ringkasan laporan" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Bukti dari jawabanmu" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Langkah berikutnya" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Laporan PDF|Kartu Instagram/ })).toHaveCount(0);
  await expect(page.getByText(/undefined|NaN/)).toHaveCount(0);
});

test("PDF busy/error/retry and both actual download actions remain usable", async ({ mount, page }) => {
  let attempts = 0, authorization = "";
  let release: (() => Promise<void>) | undefined;
  await page.route("**/api/submissions/pdf", route => {
    authorization = route.request().headers().authorization;
    if (++attempts === 1) {
      release = () => route.fulfill({ status: 503, json: { error: "Synthetic PDF unavailable" } });
      return;
    }
    return route.fulfill({ body: "%PDF-synthetic", contentType: "application/pdf" });
  });
  await mount(<ResultsView submission={richerSubmission()} />);
  await page.getByRole("button", { name: "Laporan PDF" }).click();
  await expect(page.getByRole("button", { name: "Mengunduh…" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Kartu Instagram" })).toBeDisabled();
  await expect.poll(() => !!release).toBe(true); await release!();
  await expect(page.getByRole("alert")).toContainText("Synthetic PDF unavailable");
  const pdf = page.waitForEvent("download");
  await page.getByRole("button", { name: "Laporan PDF" }).click();
  expect((await pdf).suggestedFilename()).toBe("laporan-synthetic-rich-results.pdf");
  expect(authorization).toBe("Bearer synthetic-token");
  await expect(page.getByRole("alert")).toHaveCount(0);
  const image = page.waitForEvent("download");
  await page.getByRole("button", { name: "Kartu Instagram" }).click();
  expect((await image).suggestedFilename()).toBe("kartu-instagram-synthetic-rich-results.png");
});

for (const width of [320, 390, 1280])
  test(`rich saved results wrap long aspirations at ${width}px`, async ({ mount, page }) => {
    await page.setViewportSize({ width, height: 844 });
    const value = richerSubmission();
    value.answers.futureVision = "SyntheticLongAspiration".repeat(20);
    await mount(<ResultsView submission={value} />);
    await expect(page.getByRole("heading", { name: "Teknik Sintetis", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const summary = page.locator("details.recommendation-details > summary").first();
    await summary.focus(); await page.keyboard.press("Enter");
    await expect(page.locator("details.recommendation-details").first()).toHaveAttribute("open", "");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 320) {
      await page.addStyleTag({ content: "html { font-size: 24px }" });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  });
test("curated guidance renders on a phone and legacy reports keep old skill wording", async ({ mount, page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  const top = submission.report.topRecommendation;
  const actionGuidance = {
    skillTargets: [{ gap: "Ketelitian", target: "Bisa mencocokkan sepuluh label pada diagram latihan.", proof: "Simpan diagram bertanda." }],
    weekPlan: [1, 2, 3, 4].map(week => ({ week, durationLabel: "1 jam", action: `Langkah minggu ${week} sintetis.`, proof: `Bukti minggu ${week}.` })),
  };
  const guided: Submission = {
    ...submission,
    report: {
      ...submission.report,
      topRecommendation: { ...top, actionGuidance },
      recommendations: [{ ...top, actionGuidance }, ...submission.report.recommendations.slice(1)],
      studentGuidance: {
        evidenceSummary: "Ringkasan bukti sintetis.",
        tensions: ["Ketegangan sintetis."],
        aspirationRoutes: [{ title: "Rute sintetis", steps: ["Langkah rute satu.", "Langkah rute dua."], verify: "Cek sumber resmi sintetis." }],
        glossary: [{ term: "K3", plain: "Keselamatan dan kesehatan kerja." }],
      },
    },
  } as Submission;
  const component = await mount(<ResultsView submission={guided} />);
  await expect(page.getByText("Ketegangan sintetis.")).toBeVisible();
  const plan = page.getByRole("region", { name: "Rencana 4 minggu" });
  await expect(plan.getByText("Rencana 4 minggu (4 langkah)")).toBeVisible();
  await expect(page.getByText("Langkah minggu 4 sintetis.")).toBeHidden();
  await plan.getByText("Rencana 4 minggu (4 langkah)").click();
  await expect(page.getByText("Langkah minggu 4 sintetis.")).toBeVisible();
  await plan.getByRole("checkbox").nth(1).check();
  await expect(plan.getByTestId("plan-progress")).toHaveText("1 dari 4 selesai");
  expect(await page.evaluate(([id, major]) => localStorage.getItem(`nelly-plan:${id}:${major}`), [guided.id, top.majorId])).toBe("[2]");
  await expect(page.getByText("Cek sumber resmi sintetis.")).toBeVisible();
  const main = page.locator("article.panel").first();
  await expect(main.getByText("Target skill yang bisa kamu tunjukkan")).toBeVisible();
  await expect(main.getByText("Skill yang perlu ditingkatkan")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await component.unmount();
  await mount(<ResultsView submission={submission} />);
  await expect(page.getByRole("region", { name: "Rencana 4 minggu" })).toHaveCount(0);
  await expect(page.getByText("Skill yang perlu ditingkatkan").first()).toBeVisible();
});

test("layout fills space: two-column alternatives, balanced main card, phone jump nav", async ({ mount, page }) => {
  const top = submission.report.topRecommendation;
  const second = submission.report.recommendations[1];
  const actionGuidance = {
    skillTargets: [1, 2, 3].map(n => ({ gap: `Skill ${n}`, target: `Bisa target ${n}.`, proof: `Simpan bukti ${n}.` })),
    weekPlan: [1, 2, 3, 4].map(week => ({ week, durationLabel: "1 jam", action: `Langkah minggu ${week} sintetis.`, proof: `Bukti minggu ${week}.` })),
  };
  const guided = {
    ...submission,
    report: {
      ...submission.report,
      topRecommendation: { ...top, actionGuidance },
      recommendations: [{ ...top, actionGuidance }, { ...second, actionGuidance: { ...actionGuidance, comparisonNote: "Catatan urutan sintetis." } }, ...submission.report.recommendations.slice(2)],
      studentGuidance: { evidenceSummary: "Ringkasan bukti sintetis.", tensions: ["Ketegangan sintetis."], aspirationRoutes: [{ title: "Rute sintetis", steps: ["Langkah rute."], verify: "Cek sumber resmi sintetis." }], glossary: [] },
    },
  } as Submission;
  await page.setViewportSize({ width: 1280, height: 900 });
  const component = await mount(<ResultsView submission={guided} />);
  const cards = page.locator("details.recommendation-details");
  const [a, b] = [await cards.nth(0).boundingBox(), await cards.nth(1).boundingBox()];
  expect(Math.abs(a!.y - b!.y)).toBeLessThan(2);
  expect(a!.width).toBeLessThan(700);
  await expect(cards.first().locator(":scope > summary")).toContainText("Catatan urutan sintetis.");
  await expect(cards.first().locator(":scope > summary")).toContainText("Contoh karier:");
  await expect(page.getByRole("region", { name: "Aspirasi yang kamu tulis" }).getByText("Ketegangan sintetis.")).toBeVisible();
  await expect(page.getByText("Ketegangan sintetis.")).toHaveCount(1);
  await expect(page.getByRole("navigation", { name: "Lompat ke bagian" })).toBeHidden();
  const main = page.locator("article.panel").first();
  const evidence = await main.getByRole("region", { name: "Bukti dari jawabanmu" }).boundingBox();
  const targets = await main.getByText("Target skill yang bisa kamu tunjukkan").boundingBox();
  expect(Math.abs(targets!.x - evidence!.x)).toBeLessThan(2);
  await cards.first().locator(":scope > summary").click();
  expect((await cards.first().boundingBox())!.width).toBeGreaterThan(1000);
  await component.unmount();
  await page.setViewportSize({ width: 360, height: 800 });
  await mount(<ResultsView submission={guided} />);
  const nav = page.getByRole("navigation", { name: "Lompat ke bagian" });
  await expect(nav.getByRole("link")).toHaveText(["Ringkasan", "Rencana", "Cita-cita", "Alternatif", "Kampus"]);
  for (const link of await nav.getByRole("link").all()) expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await nav.getByRole("link", { name: "Alternatif" }).click();
  await expect(page.locator("#alternatif")).toBeInViewport();
  await expect(nav).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});
test("compare up to 3 majors with sticky bar, table and campus counts", async ({ mount, page }) => {
  await page.route("**/api/campus/major/**", r => r.fulfill({ json: { items: [], total: 42, maritimeNote: false, source: "x" } }));
  await page.setViewportSize({ width: 360, height: 800 });
  await mount(<ResultsView submission={submission} />);
  const [first, second, third, fourth] = submission.report.recommendations;
  await page.getByRole("button", { name: `Bandingkan ${first.majorName}`, exact: true }).click();
  const bar = page.getByRole("region", { name: "Jurusan yang dibandingkan" });
  await expect(bar).toContainText("1/3 dipilih");
  await expect(bar).toContainText("Pilih 1 jurusan lagi");
  for (const r of [second, third]) await page.getByRole("button", { name: `Bandingkan ${r.majorName}`, exact: true }).click();
  await expect(page.getByRole("button", { name: `Bandingkan ${fourth.majorName}`, exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: `Bandingkan ${first.majorName}`, exact: true })).toHaveAttribute("aria-pressed", "true");
  for (const button of await bar.getByRole("button").all()) expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await bar.getByRole("link", { name: "Lihat perbandingan" }).click();
  const table = page.getByRole("region", { name: "Perbandingan jurusan" });
  await expect(table).toBeInViewport();
  await expect(table.getByRole("columnheader")).toHaveCount(4);
  await expect(table.getByRole("row", { name: /Kecocokan/ })).toContainText(`${first.overallFitScore}/100`);
  await expect(table.getByRole("row", { name: /Program studi di katalog/ })).toContainText("42 program studi");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await bar.getByRole("button", { name: `Hapus ${second.majorName} dari perbandingan` }).click();
  await expect(table.getByRole("columnheader")).toHaveCount(3);
  await bar.getByRole("button", { name: "Hapus semua" }).click();
  await expect(bar).toBeHidden();
  await expect(table).toBeHidden();
});
