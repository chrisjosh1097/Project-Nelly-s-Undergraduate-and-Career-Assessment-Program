/**
 * Bank Prompt: approved prompt texts (review #2, draft v2) for students to paste into any AI chat.
 * Adapted from f/prompts.chat (CC0) patterns. No salary figures, admission chances or passing grades.
 * Placeholders: {jurusanSekolah} {aktivitas} {jurusanKuliah} {karier}. [Bracketed] text is typed by the student.
 */
export type PromptField = "jurusanSekolah" | "aktivitas" | "jurusanKuliah" | "karier";
export type PromptCategoryId = "diri" | "jurusan" | "karier" | "portofolio" | "seleksi" | "orangtua";

export interface PromptCategory { id: PromptCategoryId; step: string; title: string; intro: string }
export interface AiPrompt {
  id: string;
  category: PromptCategoryId;
  title: string;
  purpose: string;
  template: string;
  hint?: string;
}

export const PROMPT_ENDING =
  "Gunakan bahasa Indonesia yang sederhana untuk siswa SMA/SMK dan konteks Indonesia. " +
  "Jangan menyebut angka gaji, peluang diterima, atau passing grade. " +
  "Kalau tidak yakin, bilang tidak yakin dan sarankan sumber resmi untuk dicek.";

export const promptCategories: PromptCategory[] = [
  { id: "diri", step: "1", title: "Kenali diri", intro: "Mulai dari sini kalau kamu belum punya gambaran." },
  { id: "jurusan", step: "2", title: "Pilih jurusan & kampus", intro: "Bandingkan pilihan dan siapkan pertanyaan." },
  { id: "karier", step: "3", title: "Bayangkan kariernya", intro: "Lihat sisi nyata pekerjaan dari jurusan pilihanmu." },
  { id: "portofolio", step: "4", title: "Portofolio & persiapan", intro: "Ubah minat jadi bukti yang bisa kamu tunjukkan." },
  { id: "seleksi", step: "5", title: "Seleksi masuk", intro: "Latihan belajar dan wawancara." },
  { id: "orangtua", step: "✦", title: "Bicara dengan orang tua", intro: "Bisa dipakai kapan saja." },
];

