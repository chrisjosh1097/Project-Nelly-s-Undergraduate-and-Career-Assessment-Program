/**
 * Aggregate-only offline replay of the current scorer (plan Task D).
 *
 * Usage: npx tsx scripts/replayAggregate.ts <local-private-answers.json>
 *
 * - Reads only an already-downloaded local JSON file: an array of { answers, storedTop10? }.
 * - Makes no network or Firestore calls and writes no files.
 * - Prints counts only: no names, emails, answers, IDs or per-student rows.
 */
import { readFileSync } from "node:fs";
import { generateRecommendations } from "../src/lib/recommendation";
import type { StudentAnswer } from "../src/lib/types";

type ReplayRecord = { answers: StudentAnswer; storedTop10?: string[] };

export type ReplaySummary = {
  total: number;
  errors: number;
  withTenResults: number;
  top10Changed: number;
  usedGuarantee: number;
  guaranteedMajors: number;
  relatedGuarantees: number;
  officialServiceNote: number;
};

const NOTE_PREFIX = "Cita-citamu menyebut jalur kedinasan";

export function replayAggregate(records: ReplayRecord[]): ReplaySummary {
  const summary: ReplaySummary = {
    total: records.length, errors: 0, withTenResults: 0, top10Changed: 0,
    usedGuarantee: 0, guaranteedMajors: 0, relatedGuarantees: 0, officialServiceNote: 0,
  };
  for (const record of records) {
    try {
      const report = generateRecommendations({ educationPathway: "exploring", ...record.answers });
      const ids = report.recommendations.map((r) => r.majorId);
      if (ids.length === 10) summary.withTenResults++;
      if (record.storedTop10 && ids.some((id) => !record.storedTop10!.includes(id))) summary.top10Changed++;
      const guaranteed = report.recommendations.filter((r) => r.aspirationMatch);
      if (guaranteed.length) summary.usedGuarantee++;
      summary.guaranteedMajors += guaranteed.length;
      summary.relatedGuarantees += guaranteed.filter((r) => r.aspirationMatchKind === "related").length;
      if (report.answerPatternNotes?.some((note) => note.startsWith(NOTE_PREFIX))) summary.officialServiceNote++;
    } catch {
      summary.errors++;
    }
  }
  return summary;
}

const input = process.argv[2];
if (input && /replayAggregate\.ts$/.test(process.argv[1] ?? "")) {
  const parsed = JSON.parse(readFileSync(input, "utf8")) as ReplayRecord[] | Record<string, ReplayRecord>;
  console.log(JSON.stringify(replayAggregate(Array.isArray(parsed) ? parsed : Object.values(parsed)), null, 2));
}
