import type { StudentAnswer } from "@/lib/types";
import { getAssessmentSteps, assessmentSections } from "@/lib/assessment/steps";
import { educationPathwayLabel } from "@/lib/assessment/pathways";
import { assessmentReviewWarnings } from "@/lib/assessment/formState";
import { Button } from "@/components/ui/Button";
import { StatusMessage } from "@/components/ui/StatusMessage";
export function AssessmentReview({
  answer,
  onEdit,
}: {
  answer: StudentAnswer;
  onEdit: (key: keyof StudentAnswer) => void;
}) {
  return (
    <div className="space-y-5">
      {assessmentReviewWarnings(answer).map((w) => (
        <StatusMessage key={w}>{w}</StatusMessage>
      ))}
      {Object.entries(assessmentSections)
        .filter(([key]) => key !== "review")
        .map(([section, label]) => (
          <section key={section}>
            <h2 className="eyebrow border-b border-stone-200 pb-3">{label}</h2>
            <dl>
              {getAssessmentSteps(answer.educationPathway)
                .filter((s) => s.section === section)
                .map((s) => {
                  const key =
                    s.key === "profileDetails"
                      ? "gender"
                      : (s.key as keyof StudentAnswer);
                  const value =
                    s.key === "profileDetails"
                      ? `${answer.gender}, ${answer.age} tahun`
                      : key === "educationPathway"
                        ? educationPathwayLabel(answer.educationPathway)
                        : answer[key];
                  return (
                    <div
                      key={s.key}
                      className="flex items-start justify-between gap-3 border-b border-stone-100 py-3"
                    >
                      <div className="min-w-0">
                        <dt className="text-xs text-stone-600">{s.title}</dt>
                        <dd className="mt-1 text-sm">
                          {Array.isArray(value)
                            ? value.join(", ")
                            : value || "Belum diisi"}
                          {key === "favoriteSubjects" &&
                          answer.favoriteSubjectsOther ? (
                            <p className="mt-1">
                              {answer.favoriteSubjectsOther}
                            </p>
                          ) : null}
                          {key === "collegePathPreferences" &&
                          answer.collegePathPreferenceOther ? (
                            <p className="mt-1">
                              {answer.collegePathPreferenceOther}
                            </p>
                          ) : null}
                        </dd>
                      </div>
                      {key !== "email" ? (
                        <Button
                          variant="ghost"
                          aria-label={`Ubah ${s.title}`}
                          onClick={() => onEdit(key)}
                        >
                          Ubah
                        </Button>
                      ) : null}
                    </div>
                  );
                })}
            </dl>
          </section>
        ))}
    </div>
  );
}
