import React from "react";
import { test, expect } from "@playwright/experimental-ct-react";
import type { Page, Route } from "playwright/test";
import { CampusSearch } from "../../src/components/campus/CampusSearch";
import { Header } from "../../src/components/auth/Header";

const SOURCE =
  "Sumber: kompilasi PDDikti (joearton, 2022) dan data SNPMB 2024 (Ibnul Habib, MIT). Data bisa berubah — cek sumber resmi.";
const items = (n: number, offset = 0) =>
  Array.from({ length: n }, (_, i) => ({
    campus: `Kampus Contoh ${offset + i + 1}`,
    type: i % 2 ? "Swasta/Lainnya" : "Negeri",
    province: i % 2 ? undefined : "Jawa Barat",
    lldikti: i % 2 ? 4 : undefined,
    program: "Teknik Mesin",
    degree: "S1",
    quota2024: i % 2 ? undefined : 50,
    applicants2024: i % 2 ? undefined : 1200,
    pddiktiUrl: `https://pddikti.kemdiktisaintek.go.id/search/${encodeURIComponent(`Kampus Contoh ${offset + i + 1}`)}`,
  }));

async function stub(page: Page, handler?: (url: URL) => Record<string, unknown> | "fail") {
  const calls: URL[] = [];
  await page.route("**/api/campus/search**", (route: Route) => {
    const url = new URL(route.request().url());
    calls.push(url);
    const body = handler?.(url);
    if (body === "fail") return route.fulfill({ status: 500, json: {} });
    const p = Number(url.searchParams.get("page") ?? "1");
    return route.fulfill({
      json: { items: items(20, (p - 1) * 20), total: 45, page: p, pageSize: 20, provinces: ["Jawa Barat", "DI Yogyakarta"], source: SOURCE, ...body },
    });
  });
  return calls;
}

test("searches with debounce, shows results and source", async ({ mount, page }) => {
  const calls = await stub(page);
  const component = await mount(<CampusSearch />);
  await expect(component.getByText("Menampilkan 1–20 dari 45")).toBeVisible();
  await expect(component.getByText("Kampus Contoh 1", { exact: true })).toBeVisible();
  await expect(component.getByText("Daya tampung 50 · peminat 1.200 (SNPMB 2024)").first()).toBeVisible();
  await expect(component.getByText("Swasta/Lainnya · Wilayah LLDikti 4").first()).toBeVisible();
  await expect(component.getByText(SOURCE, { exact: true })).toBeVisible();
  const before = calls.length;
  await component.getByRole("searchbox").fill("teknik mesin");
  await expect.poll(() => calls.some((c) => c.searchParams.get("q") === "teknik mesin")).toBe(true);
  expect(calls.length - before).toBe(1);
  await expect.poll(() => page.evaluate(() => location.pathname + location.search)).toBe("/kampus?q=teknik+mesin");
});

test("filters send params and pagination works", async ({ mount, page }) => {
  const calls = await stub(page);
  const component = await mount(<CampusSearch initial={{ q: "teknik" }} />);
  await expect(component.getByText("Menampilkan 1–20 dari 45")).toBeVisible();
  await component.getByLabel("Jenjang").selectOption("S1");
  await component.getByLabel("Provinsi").selectOption("DI Yogyakarta");
  await component.getByLabel("Jenis kampus").selectOption("Negeri");
  await expect.poll(() => calls.at(-1)?.search).toContain("type=Negeri");
  const last = calls.at(-1)!;
  expect(last.searchParams.get("q")).toBe("teknik");
  expect(last.searchParams.get("degree")).toBe("S1");
  expect(last.searchParams.get("province")).toBe("DI Yogyakarta");
  await expect(component.getByText("Filter provinsi hanya mencakup kampus negeri dari data SNPMB 2024.")).toBeVisible();
  await component.getByRole("button", { name: "Berikutnya" }).click();
  await expect(component.getByText("Menampilkan 21–40 dari 45")).toBeVisible();
  expect(calls.at(-1)!.searchParams.get("page")).toBe("2");
  await expect(component.getByRole("button", { name: "Sebelumnya" })).toBeEnabled();
});

test("shows the empty state", async ({ mount, page }) => {
  await stub(page, () => ({ items: [], total: 0 }));
  const component = await mount(<CampusSearch initial={{ q: "zzzz" }} />);
  await expect(component.getByText('Belum ada yang cocok. Coba kata lain, misalnya "teknik mesin".')).toBeVisible();
});

test("shows an error with retry", async ({ mount, page }) => {
  let fail = true;
  await stub(page, () => (fail ? "fail" : {}));
  const component = await mount(<CampusSearch />);
  await expect(component.getByText("Data kampus belum bisa dimuat.")).toBeVisible();
  fail = false;
  await component.getByRole("button", { name: "Coba lagi" }).click();
  await expect(component.getByText("Menampilkan 1–20 dari 45")).toBeVisible();
});

test("fits 320px with 44px targets", async ({ mount, page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await stub(page);
  const component = await mount(<CampusSearch />);
  await expect(component.getByText("Menampilkan 1–20 dari 45")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  for (const target of [
    component.getByRole("searchbox"),
    component.getByRole("button", { name: "Cari" }),
    component.getByLabel("Jenjang"),
    component.getByRole("link", { name: "Cek di PDDikti" }).first(),
    component.getByRole("button", { name: "Berikutnya" }),
  ]) {
    expect((await target.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
});

test("header shows the Kampus link on 320px without overflow", async ({ mount, page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await mount(<Header />);
  const nav = page.getByRole("navigation", { name: "Navigasi siswa" });
  await expect(nav.getByRole("link", { name: /Kampus/ })).toHaveAttribute("href", "/kampus");
  await expect(nav.getByRole("link")).toHaveCount(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
