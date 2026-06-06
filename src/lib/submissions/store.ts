import type { Submission, StudentAnswer } from "@/lib/types";
import { getAdminDb } from "@/lib/firebase/admin";
import { generateRecommendations } from "@/lib/recommendation";
import { enhanceRecommendationReport } from "@/lib/recommendation/narrative";
import { normalizeEmail } from "@/lib/utils";

const COLLECTION = "submissions";

export function submissionIdForEmail(email: string) {
  return Buffer.from(normalizeEmail(email)).toString("base64url");
}

function collection() {
  return getAdminDb().collection(COLLECTION);
}

function snapshotToSubmission(
  snapshot: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
) {
  if (!snapshot.exists) return null;
  return { id: snapshot.id, ...snapshot.data() } as Submission;
}

export async function getSubmissionByEmail(email: string) {
  const snapshot = await collection().doc(submissionIdForEmail(email)).get();
  return snapshotToSubmission(snapshot);
}

export async function deleteSubmissionByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const ref = collection().doc(submissionIdForEmail(normalizedEmail));
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    return {
      deleted: false,
      email: normalizedEmail,
      id: ref.id
    };
  }

  await ref.delete();
  return {
    deleted: true,
    email: normalizedEmail,
    id: ref.id
  };
}

export async function createOrGetSubmission(answer: StudentAnswer) {
  const normalizedEmail = normalizeEmail(answer.email);
  const normalizedAnswer: StudentAnswer = { ...answer, email: normalizedEmail };
  const ref = collection().doc(submissionIdForEmail(normalizedEmail));

  const transactionResult = await getAdminDb().runTransaction(async (transaction) => {
    const existing = await transaction.get(ref);
    if (existing.exists) {
      return {
        submission: snapshotToSubmission(existing) as Submission,
        created: false
      };
    }

    const now = new Date().toISOString();
    const report = generateRecommendations(normalizedAnswer);
    const submission: Submission = {
      id: ref.id,
      email: normalizedEmail,
      fullName: normalizedAnswer.fullName,
      school: normalizedAnswer.school,
      className: normalizedAnswer.className,
      status: "completed",
      answers: normalizedAnswer,
      report,
      createdAt: now,
      updatedAt: now
    };

    transaction.create(ref, submission);
    return { submission, created: true };
  });

  if (!transactionResult.created) {
    return transactionResult;
  }

  const enhancedReport = await enhanceRecommendationReport(normalizedAnswer, transactionResult.submission.report);
  const updatedSubmission: Submission = {
    ...transactionResult.submission,
    report: enhancedReport,
    updatedAt: new Date().toISOString()
  };

  await ref.set(updatedSubmission, { merge: true });
  return { submission: updatedSubmission, created: true };
}

export interface SubmissionFilters {
  school?: string;
  className?: string;
  topRecommendation?: string;
  cluster?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function listSubmissions(filters: SubmissionFilters = {}) {
  const snapshot = await collection().orderBy("createdAt", "desc").limit(500).get();
  let submissions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Submission);

  submissions = submissions.filter((submission) => {
    const top = submission.report?.topRecommendation;
    if (filters.school && !submission.school.toLowerCase().includes(filters.school.toLowerCase())) return false;
    if (filters.className && !submission.className.toLowerCase().includes(filters.className.toLowerCase())) return false;
    if (
      filters.topRecommendation &&
      top?.majorName.toLowerCase() !== filters.topRecommendation.toLowerCase()
    ) {
      return false;
    }
    if (filters.cluster && top?.cluster.toLowerCase() !== filters.cluster.toLowerCase()) return false;
    if (filters.status && submission.status !== filters.status) return false;
    if (filters.dateFrom && submission.createdAt < filters.dateFrom) return false;
    if (filters.dateTo && submission.createdAt > `${filters.dateTo}T23:59:59.999Z`) return false;
    return true;
  });

  return submissions;
}
