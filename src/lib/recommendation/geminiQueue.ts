import { getAdminDb } from "@/lib/firebase/admin";
import { enhanceRecommendationReportWithGemini } from "@/lib/recommendation/narrative";
import type { NarrativeStatus, Submission } from "@/lib/types";
import { getGeminiRequestConfig } from "@/lib/recommendation/geminiResponse";
import { isDeepStrictEqual } from "node:util";

const JOB_COLLECTION = "geminiNarrativeJobs";
const SUBMISSION_COLLECTION = "submissions";
const RATE_LIMITER_DOC = "system/geminiRateLimiter";
const MAX_SLOT_WAIT_MS = 10_000;

type GeminiJobStatus = "queued" | "processing" | "completed" | "failed";

export interface GeminiNarrativeJob {
  id: string;
  submissionId: string;
  email: string;
  status: GeminiJobStatus;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  availableAt: string;
  lockedUntil?: string;
  completedAt?: string;
  lastError?: string;
}

// In-memory snapshot only; persisted job documents keep their existing schema.
type ProcessingGeminiJob = GeminiNarrativeJob & {
  assessmentSnapshot?: FirebaseFirestore.DocumentSnapshot;
};

export interface GeminiQueueResult {
  jobId: string;
  status: GeminiJobStatus | "skipped";
  attempts: number;
  message?: string;
}

export function isGeminiQueueEnabled() {
  return process.env.ENABLE_GEMINI_ENHANCEMENT === "true" && process.env.GEMINI_QUEUE_ENABLED !== "false";
}

export function initialNarrativeStatus(): NarrativeStatus {
  return isGeminiQueueEnabled() ? "pending" : "skipped";
}

export function getGeminiQueueConfig() {
  return {
    batchSize: boundedNumber(process.env.GEMINI_QUEUE_BATCH_SIZE, 10, 1, 20),
    delayMs: boundedNumber(process.env.GEMINI_QUEUE_DELAY_MS, 500, 0, 10_000),
    maxAttempts: boundedNumber(process.env.GEMINI_QUEUE_MAX_ATTEMPTS, 3, 1, 8),
    lockMs: boundedNumber(process.env.GEMINI_QUEUE_LOCK_MS, 120_000,
      getGeminiRequestConfig().timeoutMs + MAX_SLOT_WAIT_MS + 5_000, 10 * 60_000)
  };
}

export function isGeminiWorkerAuthorized(request: Request) {
  const secret = process.env.GEMINI_WORKER_SECRET;
  if (!secret) return false;
  const authHeader = request.headers.get("authorization") ?? "";
  const [scheme, token] = authHeader.split(" ");
  return scheme === "Bearer" && token === secret;
}

export function nextRetryAvailableAt(attempts: number, now = Date.now()) {
  const delayMs = Math.min(60_000, Math.max(1, attempts) * 15_000);
  return new Date(now + delayMs).toISOString();
}

export async function enqueueGeminiNarrativeJob(submission: Submission) {
  if (!isGeminiQueueEnabled()) return false;

  const now = new Date().toISOString();
  const job: GeminiNarrativeJob = {
    id: submission.id,
    submissionId: submission.id,
    email: submission.email,
    status: "queued",
    attempts: 0,
    createdAt: now,
    updatedAt: now,
    availableAt: now
  };

  await getAdminDb().collection(JOB_COLLECTION).doc(submission.id).set(job);
  return true;
}

export async function drainGeminiNarrativeJobs() {
  if (!isGeminiQueueEnabled()) {
    return {
      processed: 0,
      results: [] as GeminiQueueResult[],
      message: "Gemini queue is disabled."
    };
  }

  await requeueExpiredProcessingJobs();

  const config = getGeminiQueueConfig();
  const snapshot = await getAdminDb().collection(JOB_COLLECTION).where("status", "==", "queued").limit(config.batchSize * 4).get();
  const lockedJobs: ProcessingGeminiJob[] = [];

  for (const doc of snapshot.docs) {
    if (lockedJobs.length >= config.batchSize) break;
    const lockedJob = await lockQueuedJob(doc.id);
    if (!lockedJob) continue;
    lockedJobs.push(lockedJob);
  }

  const results = await Promise.all(lockedJobs.map(processRateLimitedGeminiJob));

  return {
    processed: results.length,
    results
  };
}

async function processRateLimitedGeminiJob(job: ProcessingGeminiJob) {
  try {
    await waitForGeminiSlot();
  } catch (error) {
    return handleGeminiJobFailure(job, sanitizeJobError(error));
  }
  return processLockedGeminiJob(job);
}

