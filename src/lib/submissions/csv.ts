import type {Submission} from "@/lib/types";
import {csvEscape} from "@/lib/api";
export function serializeSubmissionsCsv(submissions:readonly Submission[]):string{
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
      "topAspirationReflection",
      "topCareerPathwayAdvice",
      "cluster",
      "fitScore",
      "aiFutureResilienceScore",
      "fitLabel",
      "aiFutureResilienceLabel",
      "top10RecommendationsJson",
      "scoringVersion",
      "educationPathway",
      "topDegreeTypes"
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
        top.aspirationReflection ?? "",
        (top.careerPathwayAdvice ?? []).join("; "),
        top.cluster,
        top.overallFitScore,
        top.aiFutureResilienceScore,
        top.fitLabel,
        top.aiFutureResilienceLabel,
        JSON.stringify(submission.report.recommendations),
        submission.report.scoringVersion,
        submission.answers.educationPathway ?? "",
        (top.degreeTypes ?? []).join("; ")
      ].map(csvEscape);
    });

    const csv = [headers.map(csvEscape), ...rows].map((row) => row.join(",")).join("\n");

    return csv;
}
