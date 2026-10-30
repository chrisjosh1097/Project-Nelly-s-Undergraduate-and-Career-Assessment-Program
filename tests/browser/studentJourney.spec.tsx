import React from "react";
import { test, expect } from "@playwright/experimental-ct-react";
import type { Page } from "playwright/test";
import { AssessmentForm } from "../../src/components/assessment/AssessmentForm";
async function next(page: Page) {
  await page
    .getByRole("button", { name: /^Lanjutkan|^Simpan perubahan/ })
    .click();
}
async function school(page: Page) {
  await page
    .getByRole("textbox", { name: "Nama lengkap", exact: true })
    .fill("Nelly Siswa");
  await next(page);
  await next(page);
  await page.getByRole("radio", { name: "Wanita", exact: true }).click();
  await page.getByRole("textbox", { name: "Umur", exact: true }).fill("16");
  await next(page);
  await page
    .getByRole("textbox", { name: "Asal sekolah", exact: true })
    .fill("SMKN 1 Contoh");
  await next(page);
  await page
    .getByRole("textbox", { name: "Kelas", exact: true })
    .fill("XI Teknik");
  await next(page);
  await page.getByRole("radio", { name: "SMK Teknik", exact: true }).click();
  await next(page);
}
test.beforeEach(async ({ page }) => {
  await page.route("**/api/submissions/status", (r) =>
    r.fulfill({ json: { status: "not-submitted" } }),
  );
});
test("school background routes to explicit direction and retains answers", async ({
  mount,
  page,
}) => {
  await mount(<AssessmentForm />);
  await school(page);
  await expect(
    page.getByRole("heading", { name: /Setelah lulus/ }),
  ).toBeVisible();
  await next(page);
  await expect(page.getByRole("alert")).toContainText("Pilih arah");
  await page.getByRole("radio", { name: /Universitas \/ Akademik/ }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("radio", { name: /Vokasi \/ Terapan/ }),
  ).toHaveAttribute("aria-checked", "true");
  await next(page);
  await page.getByRole("checkbox", { name: "Matematika", exact: true }).click();
  await next(page);
  await expect(page.getByText(/praktik alat/)).toBeVisible();
  for (const name of ["Coding/teknologi", "Kerja lapangan", "Membantu orang"])
    await page.getByRole("checkbox", { name, exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Eksperimen/lab", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("maksimal 3");
  await page.getByRole("button", { name: /Kembali/ }).click();
  await expect(
    page.getByRole("checkbox", { name: "Matematika", exact: true }),
  ).toHaveAttribute("aria-checked", "true");
});
test("review editing and retry keep answers, duplicate clicks send one request", async ({
  mount,
  page,
}) => {
  let posts = 0;
  let payload: any;
  await page.route("**/api/submissions", async (r) => {
    posts++;
    payload = r.request().postDataJSON();
    await r.fulfill({
      status: posts === 1 ? 500 : 200,
      json: posts === 1 ? { error: "Koneksi terputus" } : { created: false },
    });
  });
  await mount(<AssessmentForm />);
  await school(page);
  await page.getByRole("radio", { name: /Vokasi \/ Terapan/ }).click();
  await next(page);
  await page.getByRole("checkbox", { name: "Matematika", exact: true }).click();
  await next(page);
  await page
    .getByRole("checkbox", { name: "Coding/teknologi", exact: true })
    .click();
  await next(page);
  await page.getByRole("checkbox", { name: "Logika", exact: true }).click();
  await next(page);
  await next(page);
  await page.getByRole("checkbox", { name: "Teknologi", exact: true }).click();
  await next(page);
  await page
    .getByRole("checkbox", { name: "PTN di Jawa", exact: true })
    .click();
  await next(page);
  await page.getByRole("checkbox", { name: "Biaya", exact: true }).click();
  await next(page);
  await next(page);
  await next(page);
  await next(page);
  await expect(
    page.getByRole("heading", { name: /Sudah menggambarkan/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Ubah Nama lengkap", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Nama lengkap", exact: true })
    .fill("Nelly Baru");
  await next(page);
  await page
    .getByRole("button", { name: "Kirim asesmen", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(/satu/i);
  await page
    .getByRole("button", { name: "Ya, kirim jawaban" })
    .evaluate((button: HTMLButtonElement) => {
      button.click();
      button.click();
    });
  await expect(page.getByRole("alert")).toContainText("Koneksi terputus");
  await page.getByRole("button", { name: "Ya, kirim jawaban" }).click();
  await expect
    .poll(() => page.evaluate(() => (window as any).__navigation))
    .toBe("/already-submitted");
  expect(posts).toBe(2);
  expect(payload.fullName).toBe("Nelly Baru");
  expect(payload.educationPathway).toBe("vocational");
});
