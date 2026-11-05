# Review #2 — next phase plan

Source: reviewer document "Review Project Nelly" (Review #2). The raw PDF stays only in gitignored `.superpowers/sdd/2026-11-04-review/`. Do not put student names in code, tests, docs or commits.

Branch: `feat/app-remake-pathway-flows`. Never merge to `main`. Push only on request.

## Status of the review items

| # | Review item | Status |
|---|---|---|
| R1 | Replace the 4-week plan with AI prompts the student can copy | **New**: needs decisions D1–D3 |
| R2 | Change the campus heading copy | **New**: small |
| R3 | "Lainnya" for the school field must accept free text | **New**: needs decision D4 |
| R4 | Results header should not be black; use blue, green or orange | **New**: needs decision D5 |
| R5 | Problem areas: 2 questions (pick 3, then order) with 8 new labels | **Already done** in v3.2.0 (`7724515`). Only the reviewer's wording differs; see R5 below |

---

## R1. AI prompt helper instead of the 4-week plan

**What the reviewer wants.** The 4-week plan was meant to be a practical resource. Instead, offer ready-made prompts the student pastes into an AI (ChatGPT, Gemini, Claude).

**Section copy (reviewer's wording, shortened to ≤20 words per sentence):**
- Title: "Penasaran lebih jauh? Yuk konsultasi mandiri"
- Intro: "Salin prompt di bawah ke AI seperti ChatGPT, Gemini, atau Claude. Gunakan untuk menyusun strategi kuliah dan kariermu."

**Four prompts, each collapsible with a copy button:**
1. **Pemetaan Industri.** Placeholder `[Nama Karier]`.
2. **Strategi Portofolio.** Placeholders `[Jurusan Sekolah]`, `[Aktivitas A/B/C]`, `[Jurusan Kuliah Target]`.
3. **Day-in-the-Life.** Placeholders `[Nama Karier]`, `[Perusahaan/Institusi]`.
4. **Rekomendasi Tools & Skill Teknis.** Placeholder `[Jurusan Kuliah Target]`.

The prompt texts are kept verbatim from the review in `data/aiPrompts.ts`, apart from the placeholders.

**Auto-filled placeholders (display only, from saved report fields; no rescoring):**

| Placeholder | Source |
|---|---|
| `[Nama Karier]` | First item of `nicheCareerPaths`, else `relatedCareers` |
| `[Jurusan Kuliah Target]` | `majorName` |
| `[Jurusan Sekolah]` | `currentSchoolMajor`, or the R3 free text when it is "Lainnya" |
| `[Aktivitas A/B/C]` | `favoriteActivities` (max 3), plus `favoriteActivitiesOther` if present |
| `[Perusahaan/Institusi]` | Left as a placeholder the student edits. No company names may be invented |

When there are fewer than 3 activities, the missing slots stay as `[Aktivitas …]` so the student can fill them in.

**Interaction:**
- Each prompt is a `<details>` with the title in `<summary>`. The copy button sits **outside** the summary (rule: no buttons inside `<summary>`).
- The "Salin prompt" button is ≥44px. It uses `navigator.clipboard.writeText` and announces "Prompt disalin" in a live region. When the clipboard is blocked, it falls back to selecting the text.
- Optional quick links "Buka ChatGPT / Gemini / Claude" are **not** included unless approved (D3).

**Where:**
- Shown on the main recommendation card in place of the WeekPlan block, and in each alternative card when it is opened.
- PDF: prompts 1–4 with filled placeholders, as a short block instead of the 4-week plan (D2).
- The Instagram card is unchanged.

**Compatibility:**
- `actionGuidance.weekPlan` stays in stored reports and in types. Nothing is deleted from data.
- The prompt helper is built at render time, so old reports get it too.
- The S2 localStorage checklist is removed from the UI if D1 = replace. Its stored keys are harmless.

**Content rule note.** Prompt 1 asks the AI where a role is "paling dihargai secara finansial". That is the external AI's answer, not our claim, so the rule "no invented salary claims" in *our* text still holds. Add a one-line caution under the section: "Jawaban AI bisa salah. Cek ulang ke sumber resmi, guru BK, atau praktisi."

**Tests:**
- Unit: placeholder filling (complete, missing activities, "Lainnya" school, legacy report without `nicheCareerPaths`).
- Browser: the copy button is outside the summary, is ≥44px, writes the expected text to the clipboard (mocked), and is announced; phone 320/375 has no horizontal overflow.
- PDF test: the prompt block is present and fits the bounds.

## R2. Campus heading copy

Change "Contoh kampus yang membuka jurusan ini" to **"Contoh kampus yang membuka spesifik program studi ini"** in `CampusExamples.tsx`, and update the matching test strings.

Note: the reviewer's text reads a bit unusual in Indonesian. Alternative: "Contoh kampus dengan program studi spesifik ini". Use the reviewer's wording unless the user picks the alternative (D6).

## R3. "Lainnya" on the school field accepts free text

**Interpretation.** "Kolom sekolah" means the **"Jurusan sekolah saat ini"** question. It has a "Lainnya" option today with no text box. "Asal sekolah" is already a free-text field. (D4 confirms this.)

**Change:**
- Add an optional `currentSchoolMajorOther` to the answer types.
- Validation: required (2–60 characters) when `currentSchoolMajor === "Lainnya"`, otherwise empty.
- When "Lainnya" is picked, the form shows a text box under the option (same pattern as `favoriteSubjectsOther`). Switching away clears it.
- **Scoring is unchanged:** `currentSchoolMajor` stays "Lainnya" for the school-background rules, so there is no version bump. The free text is used only for display and the R1 prompt placeholder.
- Display: review page, admin detail, PDF and CSV show "Lainnya — {text}".
- Old answers without the field still validate and render.

**Tests:** validation (required only for "Lainnya"), form flow (the box appears and clears), review/PDF/CSV display, and a legacy fixture.

## R4. Results header not black

**Today.** The top summary block (`#ringkasan`) uses `bg-ink` (black) with white and orange text.

**Options (white text must keep ≥4.5:1 contrast):**

| Option | Background | Note |
|---|---|---|
| A | Deep orange `#c2410c` (orange-700), with a soft gradient to `#ea580c` behind large text only | Closest to the brand; score text becomes white instead of orange |
| B | Deep blue `#1d4ed8` (blue-700) | Matches the blue accent of the Instagram story |
| C | Deep green `#15803d` (green-700) | Matches the green accent of the Instagram story |

**Scope:**
- The header block on the web results page.
- Black CTA buttons on the results page: "Lihat perbandingan", and the retry button in `ResultLoader`.
- The site footer and the "Mulai asesmen" CTA on `/jurusan` stay as they are unless asked.
- The PDF uses no black header block, so it is unchanged.

**Tests:** `contrast.spec.tsx` covers the new header colours. Take screenshots at 375 and 1280 px.

## R5. Problem areas (already shipped in v3.2.0)

Already done:
- Two steps: pick max 3, then order with up/down buttons.
- The 8 labels exactly as listed by the reviewer.
- Rank weights 1.0/0.8/0.6.

Small wording gap:
- **Reviewer:** "Masalah apa yang ingin kamu selesaikan? (Pilih 3 yang paling sesuai)".
- **Today:** "Masalah apa yang ingin kamu selesaikan?" with guidance "Pilih maksimal 3 yang paling sesuai."
- The user earlier decided on "maksimal 3", so keep it.

Ordering is by buttons, not drag. Buttons work for keyboard and screen readers and on small phones. Drag can be added later as an extra, but needs approval (D7).

---

## Decisions needed from the user

- **D1.** R1: should the prompts **replace** the 4-week plan (as the reviewer wrote), or appear **next to it** (plan collapsed)? Recommended: replace, keeping the data.
- **D2.** R1: should the PDF also switch to the prompts? Recommended: yes.
- **D3.** R1: add "Buka ChatGPT / Gemini / Claude" links? Recommended: no, just copy (neutral, and no external dependency).
- **D4.** R3: confirm that "kolom sekolah" means "Jurusan sekolah saat ini" (not "Asal sekolah").
- **D5.** R4: header colour A (orange), B (blue) or C (green)?
- **D6.** R2: reviewer wording, or the alternative "Contoh kampus dengan program studi spesifik ini"?
- **D7.** R5: keep button ordering only, or also add drag?

## Order of work

1. **R2 + R4 + R3:** small, display or optional-field changes. One commit each.
2. **R1:** prompt helper on web and PDF.
3. Verify each step:
   - `npm test`, typecheck, lint, `validate:kb`, build.
   - Browser tests at 320/375/1280 px.
   - A PDF check with a synthetic report.

No scoring change is expected in this phase, so `SCORING_VERSION` stays at v3.2.0.

## Still open from earlier

- Guidance Tasks 3, 5 and 7: on hold by the user.
- A fifth "Jurusan" bottom-nav item: not yet answered.
- Live checks:
  - Gemini, Firestore and login on the preview;
  - the admin access delay.

---

## Decisions (user, 2026-11-04)

These replace the open questions D1–D7 above.

1. **R1 has two layers.**
   - **Layer 1, results:** one collapsible block "Tanya AI tentang jurusan ini", on the **main recommendation only**. It holds the 4 reviewer prompts with auto-filled placeholders and a "Salin" button outside `<summary>`, plus a link "Lihat semua prompt →" to `/prompt`.
   - **Layer 2, `/prompt` "Bank Prompt":** a public page with about 15 prompts in 6 categories.
     - A few fields at the top (school major, target major or career, activities) fill every prompt.
     - When coming from the results page, the fields are prefilled through query parameters with no personal identifiers: school major, major name and career only. No name or email.
     - Each prompt shows a title, a one-line purpose and "Salin". The full text sits behind "Lihat isi prompt".
   - **Rules for every prompt:**
     - It ends with the safety line "Kalau tidak yakin, bilang tidak yakin dan sarankan sumber resmi untuk dicek."
     - No prompts about salary figures, admission chances or passing grades.
     - Reviewer prompt 1 becomes "industri mana yang paling membutuhkan peran ini, dan sumber apa yang bisa saya cek".
     - Reviewer prompt 4 drops "belum banyak diketahui orang" and asks for official or well-known free sources to verify.
   - **The 4-week plan** is replaced in the UI by a single "Langkah pertama minggu ini" (week 1 of the stored plan). The data is kept.
2. **PDF:** a short prompt block (the 4 filled reviewer prompts) on the last page, and the first step instead of the 4-week plan.
3. **No "Buka ChatGPT/Gemini/Claude" links.**
4. **R3:** "kolom sekolah" means "Jurusan sekolah saat ini". Add the free-text field `currentSchoolMajorOther`.
5. **R4:** the results header uses **deep orange** (orange-700/800 range, white text ≥4.5:1). The black CTAs on the results page also become orange.
6. **R2:** use the alternative copy "Contoh kampus dengan program studi spesifik ini".
7. **R5:** keep button ordering; no drag.

**Prompt texts** (draft below) need the user's or reviewer's approval before release, like the glossary.

## Draft: Bank Prompt (for approval)

Placeholders are filled from the top fields: `{karier}`, `{jurusanKuliah}`, `{jurusanSekolah}`, `{aktivitas}`. Every prompt ends with the safety line.

**🎯 Kenali diri**
1. *Cari jurusan dari minatku.* "Saya siswa {jurusanSekolah}. Saya suka {aktivitas}. Sebutkan 5 jurusan kuliah yang cocok, alasan singkatnya, dan satu pertanyaan untuk menguji minat saya di tiap jurusan."
2. *Kenali kekuatanku.* "Ajukan 8 pertanyaan singkat, satu per satu, untuk membantu saya mengenali kekuatan dan gaya belajar saya. Setelah saya menjawab semuanya, rangkum kekuatan saya dan bidang yang cocok."

**🏫 Pilih jurusan & kampus**
3. *Bandingkan dua jurusan.* "Bandingkan jurusan {jurusanKuliah} dengan satu jurusan lain yang mirip. Jelaskan perbedaan mata kuliah, gaya belajar, dan contoh karier dalam tabel sederhana."
4. *Pertanyaan untuk kakak tingkat.* "Saya akan bertanya kepada mahasiswa {jurusanKuliah}. Buatkan 8 pertanyaan yang jujur dan spesifik tentang tugas, beban belajar, dan hal yang mereka sesali."
5. *Cara memilih kampus.* "Bantu saya membuat daftar periksa untuk memilih kampus jurusan {jurusanKuliah}: akreditasi, kurikulum, magang, biaya, dan lokasi. Beri tahu di mana saya bisa mengecek tiap poin."

**💼 Bayangkan kariernya**
6. *Pemetaan industri (reviewer 1).* "Saya sedang menimbang dunia {karier} di Indonesia. Jadilah mentor yang jujur dan blak-blakan. Apa 3 mitos terbesar tentang pekerjaan ini? Industri mana yang paling membutuhkan peran ini, dan sumber apa yang bisa saya cek?"
7. *Day-in-the-life (reviewer 3).* "Bayangkan saya magang hari pertama sebagai {karier} di sebuah [Perusahaan/Institusi]. Beri satu masalah tak terduga yang sering terjadi di profesi ini. Bagaimana profesional menyelesaikannya, dan karakter seperti apa yang biasanya menyerah?"
8. *Karier yang tahan AI.* "Bagaimana AI mengubah pekerjaan {karier} dalam 5–10 tahun ke depan? Bagian mana yang tetap butuh manusia, dan skill apa yang perlu saya latih dari sekarang?"

**📁 Portofolio & persiapan**
9. *Connect the dots (reviewer 2).* "Saya siswa {jurusanSekolah}. Pengalaman saya baru sebatas {aktivitas}. Saya ingin kuliah {jurusanKuliah}. Bantu saya menghubungkan pengalaman ini menjadi narasi portofolio yang unik."
10. *Tools & skill tahun pertama (reviewer 4).* "Kalau kamu mahasiswa baru {jurusanKuliah} yang mengulang dari awal, tools atau keahlian apa yang kamu pelajari di tahun pertama? Sebutkan tempat belajar atau sertifikasi gratis yang resmi atau terkenal agar bisa saya cek."
11. *Rencana latihan 4 minggu.* "Buatkan rencana latihan 4 minggu, 2–3 jam per minggu, untuk mencoba bidang {jurusanKuliah}. Tiap minggu berisi satu aksi kecil dan bukti hasil yang bisa saya simpan."
12. *Ide proyek kecil.* "Beri 3 ide proyek kecil yang bisa saya selesaikan dalam 2 minggu untuk menunjukkan minat pada {jurusanKuliah}. Alat yang dipakai harus gratis."

**📝 Seleksi masuk**
13. *Strategi belajar UTBK.* "Saya punya waktu [jumlah bulan] bulan sebelum UTBK. Bantu saya membuat jadwal belajar mingguan yang realistis berdasarkan subtes resmi. Sarankan saya mengecek info terbaru di situs SNPMB."
14. *Latihan wawancara atau esai.* "Jadilah pewawancara beasiswa atau seleksi kampus untuk jurusan {jurusanKuliah}. Ajukan satu pertanyaan per giliran, lalu beri masukan singkat atas jawaban saya."

**💬 Bicara dengan orang tua**
15. *Jelaskan pilihanku.* "Saya ingin kuliah {jurusanKuliah}, tetapi orang tua saya ragu. Bantu saya menyiapkan penjelasan yang tenang dan sopan: alasan saya, rencana cadangan, dan pertanyaan yang bisa kami bahas bersama."

## Revised order of work

1. **R2 + R4 + R3:** small; start now.
2. **R1 layer 1:** results block, first-step swap, and PDF.
3. **R1 layer 2:** `/prompt` page, after the prompt texts are approved.
