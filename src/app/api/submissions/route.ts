import { ApiError, jsonError, readJsonBody } from "@/lib/api";
import { verifyFirebaseRequest } from "@/lib/firebase/admin";
import { createOrGetSubmission } from "@/lib/submissions/store";
import { normalizeEmail } from "@/lib/utils";
import { studentAnswerSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const decoded = await verifyFirebaseRequest(request);
    const payload = await readJsonBody(request, 24_000);
    const validation = studentAnswerSchema.safeParse(payload);
    if (!validation.success)
      throw new ApiError(
        validation.error.issues[0]?.message ?? "Jawaban tidak valid.",
        400,
      );
    const parsed = validation.data;
    const tokenEmail = normalizeEmail(decoded.email!);

    if (normalizeEmail(parsed.email) !== tokenEmail) {
      return Response.json(
        { error: "Email jawaban harus sama dengan email Google yang login." },
        { status: 403 },
      );
    }

    const result = await createOrGetSubmission({
      ...parsed,
      email: tokenEmail,
    });
    return Response.json({
      created: result.created,
      status: result.submission.status,
      submission: result.submission,
    });
  } catch (error) {
    return jsonError(error);
  }
}
