import { csvEscape, jsonError } from "@/lib/api";
import { verifyAdminRequest } from "@/lib/firebase/admin";
import { listSubmissions } from "@/lib/submissions/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await verifyAdminRequest(request);
    const url = new URL(request.url);
    const submissions = await listSubmissions({
      school: url.searchParams.get("school") ?? undefined,
      className: url.searchParams.get("className") ?? undefined,
      topRecommendation: url.searchParams.get("topRecommendation") ?? undefined,
      cluster: url.searchParams.get("cluster") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      dateFrom: url.searchParams.get("dateFrom") ?? undefined,
      dateTo: url.searchParams.get("dateTo") ?? undefined
    });

    const headers = [
      "createdAt",
      "updatedAt",
      "status",
      "fullName",
      "email",
      "school",
      "className",
      "schoolMajor",
      "favoriteSubjects",
      "favoriteActivities",
      "skillStrengths",
      "workStyle",
      "problemAreas",
      "collegePathPreferences",
      "personalConstraints",
      "techComfort",
      "dreamProfession",
      "futureVision",
      "topRecommendation",
      "topCareerDirection",
      "cluster",
      "fitScore",
      "aiFutureResilienceScore",
      "fitLabel",
      "aiFutureResilienceLabel",
      "top10RecommendationsJson",
      "scoringVersion"
    ];
    const rows = submissions.map((submission) => {
      const top = submission.report.topRecommendation;
      return [
        submission.createdAt,
        submission.updatedAt,
        submission.status,
        submission.fullName,
        submission.email,
        submission.school,
        submission.className,
        submission.answers.currentSchoolMajor,
        submission.answers.favoriteSubjects.join("; "),
        submission.answers.favoriteActivities.join("; "),
        submission.answers.skillStrengths.join("; "),
        submission.answers.workStyle,
        submission.answers.problemAreas.join("; "),
        submission.answers.collegePathPreferences.join("; "),
        submission.answers.personalConstraints.join("; "),
        submission.answers.techComfort,
        submission.answers.dreamProfession,
        submission.answers.futureVision,
        top.majorName,
        top.careerDirection,
        top.cluster,
        top.overallFitScore,
        top.aiFutureResilienceScore,
        top.fitLabel,
        top.aiFutureResilienceLabel,
        JSON.stringify(submission.report.recommendations),
        submission.report.scoringVersion
      ].map(csvEscape);
    });

    const csv = [headers.map(csvEscape), ...rows].map((row) => row.join(",")).join("\n");
    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=\"project-nelly-submissions.csv\""
      }
    });
  } catch (error) {
    return jsonError(error);
  }
}
