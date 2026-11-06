import {
  matchesSubmissionFilters,
  type SubmissionFilters,
} from "@/lib/submissions/filters";
export type { SubmissionFilters } from "@/lib/submissions/filters";
import type { Submission, StudentAnswer } from "@/lib/types";
import { getAdminDb } from "@/lib/firebase/admin";
import { generateRecommendations } from "@/lib/recommendation";
import { buildHeuristicNarrativeReport } from "@/lib/recommendation/narrative";
import {
  enqueueGeminiNarrativeJob,
  initialNarrativeStatus,
  isGeminiQueueEnabled,
} from "@/lib/recommendation/geminiQueue";
import { normalizeEmail } from "@/lib/utils";
import {
  ADMIN_SUMMARY_FIELDS,
  summarizeAdminPage,
  type AdminSummarySource,
} from "@/lib/admin/submissions";

const COLLECTION = "submissions";

export function submissionIdForEmail(email: string) {
  return Buffer.from(normalizeEmail(email)).toString("base64url");
}

function collection() {
  return getAdminDb().collection(COLLECTION);
}

function snapshotToSubmission(
  snapshot: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>,
) {
  if (!snapshot.exists) return null;
  return { id: snapshot.id, ...snapshot.data() } as Submission;
}

export async function getSubmissionByEmail(email: string) {
  const snapshot = await collection().doc(submissionIdForEmail(email)).get();
  return snapshotToSubmission(snapshot);
}

export async function getSubmissionById(id: string) {
  return snapshotToSubmission(await collection().doc(id).get());
}

export async function deleteSubmissionByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const ref = collection().doc(submissionIdForEmail(normalizedEmail));
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    return {
      deleted: false,
      email: normalizedEmail,
      id: ref.id,
    };
  }

  await ref.delete();
  return {
    deleted: true,
    email: normalizedEmail,
    id: ref.id,
  };
}

export async function createOrGetSubmission(answer: StudentAnswer) {
  const normalizedEmail = normalizeEmail(answer.email);
  const normalizedAnswer: StudentAnswer = { ...answer, email: normalizedEmail };
  const ref = collection().doc(submissionIdForEmail(normalizedEmail));

  const transactionResult = await getAdminDb().runTransaction(
    async (transaction) => {
      const existing = await transaction.get(ref);
      if (existing.exists) {
        return {
          submission: snapshotToSubmission(existing) as Submission,
          created: false,
        };
      }

      const now = new Date().toISOString();
      const report = await buildHeuristicNarrativeReport(
        normalizedAnswer,
        generateRecommendations(normalizedAnswer),
      );
      const submission: Submission = {
        id: ref.id,
        email: normalizedEmail,
        fullName: normalizedAnswer.fullName,
        school: normalizedAnswer.school,
        className: normalizedAnswer.className,
        status: "completed",
        narrativeStatus: initialNarrativeStatus(),
        narrativeUpdatedAt: now,
        answers: normalizedAnswer,
        report,
        createdAt: now,
        updatedAt: now,
      };

      transaction.create(ref, submission);
      return { submission, created: true };
    },
  );

  if (!transactionResult.created) {
    return transactionResult;
  }

  if (!isGeminiQueueEnabled()) {
    return transactionResult;
  }

  try {
    await enqueueGeminiNarrativeJob(transactionResult.submission);
    return transactionResult;
  } catch (error) {
    const updatedAt = new Date().toISOString();
    const narrativeError =
      error instanceof Error
        ? error.message.slice(0, 360)
        : "Gagal membuat queue Gemini.";
    const updatedSubmission: Submission = {
      ...transactionResult.submission,
      narrativeStatus: "failed",
      narrativeUpdatedAt: updatedAt,
      narrativeError,
      updatedAt,
    };
    await ref.set(
      {
        narrativeStatus: "failed",
        narrativeUpdatedAt: updatedAt,
        narrativeError,
        updatedAt,
      },
      { merge: true },
    );
    return { submission: updatedSubmission, created: true };
  }
}

export async function listSubmissions(filters: SubmissionFilters = {}) {
  const matches: Submission[] = [];
  for await (const doc of scanSubmissions(false)) {
    const submission = { ...doc.data(), id: doc.id } as Submission;
    if (matchesSubmissionFilters(submission, filters)) matches.push(submission);
  }
  return matches;
}

// A cursor snapshot includes the implicit document-ID tie breaker for equal timestamps.
// No hard cap: each read has a bounded payload, and summary pages retain at most 100 rows.
async function* scanSubmissions(projected: boolean) {
  let query: FirebaseFirestore.Query = collection().orderBy(
    "createdAt",
    "desc",
  );
  if (projected) query = query.select(...ADMIN_SUMMARY_FIELDS);
  query = query.limit(200);
  let cursor: FirebaseFirestore.QueryDocumentSnapshot | undefined;
  while (true) {
    const snapshot = await (cursor ? query.startAfter(cursor) : query).get();
    for (const doc of snapshot.docs) yield doc;
    if (snapshot.docs.length < 200) break;
    cursor = snapshot.docs[snapshot.docs.length - 1];
  }
}

export async function listAdminSubmissionPage(
  filters: SubmissionFilters = {},
  page = 1,
) {
  async function* sources() {
    for await (const doc of scanSubmissions(true))
      yield { ...doc.data(), id: doc.id } as AdminSummarySource;
  }
  return summarizeAdminPage(sources(), filters, page);
}
