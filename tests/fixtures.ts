import type { StudentAnswer, Submission } from "@/lib/types";
import { generateRecommendations } from "@/lib/recommendation";
import { submissionIdForEmail } from "@/lib/submissions/store";

export const techAnswer: StudentAnswer = {
  fullName: "Nelly Siswa",
  email: "nelly@example.com",
  school: "SMAN 1 Contoh",
  className: "XI IPA 2",
  currentSchoolMajor: "IPA",
  favoriteSubjects: ["Matematika", "Komputer/TIK", "Fisika"],
  favoriteActivities: ["Coding/teknologi", "Menghitung/analisis data"],
  skillStrengths: ["Logika", "Problem solving", "Teknologi", "Numerik/hitung-hitungan"],
  workStyle: "Banyak analisis sendiri",
  problemAreas: ["Teknologi", "Bisnis"],
  collegePathPreferences: ["PTN di Jawa", "Sertifikasi/bootcamp"],
  personalConstraints: ["Ingin cepat kerja"],
  techComfort: "Sangat nyaman",
  dreamProfession: "Data analyst atau software engineer",
  futureVision: "Saya ingin bekerja di bidang teknologi dan membantu bisnis mengambil keputusan."
};

export function buildSubmission(answer: StudentAnswer = techAnswer): Submission {
  const report = generateRecommendations(answer);
  return {
    id: submissionIdForEmail(answer.email),
    email: answer.email,
    fullName: answer.fullName,
    school: answer.school,
    className: answer.className,
    status: "completed",
    answers: answer,
    report,
    createdAt: "2026-05-23T08:00:00.000Z",
    updatedAt: "2026-05-23T08:00:00.000Z"
  };
}
