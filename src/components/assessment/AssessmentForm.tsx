"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AssessmentReview } from "./AssessmentReview";
import { getAssessmentSteps, assessmentSections } from "@/lib/assessment/steps";
import {
  emptyAnswer,
  validateAssessmentStep,
  assessmentProgress,
} from "@/lib/assessment/formState";
import { educationPathwayOptions } from "@/lib/assessment/pathways";
import { genderOptions } from "@/lib/assessment/options";
import { assessmentMultiSelectLimits } from "@/lib/validation";
import type { StudentAnswer } from "@/lib/types";

export function AssessmentForm() {
  const router = useRouter();
  const { user, loading, configured, getToken } = useAuth();
  const [answer, setAnswer] = useState<StudentAnswer>(() =>
    emptyAnswer(user?.email ?? ""),
  );
  const [index, setIndex] = useState(0),
    [error, setError] = useState(""),
    [status, setStatus] = useState<"checking" | "ready" | "error">("checking"),
    [retry, setRetry] = useState(0);
  const [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [editing, setEditing] = useState(false);
  const editSnapshot = useRef<StudentAnswer | null>(null);
  const submitting = useRef(false),
    heading = useRef<HTMLHeadingElement>(null),
    errorRef = useRef<HTMLDivElement>(null);
  const steps = useMemo(
    () => getAssessmentSteps(answer.educationPathway),
    [answer.educationPathway],
  );
  const step = steps[index];
  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/assessment");
  }, [loading, user, router]);
  useEffect(() => {
    if (user?.email) setAnswer((a) => ({ ...a, email: user.email ?? "" }));
  }, [user?.email]);
  useEffect(() => {
    if (!user) return;
    let active = true;
    setStatus("checking");
    (async () => {
      try {
        const token = await getToken();
        const response = await fetch("/api/submissions/status", {
          headers: { authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error ?? "Gagal memeriksa status.");
        if (!active) return;
        if (data.status === "completed") {
          router.replace("/already-submitted");
          return;
        }
        if (data.status === "processing") {
          router.replace("/result");
          return;
        }
        setError("");
        setStatus("ready");
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "Gagal memeriksa status.");
          setStatus("error");
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [user, getToken, router, retry]);
  useEffect(() => {
    heading.current?.focus();
  }, [index, status]);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  function update(
    key: keyof StudentAnswer,
    value: StudentAnswer[keyof StudentAnswer],
  ) {
    setAnswer((a) => ({ ...a, [key]: value }));
    setError("");
  }
  function toggle(key: keyof StudentAnswer, value: string) {
    const current = answer[key];
    if (!Array.isArray(current)) return;
    const limit =
      key === "favoriteSubjects"
        ? assessmentMultiSelectLimits.favoriteSubjects
        : key === "favoriteActivities"
          ? assessmentMultiSelectLimits.favoriteActivities
          : undefined;
    if (!current.includes(value) && limit && current.length >= limit) {
      setError(
        `Pilih maksimal ${limit} jawaban yang paling menggambarkan kamu.`,
      );
      return;
    }
    setAnswer((a) => ({
      ...a,
      [key]: current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
      ...(value === "Lainnya" && current.includes(value)
        ? key === "favoriteSubjects"
          ? { favoriteSubjectsOther: "" }
          : key === "collegePathPreferences"
            ? { collegePathPreferenceOther: "" }
            : {}
        : {}),
    }));
    setError("");
  }
  function next() {
    const invalid = validateAssessmentStep(step, answer);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError("");
    if (step.type === "review") {
      setConfirm(true);
      return;
    }
    if (editing) {
      editSnapshot.current = null;
      setEditing(false);
      setIndex(steps.length - 1);
    } else setIndex((i) => i + 1);
  }
  async function submit() {
    if (submitting.current) return;
    const invalid = validateAssessmentStep(steps[steps.length - 1], answer);
    if (invalid) {
      setError(invalid);
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const token = await getToken();
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(answer),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error ?? "Gagal menyimpan jawaban.");
      router.replace(data.created ? "/result" : "/already-submitted");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan jawaban.");
      submitting.current = false;
      setBusy(false);
    }
  }
  const choice = (
    value: string,
    label: string,
    selected: boolean,
    onClick: () => void,
    description?: string,
    multi = false,
  ) => (
    <button
      key={value}
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      className="choice-button"
      onClick={onClick}
    >
      <span>
        <span className="block font-semibold">{label}</span>
        {description ? (
          <span className="mt-1 block text-xs leading-6 text-stone-600">
            {description}
          </span>
        ) : null}
      </span>
      <span className="choice-marker" aria-hidden="true" />
    </button>
  );
  if (!configured)
    return (
      <StatusMessage tone="error">
        Layanan masuk belum dikonfigurasi. Hubungi pengelola sebelum mengisi
        asesmen.
      </StatusMessage>
    );
  if (loading || !user || status === "checking")
    return <StatusMessage>Memeriksa akun dan status asesmen…</StatusMessage>;
  if (status === "error")
    return (
      <Panel>
        <StatusMessage tone="error">{error}</StatusMessage>
        <Button className="mt-5" onClick={() => setRetry((v) => v + 1)}>
          Coba lagi
        </Button>
      </Panel>
    );
  const value =
    step.type === "profile" || step.type === "review"
      ? undefined
      : answer[step.key];
  return (
    <div className="wizard-layout">
      <aside>
        <div className="eyebrow">Asesmen dirimu</div>
        <ol className="wizard-steps">
          {Object.entries(assessmentSections).map(([key, label], i) => (
            <li
              key={key}
              aria-current={step.section === key ? "step" : undefined}
            >
              <b>{i + 1}</b>
              {label}
            </li>
          ))}
        </ol>
        <p className="wizard-aside-note mt-8 rounded-xl bg-orange-50 p-5 text-sm leading-7 text-stone-600">
          Tidak perlu sudah punya semua jawabannya. Mulai dari yang kamu tahu
          tentang dirimu.
        </p>
      </aside>
      <div className="min-w-0">
        <div className="mb-3 flex justify-between gap-3 text-xs text-stone-600">
          <span>{assessmentSections[step.section]}</span>
          <span>
            {index + 1} / {steps.length}
          </span>
        </div>
        <div
          className="mb-6 h-1.5 overflow-hidden rounded-full bg-stone-200"
          role="progressbar"
          aria-label="Kemajuan asesmen"
          aria-valuenow={assessmentProgress(index, steps.length)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-leaf"
            style={{ width: `${assessmentProgress(index, steps.length)}%` }}
          />
        </div>
        <Panel className="wizard-question">
          <form
            onKeyDown={(e) => {
              if (
                ![
                  "ArrowDown",
                  "ArrowRight",
                  "ArrowUp",
                  "ArrowLeft",
                  "Home",
                  "End",
                ].includes(e.key)
              )
                return;
              const target = e.target as HTMLElement;
              const group = target.closest('[role="radiogroup"]');
              if (!group || target.getAttribute("role") !== "radio") return;
              const radios = Array.from(
                group.querySelectorAll<HTMLButtonElement>('[role="radio"]'),
              );
              const current = radios.indexOf(target as HTMLButtonElement);
              const next =
                e.key === "Home"
                  ? 0
                  : e.key === "End"
                    ? radios.length - 1
                    : (current +
                        (["ArrowUp", "ArrowLeft"].includes(e.key) ? -1 : 1) +
                        radios.length) %
                      radios.length;
              e.preventDefault();
              radios[next]?.focus();
              radios[next]?.click();
            }}
            onSubmit={(e) => {
              e.preventDefault();
              next();
            }}
          >
            <p className="eyebrow">
              {step.type === "review"
                ? "Sebelum melangkah"
                : assessmentSections[step.section]}
            </p>
            <h1 ref={heading} tabIndex={-1}>
              {step.title}
            </h1>
            <p className="mb-6 text-sm leading-7 text-stone-600">
              {step.guidance ??
                (step.type === "multi"
                  ? "Pilih satu atau beberapa yang paling sesuai."
                  : step.type === "single"
                    ? "Pilih satu jawaban yang paling sesuai."
                    : "Isi sesuai data dirimu.")}
            </p>
            {error && !confirm ? (
              <div ref={errorRef} tabIndex={-1} className="mb-5">
                <StatusMessage tone="error">{error}</StatusMessage>
              </div>
            ) : null}
            {step.type === "text" || step.type === "email" ? (
              <Input
                aria-label={step.title}
                type={step.type === "email" ? "email" : "text"}
                value={String(value ?? "")}
                readOnly={step.type === "email"}
                onChange={(e) => update(step.key, e.target.value)}
                autoComplete={
                  step.key === "fullName"
                    ? "name"
                    : step.key === "email"
                      ? "email"
                      : "off"
                }
              />
            ) : null}
            {step.type === "textarea" ? (
              <Textarea
                aria-label={step.title}
                value={String(value ?? "")}
                maxLength={step.key === "futureVision" ? 480 : 240}
                onChange={(e) => update(step.key, e.target.value)}
              />
            ) : null}
            {step.type === "profile" ? (
              <div className="space-y-6">
                <div>
                  <div className="mb-3 text-sm font-semibold">Gender</div>
                  <div
                    role="radiogroup"
                    aria-label="Gender"
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    {genderOptions.map((g) =>
                      choice(g, g, answer.gender === g, () =>
                        update("gender", g),
                      ),
                    )}
                  </div>
                </div>
                <Field label="Umur">
                  <Input
                    aria-label="Umur"
                    inputMode="numeric"
                    maxLength={2}
                    value={answer.age}
                    onChange={(e) => update("age", e.target.value)}
                  />
                </Field>
              </div>
            ) : null}
            {step.type === "pathway" ? (
              <div
                role="radiogroup"
                aria-label={step.title}
                className="space-y-3"
              >
                {educationPathwayOptions.map((o) =>
                  choice(
                    o.value,
                    o.title,
                    answer.educationPathway === o.value,
                    () => update("educationPathway", o.value),
                    o.description,
                  ),
                )}
              </div>
            ) : null}
            {step.type === "single" || step.type === "multi" ? (
              <div
                role={step.type === "single" ? "radiogroup" : "group"}
                aria-label={step.title}
                className="grid gap-3 sm:grid-cols-2"
              >
                {step.options?.map((option) =>
                  choice(
                    option,
                    option,
                    Array.isArray(value)
                      ? value.includes(option)
                      : value === option,
                    () =>
                      step.type === "multi"
                        ? toggle(step.key, option)
                        : update(step.key, option),
                    undefined,
                    step.type === "multi",
                  ),
                )}
              </div>
            ) : null}
            {step.key === "favoriteSubjects" &&
            answer.favoriteSubjects.includes("Lainnya") ? (
              <div className="mt-5">
                <Field label="Mata pelajaran lainnya">
                  <Input
                    value={answer.favoriteSubjectsOther}
                    onChange={(e) =>
                      update("favoriteSubjectsOther", e.target.value)
                    }
                  />
                </Field>
              </div>
            ) : null}
            {step.key === "collegePathPreferences" &&
            answer.collegePathPreferences.includes("Lainnya") ? (
              <div className="mt-5">
                <Field label="Preferensi lainnya">
                  <Input
                    value={answer.collegePathPreferenceOther}
                    onChange={(e) =>
                      update("collegePathPreferenceOther", e.target.value)
                    }
                  />
                </Field>
              </div>
            ) : null}
            {step.type === "review" ? (
              <AssessmentReview
                answer={answer}
                onEdit={(key) => {
                  const target = steps.findIndex(
                    (s) =>
                      s.key === key ||
                      (key === "gender" && s.type === "profile"),
                  );
                  if (target >= 0) {
                    editSnapshot.current = structuredClone(answer);
                    setEditing(true);
                    setIndex(target);
                  }
                }}
              />
            ) : null}
            <div className="wizard-actions">
              <Button
                variant="secondary"
                disabled={(!editing && index === 0) || busy}
                onClick={() => {
                  setError("");
                  if (editing) {
                    if (editSnapshot.current) setAnswer(editSnapshot.current);
                    editSnapshot.current = null;
                    setEditing(false);
                    setIndex(steps.length - 1);
                  } else setIndex((i) => Math.max(0, i - 1));
                }}
              >
                <ArrowLeft size={16} /> {editing ? "Batal ubah" : "Kembali"}
              </Button>
              <Button type="submit" className="brand-cta" disabled={busy}>
                {step.type === "review"
                  ? "Kirim asesmen"
                  : editing
                    ? "Simpan perubahan"
                    : "Lanjutkan"}
                {step.type === "review" ? (
                  <Check size={16} />
                ) : (
                  <ArrowRight size={16} />
                )}
              </Button>
            </div>
          </form>
        </Panel>
        <p className="mt-4 text-xs leading-6 text-stone-600">
          Jawaban tersimpan selama halaman ini terbuka. Jangan tutup atau muat
          ulang sebelum mengirim.
        </p>
      </div>
      <ConfirmDialog
        open={confirm}
        title="Kirim jawabanmu?"
        confirmLabel="Ya, kirim jawaban"
        busy={busy}
        onClose={() => {
          setConfirm(false);
          setError("");
        }}
        onConfirm={submit}
      >
        <p>
          Satu email Google hanya dapat mengirim satu asesmen. Pastikan jawaban
          sudah menggambarkan dirimu.
        </p>
        {error ? (
          <div className="mt-4">
            <StatusMessage tone="error">{error}</StatusMessage>
          </div>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}
