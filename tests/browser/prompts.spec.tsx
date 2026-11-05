import React from "react";
import { test, expect } from "@playwright/experimental-ct-react";
import { ResultsView } from "../../src/components/results/ResultsView";
import { PromptBank } from "../../src/components/prompts/PromptBank";
import { submission } from "./fixtures";

const mockClipboard = (page: import("playwright/test").Page, ok = true) => page.evaluate((ok) => {
  (window as any).__copied = [];
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
    writeText: (t: string) => ok ? ((window as any).__copied.push(t), Promise.resolve()) : Promise.reject(new Error("denied")),
  } });
}, ok);

for (const width of [320, 375]) test(`results: Tanya AI block on main card only, copy outside summary (${width}px)`, async ({ mount, page }) => {
  await page.setViewportSize({ width, height: 800 });
  await mount(<ResultsView submission={submission} />);
  await mockClipboard(page);
  const block = page.locator("details[aria-label='Tanya AI tentang jurusan ini']");
  await expect(block).toHaveCount(1);
  await block.locator(":scope > summary").click();
  const copy = block.getByRole("button", { name: /^Salin prompt: / });
  await expect(copy).toHaveCount(4);
  await expect(page.locator("summary button")).toHaveCount(0);
  for (const b of await copy.all()) expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await copy.first().click();
  await expect(block.getByRole("status").first()).toHaveText("Prompt disalin");
  const copied: string[] = await page.evaluate(() => (window as any).__copied);
  expect(copied[0]).toContain(submission.report.topRecommendation.nicheCareerPaths?.[0] ?? submission.report.topRecommendation.relatedCareers[0]);
  expect(copied[0]).toMatch(/Kalau tidak yakin, bilang tidak yakin/);
  expect(copied[0]).not.toMatch(/\{\w+\}/);
  const link = block.getByRole("link", { name: "Lihat semua prompt →" });
  const href = await link.getAttribute("href");
  expect(href).toMatch(/^\/prompt\?/);
  expect(href).not.toContain(encodeURIComponent(submission.email));
  expect(href).not.toContain("aktivitas");
  await expect(page.getByText("Jawaban AI bisa salah", { exact: false }).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("results: compact view has no prompt block", async ({ mount, page }) => {
  await mount(<ResultsView submission={submission} compact />);
  await expect(page.locator("details[aria-label='Tanya AI tentang jurusan ini']")).toHaveCount(0);
});

test("copy falls back to selecting the text when clipboard is denied", async ({ mount, page }) => {
  await mount(<PromptBank initial={{}} />);
  await mockClipboard(page, false);
  const item = page.locator("[data-prompt-id='wawancara-diri']");
  await item.getByRole("button", { name: /Salin/ }).click();
  await expect(item.getByRole("status")).toContainText("Salin manual");
  await expect(item.locator("details")).toHaveAttribute("open", "");
  expect(await page.evaluate(() => window.getSelection()?.toString() ?? "")).toContain("Jadilah konselor karier");
});

test("prompt bank: fields fill every prompt; default category depends on major", async ({ mount, page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const c = await mount(<PromptBank initial={{}} />);
  await mockClipboard(page);
  await expect(page.locator("details[data-category='diri']")).toHaveAttribute("open", "");
  await expect(page.locator("details[data-category='karier']")).not.toHaveAttribute("open", "");
  await expect(page.getByRole("link", { name: "Ikuti asesmen dulu" })).toBeVisible();
  await page.getByLabel("Jurusan sekolahmu").fill("SMK Teknik");
  const item = page.locator("[data-prompt-id='wawancara-diri']");
  await item.getByRole("button", { name: /Salin/ }).click();
  const copied: string[] = await page.evaluate(() => (window as any).__copied);
  expect(copied[0]).toContain("Aku siswa SMK Teknik dan suka [kegiatan yang kamu suka].");
  for (const b of await page.getByRole("button", { name: /Salin/ }).all()) if (await b.isVisible()) expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await c.unmount();
  await mount(<PromptBank initial={{ jurusanKuliah: "Informatika", karier: "Data Analyst" }} />);
  const karier = page.locator("details[data-category='karier']");
  await expect(karier).toHaveAttribute("open", "");
  await expect(karier.getByText("Cocok untukmu sekarang")).toBeVisible();
  await karier.locator("[data-prompt-id='mitos-industri'] summary").click();
  await expect(karier.getByText("Aku sedang menimbang dunia Data Analyst di Indonesia.", { exact: false })).toBeVisible();
});
