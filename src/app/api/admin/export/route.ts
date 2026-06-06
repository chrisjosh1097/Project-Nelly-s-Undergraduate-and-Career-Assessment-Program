import { csvEscape, jsonError } from "@/lib/api";
import { verifyManualAdminRequest } from "@/lib/admin/session";
import { listSubmissions } from "@/lib/submissions/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    verifyManualAdminRequest(request);
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
      "gender",
      "age",
      "schoolMajor",
      "favoriteSubjects",
      "favoriteSubjectsOther",
      "favoriteActivities",
      "skillStrengths",
      "workStyle",
      "problemAreas",
      "collegePathPreferences",
      "collegePathPreferenceOther",
      "personalConstraints",
      "techComfort",
      "dreamProfession",
      "futureVision",
      "topRecommendation",
      "topCareerDirection",
      "topPersonalizedCareerDirection",
      "topNicheCareerPaths",
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
        submission.answers.gender ?? "",
        submission.answers.age ?? "",
        submission.answers.currentSchoolMajor,
        submission.answers.favoriteSubjects.join("; "),
        submission.answers.favoriteSubjectsOther ?? "",
        submission.answers.favoriteActivities.join("; "),
        submission.answers.skillStrengths.join("; "),
        submission.answers.workStyle,
        submission.answers.problemAreas.join("; "),
        submission.answers.collegePathPreferences.join("; "),
        submission.answers.collegePathPreferenceOther ?? "",
        submission.answers.personalConstraints.join("; "),
        submission.answers.techComfort,
        submission.answers.dreamProfession,
        submission.answers.futureVision,
        top.majorName,
        top.careerDirection,
        top.personalizedCareerDirection ?? "",
        (top.nicheCareerPaths ?? top.relatedCareers.slice(0, 3)).join("; "),
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
