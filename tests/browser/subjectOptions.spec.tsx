import React from "react";
import { test, expect } from "@playwright/experimental-ct-react";
import type { Page } from "playwright/test";
import { AssessmentForm } from "../../src/components/assessment/AssessmentForm";
import { favoriteSubjectOptions } from "../../src/lib/assessment/options";

async function next(page: Page) {
  await page.getByRole("button", { name: /^Lanjutkan|^Simpan perubahan/ }).click();
}

async function toSubjects(page: Page) {
  await page.getByRole("textbox", { name: "Nama lengkap", exact: true }).fill("Siswa Sintetis");
  await next(page);
  await next(page);
  await page.getByRole("radio", { name: "Wanita", exact: true }).click();
  await page.getByRole("textbox", { name: "Umur", exact: true }).fill("16");
  await next(page);
  await page.getByRole("textbox", { name: "Asal sekolah", exact: true }).fill("SMAN Contoh");
  await next(page);
  await page.getByRole("textbox", { name: "Kelas", exact: true }).fill("XI");
  await next(page);
  await page.getByRole("radio", { name: "IPS", exact: true }).click();
  await next(page);
  await page.getByRole("radio", { name: /Universitas \/ Akademik/ }).click();
  await next(page);
}

test.beforeEach(async ({ page }) => {
  await page.route("**/api/submissions/status", (r) => r.fulfill({ json: { status: "not-submitted" } }));
});

test("all SMA subjects are explicit options, usable at 320px, max 3", async ({ mount, page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await mount(<AssessmentForm />);
  await toSubjects(page);
  await expect(page.getByRole("heading", { name: /Mata pelajaran/ })).toBeVisible();
  for (const name of favoriteSubjectOptions)
    await expect(page.getByRole("checkbox", { name, exact: true }), name).toBeVisible();
  for (const legacy of ["Bahasa", "Seni/Desain", "Komputer/TIK", "Olahraga"])
    await expect(page.getByRole("checkbox", { name: legacy, exact: true })).toHaveCount(0);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const box = await page.getByRole("checkbox", { name: "Geografi", exact: true }).boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);

  for (const name of ["Geografi", "Pendidikan Pancasila (PPKn)", "Matematika Tingkat Lanjut"])
    await page.getByRole("checkbox", { name, exact: true }).click();
  await page.getByRole("checkbox", { name: "Sejarah", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("maksimal 3");
  await next(page);
  await expect(page.getByRole("heading", { name: /Mata pelajaran/ })).toHaveCount(0);
});

test("Lainnya still asks for free text", async ({ mount, page }) => {
  await mount(<AssessmentForm />);
  await toSubjects(page);
  await page.getByRole("checkbox", { name: "Lainnya", exact: true }).click();
  await expect(page.getByRole("textbox")).toBeVisible();
});
