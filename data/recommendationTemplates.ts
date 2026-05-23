import type { RecommendationTemplates } from "./types";

export const recommendationTemplates: RecommendationTemplates = {
  topRecommendationTemplate:
    "Berdasarkan minat kamu pada {interests} dan kekuatan kamu di {skills}, jurusan {majorName} cocok karena bidang ini membutuhkan {matchedSkills}. Di era AI, bidang ini memiliki ketahanan {aiResilienceLabel} karena {aiReason}. Namun, kamu tetap perlu memperkuat {skillGaps}.",
  alternativeRecommendationTemplate:
    "Pilihan #{rank}, {majorName}, juga relevan karena cocok dengan {matchedInterests} dan membuka arah karier seperti {careerDirections}.",
  aiResilienceTemplate:
    "Skor AI Future Resilience {score}/100 berarti bidang ini {label}. Skor tinggi bukan berarti tanpa dampak AI; artinya pekerjaan lebih tahan karena membutuhkan judgement, kreativitas, interaksi manusia, praktik nyata, atau kemampuan memakai AI sebagai alat bantu.",
  skillGapTemplate:
    "Agar lebih siap, kamu bisa memperkuat {skillGaps} melalui proyek kecil, kursus dasar, organisasi, magang, atau sertifikasi.",
  ptnPtsVokasiAdviceTemplate:
    "Untuk jalur kampus, bandingkan PTN, PTS, vokasi, dan sertifikasi dari sisi biaya, lokasi, akreditasi, magang, fasilitas, dan kecocokan kurikulum.",
  uncertainStudentTemplate:
    "Kalau kamu masih belum yakin minat, pilih jurusan yang cukup fleksibel dan coba mini project 2 minggu sebelum menentukan pilihan final.",
  costSensitiveTemplate:
    "Karena biaya menjadi pertimbangan, cari beasiswa, PTN/PTS dengan biaya realistis, serta alternatif serumpun yang tetap dekat dengan tujuan kariermu.",
  fastEmploymentTemplate:
    "Jika ingin cepat kerja, prioritaskan portofolio, magang, sertifikasi, dan jalur D3/D4/vokasi atau program yang punya praktik industri kuat."
};
