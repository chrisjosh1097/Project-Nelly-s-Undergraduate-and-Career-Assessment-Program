import type { EducationPathway, Submission } from "@/lib/types";
import { ApiError } from "@/lib/api";
export interface SubmissionFilters {
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
export function matchesSubmissionFilters(
  s: Submission,
  f: SubmissionFilters,
): boolean {
  const top = s.report?.topRecommendation;
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
    (s.answers.educationPathway ?? "unrecorded") !== f.educationPathway
  )
    return false;
  return true;
}
