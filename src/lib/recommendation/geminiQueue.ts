import { getAdminDb } from "@/lib/firebase/admin";
import { enhanceRecommendationReportWithGemini } from "@/lib/recommendation/narrative";
import type { NarrativeStatus, Submission } from "@/lib/types";

const JOB_COLLECTION = "geminiNarrativeJobs";
const SUBMISSION_COLLECTION = "submissions";
const RATE_LIMITER_DOC = "system/geminiRateLimiter";

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
    lockMs: boundedNumber(process.env.GEMINI_QUEUE_LOCK_MS, 120_000, 10_000, 10 * 60_000)
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
  const lockedJobs: GeminiNarrativeJob[] = [];

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

async function processRateLimitedGeminiJob(job: GeminiNarrativeJob) {
  await waitForGeminiSlot();
  return processLockedGeminiJob(job);
}

async function requeueExpiredProcessingJobs() {
  const now = Date.now();
  const snapshot = await getAdminDb().collection(JOB_COLLECTION).where("status", "==", "processing").limit(20).get();
  const batch = getAdminDb().batch();
  let count = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data() as GeminiNarrativeJob;
    const lockedUntil = Date.parse(data.lockedUntil ?? "");
    if (!Number.isFinite(lockedUntil) || lockedUntil > now) continue;
    batch.set(
      doc.ref,
      {
        status: "queued",
        updatedAt: new Date().toISOString(),
        availableAt: new Date().toISOString(),
        lastError: "Worker lock expired before completion."
      },
      { merge: true }
    );
    count += 1;
  }

  if (count > 0) await batch.commit();
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

async function processLockedGeminiJob(job: GeminiNarrativeJob): Promise<GeminiQueueResult> {
  const db = getAdminDb();
  const jobRef = db.collection(JOB_COLLECTION).doc(job.id);
  const submissionRef = db.collection(SUBMISSION_COLLECTION).doc(job.submissionId);
  const now = new Date().toISOString();

  try {
    const snapshot = await submissionRef.get();
    if (!snapshot.exists) {
      await jobRef.set(
        {
          status: "failed",
          updatedAt: now,
          lastError: "Submission for Gemini job was not found."
        },
        { merge: true }
      );
      return {
        jobId: job.id,
        status: "failed",
        attempts: job.attempts,
        message: "Submission for Gemini job was not found."
      };
    }

    await submissionRef.set(
      {
        narrativeStatus: "processing",
        narrativeUpdatedAt: now
      },
      { merge: true }
    );

    const submission = { id: snapshot.id, ...snapshot.data() } as Submission;
    const enhancedReport = await enhanceRecommendationReportWithGemini(submission.answers, submission.report);
    const completedAt = new Date().toISOString();

    await submissionRef.set(
      {
        report: enhancedReport,
        narrativeStatus: "completed",
        narrativeUpdatedAt: completedAt,
        narrativeError: ""
      },
      { merge: true }
    );
    await jobRef.set(
      {
        status: "completed",
        completedAt,
        updatedAt: completedAt,
        lastError: ""
      },
      { merge: true }
    );

    return {
      jobId: job.id,
      status: "completed",
      attempts: job.attempts
    };
  } catch (error) {
    return handleGeminiJobFailure(job, sanitizeJobError(error));
  }
}

async function handleGeminiJobFailure(job: GeminiNarrativeJob, message: string): Promise<GeminiQueueResult> {
  const db = getAdminDb();
  const config = getGeminiQueueConfig();
  const jobRef = db.collection(JOB_COLLECTION).doc(job.id);
  const submissionRef = db.collection(SUBMISSION_COLLECTION).doc(job.submissionId);
  const now = new Date().toISOString();

  if (job.attempts >= config.maxAttempts) {
    await submissionRef.set(
      {
        narrativeStatus: "failed",
        narrativeUpdatedAt: now,
        narrativeError: message
      },
      { merge: true }
    );
    await jobRef.set(
      {
        status: "failed",
        updatedAt: now,
        lastError: message
      },
      { merge: true }
    );

    return {
      jobId: job.id,
      status: "failed",
      attempts: job.attempts,
      message
    };
  }

  const availableAt = nextRetryAvailableAt(job.attempts);
  await submissionRef.set(
    {
      narrativeStatus: "pending",
      narrativeUpdatedAt: now,
      narrativeError: message
    },
    { merge: true }
  );
  await jobRef.set(
    {
      status: "queued",
      availableAt,
      updatedAt: now,
      lastError: message
    },
    { merge: true }
  );

  return {
    jobId: job.id,
    status: "queued",
    attempts: job.attempts,
    message
  };
}

function boundedNumber(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function sanitizeJobError(error: unknown) {
  const message = error instanceof Error ? error.message : "Gemini narrative job failed.";
  return message.replace(/\s+/g, " ").slice(0, 360);
}
