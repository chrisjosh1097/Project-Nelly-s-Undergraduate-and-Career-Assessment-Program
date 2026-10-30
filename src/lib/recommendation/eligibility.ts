import type { Major } from "../../../data";
import type { EducationPathway } from "@/lib/types";
import { eligibleDegreeTypes } from "@/lib/assessment/pathways";

export function isMajorEligible(
  major: Pick<Major, "degreeTypes">,
  pathway?: EducationPathway,
): boolean {
  return (
    !pathway ||
    pathway === "exploring" ||
    eligibleDegreeTypes(major.degreeTypes, pathway).length > 0
  );
}
export function eligibleMajors(
  majors: readonly Major[],
  pathway?: EducationPathway,
): Major[] {
  return majors.filter((major) => isMajorEligible(major, pathway));
}
export function validatePathwayCapacity(majors: readonly Major[]): string[] {
  return (["university", "vocational"] as const).flatMap((pathway) =>
    eligibleMajors(majors, pathway).length < 10
      ? [`Pathway ${pathway} requires at least 10 degree-compatible programs.`]
      : [],
  );
}