async function requeueExpiredProcessingJobs() {
  const now = Date.now();
  const { maxAttempts } = getGeminiQueueConfig();
  const snapshot = await getAdminDb().collection(JOB_COLLECTION).where("status", "==", "processing").limit(20).get();

  for (const doc of snapshot.docs) {
    const data = doc.data() as GeminiNarrativeJob;
    const lockedUntil = Date.parse(data.lockedUntil ?? "");
    if (!Number.isFinite(lockedUntil) || lockedUntil > now) continue;
    const exhausted = data.attempts >= maxAttempts;
    const lastError = exhausted
      ? "Gemini retry limit reached after worker lock expired."
      : "Worker lock expired before completion.";
    await writeOwnedTransition({ ...data, id: doc.id },
      {
        status: exhausted ? "failed" : "queued",
        updatedAt: new Date().toISOString(),
        availableAt: new Date().toISOString(),
        lastError
      },
      exhausted ? { narrativeStatus: "failed", narrativeUpdatedAt: new Date(now).toISOString(), narrativeError: lastError } : undefined,
    );
  }
}

async function lockQueuedJob(jobId: string) {
  const db = getAdminDb();
  const ref = db.collection(JOB_COLLECTION).doc(jobId);
  const config = getGeminiQueueConfig();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) return null;

    const data = { id: snapshot.id, ...snapshot.data() } as GeminiNarrativeJob;
    if (data.status !== "queued") return null;

    const availableAt = Date.parse(data.availableAt ?? data.createdAt);
    if (Number.isFinite(availableAt) && availableAt > now) return null;

    const submissionRef = db.collection(SUBMISSION_COLLECTION).doc(data.submissionId);
    const assessmentSnapshot = await transaction.get(submissionRef);
    const problem = assessmentProblem(data, assessmentSnapshot);
    if (problem || (data.attempts ?? 0) >= config.maxAttempts) {
      const message = problem ?? "Gemini retry limit reached before another attempt.";
      transaction.set(ref, { status: "failed", updatedAt: nowIso, lastError: message }, { merge: true });
      if (!problem) transaction.set(submissionRef, {
        narrativeStatus: "failed", narrativeUpdatedAt: nowIso, narrativeError: message,
      }, { merge: true });
      return null;
    }

    const attempts = (data.attempts ?? 0) + 1;
    const lockedUntil = new Date(now + config.lockMs).toISOString();
    transaction.set(
      ref,
      {
        status: "processing",
        attempts,
        lockedUntil,
        updatedAt: nowIso
      },
      { merge: true }
    );

    return {
      ...data,
      assessmentSnapshot,
      status: "processing" as const,
      attempts,
      lockedUntil,
      updatedAt: nowIso
    };
  });
}

async function waitForGeminiSlot() {
  const db = getAdminDb();
  const ref = db.doc(RATE_LIMITER_DOC);
  const delayMs = getGeminiQueueConfig().delayMs;
  const now = Date.now();

  const waitMs = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const nextAllowedAtMillis = Number(snapshot.data()?.nextAllowedAtMillis ?? 0);
    const scheduledAt = Math.max(now, Number.isFinite(nextAllowedAtMillis) ? nextAllowedAtMillis : 0);
    if (scheduledAt - now > MAX_SLOT_WAIT_MS)
      throw new Error("Gemini rate-limit slot wait exceeds the bounded wait; retry later.");
    transaction.set(
      ref,
      {
        nextAllowedAtMillis: scheduledAt + delayMs,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
    return Math.max(0, scheduledAt - now);
  });

  if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
}

async function processLockedGeminiJob(job: ProcessingGeminiJob): Promise<GeminiQueueResult> {
  const db = getAdminDb();
  const submissionRef = db.collection(SUBMISSION_COLLECTION).doc(job.submissionId);
  const now = new Date().toISOString();

  try {
    const snapshot = await submissionRef.get();
    if (!snapshot.exists) {
      const written = await writeOwnedTransition(job,
        {
          status: "failed",
          updatedAt: now,
          lastError: "Submission for Gemini job was not found."
        }
      );
      if (!written) return staleJobResult(job);
      return {
        jobId: job.id,
        status: "failed",
        attempts: job.attempts,
        message: "Submission for Gemini job was not found."
      };
    }

    const started = await writeOwnedTransition(job, {},
      {
        narrativeStatus: "processing",
        narrativeUpdatedAt: now,
        narrativeError: ""
      }
    );
    if (!started) return staleJobResult(job);

    const submission = { id: snapshot.id, ...snapshot.data() } as Submission;
    const enhancedReport = await enhanceRecommendationReportWithGemini(submission.answers, submission.report);
    const completedAt = new Date().toISOString();

    const completed = await writeOwnedTransition(job,
      {
        status: "completed",
        completedAt,
        updatedAt: completedAt,
        lastError: ""
      },
      {
        report: enhancedReport,
        narrativeStatus: "completed",
        narrativeUpdatedAt: completedAt,
        narrativeError: ""
      }
    );
    if (!completed) return staleJobResult(job);

    return {
      jobId: job.id,
      status: "completed",
      attempts: job.attempts
    };
  } catch (error) {
    return handleGeminiJobFailure(job, sanitizeJobError(error));
  }
}

