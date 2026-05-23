import type { KnowledgeDimension } from "./types";

export const skills: KnowledgeDimension[] = [
  { id: "communication", label: "Komunikasi", description: "Menyampaikan informasi dengan jelas dan mendengarkan orang lain." },
  { id: "creativity", label: "Kreativitas", description: "Menciptakan ide, konsep, pendekatan, atau karya baru." },
  { id: "logic", label: "Logika", description: "Berpikir runtut, melihat pola, dan menyusun alasan." },
  { id: "empathy", label: "Empati", description: "Memahami kondisi, perasaan, dan kebutuhan orang lain." },
  { id: "leadership", label: "Leadership", description: "Mengarahkan tim, mengambil inisiatif, dan menjaga tujuan bersama." },
  { id: "detail_orientation", label: "Ketelitian", description: "Memeriksa detail, mengurangi kesalahan, dan menjaga kualitas." },
  { id: "problem_solving", label: "Problem solving", description: "Menganalisis masalah dan menemukan solusi yang realistis." },
  { id: "public_speaking", label: "Public speaking", description: "Berbicara di depan orang dengan percaya diri dan terstruktur." },
  { id: "numeracy", label: "Numerik", description: "Nyaman memakai angka, hitungan, statistik, atau logika kuantitatif." },
  { id: "foreign_language", label: "Bahasa asing", description: "Mempelajari dan menggunakan bahasa selain bahasa Indonesia." },
  { id: "technology", label: "Teknologi", description: "Memakai alat digital, aplikasi, sistem, dan teknologi baru." },
  { id: "practical_work", label: "Kerja praktik", description: "Belajar lewat praktik langsung, alat, prosedur, dan eksperimen." },
  { id: "writing", label: "Menulis", description: "Menyusun ide, laporan, cerita, kampanye, atau argumen tertulis." },
  { id: "visual_design", label: "Desain visual", description: "Membuat tampilan, komposisi, warna, ilustrasi, atau antarmuka." },
  { id: "research", label: "Riset", description: "Mengumpulkan data, membaca referensi, dan menarik kesimpulan." },
  { id: "negotiation", label: "Negosiasi", description: "Mencapai kesepakatan dengan memahami kepentingan berbagai pihak." },
  { id: "teamwork", label: "Kerja tim", description: "Bekerja sama, berbagi peran, dan saling mendukung." },
  { id: "discipline", label: "Disiplin", description: "Konsisten menjalankan proses, latihan, standar, dan target." },
  { id: "critical_thinking", label: "Berpikir kritis", description: "Menguji informasi, melihat risiko, dan membuat penilaian matang." }
];

export const skillsById = Object.fromEntries(skills.map((item) => [item.id, item]));
