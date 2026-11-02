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
for (const field of [
  "pathway",
  "name",
  "subject-other",
  "college-other",
] as const)
  test(`cancelling ${field} edits restores original answers`, async ({
    mount,
    page,
  }) => {
    await mount(<AssessmentForm />);
    await school(page);
    await page.getByRole("radio", { name: /Vokasi \/ Terapan/ }).click();
    await next(page);
    await page.getByRole("checkbox", { name: "Lainnya", exact: true }).click();
    await page
      .getByLabel("Mata pelajaran lainnya", { exact: true })
      .fill("Robotika");
    await next(page);
    await page
      .getByRole("checkbox", { name: "Coding/teknologi", exact: true })
      .click();
    await next(page);
    await page.getByRole("checkbox", { name: "Logika", exact: true }).click();
    await next(page);
    await next(page);
    await page
      .getByRole("checkbox", { name: "Industri, Inovasi, dan Infrastruktur", exact: true })
      .click();
    await next(page);
    await page.getByRole("checkbox", { name: "Lainnya", exact: true }).click();
    await page
      .getByLabel("Preferensi lainnya", { exact: true })
      .fill("Dekat industri");
    await next(page);
    await page.getByRole("checkbox", { name: "Biaya", exact: true }).click();
    await next(page);
    await next(page);
    await next(page);
    await next(page);
    const label =
      field === "pathway"
        ? "Ubah Setelah lulus, kamu ingin belajar lewat jalur apa?"
        : field === "name"
          ? "Ubah Nama lengkap"
          : field === "subject-other"
            ? "Ubah Mata pelajaran yang paling disukai"
            : "Ubah Preferensi kampus dan lokasi";
    await page.getByRole("button", { name: label, exact: true }).click();
    if (field === "pathway")
      await page
        .getByRole("radio", { name: /Universitas \/ Akademik/ })
        .click();
    else if (field === "name")
      await page
        .getByRole("textbox", { name: "Nama lengkap", exact: true })
        .fill("Cancelled name");
    else
      await page
        .getByRole("checkbox", { name: "Lainnya", exact: true })
        .click();
    await expect(
      page.getByRole("button", { name: "Batal ubah", exact: true }),
    ).toBeEnabled();
    await page.getByRole("button", { name: "Batal ubah", exact: true }).click();
    await page.getByRole("button", { name: label, exact: true }).click();
    if (field === "pathway")
      await expect(
        page.getByRole("radio", { name: /Vokasi \/ Terapan/ }),
      ).toHaveAttribute("aria-checked", "true");
    else if (field === "name")
      await expect(
        page.getByRole("textbox", { name: "Nama lengkap", exact: true }),
      ).toHaveValue("Nelly Siswa");
    else {
      await expect(
        page.getByRole("checkbox", { name: "Lainnya", exact: true }),
      ).toHaveAttribute("aria-checked", "true");
      await expect(
        page.getByLabel(
          field === "subject-other"
            ? "Mata pelajaran lainnya"
            : "Preferensi lainnya",
          { exact: true },
        ),
      ).toHaveValue(field === "subject-other" ? "Robotika" : "Dekat industri");
    }
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
  await page.getByRole("checkbox", { name: "Industri, Inovasi, dan Infrastruktur", exact: true }).click();
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
test("problem areas allow max 3, can be reordered, and keep order in review and payload", async ({
  mount,
  page,
}) => {
  let payload: any;
  await page.route("**/api/submissions", async (r) => {
    payload = r.request().postDataJSON();
    await r.fulfill({ json: { created: true } });
  });
  await mount(<AssessmentForm />);
  await school(page);
  await page.getByRole("radio", { name: /Universitas \/ Akademik/ }).click();
  await next(page);
  await page.getByRole("checkbox", { name: "Matematika", exact: true }).click();
  await next(page);
  await page.getByRole("checkbox", { name: "Coding/teknologi", exact: true }).click();
  await next(page);
  await page.getByRole("checkbox", { name: "Logika", exact: true }).click();
  await next(page);
  await next(page);
  await expect(page.getByRole("heading", { name: /Masalah apa/ })).toBeVisible();
  const a = "Pemerataan Pendidikan dan Literasi";
  const b = "Kepemudaan dan Kebugaran Jasmani";
  const c = "Manajemen dan Transparansi";
  for (const name of [a, b, c]) await page.getByRole("checkbox", { name, exact: true }).click();
  await page.getByRole("checkbox", { name: "Seni Berekspresi, Bahasa, dan Estetika", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("maksimal 3");
  await next(page);
  await expect(page.getByRole("heading", { name: /Urutkan sesuai prioritas/ })).toBeVisible();
  await expect(page.getByRole("button", { name: `Naikkan ${a}` })).toBeDisabled();
  await page.getByRole("button", { name: `Naikkan ${c}` }).click();
  await page.getByRole("button", { name: `Naikkan ${c}` }).click();
  await expect(page.getByText(`${c} sekarang di urutan 1 dari 3.`)).toBeAttached();
  const items = page.getByRole("list", { name: "Urutan prioritas" }).getByRole("listitem");
  await expect(items.first()).toContainText(c);
  const box = await page.getByRole("button", { name: `Turunkan ${c}` }).boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  await next(page);
  await page.getByRole("checkbox", { name: "PTN di Jawa", exact: true }).click();
  await next(page);
  await page.getByRole("checkbox", { name: "Biaya", exact: true }).click();
  await next(page);
  await next(page);
  await page.getByRole("textbox", { name: /Profesi impian/ }).fill("belum tahu");
  await expect(page.getByTestId("aspiration-hint")).toBeVisible();
  await next(page);
  await next(page);
  await expect(page.getByText(`1. ${c} 2. ${a} 3. ${b}`)).toBeVisible();
  await page.getByRole("button", { name: "Ubah Masalah apa yang ingin kamu selesaikan?", exact: true }).click();
  await next(page);
  await expect(page.getByRole("heading", { name: /Urutkan sesuai prioritas/ })).toBeVisible();
  await page.getByRole("button", { name: `Turunkan ${c}` }).click();
  await next(page);
  await expect(page.getByText(`1. ${a} 2. ${c} 3. ${b}`)).toBeVisible();
  await page.getByRole("button", { name: "Kirim asesmen", exact: true }).click();
  await page.getByRole("button", { name: "Ya, kirim jawaban" }).click();
  await expect.poll(() => payload?.problemAreas).toEqual([a, c, b]);
});
