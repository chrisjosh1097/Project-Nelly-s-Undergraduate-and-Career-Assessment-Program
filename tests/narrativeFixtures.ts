import type { RecommendationReport, StudentAnswer } from "@/lib/types";

export const technicalAspirationAnswer: StudentAnswer = {
  fullName: "Synthetic Student", email: "synthetic@example.test",
  gender: "Pria", age: "17", school: "Synthetic School", className: "XII",
  educationPathway: "vocational", currentSchoolMajor: "IPA",
  favoriteSubjects: ["Matematika", "Fisika"], favoriteSubjectsOther: "",
  favoriteActivities: ["Menulis/berbicara", "Eksperimen/lab", "Kerja lapangan"],
  skillStrengths: ["Leadership", "Logika", "Public speaking", "Kerja praktik"],
  workStyle: "Banyak bertemu orang", problemAreas: ["Teknologi"],
  collegePathPreferences: ["Belum tahu"], collegePathPreferenceOther: "",
  personalConstraints: [], techComfort: "Biasa saja",
  dreamProfession: "Menjadi engineer di luar negeri, terutama Jepang.",
  futureVision: "Bekerja pada bidang maritim atau pertambangan.",
};

export function completeGeminiNarrative(report: RecommendationReport) {
  return {
    summary: "Berdasarkan jawaban yang kamu isi, eksplorasi proyek teknik dapat membantu menilai pilihanmu.",
    studentStrengths: ["Minat matematika dan fisika.", "Ketertarikan pada praktik lapangan.", "Latihan komunikasi dan kepemimpinan."],
    recommendationReasons: Object.fromEntries(report.recommendations.map(r => [r.majorId, ["Bandingkan kecocokan kurikulumnya.", "Uji minat melalui proyek kecil."]])),
    careerPersonalizations: Object.fromEntries(report.recommendations.map(r => [r.majorId, {
      personalizedCareerDirection: "Eksplorasi bidang sesuai kurikulum dan pengalaman praktik.",
      nicheCareerPaths: ["Pendukung proyek", "Asisten operasional", "Dokumentasi teknis"],
      reason: "Periksa kecocokan keterampilan melalui latihan.",
      aspirationReflection: "Ambisi engineering di Jepang perlu dieksplorasi sesuai bidang studi.",
      pathwayAdvice: ["Bandingkan kurikulum.", "Coba proyek sederhana.", "Diskusikan hasil dengan mentor."],
      cautions: ["Periksa persyaratan resmi untuk peran yang dituju."],
    }])),
  };
}
