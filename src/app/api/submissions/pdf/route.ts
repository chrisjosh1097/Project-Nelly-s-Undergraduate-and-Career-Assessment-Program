import { jsonError } from "@/lib/api";
import { verifyFirebaseRequest } from "@/lib/firebase/admin";
import { generateSubmissionPdf } from "@/lib/pdf/report";
import { getSubmissionByEmail } from "@/lib/submissions/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const decoded = await verifyFirebaseRequest(request);
    const submission = await getSubmissionByEmail(decoded.email!);
    if (!submission) {
      return Response.json({ error: "Submission belum ditemukan." }, { status: 404 });
    }

    const pdf = await generateSubmissionPdf(submission);
    return new Response(Buffer.from(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="laporan-${submission.id}.pdf"`
      }
    });
  } catch (error) {
    return jsonError(error);
  }
}
