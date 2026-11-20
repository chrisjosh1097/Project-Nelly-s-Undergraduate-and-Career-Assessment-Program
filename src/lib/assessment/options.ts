import type { Gender, SchoolMajor, TechComfort, WorkStyle } from "@/lib/types";

export const genderOptions: Gender[] = ["Pria", "Wanita"];

export const schoolMajorOptions: SchoolMajor[] = [
  "IPA",
  "IPS",
  "Bahasa",
  "SMK Teknik",
  "SMK Bisnis",
  "SMK Kesehatan",
  "SMK Kreatif/Multimedia",
  "Lainnya"
];

// v3.3.0: every Kurikulum Merdeka SMA subject (Fase E/F) as an explicit option.
// Advanced variants of IPA/IPS subjects fold into their base subject; non-English
// foreign languages share one option. SMK subjects can still use "Lainnya".
export const favoriteSubjectOptions = [
  "Matematika",
  "Matematika Tingkat Lanjut",
  "Fisika",
  "Kimia",
  "Biologi",
  "Informatika",
  "Bahasa Indonesia",
  "Bahasa Inggris",
  "Bahasa Asing Lain (Jepang, Mandarin, Arab, Jerman, Korea, dll.)",
  "Ekonomi",
  "Akuntansi",
  "Sosiologi",
  "Geografi",
  "Sejarah",
  "Antropologi",
  "Pendidikan Pancasila (PPKn)",
  "Pendidikan Agama dan Budi Pekerti",
  "Seni Rupa/Desain",
  "Seni Musik",
  "Seni Tari/Teater",
  "PJOK (Olahraga)",
  "Prakarya dan Kewirausahaan",
  "Lainnya"
];

// Pre-v3.3.0 labels. Still valid so saved answers keep validating and scoring; not shown.
export const legacyFavoriteSubjectOptions = ["Bahasa", "Seni/Desain", "Komputer/TIK", "Olahraga"];

export const favoriteActivityOptions = [
  "Membuat desain/konten",
  "Coding/teknologi",
  "Membantu orang",
  "Berjualan/bisnis",
  "Menghitung/analisis data",
  "Menulis/berbicara",
  "Eksperimen/lab",
  "Kerja lapangan",
  "Mengorganisir acara",
  "Memperbaiki barang/mesin"
];

export const skillStrengthOptions = [
  "Komunikasi",
  "Kreativitas",
  "Logika",
  "Empati",
  "Leadership",
  "Ketelitian",
  "Problem solving",
  "Public speaking",
  "Numerik/hitung-hitungan",
  "Bahasa asing",
  "Teknologi",
  "Kerja praktik"
];

export const workStyleOptions: WorkStyle[] = [
  "Banyak bertemu orang",
  "Banyak analisis sendiri",
  "Praktik langsung",
  "Kreatif dan fleksibel",
  "Terstruktur dan detail",
  "Dinamis di lapangan"
];

// v3.2.0 options (UAT 2026-11). Order of the answer = student priority.
export const problemAreaOptions = [
  "Pemerataan Pendidikan dan Literasi",
  "Industri, Inovasi, dan Infrastruktur",
  "Lingkungan, Iklim, dan Kehidupan Laut",
  "Akses Fasilitas Kesehatan dan Sanitasi Layak",
  "Perdamaian, Keadilan, dan Kelembagaan yang Tangguh",
  "Manajemen dan Transparansi",
  "Kepemudaan dan Kebugaran Jasmani",
  "Seni Berekspresi, Bahasa, dan Estetika"
];

// Pre-v3.2.0 labels. Still valid so saved answers and old fixtures keep working.
export const legacyProblemAreaOptions = [
  "Pendidikan",
  "Kesehatan",
  "Bisnis",
  "Teknologi",
  "Lingkungan",
  "Sosial",
  "Keuangan",
  "Hukum",
  "Kreatif/media",
  "Infrastruktur"
];

export const problemAreaOptionTags: Record<string, string[]> = {
  "Pemerataan Pendidikan dan Literasi": ["education"],
  "Industri, Inovasi, dan Infrastruktur": ["technology", "business", "infrastructure"],
  "Lingkungan, Iklim, dan Kehidupan Laut": ["environment", "food"],
  "Akses Fasilitas Kesehatan dan Sanitasi Layak": ["health"],
  "Perdamaian, Keadilan, dan Kelembagaan yang Tangguh": ["law", "social"],
  "Manajemen dan Transparansi": ["public_service", "finance", "business"],
  "Kepemudaan dan Kebugaran Jasmani": ["youth_sport"],
  "Seni Berekspresi, Bahasa, dan Estetika": ["creative_media"]
};

export const PROBLEM_AREA_MAX = 3;
export const PROBLEM_AREA_RANK_WEIGHTS = [1, 0.8, 0.6] as const;

export function usesRankedProblemAreas(values: readonly string[]) {
  return values.length > 0 && values.every((value) => value in problemAreaOptionTags);
}

export const collegePathPreferenceOptions = [
  "PTN di Jawa",
  "PTN luar Jawa",
  "PTS bagus di kota besar",
  "Kuliah dekat rumah",
  "Diploma/vokasi",
  "Sertifikasi/bootcamp",
  "Belum tahu",
  "Lainnya"
];

export const personalConstraintOptions = [
  "Biaya",
  "Izin orang tua",
  "Lokasi jauh",
  "Persaingan masuk",
  "Belum tahu minat",
  "Takut salah jurusan",
  "Ingin cepat kerja",
  "Ingin beasiswa"
];

export const techComfortOptions: TechComfort[] = [
  "Sangat nyaman",
  "Cukup nyaman",
  "Biasa saja",
  "Kurang nyaman",
  "Belum pernah mencoba"
];
