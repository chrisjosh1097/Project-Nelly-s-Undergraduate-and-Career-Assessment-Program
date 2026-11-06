import React from "react";
import { test, expect } from "@playwright/experimental-ct-react";
import { Header } from "../../src/components/auth/Header";
import { Input } from "../../src/components/ui/Input";
import { DialogExample } from "./DialogExample";
test("mobile header uses accessible real navigation and logo", async ({
  mount,
  page,
}) => {
  await mount(<Header />);
  await expect(page.getByRole("img", { name: "Project Nelly" })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Navigasi siswa" });
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("link", { name: /Beranda/ })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(nav.getByRole("link", { name: /Admin/ })).toHaveCount(0);
  for (const link of await nav.getByRole("link").all()) {
    const box = await link.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
