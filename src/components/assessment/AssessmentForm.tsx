"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  collegePathPreferenceOptions,
  favoriteActivityOptions,
  favoriteSubjectOptions,
  genderOptions,
  personalConstraintOptions,
  problemAreaOptions,
  schoolMajorOptions,
  skillStrengthOptions,
  techComfortOptions,
  workStyleOptions
} from "@/lib/assessment/options";
import type { Gender, SchoolMajor, StudentAnswer, TechComfort, WorkStyle } from "@/lib/types";
import { cn } from "@/lib/utils";
import { studentAnswerSchema } from "@/lib/validation";

type Step =
  | { key: keyof StudentAnswer; title: string; type: "text"; placeholder?: string }
  | { key: keyof StudentAnswer; title: string; type: "email" }
  | { key: "profileDetails"; title: string; type: "profile" }
  | { key: keyof StudentAnswer; title: string; type: "textarea"; placeholder?: string }
  | { key: keyof StudentAnswer; title: string; type: "single"; options: readonly string[] }
  | { key: keyof StudentAnswer; title: string; type: "multi"; options: readonly string[] };

const steps: Step[] = [
  { key: "fullName", title: "Nama lengkap", type: "text", placeholder: "Nama sesuai data sekolah" },
  { key: "email", title: "Email Google verified", type: "email" },
  { key: "profileDetails", title: "Profil tambahan", type: "profile" },
  { key: "school", title: "Asal sekolah", type: "text", placeholder: "Contoh: SMAN 1 Bandung" },
  { key: "className", title: "Kelas", type: "text", placeholder: "Contoh: XI IPA 2" },
  { key: "currentSchoolMajor", title: "Jurusan sekolah saat ini", type: "single", options: schoolMajorOptions },
  { key: "favoriteSubjects", title: "Mata pelajaran yang paling disukai", type: "multi", options: favoriteSubjectOptions },
  { key: "favoriteActivities", title: "Aktivitas yang paling disukai", type: "multi", options: favoriteActivityOptions },
  { key: "skillStrengths", title: "Skill atau kekuatan utama", type: "multi", options: skillStrengthOptions },
  { key: "workStyle", title: "Gaya kerja yang paling cocok", type: "single", options: workStyleOptions },
  { key: "problemAreas", title: "Tipe masalah yang ingin kamu bantu selesaikan", type: "multi", options: problemAreaOptions },
  { key: "collegePathPreferences", title: "Preferensi jalur kuliah", type: "multi", options: collegePathPreferenceOptions },
  { key: "personalConstraints", title: "Batasan atau pertimbangan pribadi", type: "multi", options: personalConstraintOptions },
  { key: "techComfort", title: "Seberapa nyaman kamu dengan teknologi dan AI?", type: "single", options: techComfortOptions },
  {
    key: "dreamProfession",
    title: "Profesi impian atau bidang yang kamu penasaran",
    type: "textarea",
    placeholder: "Contoh: data analyst, dokter, desainer, pengusaha, guru..."
  },
  {
    key: "futureVision",
    title: "Ceritakan singkat: kamu ingin masa depan seperti apa?",
    type: "textarea",
    placeholder: "Tulis 2-4 kalimat singkat."
  }
];

function emptyAnswer(email = ""): StudentAnswer {
  return {
    fullName: "",
    email,
    gender: "",
    age: "",
    school: "",
    className: "",
    currentSchoolMajor: "IPA",
    favoriteSubjects: [],
    favoriteSubjectsOther: "",
    favoriteActivities: [],
    skillStrengths: [],
    workStyle: "Banyak bertemu orang",
    problemAreas: [],
    collegePathPreferences: [],
    collegePathPreferenceOther: "",
    personalConstraints: [],
    techComfort: "Biasa saja",
    dreamProfession: "",
    futureVision: ""
  };
}

function isEmptyValue(value: StudentAnswer[keyof StudentAnswer]) {
  if (Array.isArray(value)) return value.length === 0;
  return String(value ?? "").trim().length === 0;
}

function stepGuidance(step: Step) {
  if (step.type === "multi") return "Boleh pilih lebih dari satu jawaban. Pilih minimal 1 yang paling menggambarkan kamu.";
  if (step.type === "single") return "Pilih 1 jawaban yang paling sesuai.";
  if (step.type === "email") return "Email otomatis dari akun Google yang sedang login dan tidak bisa diubah manual.";
  if (step.type === "profile") return "Pilih gender dan isi umur. Data ini hanya untuk analytics admin, tidak mempengaruhi rekomendasi.";
  if (step.type === "textarea") return "Opsional. Tulis singkat saja kalau kamu sudah punya gambaran.";
  return "Isi sesuai data kamu. Pertanyaan ini wajib diisi.";
}

