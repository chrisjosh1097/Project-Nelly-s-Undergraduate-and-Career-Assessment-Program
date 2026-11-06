import React from "react";
import { test, expect } from "@playwright/experimental-ct-react";
import type { Page, Route } from "playwright/test";
import { CampusExamples } from "../../src/components/results/CampusExamples";
import { ResultsView } from "../../src/components/results/ResultsView";
import { submission } from "./fixtures";

const SOURCE =
  "Sumber: kompilasi PDDikti (joearton, 2022) dan data SNPMB 2024 (Ibnul Habib, MIT). Data bisa berubah — cek sumber resmi.";
const item = (campus: string, extra: Record<string, unknown> = {}) => ({
  campus,
  type: "Negeri",
  program: "Teknik Pertambangan",
  degree: "D3",
  pddiktiUrl: `https://pddikti.kemdiktisaintek.go.id/search/${encodeURIComponent(campus)}`,
  ...extra,
});
const ok = (body: Record<string, unknown>) => (route: Route) =>
  route.fulfill({ json: { total: 3, maritimeNote: false, source: SOURCE, ...body } });

async function stub(page: Page, handler: (route: Route) => unknown) {
  const calls: string[] = [];
  await page.route("**/api/campus/**", (route) => {
    calls.push(route.request().url());
    return handler(route);
  });
  return calls;
}

