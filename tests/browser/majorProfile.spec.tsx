import React from "react";
import { test, expect } from "@playwright/experimental-ct-react";
import { MajorProfileView } from "../../src/components/majors/MajorProfileView";
import { publicMajorProfile } from "../../src/lib/majors/publicProfile";

const major = publicMajorProfile("informatika")!;

for (const width of [320, 375, 1280])
  test(`major profile fits ${width}px with campus examples and 44px controls`, async ({ mount, page }) => {
    await page.route("**/api/campus/major/**", (r) => r.fulfill({ json: {
      items: [{ campus: "Kampus Sintetis", type: "Negeri", province: "Jawa Barat", program: "Informatika", degree: "S1", pddiktiUrl: "https://pddikti.kemdiktisaintek.go.id/search/Kampus%20Sintetis" }],
      total: 1, maritimeNote: false, source: "Sumber sintetis.",
    } }));
    await page.setViewportSize({ width, height: 844 });
    await mount(<MajorProfileView major={major} />);
    await expect(page.getByRole("heading", { level: 1, name: major.name })).toBeVisible();
    await expect(page.getByRole("region", { name: "Skill yang dipakai" })).toContainText(major.skills[0]);
    await expect(page.getByRole("region", { name: "Contoh karier" })).toContainText(major.careers[0]);
    await expect(page.getByRole("region", { name: "Ketahanan terhadap AI" })).toContainText(`${major.aiScore}/100`);
    await expect(page.getByRole("region", { name: "Contoh kampus" })).toContainText("Kampus Sintetis");
    await expect(page.getByRole("link", { name: "Mulai asesmen" })).toHaveAttribute("href", "/assessment");
    await expect(page.getByRole("link", { name: /Cari kampus lain/ })).toHaveAttribute("href", `/kampus?q=${encodeURIComponent(major.name)}`);
    for (const link of await page.getByRole("link").all()) {
      if (await link.isVisible()) expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
