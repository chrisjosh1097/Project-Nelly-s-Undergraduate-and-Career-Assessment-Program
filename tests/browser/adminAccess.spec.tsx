import React from "react";
import { test, expect } from "@playwright/experimental-ct-react";
import { SiteFooter } from "../../src/components/layout/SiteFooter";

for (const width of [320, 390, 1280]) {
  test(`admin login is discoverable from the footer at ${width}px`, async ({
    mount,
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await mount(<SiteFooter />);
    const link = page.getByRole("link", {
      name: "Admin / Guru BK",
      exact: true,
    });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/admin");
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await link.focus();
    await expect(link).toBeFocused();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
