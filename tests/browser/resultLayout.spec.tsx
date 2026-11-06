import React from "react";
import { test, expect } from "@playwright/experimental-ct-react";
import { ResultsView } from "../../src/components/results/ResultsView";
import { submission } from "./fixtures";

for (const width of [320, 1440]) test(`campus examples follow the plan at full width, ${width}px`, async ({ mount, page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.route("**/api/campus/**", route => route.fulfill({ json: {
    total: 6, maritimeNote: false, source: "Sumber sintetis — cek sumber resmi.",
    items: Array.from({ length: 6 }, (_, i) => ({ campus: `Kampus Sintetis ${i}`, type: "Negeri", program: "Program Sintetis", degree: "D3", pddiktiUrl: "https://pddikti.kemdiktisaintek.go.id/search/sintetis" })),
  } }));
  await mount(<ResultsView submission={submission} />);
  const main = page.locator("#rencana article");
  const campuses = main.getByRole("region", { name: "Contoh kampus", exact: true });
  await expect(campuses.getByRole("listitem")).toHaveCount(6);
  const campusBox = (await campuses.boundingBox())!;
  const articleBox = (await main.boundingBox())!;
  expect(campusBox.width).toBeGreaterThan(articleBox.width * 0.8);
  const steps = (await main.getByRole("heading", { name: "Langkah berikutnya", exact: true }).boundingBox())!;
  expect(campusBox.y).toBeGreaterThan(steps.y + steps.height);
  const items = campuses.getByRole("listitem");
  const first = (await items.nth(0).boundingBox())!, second = (await items.nth(1).boundingBox())!;
  if (width === 1440) {
    expect(Math.abs(first.y - second.y)).toBeLessThan(2);
    expect(second.x).toBeGreaterThan(first.x + first.width);
  } else expect(second.y).toBeGreaterThan(first.y + first.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
