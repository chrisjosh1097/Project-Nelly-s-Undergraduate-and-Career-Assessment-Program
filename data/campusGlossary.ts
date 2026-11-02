// Short, reviewed definitions for campus and admission terms (≤20 words each).
// Keep wording general: no dates, quotas or rules that change yearly.
export const campusGlossary = {
  D3: "Diploma tiga. Kuliah terapan sekitar tiga tahun, banyak praktik untuk siap kerja.",
  D4: "Diploma empat atau sarjana terapan. Kuliah terapan sekitar empat tahun, setara jenjang S1.",
  S1: "Sarjana. Kuliah sekitar empat tahun, lebih banyak teori, riset, dan dasar keilmuan.",
  Vokasi: "Pendidikan terapan, misalnya D3 atau D4, yang fokus pada praktik dan keterampilan kerja.",
  Negeri: "Perguruan tinggi negeri (PTN), dikelola pemerintah. Biasanya diterima lewat SNBP, SNBT, atau mandiri.",
  "Swasta/Lainnya": "Perguruan tinggi swasta (PTS) atau jenis lain. Pendaftaran biasanya langsung lewat kampusnya.",
  LLDikti: "Lembaga Layanan Pendidikan Tinggi. Wilayah ini menunjukkan area kampus swasta berada.",
  PDDikti: "Pangkalan Data Pendidikan Tinggi. Situs resmi untuk cek status kampus dan program studi.",
  "Daya tampung": "Jumlah kursi yang dibuka satu program studi pada seleksi tertentu.",
  Peminat: "Jumlah pendaftar yang memilih program studi itu pada seleksi tertentu.",
  SNPMB: "Seleksi Nasional Penerimaan Mahasiswa Baru, yaitu seleksi bersama PTN lewat jalur SNBP dan SNBT.",
} as const;

export type CampusGlossaryTerm = keyof typeof campusGlossary;
