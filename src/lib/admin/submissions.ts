import type {
  Submission,
  StudentAnswer,
  RecommendationResult,
} from "@/lib/types";
import { educationPathwayLabel } from "@/lib/assessment/pathways";
import {
  matchesSubmissionFilters,
  type SubmissionFilters,
} from "@/lib/submissions/filters";

type SummaryTop = Pick<
  RecommendationResult,
  "majorName" | "cluster" | "overallFitScore" | "aiFutureResilienceScore"
>;
export interface AdminSubmissionSummary extends Pick<
  Submission,
  | "id"
  | "email"
  | "fullName"
  | "school"
  | "className"
  | "status"
  | "narrativeStatus"
  | "createdAt"
> {
  educationPathway?: StudentAnswer["educationPathway"];
  topRecommendation?: SummaryTop;
}
export interface AdminSummaryAnalytics {
  total: number;
  schools: number;
  fit: number;
  ai: number;
  charts: { title: string; rows: { label: string; count: number }[] }[];
}
export interface AdminSubmissionPage {
  pageSize: 50;
  page: number;
  total: number;
  totalPages: number;
  submissions: AdminSubmissionSummary[];
  analytics: AdminSummaryAnalytics;
}
/** Fields read from a projected Firestore document; this is deliberately not a full Submission. */
export interface AdminSummarySource extends Pick<
  Submission,
  | "id"
  | "email"
  | "fullName"
  | "school"
  | "className"
  | "status"
  | "narrativeStatus"
  | "createdAt"
> {
  answers?: Partial<
    Pick<
      StudentAnswer,
      | "educationPathway"
      | "gender"
      | "age"
      | "personalConstraints"
      | "favoriteActivities"
      | "skillStrengths"
    >
  >;
  report?: { topRecommendation?: SummaryTop };
}
export const ADMIN_SUMMARY_FIELDS = [
  "email",
  "fullName",
  "school",
  "className",
  "status",
  "narrativeStatus",
  "createdAt",
  "answers.educationPathway",
  "answers.gender",
  "answers.age",
  "answers.personalConstraints",
  "answers.favoriteActivities",
  "answers.skillStrengths",
  "report.topRecommendation.majorName",
  "report.topRecommendation.cluster",
  "report.topRecommendation.overallFitScore",
  "report.topRecommendation.aiFutureResilienceScore",
] as const;

export async function summarizeAdminPage(
  sources: AsyncIterable<AdminSummarySource>,
  filters: SubmissionFilters,
  requestedPage: number,
): Promise<AdminSubmissionPage> {
  let total = 0,
    fit = 0,
    ai = 0,
    scored = 0;
  const schools = new Set<string>();
  const chartTitles = [
    "Arah pendidikan",
    "Gender",
    "Umur",
    "Top 10 rekomendasi",
    "Top 10 cluster",
    "Pertimbangan umum",
    "Aktivitas umum",
    "Skill umum",
  ];
  const charts = chartTitles.map(() => new Map<string, number>());
  const requested: AdminSubmissionSummary[] = [];
  let lastPage: AdminSubmissionSummary[] = [];
  for await (const source of sources) {
    if (!matchesSubmissionFilters(source, filters)) continue;
    const {
      id,
      email,
      fullName,
      school,
      className,
      status,
      narrativeStatus,
      createdAt,
    } = source;
    const top = source.report?.topRecommendation;
    const summary: AdminSubmissionSummary = {
      id,
      email,
      fullName,
      school,
      className,
      status,
      narrativeStatus,
      createdAt,
      educationPathway: source.answers?.educationPathway,
      topRecommendation: top,
    };
    if (Math.floor(total / 50) + 1 === requestedPage) requested.push(summary);
    if (total % 50 === 0) lastPage = [];
    lastPage.push(summary);
    total++;
    if (school) schools.add(school);
    if (top) {
      scored++;
      fit += top.overallFitScore;
      ai += top.aiFutureResilienceScore;
    }
    const values = [
      [educationPathwayLabel(source.answers?.educationPathway)],
      [source.answers?.gender || "Belum tercatat"],
      [source.answers?.age || "Belum tercatat"],
      [top?.majorName],
      [top?.cluster],
      source.answers?.personalConstraints ?? [],
      source.answers?.favoriteActivities ?? [],
      source.answers?.skillStrengths ?? [],
    ];
    values.forEach((items, index) =>
      items.forEach((value) => {
        if (value)
          charts[index].set(value, (charts[index].get(value) ?? 0) + 1);
      }),
    );
  }
  const totalPages = Math.max(1, Math.ceil(total / 50));
  return {
    pageSize: 50,
    page: Math.min(requestedPage, totalPages),
    total,
    totalPages,
    submissions: requestedPage > totalPages ? lastPage : requested,
    analytics: {
      total,
      schools: schools.size,
      fit: scored ? Math.round(fit / scored) : 0,
      ai: scored ? Math.round(ai / scored) : 0,
      charts: charts.map((counts, i) => ({
        title: chartTitles[i],
        rows: [...counts]
          .map(([label, count]) => ({ label, count }))
          .sort(
            (a, b) =>
              b.count - a.count || a.label.localeCompare(b.label, "id-ID"),
          )
          .slice(0, 10),
      })),
    },
  };
}
