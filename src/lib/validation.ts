import { z } from "zod";
import {
  collegePathPreferenceOptions,
  favoriteActivityOptions,
  favoriteSubjectOptions,
  genderOptions,
  personalConstraintOptions,
  problemAreaOptions,
  schoolMajorOptions,
  skillStrengthOptions,
  techComfortOptions,
  workStyleOptions
} from "@/lib/assessment/options";
import type { Gender, SchoolMajor, TechComfort, WorkStyle } from "@/lib/types";

const boundedText = (label: string, max = 120) =>
  z
    .string({ required_error: `${label} wajib diisi.` })
    .trim()
    .min(2, `${label} wajib diisi.`)
    .max(max, `${label} terlalu panjang.`);

export const assessmentMultiSelectLimits = {
  favoriteSubjects: 3,
  favoriteActivities: 3
} as const;

const optionArray = (options: readonly string[], label: string, maxSelections = options.length) =>
  z
    .array(z.enum(options as [string, ...string[]]))
    .min(1, `Pilih minimal 1 ${label}.`)
    .max(maxSelections, `Pilih maksimal ${maxSelections} ${label}.`);

const optionalText = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${label} terlalu panjang.`)
    .refine((value) => value.length === 0 || value.length >= min, `${label} minimal ${min} karakter jika diisi.`)
    .optional()
    .default("");

export const studentAnswerSchema = z.object({
  fullName: boundedText("Nama lengkap", 100),
  email: z.string().trim().email("Email Google tidak valid."),
  gender: z.enum(genderOptions as [Gender, ...Gender[]], {
    required_error: "Gender wajib dipilih."
  }),
  age: z
    .string({ required_error: "Umur wajib diisi." })
    .trim()
    .regex(/^\d{1,2}$/, "Umur harus berupa angka.")
    .refine((value) => Number(value) >= 10 && Number(value) <= 30, "Umur harus realistis untuk siswa SMA/SMK."),
  school: boundedText("Asal sekolah", 120),
  className: boundedText("Kelas", 40),
  currentSchoolMajor: z.enum(schoolMajorOptions as [SchoolMajor, ...SchoolMajor[]]),
  favoriteSubjects: optionArray(favoriteSubjectOptions, "mata pelajaran", assessmentMultiSelectLimits.favoriteSubjects),
  favoriteSubjectsOther: optionalText("Mata pelajaran lainnya", 2, 80),
  favoriteActivities: optionArray(favoriteActivityOptions, "aktivitas", assessmentMultiSelectLimits.favoriteActivities),
  skillStrengths: optionArray(skillStrengthOptions, "skill"),
  workStyle: z.enum(workStyleOptions as [WorkStyle, ...WorkStyle[]]),
  problemAreas: optionArray(problemAreaOptions, "tipe masalah"),
  collegePathPreferences: optionArray(collegePathPreferenceOptions, "preferensi jalur kuliah"),
  collegePathPreferenceOther: optionalText("Preferensi jalur kuliah lainnya", 3, 120),
  personalConstraints: optionArray(personalConstraintOptions, "pertimbangan pribadi"),
  techComfort: z.enum(techComfortOptions as [TechComfort, ...TechComfort[]]),
  dreamProfession: optionalText("Profesi impian atau bidang yang kamu penasaran", 3, 240),
  futureVision: optionalText("Cerita masa depan", 10, 480)
}).superRefine((answer, ctx) => {
  if (answer.favoriteSubjects.includes("Lainnya") && !answer.favoriteSubjectsOther.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["favoriteSubjectsOther"],
      message: "Isi mata pelajaran lainnya."
    });
  }

  if (answer.collegePathPreferences.includes("Lainnya") && !answer.collegePathPreferenceOther.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["collegePathPreferenceOther"],
      message: "Isi preferensi jalur kuliah lainnya."
    });
  }
});

export type StudentAnswerInput = z.infer<typeof studentAnswerSchema>;