export function AssessmentForm() {
  const router = useRouter();
  const { user, loading, configured, getToken } = useAuth();
  const [answer, setAnswer] = useState<StudentAnswer>(() => emptyAnswer(user?.email ?? ""));
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState("");
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const step = steps[stepIndex];
  const progress = useMemo(() => Math.round(((stepIndex + 1) / steps.length) * 100), [stepIndex]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=/assessment");
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (user?.email) {
      setAnswer((current) => ({ ...current, email: user.email ?? "" }));
    }
  }, [user?.email]);

  useEffect(() => {
    async function checkStatus() {
      if (!user) return;
      setCheckingStatus(true);
      try {
        const token = await getToken();
        const response = await fetch("/api/submissions/status", {
          headers: { authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.status === "completed") router.replace("/already-submitted");
        if (data.status === "processing") setError("Submission kamu sedang diproses. Coba buka halaman hasil sebentar lagi.");
      } catch (statusError) {
        setError(statusError instanceof Error ? statusError.message : "Gagal memeriksa status submission.");
      } finally {
        setCheckingStatus(false);
      }
    }

    if (user) void checkStatus();
  }, [getToken, router, user]);

  function updateValue(key: keyof StudentAnswer, value: StudentAnswer[keyof StudentAnswer]) {
    setAnswer((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function toggleArrayValue(key: keyof StudentAnswer, value: string) {
    const current = answer[key];
    if (!Array.isArray(current)) return;
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    setAnswer((currentAnswer) => ({
      ...currentAnswer,
      [key]: next,
      ...(key === "favoriteSubjects" && value === "Lainnya" && current.includes(value) ? { favoriteSubjectsOther: "" } : {}),
      ...(key === "collegePathPreferences" && value === "Lainnya" && current.includes(value) ? { collegePathPreferenceOther: "" } : {})
    }));
    setError("");
  }

  function validateCurrentStep() {
    if (step.type === "profile") {
      const age = Number(answer.age);
      if (!answer.gender) {
        setError("Gender wajib dipilih.");
        return false;
      }
      if (!/^\d{1,2}$/.test(answer.age.trim()) || age < 10 || age > 30) {
        setError("Umur wajib diisi dengan angka yang realistis.");
        return false;
      }
      setError("");
      return true;
    }
    const value = answer[step.key];
    if (step.type !== "textarea" && isEmptyValue(value)) {
      setError(`${step.title} wajib diisi.`);
      return false;
    }
    if (step.key === "favoriteSubjects" && answer.favoriteSubjects.includes("Lainnya") && !answer.favoriteSubjectsOther.trim()) {
      setError("Isi mata pelajaran lainnya.");
      return false;
    }
    if (
      step.key === "collegePathPreferences" &&
      answer.collegePathPreferences.includes("Lainnya") &&
      !answer.collegePathPreferenceOther.trim()
    ) {
      setError("Isi preferensi jalur kuliah lainnya.");
      return false;
    }
    setError("");
    return true;
  }

  function goNext() {
    if (!validateCurrentStep()) return;
    if (stepIndex === steps.length - 1) {
      const parsed = studentAnswerSchema.safeParse(answer);
      if (!parsed.success) {
        setError(parsed.error.errors[0]?.message ?? "Periksa kembali jawaban kamu.");
        return;
      }
      setShowConfirm(true);
      return;
    }
    setStepIndex((current) => current + 1);
  }

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const token = await getToken();
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json"
        },
        body: JSON.stringify(answer)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Gagal menyimpan submission.");
      }
      router.replace(data.created ? "/result" : "/already-submitted");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Gagal menyimpan submission.");
    } finally {
      setSubmitting(false);
      setShowConfirm(false);
    }
  }

  if (!configured) {
    return (
      <div className="rounded-md border border-coral/30 bg-coral/10 p-5 text-sm text-ink">
        Firebase belum dikonfigurasi. Isi `.env.local` agar login Google dan submission aktif.
      </div>
    );
  }

  if (loading || checkingStatus || !user) {
    return <div className="rounded-md border border-black/10 bg-white p-6 text-sm text-ink/70">Memuat...</div>;
  }

  if (user.emailVerified === false) {
    return (
      <div className="rounded-md border border-coral/30 bg-coral/10 p-5 text-sm text-ink">
        Email Google kamu belum terverifikasi.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <Badge tone="blue">Pertanyaan {stepIndex + 1} dari {steps.length}</Badge>
          <h1 className="mt-3 text-2xl font-bold text-ink">{step.title}</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink/65">{stepGuidance(step)}</p>
        </div>
        <span className="text-sm font-semibold text-ink/60">{progress}%</span>
      </div>

      <div className="mb-6 h-2 rounded-full bg-black/10">
        <div className="h-2 rounded-full bg-leaf transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="rounded-md border border-black/10 bg-white p-5 shadow-soft sm:p-7">
        {renderField(step, answer, updateValue, toggleArrayValue)}
        {error ? (
          <div className="mt-5 flex items-start gap-2 rounded-md bg-coral/10 p-3 text-sm text-coral">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button variant="secondary" onClick={() => setStepIndex((current) => Math.max(0, current - 1))} disabled={stepIndex === 0}>
          <ChevronLeft className="h-4 w-4" />
          Kembali
        </Button>
        <Button onClick={goNext}>
          {stepIndex === steps.length - 1 ? <Send className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {stepIndex === steps.length - 1 ? "Submit" : "Lanjut"}
        </Button>
      </div>

      {showConfirm ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-md bg-white p-6 shadow-soft">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-leaf/10 text-leaf">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-ink">Konfirmasi Submit</h2>
            </div>
            <p className="text-sm leading-6 text-ink/75">
              Kamu hanya bisa submit 1 kali dengan email ini. Pastikan jawabanmu sudah benar.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowConfirm(false)} disabled={isSubmitting}>
                Periksa Lagi
              </Button>
              <Button onClick={submit} disabled={isSubmitting}>
                <Send className="h-4 w-4" />
                {isSubmitting ? "Menyimpan..." : "Ya, Submit"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function renderField(
  step: Step,
  answer: StudentAnswer,
  updateValue: (key: keyof StudentAnswer, value: StudentAnswer[keyof StudentAnswer]) => void,
  toggleArrayValue: (key: keyof StudentAnswer, value: string) => void
) {
  const value = step.type === "profile" ? "" : answer[step.key];

  if (step.type === "email") {
    return (
      <Field label={step.title}>
        <Input value={String(value)} readOnly aria-readonly />
      </Field>
    );
  }

  if (step.type === "profile") {
    return (
      <div className="space-y-5">
        <div>
          <div className="mb-3 text-sm font-semibold text-ink">Gender</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {genderOptions.map((option) => {
              const selected = answer.gender === option;
              return (
                <button
                  key={option}
                  type="button"
                  className={cn(
                    "flex min-h-12 items-center justify-between rounded-md border px-4 py-3 text-left text-sm font-semibold transition",
                    selected ? "border-leaf bg-leaf/10 text-leaf" : "border-black/10 bg-white text-ink hover:bg-skysoft/35"
                  )}
                  onClick={() => updateValue("gender", option as Gender)}
                >
                  {option}
                  {selected ? <CheckCircle2 className="h-4 w-4" /> : null}
                </button>
              );
            })}
          </div>
        </div>
        <Field label="Umur">
          <Input
            inputMode="numeric"
            value={answer.age}
            placeholder="Contoh: 16"
            onChange={(event) => updateValue("age", event.target.value.replace(/[^\d]/g, "").slice(0, 2))}
          />
        </Field>
      </div>
    );
  }

  if (step.type === "text") {
    return (
      <Field label={step.title}>
        <Input
          value={String(value)}
          placeholder={step.placeholder}
          onChange={(event) => updateValue(step.key, event.target.value)}
        />
      </Field>
    );
  }

  if (step.type === "textarea") {
    return (
      <Field label={step.title}>
        <Textarea
          value={String(value)}
          placeholder={step.placeholder}
          onChange={(event) => updateValue(step.key, event.target.value)}
        />
      </Field>
    );
  }

  if (step.type === "single") {
    return (
      <div className="space-y-3">
        {step.options.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              className={cn(
                "flex min-h-12 w-full items-center justify-between rounded-md border px-4 py-3 text-left text-sm font-semibold transition",
                selected ? "border-leaf bg-leaf/10 text-leaf" : "border-black/10 bg-white text-ink hover:bg-skysoft/35"
              )}
              onClick={() => {
                if (step.key === "currentSchoolMajor") updateValue(step.key, option as SchoolMajor);
                if (step.key === "workStyle") updateValue(step.key, option as WorkStyle);
                if (step.key === "techComfort") updateValue(step.key, option as TechComfort);
              }}
            >
              {option}
              {selected ? <CheckCircle2 className="h-4 w-4" /> : null}
            </button>
          );
        })}
      </div>
    );
  }

  const showSubjectOther = step.key === "favoriteSubjects" && answer.favoriteSubjects.includes("Lainnya");
  const showCollegeOther = step.key === "collegePathPreferences" && answer.collegePathPreferences.includes("Lainnya");

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {step.options.map((option) => {
          const selected = Array.isArray(value) && value.includes(option);
          return (
            <button
              key={option}
              type="button"
              className={cn(
                "flex min-h-12 items-center justify-between rounded-md border px-4 py-3 text-left text-sm font-semibold transition",
                selected ? "border-leaf bg-leaf/10 text-leaf" : "border-black/10 bg-white text-ink hover:bg-skysoft/35"
              )}
              onClick={() => toggleArrayValue(step.key, option)}
            >
              {option}
              {selected ? <CheckCircle2 className="h-4 w-4" /> : null}
            </button>
          );
        })}
      </div>
      {showSubjectOther ? (
        <Field label="Tulis mata pelajaran lainnya">
          <Input
            value={answer.favoriteSubjectsOther}
            placeholder="Contoh: Geografi, Informatika, Agama, Bahasa Jepang"
            onChange={(event) => updateValue("favoriteSubjectsOther", event.target.value)}
          />
        </Field>
      ) : null}
      {showCollegeOther ? (
        <Field label="Tulis preferensi jalur kuliah lainnya">
          <Input
            value={answer.collegePathPreferenceOther}
            placeholder="Contoh: sekolah kedinasan, kuliah sambil kerja, luar negeri"
            onChange={(event) => updateValue("collegePathPreferenceOther", event.target.value)}
          />
        </Field>
      ) : null}
    </div>
  );
}
