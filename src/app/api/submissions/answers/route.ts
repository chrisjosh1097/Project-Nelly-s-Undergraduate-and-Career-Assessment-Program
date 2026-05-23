import { jsonError } from "@/lib/api";
import { verifyFirebaseRequest } from "@/lib/firebase/admin";
import { getSubmissionByEmail } from "@/lib/submissions/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const decoded = await verifyFirebaseRequest(request);
    const submission = await getSubmissionByEmail(decoded.email!);
    if (!submission) {
      return Response.json({ error: "Submission belum ditemukan." }, { status: 404 });
    }

    return new Response(JSON.stringify(submission.answers, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="jawaban-${submission.id}.json"`
      }
    });
  } catch (error) {
    return jsonError(error);
  }
}
