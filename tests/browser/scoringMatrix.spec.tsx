import React from "react";
import { test, expect } from "@playwright/experimental-ct-react";
import { AdminDashboard } from "../../src/components/admin/AdminDashboard";

const list = { page: 1, pageSize: 50, total: 0, totalPages: 1, submissions: [], analytics: { total: 0, schools: 0, fit: 0, ai: 0, charts: [] } };
const matrix = {
  fitWeights: [{ label: "Minat", weight: 0.3 }, { label: "Skill", weight: 0.25 }],
  fitThresholds: [{ min: 82, label: "Sangat Cocok" }, { min: 0, label: "Perlu Dipertimbangkan Lagi" }],
  aspirationBoosts: { exactPhrase: 6, keywordPair: 4 },
  aiWeights: [
    { label: "Interaksi manusia", weight: 0.15 }, { label: "Kreativitas", weight: 0.12 },
    { label: "Kerja fisik/praktik", weight: 0.1 }, { label: "Pertimbangan etis", weight: 0.12 },
    { label: "Pemecahan masalah kompleks", weight: 0.15 }, { label: "Akuntabilitas profesional", weight: 0.1 },
    { label: "Potensi dibantu AI", weight: 0.12 }, { label: "Pertumbuhan industri", weight: 0.09 },
    { label: "Kerja non-rutin", weight: 0.05 },
  ],
  aiThresholds: [{ min: 80, label: "Tinggi" }, { min: 60, label: "Sedang" }, { min: 0, label: "Perlu Adaptasi Tinggi" }],
  majors: [
    { id: "kedokteran", name: "Kedokteran", cluster: "Kesehatan", profileName: "Kesehatan Klinis", components: [95, 60, 85, 95, 90, 98, 80, 88, 85], aiScore: 87, aiLabel: "Tinggi" },
    { id: "akuntansi", name: "Akuntansi", cluster: "Bisnis", profileName: "Keuangan", components: [55, 45, 10, 80, 70, 85, 75, 60, 40], aiScore: 61, aiLabel: "Sedang" },
  ],
};

type Page = Parameters<Parameters<typeof test>[2]>[0]["page"];
async function setup(page: Page, matrixStatus = 200) {
  const calls: string[] = [];
  await page.route(/\/api\/admin\/submissions(?:\?.*)?$/, (r) => r.fulfill({ json: list }));
  await page.route(/\/api\/admin\/scoring-matrix$/, (r) => {
    calls.push(r.request().url());
    return matrixStatus === 200 ? r.fulfill({ json: matrix }) : r.fulfill({ status: matrixStatus, json: { error: "Login admin diperlukan." } });
  });
  return calls;
}

test("matrix tab loads lazily and shows rubric plus filterable major table", async ({ mount, page }) => {
  const calls = await setup(page);
  await mount(<AdminDashboard />);
  const tabs = page.getByRole("tablist", { name: "Bagian dashboard" });
  await expect(tabs.getByRole("tab", { name: "Data asesmen" })).toHaveAttribute("aria-selected", "true");
  expect(calls).toHaveLength(0);

  await tabs.getByRole("tab", { name: "Matriks penilaian" }).click();
  await expect(tabs.getByRole("tab", { name: "Matriks penilaian" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: "Skor kecocokan" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ketahanan terhadap AI" })).toBeVisible();
  await expect(page.getByText("30%").first()).toBeVisible();
  await expect(page.getByRole("table", { name: "Matriks ketahanan AI per jurusan" }).getByRole("row")).toHaveCount(3);
  await expect(page.getByRole("heading", { name: "Data asesmen" })).toHaveCount(0);
  expect(calls).toHaveLength(1);

  await page.getByLabel("Cari jurusan").fill("akun");
  await expect(page.getByRole("table", { name: "Matriks ketahanan AI per jurusan" }).getByRole("row")).toHaveCount(2);
  await expect(page.getByRole("rowheader", { name: /Akuntansi/ })).toBeVisible();

  await tabs.getByRole("tab", { name: "Data asesmen" }).click();
  await tabs.getByRole("tab", { name: "Matriks penilaian" }).click();
  expect(calls).toHaveLength(1); // cached after first load
});

test("matrix tab is keyboard operable and fits 320px without page overflow", async ({ mount, page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await setup(page);
  await mount(<AdminDashboard />);
  const first = page.getByRole("tab", { name: "Data asesmen" });
  await first.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Matriks penilaian" })).toBeFocused();
  await expect(page.getByRole("tab", { name: "Matriks penilaian" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("table", { name: "Matriks ketahanan AI per jurusan" })).toBeVisible();
  for (const tab of await page.getByRole("tab").all()) expect((await tab.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("an expired session on the matrix tab returns to admin login", async ({ mount, page }) => {
  await setup(page, 401);
  await mount(<AdminDashboard />);
  await page.getByRole("tab", { name: "Matriks penilaian" }).click();
  await expect(page.getByLabel("Password")).toBeVisible();
});
