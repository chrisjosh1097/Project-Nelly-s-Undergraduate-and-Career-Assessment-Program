import { usesRankedProblemAreas } from "./options";

/** "1. A 2. B" for ranked (v3.2.0) answers; comma list for legacy labels. */
export function formatProblemAreas(values: readonly string[], separator = ", ") {
  if (!usesRankedProblemAreas(values)) return values.join(separator);
  return values.map((value, index) => `${index + 1}. ${value}`).join(" ");
}
