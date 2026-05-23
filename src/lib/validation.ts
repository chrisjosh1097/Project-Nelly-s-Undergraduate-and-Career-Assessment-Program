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

const optionArray = (options: readonly string[], label: string) =>
  z
    .array(z.enum(options as [string, ...string[]]))
    .min(1, `Pilih minimal 1 ${label}.`)
    .max(options.length, `Pilihan ${label} tidak valid.`);

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
  favoriteSubjects: optionArray(favoriteSubjectOptions, "mata pelajaran"),
  favoriteActivities: optionArray(favoriteActivityOptions, "aktivitas"),
  skillStrengths: optionArray(skillStrengthOptions, "skill"),
  workStyle: z.enum(workStyleOptions as [WorkStyle, ...WorkStyle[]]),
  problemAreas: optionArray(problemAreaOptions, "tipe masalah"),
  collegePathPreferences: optionArray(collegePathPreferenceOptions, "preferensi jalur kuliah"),
  personalConstraints: optionArray(personalConstraintOptions, "pertimbangan pribadi"),
  techComfort: z.enum(techComfortOptions as [TechComfort, ...TechComfort[]]),
  dreamProfession: z.string().trim().max(240, "Jawaban terlalu panjang.").optional().default(""),
  futureVision: z.string().trim().max(480, "Jawaban terlalu panjang.").optional().default("")
});

export type StudentAnswerInput = z.infer<typeof studentAnswerSchema>;