export const aiPrompts: AiPrompt[] = [
  {
    id: "wawancara-diri", category: "diri", title: "Wawancarai aku dulu",
    purpose: "AI bertanya satu per satu, lalu merangkum kekuatan dan bidang yang cocok.",
    template: "Jadilah konselor karier untuk siswa SMA/SMK. Aku siswa {jurusanSekolah} dan suka {aktivitas}. Tanyakan tepat 5 pertanyaan, satu per satu, tentang hal yang membuatku semangat, pelajaran yang kusukai, dan cara aku suka bekerja. Tunggu jawabanku sebelum lanjut. Kalau jawabanku terlalu umum, minta contoh nyata. Setelah itu, rangkum 3 kekuatanku dan 3 bidang kuliah yang cocok beserta alasannya.",
  },
  {
    id: "skill-tersembunyi", category: "diri", title: "Temukan skill tersembunyiku",
    purpose: "Ubah kegiatan sehari-hari jadi daftar skill dan buktinya.",
    template: "Aku siswa {jurusanSekolah}. Kegiatanku sehari-hari: {aktivitas}. Banyak orang tidak sadar kegiatan biasa sebenarnya melatih skill. Tanyakan 3 pertanyaan lanjutan, satu per satu, tentang apa yang benar-benar kulakukan di kegiatan itu. Lalu buat tabel: kegiatan, skill yang terlatih, dan bukti yang bisa kutunjukkan.",
  },
  {
    id: "bandingkan-jurusan", category: "jurusan", title: "Bandingkan dua jurusan",
    purpose: "Tabel perbandingan tanpa memilihkan untukmu.",
    template: "Bandingkan jurusan {jurusanKuliah} dengan [jurusan lain yang kupertimbangkan]. Buat tabel: mata kuliah utama, gaya belajar, tugas yang sering muncul, contoh karier, dan tipe siswa yang biasanya betah. Jangan memilihkan untukku. Akhiri dengan 3 pertanyaan untuk membantuku memutuskan sendiri.",
  },
  {
    id: "tanya-kakak-tingkat", category: "jurusan", title: "Pertanyaan untuk kakak tingkat",
    purpose: "8 pertanyaan jujur untuk mahasiswa jurusan itu.",
    hint: "Lebih enak dipakai setelah \"Bandingkan dua jurusan\".",
    template: "Aku akan mengobrol dengan mahasiswa jurusan {jurusanKuliah}. Buatkan 8 pertanyaan yang jujur dan spesifik tentang tugas, beban belajar, praktikum atau magang, dan hal yang mereka harap diketahui sebelum masuk. Urutkan dari yang ringan ke yang lebih dalam.",
  },
  {
    id: "cek-kampus", category: "jurusan", title: "Daftar periksa memilih kampus",
    purpose: "Hal yang perlu dicek dan tempat mengeceknya.",
    template: "Bantu aku membuat daftar periksa untuk memilih kampus jurusan {jurusanKuliah}. Poinnya: akreditasi program studi, kurikulum, praktik atau magang, biaya, lokasi, dan dukungan beasiswa. Untuk tiap poin, beri tahu cara dan tempat mengeceknya, misalnya PDDikti, situs resmi kampus, atau BAN-PT/LAM.",
  },
  {
    id: "mitos-industri", category: "karier", title: "Mitos dan kebutuhan industri",
    purpose: "Mitos vs kenyataan, plus industri yang membutuhkan peran ini.",
    template: "Aku sedang menimbang dunia {karier} di Indonesia. Jadilah mentor yang jujur dan blak-blakan. Sebutkan 3 mitos terbesar tentang pekerjaan ini dan kenyataannya. Lalu sebutkan industri yang paling membutuhkan peran ini, dan sumber apa yang bisa kucek untuk memastikannya.",
  },
  {
    id: "hari-pertama-magang", category: "karier", title: "Hari pertama magang",
    purpose: "Simulasi masalah nyata. Kamu coba jawab dulu.",
    template: "Bayangkan aku magang hari pertama sebagai {karier} di sebuah [Perusahaan/Institusi]. Beri satu masalah tak terduga yang sering terjadi di profesi ini. Biarkan aku mencoba menjawab dulu. Setelah itu, jelaskan cara profesional menyelesaikannya dan sifat apa yang membuat orang bertahan atau menyerah di posisi ini.",
  },
  {
    id: "karier-era-ai", category: "karier", title: "Karier di era AI",
    purpose: "Tugas yang dibantu AI, yang tetap butuh manusia, dan skill yang perlu dilatih.",
    template: "Bagaimana AI kemungkinan mengubah pekerjaan {karier} dalam 5 sampai 10 tahun? Pisahkan menjadi tiga daftar: tugas yang mungkin dibantu AI, tugas yang tetap butuh manusia, dan skill yang perlu kulatih dari sekarang. Beri satu latihan kecil untuk tiap skill.",
  },
  {
    id: "connect-the-dots", category: "portofolio", title: "Connect the dots",
    purpose: "Rangkai pengalamanmu jadi satu cerita portofolio.",
    template: "Aku siswa {jurusanSekolah}. Pengalamanku baru sebatas {aktivitas}. Aku ingin kuliah {jurusanKuliah}. Tanyakan 3 pertanyaan dulu, satu per satu, tentang pengalaman itu. Lalu bantu aku menghubungkannya menjadi satu cerita portofolio yang unik, maksimal 150 kata, dan sebutkan bukti yang perlu kukumpulkan.",
  },
  {
    id: "tools-tahun-pertama", category: "portofolio", title: "Tools tahun pertama",
    purpose: "Keahlian dan tempat belajar gratis untuk mahasiswa baru.",
    template: "Kalau kamu mahasiswa baru {jurusanKuliah} yang mengulang dari awal, tools atau keahlian apa yang akan kamu pelajari di tahun pertama? Sebutkan tempat belajar atau sertifikasi gratis yang resmi atau terkenal agar bisa kucek sendiri.",
  },
  {
    id: "latihan-4-minggu", category: "portofolio", title: "Rencana latihan 4 minggu",
    purpose: "Satu aksi kecil per minggu, lengkap dengan buktinya.",
    template: "Buat rencana latihan 4 minggu, 2 sampai 3 jam per minggu, untuk mencoba bidang {jurusanKuliah}. Tiap minggu berisi satu aksi kecil, alat gratis yang dipakai, dan bukti hasil yang bisa kusimpan. Tanyakan dulu berapa hari per minggu aku punya waktu.",
  },
  {
    id: "ide-proyek", category: "portofolio", title: "Ide proyek kecil",
    purpose: "3 proyek 2 minggu dengan alat gratis.",
    template: "Beri 3 ide proyek kecil yang bisa kuselesaikan dalam 2 minggu untuk menunjukkan minat pada {jurusanKuliah}. Gunakan alat gratis. Untuk tiap ide, tulis langkah 1, 2, 3 dan hasil akhirnya.",
  },
  {
    id: "jadwal-utbk", category: "seleksi", title: "Jadwal belajar UTBK",
    purpose: "Jadwal mingguan yang realistis, termasuk hari istirahat.",
    template: "Aku punya [jumlah bulan] bulan sebelum UTBK dan bisa belajar [jam] jam per hari. Tanyakan dulu subtes mana yang paling sulit bagiku. Lalu buat jadwal mingguan yang realistis, termasuk hari istirahat. Ingatkan aku mengecek info subtes terbaru di situs resmi SNPMB.",
  },
  {
    id: "simulasi-wawancara", category: "seleksi", title: "Simulasi wawancara",
    purpose: "Latihan 5 pertanyaan dengan masukan tiap jawaban.",
    template: "Jadilah pewawancara seleksi kampus atau beasiswa untuk jurusan {jurusanKuliah}. Ajukan satu pertanyaan per giliran, total 5 pertanyaan. Setelah tiap jawabanku, beri satu hal yang sudah bagus dan satu yang bisa diperbaiki. Tutup dengan ringkasan singkat.",
  },
  {
    id: "jelaskan-ke-orang-tua", category: "orangtua", title: "Jelaskan pilihanku",
    purpose: "Siapkan obrolan tenang dan latihan dengan AI sebagai orang tua.",
    template: "Aku ingin kuliah {jurusanKuliah}, tetapi orang tuaku masih ragu. Bantu aku menyiapkan obrolan yang tenang dan sopan: alasanku dalam 3 poin, rencana cadangan, dan 3 pertanyaan yang bisa kami bahas bersama. Lalu ajak aku berlatih: kamu berperan sebagai orang tua yang khawatir.",
  },
];

/** The four reviewer prompts shown on the results page, in reviewer order. */
export const resultPromptIds = ["mitos-industri", "connect-the-dots", "hari-pertama-magang", "tools-tahun-pertama"] as const;
