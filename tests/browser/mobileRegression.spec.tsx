import React from "react";
import { test, expect } from "@playwright/experimental-ct-react";
import { AppShell } from "../../src/components/layout/AppShell";
import LandingPage from "../../src/app/page";
import { LoginPanel } from "../../src/components/auth/LoginPanel";
import { AssessmentForm } from "../../src/components/assessment/AssessmentForm";
import { ResultsView } from "../../src/components/results/ResultsView";
import { AdminDashboard } from "../../src/components/admin/AdminDashboard";
import { submission } from "./fixtures";

for (const width of [320, 360, 390, 768, 1280])
  for (const screen of [
    "landing",
    "login",
    "assessment",
    "results",
    "admin",
  ] as const) {
    test(`${screen} fits ${width}px with accessible controls`, async ({
      mount,
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(
        ({ screen }) => {
          (window as any).__pathname =
            screen === "landing"
              ? "/"
              : screen === "results"
                ? "/result"
                : "/" + screen;
          if (screen === "login")
            (window as any).__auth = {
              user: null,
              loading: false,
              configured: false,
            };
        },
        { screen },
      );
      await page.route("**/api/submissions/status", (r) =>
        r.fulfill({ json: { status: "not-submitted" } }),
      );
      const long = {
        ...submission,
        fullName: "Nadia Rahma Anindita dengan nama yang sangat panjang",
        school: "SMK Negeri Teknik dan Informatika dengan nama sekolah panjang",
      };
      await page.route("**/api/admin/submissions", (r) =>
        r.fulfill({ json: { submissions: [long] } }),
      );
      const view =
        screen === "landing" ? (
          <LandingPage />
        ) : screen === "login" ? (
          <LoginPanel />
        ) : screen === "assessment" ? (
          <AssessmentForm />
        ) : screen === "results" ? (
          <ResultsView submission={long} />
        ) : (
          <AdminDashboard />
        );
      await mount(<AppShell>{view}</AppShell>);
      if (screen === "assessment")
        await expect(
          page.getByRole("textbox", { name: "Nama lengkap", exact: true }),
        ).toBeVisible();
      if (screen === "admin") {
        await expect(
          page.getByRole("heading", { name: "Pahami arah siswa." }),
        ).toBeVisible();
        await page
          .locator("summary")
          .filter({ hasText: "Filter asesmen" })
          .click();
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const logo = page
        .getByRole("img", { name: "Project Nelly", exact: true })
        .first();
      expect(
        await logo.evaluate(
          (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
        ),
      ).toBe(true);
      for (const input of await page
        .locator(
          'input:not([type="checkbox"]):not([type="radio"]),textarea,select',
        )
        .all())
        if (await input.isVisible())
          expect(
            await input.evaluate((el) =>
              parseFloat(getComputedStyle(el).fontSize),
            ),
          ).toBeGreaterThanOrEqual(16);
      for (const button of await page.getByRole("button").all())
        if (await button.isVisible()) {
          const box = await button.boundingBox();
          expect(box!.height).toBeGreaterThanOrEqual(44);
        }
      if (screen === "admin") {
        await page.getByRole("button", { name: /Lihat laporan Nadia/ }).click();
        await expect(
          page.getByRole("button", { name: "Kembali ke dashboard" }),
        ).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      }
      if (width === 390 && ["landing", "results", "admin"].includes(screen))
        await page.screenshot({
          path: `exports/actual-${screen}-phone.png`,
          fullPage: true,
        });
    });
  }
test("larger text does not overflow a phone assessment", async ({
  mount,
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 700 });
  await page.route("**/api/submissions/status", (r) =>
    r.fulfill({ json: { status: "not-submitted" } }),
  );
  await mount(
    <AppShell>
      <AssessmentForm />
    </AppShell>,
  );
  await page.addStyleTag({ content: "html{font-size:24px}" });
  await expect(
    page.getByRole("textbox", { name: "Nama lengkap", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: /Lanjutkan/ }).focus();
  await expect(
    page.getByRole("button", { name: /Lanjutkan/ }),
  ).toBeInViewport();
});
