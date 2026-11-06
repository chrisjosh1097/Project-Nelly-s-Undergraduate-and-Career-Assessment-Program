import type { EducationPathway, Submission } from "@/lib/types";
import { ApiError } from "@/lib/api";
export interface SubmissionFilters {
  search?: string;
  school?: string;
  className?: string;
  topRecommendation?: string;
  cluster?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  educationPathway?: EducationPathway | "unrecorded";
}
export function parseSubmissionFilters(
  params: URLSearchParams,
): SubmissionFilters {
  const educationPathway = params.get("educationPathway") || undefined;
  if (
    educationPathway &&
    !["university", "vocational", "exploring", "unrecorded"].includes(
      educationPathway,
    )
  )
    throw new ApiError("Arah pendidikan tidak valid.", 400);
  const result: SubmissionFilters = {};
  for (const key of [
    "search",
    "school",
    "className",
    "topRecommendation",
    "cluster",
    "status",
    "dateFrom",
    "dateTo",
  ] as const) {
    const value = params.get(key)?.trim();
    if (value) result[key] = value;
  }
  if (educationPathway)
    result.educationPathway =
      educationPathway as SubmissionFilters["educationPathway"];
  return result;
}
export type SubmissionFilterRecord = Pick<
  Submission,
  "fullName" | "email" | "school" | "className" | "status" | "createdAt"
> & {
  answers?: Pick<Partial<Submission["answers"]>, "educationPathway">;
  report?: {
    topRecommendation?: Pick<
      Submission["report"]["topRecommendation"],
      "majorName" | "cluster"
    >;
  };
};
export function matchesSubmissionFilters(
  s: SubmissionFilterRecord,
  f: SubmissionFilters,
): boolean {
  const top = s.report?.topRecommendation;
  const search = f.search?.toLowerCase();
  if (
    search &&
    ![
      s.fullName,
      s.email,
      s.school,
      s.className,
      top?.majorName,
      top?.cluster,
    ].some((value) => value?.toLowerCase().includes(search))
  )
    return false;
  if (f.school && !s.school.toLowerCase().includes(f.school.toLowerCase()))
    return false;
  if (
    f.className &&
    !s.className.toLowerCase().includes(f.className.toLowerCase())
  )
    return false;
  if (
    f.topRecommendation &&
    top?.majorName.toLowerCase() !== f.topRecommendation.toLowerCase()
  )
    return false;
  if (f.cluster && top?.cluster.toLowerCase() !== f.cluster.toLowerCase())
    return false;
  if (f.status && s.status !== f.status) return false;
  if (f.dateFrom && s.createdAt < f.dateFrom) return false;
  if (f.dateTo && s.createdAt > `${f.dateTo}T23:59:59.999Z`) return false;
  if (
    f.educationPathway &&
    (s.answers?.educationPathway ?? "unrecorded") !== f.educationPathway
  )
    return false;
  return true;
}
