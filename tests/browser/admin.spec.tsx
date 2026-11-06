import React from "react";
import { test, expect } from "@playwright/experimental-ct-react";
import { AdminDashboard } from "../../src/components/admin/AdminDashboard";
import { submission } from "./fixtures";
const summary = {
  id: "synthetic",
  fullName: "Synthetic Student",
  email: "synthetic@example.test",
  school: "Synthetic School",
  className: "XI A",
  status: "completed",
  createdAt: "2026-10-01T00:00:00.000Z",
  educationPathway: "vocational",
  topRecommendation: {
    majorName: "Synthetic Engineering",
    cluster: "Engineering",
    overallFitScore: 72,
    aiFutureResilienceScore: 80,
  },
};
const detail = {
  ...submission,
  ...summary,
  answers: {
    ...submission.answers,
    fullName: summary.fullName,
    email: summary.email,
    school: summary.school,
  },
};
function payload(page = 1, total = 121) {
  return {
    page,
    pageSize: 50,
    total,
    totalPages: Math.max(1, Math.ceil(total / 50)),
    submissions: Array.from(
      { length: Math.min(50, Math.max(0, total - (page - 1) * 50)) },
      (_, i) => ({
        ...summary,
        id: "synthetic-" + ((page - 1) * 50 + i),
        fullName: "Synthetic Student " + ((page - 1) * 50 + i),
      }),
    ),
    analytics: { total, schools: 1, fit: 72, ai: 80, charts: [] },
  };
}
test("50-row table, explicit all-data search, page reset, clear and all-match CSV scope", async ({
  mount,
  page,
}) => {
  const queries: URL[] = [];
  await page.route(/\/api\/admin\/submissions(?:\?.*)?$/, (r) => {
    const url = new URL(r.request().url());
    queries.push(url);
    return r.fulfill({
      json: payload(Number(url.searchParams.get("page") || "1")),
    });
  });
  await mount(<AdminDashboard />);
  await expect(
    page.getByRole("heading", { name: "Pahami arah siswa." }),
  ).toBeVisible();
  await expect(page.getByLabel("Cari semua asesmen")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Analitik siswa", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Email siswa", { exact: true })).toBeVisible();
  await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(50);
  await expect(
    page.getByText("1–50 dari 121 rekaman", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Halaman berikutnya" }).click();
  await expect(
    page.getByText("51–100 dari 121 rekaman", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Halaman berikutnya" }).click();
  await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(21);
  const before = queries.length;
  await page.getByLabel("Cari semua asesmen").fill("ARCHIVE");
  expect(queries.length).toBe(before);
  await page
    .getByLabel("Arah pendidikan", { exact: true })
    .selectOption("vocational");
  await page.getByRole("button", { name: "Cari", exact: true }).click();
  await expect
    .poll(() => queries.at(-1)?.searchParams.get("search"))
    .toBe("ARCHIVE");
  expect(queries.at(-1)?.searchParams.get("page") || "1").toBe("1");
  expect(queries.at(-1)?.searchParams.get("educationPathway")).toBe(
    "vocational",
  );
  await page.getByLabel("Cari semua asesmen").fill("engineering");
  await page.getByLabel("Cari semua asesmen").press("Enter");
  await expect
    .poll(() => queries.at(-1)?.searchParams.get("search"))
    .toBe("engineering");
  let exported = "";
  await page.route("**/api/admin/export?*", (r) => {
    exported = r.request().url();
    return r.fulfill({ body: '"name"', contentType: "text/csv" });
  });
  await page.getByRole("button", { name: "Ekspor CSV" }).click();
  await expect.poll(() => exported).toContain("search=engineering");
  expect(exported).toContain("educationPathway=vocational");
  expect(new URL(exported).searchParams.has("page")).toBe(false);
  await page.getByRole("button", { name: "Bersihkan filter" }).click();
  await expect
    .poll(() => queries.at(-1)?.searchParams.has("search"))
    .toBe(false);
  await expect(page.getByLabel("Cari semua asesmen")).toHaveValue("");
});
test("report details load lazily and focus returns to the row", async ({
  mount,
  page,
}) => {
  let details = 0;
  await page.route("**/api/admin/submissions", (r) =>
    r.fulfill({ json: payload(1, 1) }),
  );
  await page.route("**/api/admin/submissions/synthetic-0", (r) => {
    details++;
    return r.fulfill({ json: { submission: detail } });
  });
  await mount(<AdminDashboard />);
  const report = page.getByRole("button", {
    name: "Lihat laporan Synthetic Student 0",
    exact: true,
  });
  await expect(report).toBeVisible();
  expect(details).toBe(0);
  await report.click();
  await expect(
    page.getByRole("heading", { name: "Detail asesmen siswa" }),
  ).toBeVisible();
  expect(details).toBe(1);
  await page.getByRole("button", { name: "Kembali ke dashboard" }).click();
  await expect(report).toBeFocused();
});
test("reset stays confirmed and deletion clamps an obsolete final page", async ({
  mount,
  page,
}) => {
  let total = 51,
    resets = 0;
  await page.route(/\/api\/admin\/submissions(?:\?.*)?$/, (r) => {
    const requested = Number(
      new URL(r.request().url()).searchParams.get("page") || 1,
    );
    return r.fulfill({
      json: payload(Math.min(requested, Math.ceil(total / 50)), total),
    });
  });
  await page.route("**/api/admin/submissions/reset", (r) => {
    resets++;
    total = 50;
    return r.fulfill({ json: { deleted: true, email: summary.email } });
  });
  await mount(<AdminDashboard />);
  await page.getByRole("button", { name: "Halaman berikutnya" }).click();
  await page
    .getByRole("button", {
      name: "Hapus attempt Synthetic Student 50",
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog")).toContainText(summary.email);
  expect(resets).toBe(0);
  await page.getByRole("button", { name: "Batal", exact: true }).click();
  expect(resets).toBe(0);
  await page
    .getByRole("button", {
      name: "Hapus attempt Synthetic Student 50",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Ya, hapus attempt", exact: true })
    .click();
  await expect(
    page.getByText("1–50 dari 50 rekaman", { exact: true }),
  ).toBeVisible();
  expect(resets).toBe(1);
});
test("unauthorized list allows manual login", async ({ mount, page }) => {
  let allowed = false;
  await page.route("**/api/admin/submissions", (r) =>
    r.fulfill({
      status: allowed ? 200 : 401,
      json: allowed ? payload(1, 0) : { error: "Login" },
    }),
  );
  await page.route("**/api/admin/login", (r) => {
    allowed = true;
    return r.fulfill({ json: { ok: true } });
  });
  await mount(<AdminDashboard />);
  await page
    .getByLabel("Email admin", { exact: true })
    .fill("admin@example.test");
  await page.getByLabel("Password", { exact: true }).fill("test-only");
  await page.getByRole("button", { name: "Masuk dashboard" }).click();
  await expect(
    page.getByText("Belum ada asesmen yang sesuai.", { exact: true }),
  ).toBeVisible();
});
test("initial failure and hanging access checks leave spinner and offer retry", async ({
  mount,
  page,
}) => {
  await page.clock.install();
  let calls = 0;
  await page.route("**/api/admin/submissions", (r) => {
    calls++;
    if (calls === 1)
      return r.fulfill({ status: 500, json: { error: "Synthetic offline" } });
    if (calls === 2) return; // deliberately held until the client deadline
    return r.fulfill({ json: payload(1, 0) });
  });
  await mount(<AdminDashboard />);
  await expect(
    page.getByText("Synthetic offline", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Coba lagi", exact: true }).click();
  await expect.poll(() => calls).toBe(2);
  await page.clock.fastForward(15_001);
  await expect(page.getByText(/Batas waktu/)).toBeVisible();
  await page.getByRole("button", { name: "Coba lagi", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Pahami arah siswa." }),
  ).toBeVisible();
});
for (const pending of ["list", "detail"] as const) {
  test(
    "logout rejects a stale " + pending + " response",
    async ({ mount, page }) => {
      let release: (() => Promise<void>) | undefined;
      let listCalls = 0;
      await page.route(/\/api\/admin\/submissions(?:\?.*)?$/, (r) => {
        if (++listCalls > 1 && pending === "list") {
          release = () => r.fulfill({ json: payload() });
          return;
        }
        return r.fulfill({ json: payload(1, 1) });
      });
      await page.route("**/api/admin/submissions/synthetic-0", (r) => {
        release = () => r.fulfill({ json: { submission: detail } });
      });
      await page.route("**/api/admin/logout", (r) =>
        r.fulfill({ json: { ok: true } }),
      );
      await mount(<AdminDashboard />);
      await expect(
        page.getByRole("heading", { name: "Pahami arah siswa." }),
      ).toBeVisible();
      if (pending === "list")
        await page.getByRole("button", { name: "Cari", exact: true }).click();
      else
        await page
          .getByRole("button", {
            name: "Lihat laporan Synthetic Student 0",
            exact: true,
          })
          .click();
      await expect.poll(() => !!release).toBe(true);
      await page
        .getByRole("button", { name: "Keluar admin", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Masuk ruang konselor" }),
      ).toBeVisible();
      const lateResponse = page.waitForResponse((response) => {
        const path = new URL(response.url()).pathname;
        return pending === "detail"
          ? path.endsWith("/synthetic-0")
          : path.endsWith("/submissions");
      });
      await release!();
      await (await lateResponse).finished();
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      await expect(
        page.getByRole("heading", { name: "Masuk ruang konselor" }),
      ).toBeVisible();
      await expect(page.getByRole("table")).toHaveCount(0);
      await expect(
        page.getByRole("heading", { name: "Detail asesmen siswa" }),
      ).toHaveCount(0);
    },
  );
}
test("unauthorized detail clears private summaries", async ({
  mount,
  page,
}) => {
  await page.route("**/api/admin/submissions", (r) =>
    r.fulfill({ json: payload(1, 1) }),
  );
  await page.route("**/api/admin/submissions/synthetic-0", (r) =>
    r.fulfill({ status: 401, json: { error: "Login" } }),
  );
  await mount(<AdminDashboard />);
  await page
    .getByRole("button", {
      name: "Lihat laporan Synthetic Student 0",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Masuk ruang konselor" }),
  ).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
});