async function handleGeminiJobFailure(job: ProcessingGeminiJob, message: string): Promise<GeminiQueueResult> {
  const config = getGeminiQueueConfig();
  const now = new Date().toISOString();
  const exhausted = job.attempts >= config.maxAttempts;
  const status = exhausted ? "failed" : "queued";
  const written = await writeOwnedTransition(job,
    {
      status,
      ...(exhausted ? {} : { availableAt: nextRetryAvailableAt(job.attempts) }),
      updatedAt: now,
      lastError: message
    },
    {
      narrativeStatus: exhausted ? "failed" : "pending",
      narrativeUpdatedAt: now,
      narrativeError: message
    }
  );
  if (!written) return staleJobResult(job);
  return {
    jobId: job.id,
    status,
    attempts: job.attempts,
    message
  };
}

function staleJobResult(job: GeminiNarrativeJob): GeminiQueueResult {
  return { jobId: job.id, status: "skipped", attempts: job.attempts, message: "Gemini job or assessment changed; stale result ignored." };
}

function assessmentProblem(job: ProcessingGeminiJob, snapshot: FirebaseFirestore.DocumentSnapshot) {
  if (!snapshot.exists) return "Submission for Gemini job was not found.";
  const submission = snapshot.data() as Submission;
  const createdAt = Date.parse(submission.createdAt);
  const queuedAt = Date.parse(job.createdAt);
  // Existing persisted timestamps reject old orphan jobs targeting a newer attempt.
  if (!Number.isFinite(createdAt) || !Number.isFinite(queuedAt) || createdAt > queuedAt)
    return "Submission assessment changed; Gemini job no longer applies.";
  const expected = job.assessmentSnapshot;
  if (expected) {
    const version = (value: Submission) => ({
      createdAt: value.createdAt, updatedAt: value.updatedAt, answers: value.answers, report: value.report,
    });
    if ((expected.createTime && !snapshot.createTime?.isEqual(expected.createTime)) ||
      !isDeepStrictEqual(version(submission), version(expected.data() as Submission)))
      return "Submission assessment changed; Gemini result no longer applies.";
  }
  return undefined;
}

// Commit the report/status together and only for the attempt that still owns the job.
async function writeOwnedTransition(
  job: ProcessingGeminiJob,
  jobPatch: Partial<GeminiNarrativeJob>,
  submissionPatch?: Partial<Submission>,
) {
  const db = getAdminDb();
  const jobRef = db.collection(JOB_COLLECTION).doc(job.id);
  return db.runTransaction(async transaction => {
    const snapshot = await transaction.get(jobRef);
    const current = snapshot.data() as GeminiNarrativeJob | undefined;
    if (!current || current.status !== "processing" || current.attempts !== job.attempts ||
        current.lockedUntil !== job.lockedUntil || current.createdAt !== job.createdAt) return false;
    const submissionRef = db.collection(SUBMISSION_COLLECTION).doc(job.submissionId);
    const assessmentSnapshot = await transaction.get(submissionRef);
    const problem = assessmentProblem(job, assessmentSnapshot);
    if (problem) {
      transaction.set(jobRef, { status: "failed", updatedAt: new Date().toISOString(), lastError: problem }, { merge: true });
      return false;
    }
    if (Object.keys(jobPatch).length) transaction.set(jobRef, jobPatch, { merge: true });
    if (submissionPatch) transaction.set(
      submissionRef, submissionPatch, { merge: true },
    );
    return true;
  });
}

function boundedNumber(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = value?.trim() ? Number(value) : NaN;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function sanitizeJobError(error: unknown) {
  const message = error instanceof Error ? error.message : "Gemini narrative job failed.";
  return message.replace(/\s+/g, " ").slice(0, 360);
}
