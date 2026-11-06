import type { StudentAnswer } from "@/lib/types";

/** "Lainnya — {text}" when the student typed their own school major; otherwise the option label. Display only. */
export function formatSchoolMajor(answers: Pick<StudentAnswer, "currentSchoolMajor"> & { currentSchoolMajorOther?: string }): string {
  const other = answers.currentSchoolMajorOther?.trim();
  return answers.currentSchoolMajor === "Lainnya" && other ? `Lainnya — ${other}` : answers.currentSchoolMajor;
}
