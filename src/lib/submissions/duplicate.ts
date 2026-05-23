import type { Submission } from "@/lib/types";

export type ExistingSubmissionState =
  | { action: "create" }
  | { action: "return-existing"; submission: Submission }
  | { action: "processing"; submission: Submission };

export function decideSubmissionAction(existing: Submission | null): ExistingSubmissionState {
  if (!existing) return { action: "create" };
  if (existing.status === "processing") return { action: "processing", submission: existing };
  return { action: "return-existing", submission: existing };
}