test("lists campuses with degree, province, quota, PDDikti links and the source line", async ({ mount, page }) => {
  await stub(page, ok({
    items: [
      item("Politeknik Negeri Samarinda", { province: "Kalimantan Timur", quota2024: 70, applicants2024: 1924 }),
      item("Akademi Contoh", { type: "Swasta/Lainnya", lldikti: 4, degree: "D4" }),
      item("Universitas Contoh", { province: "Jawa Barat", degree: "S1" }),
    ],
  }));
  const component = await mount(<CampusExamples majorId="teknik_pertambangan_terapan" majorName="Teknik Pertambangan Terapan" degreeTypes={["D3", "D4", "Vokasi"]} preferences={["PTN di Jawa"]} />);
  await expect(component.getByRole("heading", { name: "Contoh kampus dengan program studi spesifik ini" })).toBeVisible();
  await expect(component.getByText("Politeknik Negeri Samarinda")).toBeVisible();
  await expect(component.getByText("Negeri · Kalimantan Timur")).toBeVisible();
  await expect(component.getByText("Swasta/Lainnya · Wilayah LLDikti 4")).toBeVisible();
  await expect(component.getByText("Daya tampung 70 · peminat 1.924 (SNPMB 2024)")).toBeVisible();
  const links = component.getByRole("link", { name: "Cek di PDDikti" });
  await expect(links).toHaveCount(3);
  for (const link of await links.all()) {
    expect(await link.getAttribute("href")).toMatch(/^https:\/\/pddikti\.kemdiktisaintek\.go\.id\/search\//);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
  await expect(component.getByText(SOURCE, { exact: true })).toBeVisible();
});

test("sends degree and preference params", async ({ mount, page }) => {
  const calls = await stub(page, ok({ items: [item("A")] }));
  const component = await mount(<CampusExamples majorId="teknika_permesinan_kapal" majorName="Teknika" degreeTypes={["D3", "D4", "Vokasi"]} preferences={["PTN di Jawa"]} />);
  await expect(component.getByText("A", { exact: true })).toBeVisible();
  const url = new URL(calls[0]);
  expect(url.pathname).toBe("/api/campus/major/teknika_permesinan_kapal");
  expect(url.searchParams.getAll("degree")).toEqual(["D3", "D4"]);
  expect(url.searchParams.getAll("pref")).toEqual(["PTN di Jawa"]);
});

test("shows the maritime note", async ({ mount, page }) => {
  await stub(page, ok({ items: [item("Akademi Maritim Contoh")], maritimeNote: true }));
  const component = await mount(<CampusExamples majorId="teknika_permesinan_kapal" majorName="Teknika" />);
  await expect(component.getByText("Sekolah pelayaran/kedinasan resmi mungkin tidak ada di daftar ini — cek situs instansinya.")).toBeVisible();
});

test("explains empty catalog results and preserves source", async ({ mount, page }) => {
  await stub(page, ok({ items: [], total: 0 }));
  await mount(<div data-testid="host"><CampusExamples majorId="x" majorName="X" /></div>);
  await expect(page.getByTestId("campus-skeleton")).toHaveCount(0);
  await expect(page.getByText("Belum ada contoh kampus sesuai filter di katalog ini.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Cari kampus lain", exact: true })).toHaveAttribute("href", "/kampus");
  await expect(page.getByText(SOURCE, { exact: true })).toBeVisible();
});

for (const failure of ["500", "abort"] as const) {
  test(`falls back to a PDDikti link on ${failure} and keeps the results page`, async ({ mount, page }) => {
    await stub(page, (route) => (failure === "500" ? route.fulfill({ status: 500, json: {} }) : route.abort()));
    await mount(<ResultsView submission={submission} />);
    await expect(page.getByRole("link", { name: "Cari di PDDikti" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Contoh kampus dengan program studi spesifik ini" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: submission.report.topRecommendation.majorName, exact: true })).toBeVisible();
  });
}

test("fits 320px with tall links", async ({ mount, page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await stub(page, ok({ items: [item("Politeknik Negeri Dengan Nama Sangat Panjang Sekali Untuk Uji Lebar", { province: "Kalimantan Timur", quota2024: 70 })] }));
  await mount(<CampusExamples majorId="x" majorName="X" />);
  await expect(page.getByRole("link", { name: "Cek di PDDikti" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const box = await page.getByRole("link", { name: "Cek di PDDikti" }).boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
});

test("fetches an alternative's campuses only after it is opened", async ({ mount, page }) => {
  const calls = await stub(page, ok({ items: [item("A")] }));
  await mount(<ResultsView submission={submission} />);
  const top = submission.report.topRecommendation.majorId;
  const second = submission.report.recommendations[1];
  await expect.poll(() => calls.some((c) => c.includes(`/major/${top}`))).toBe(true);
  expect(calls.some((c) => c.includes(`/major/${second.majorId}`))).toBe(false);
  await page.locator("summary").filter({ hasText: second.majorName }).first().click();
  await expect.poll(() => calls.some((c) => c.includes(`/major/${second.majorId}`))).toBe(true);
});

test("results page links to the campus search", async ({ mount, page }) => {
  await stub(page, ok({ items: [] }));
  await mount(<ResultsView submission={submission} />);
  const link = page.getByRole("link", { name: "Cari kampus & jurusan lain" });
  await expect(link).toBeVisible();
  expect(await link.getAttribute("href")).toMatch(/^\/kampus\?q=/);
});

test("explains terms on tap and shows the competition ratio with its caveat", async ({ mount, page }) => {
  await stub(page, ok({ items: [item("Politeknik Negeri Samarinda", { province: "Kalimantan Timur", quota2024: 70, applicants2024: 1924 }), item("Kampus Tanpa Kuota", { quota2024: 0, applicants2024: 10 })] }));
  const component = await mount(<CampusExamples majorId="teknik_pertambangan_terapan" majorName="Teknik Pertambangan Terapan" degreeTypes={["D3"]} preferences={[]} />);
  await expect(component.getByTestId("campus-ratio")).toHaveCount(1);
  await expect(component.getByTestId("campus-ratio")).toHaveText("± 1 kursi : 27 peminat (SNPMB 2024). Bukan passing grade atau peluang diterima.");
  await component.getByRole("button", { name: "D3: arti istilah" }).first().click();
  await expect(component.getByRole("note")).toContainText("Diploma tiga");
  await page.keyboard.press("Escape");
  await expect(component.getByRole("note")).toHaveCount(0);
});
