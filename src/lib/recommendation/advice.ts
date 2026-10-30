import type { StudentAnswer } from "@/lib/types";
import { unique } from "@/lib/utils";

export function generatePtnPtsVokasiAdvice(answer: StudentAnswer) {
  const advice: string[] = [];
  const preferences = answer.collegePathPreferences;
  const constraints = answer.personalConstraints;
  if (answer.educationPathway === "university") advice.push("Untuk jalur S1, bandingkan kedalaman bidang ilmu, proyek, kurikulum, dan peluang riset maupun magang.");
  if (answer.educationPathway === "vocational") advice.push("Untuk jalur D3 / D4, bandingkan fasilitas praktik, proyek terapan, magang, dan kemitraan industri.");
  if (answer.educationPathway === "exploring") advice.push("Bandingkan S1 dengan D3 / D4 dari kurikulum, cara belajar, biaya, serta tujuan karier; keduanya dapat menjadi pilihan yang baik.");

  if (preferences.includes("PTN di Jawa")) {
    advice.push("PTN di Jawa bisa menjadi pilihan kuat jika jurusan yang dipilih benar-benar sesuai dan biaya masih realistis.");
  }
  if (preferences.includes("PTN luar Jawa")) {
    advice.push(
      "PTN luar Jawa layak dipertimbangkan jika jurusannya sangat cocok, tetapi pastikan kamu siap dengan biaya hidup, adaptasi, dan jarak dari keluarga."
    );
  }
  if (preferences.includes("PTS bagus di kota besar")) {
    advice.push(
      "PTS berkualitas di kota besar bisa menjadi pilihan cerdas jika memiliki jurusan yang cocok, koneksi industri, dan peluang magang yang baik."
    );
  }
  if (preferences.includes("Kuliah dekat rumah")) {
    advice.push(
      "Kuliah dekat rumah dapat membantu mengurangi biaya hidup dan menjaga support system, selama kualitas jurusan tetap diperhatikan."
    );
  }
  if (preferences.includes("Diploma/vokasi") && answer.educationPathway !== "university") {
    advice.push("Jalur vokasi cocok jika kamu ingin pembelajaran yang lebih praktis dan dekat dengan kebutuhan industri.");
  }
  if (preferences.includes("Sertifikasi/bootcamp")) {
    advice.push(
      "Sertifikasi atau bootcamp bisa menjadi pelengkap, terutama untuk bidang teknologi, digital marketing, desain, dan skill praktis lainnya."
    );
  }
  if (constraints.includes("Biaya")) {
    advice.push("Karena biaya menjadi pertimbangan, bandingkan UKT, biaya hidup, beasiswa, dan peluang kerja setelah lulus.");
  }
  if (constraints.includes("Ingin cepat kerja")) {
    advice.push("Jika ingin cepat kerja, prioritaskan jurusan yang punya skill praktis, magang, portofolio, dan sertifikasi pendukung.");
  }
  if (preferences.includes("PTN luar Jawa") && constraints.includes("Lokasi jauh")) {
    advice.push(
      "Karena kamu juga mempertimbangkan lokasi jauh, diskusikan kesiapan tinggal jauh dari keluarga dan hitung biaya hidup bulanan secara realistis."
    );
  }

  if (advice.length === 0) {
    advice.push(
      "Bandingkan PTN, PTS, vokasi, dan sertifikasi dari sisi biaya, lokasi, akreditasi, peluang magang, fasilitas, dan kecocokan kurikulum."
    );
  }

  return unique(advice);
}
