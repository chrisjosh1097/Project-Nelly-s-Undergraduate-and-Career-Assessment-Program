import type { StudentAnswer } from "@/lib/types";
import { studentAnswerSchema } from "@/lib/validation";
import type { AssessmentStep } from "./steps";
export function emptyAnswer(email = ""): StudentAnswer {
  return {
    fullName: "",
    email,
    gender: "",
    age: "",
    school: "",
    className: "",
    currentSchoolMajor: "IPA",
    favoriteSubjects: [],
    favoriteSubjectsOther: "",
    favoriteActivities: [],
    skillStrengths: [],
    workStyle: "Banyak bertemu orang",
    problemAreas: [],
    collegePathPreferences: [],
    collegePathPreferenceOther: "",
    personalConstraints: [],
    techComfort: "Biasa saja",
    dreamProfession: "",
    futureVision: "",
  };
}
export function validateAssessmentStep(
  step: AssessmentStep,
  answer: StudentAnswer,
): string | null {
  if (
    (step.type === "pathway" || step.type === "review") &&
    !answer.educationPathway
  )
    return "Pilih arah pendidikan terlebih dahulu.";
  const parsed = studentAnswerSchema.safeParse(answer);
  if (parsed.success) return null;
  const keys =
    step.type === "review"
      ? null
      : step.type === "profile"
        ? ["gender", "age"]
        : [
            step.key,
            ...(step.key === "favoriteSubjects"
              ? ["favoriteSubjectsOther"]
              : step.key === "collegePathPreferences"
                ? ["collegePathPreferenceOther"]
                : []),
          ];
  return (
    parsed.error.issues.find(
      (issue) => keys === null || keys.includes(String(issue.path[0])),
    )?.message ?? null
  );
}
export function assessmentProgress(index: number, total: number): number {
  return Math.min(
    99,
    Math.max(0, Math.round((index / Math.max(1, total)) * 100)),
  );
}
export function assessmentReviewWarnings(answer: StudentAnswer): string[] {
  return answer.educationPathway === "university" &&
    answer.collegePathPreferences.includes("Diploma/vokasi")
    ? [
        "Kamu memilih S1 dan juga preferensi Diploma/vokasi. Hasil akan mengikuti pilihan S1; ubah arah pendidikan jika ingin mengeksplorasi keduanya.",
      ]
    : [];
}
