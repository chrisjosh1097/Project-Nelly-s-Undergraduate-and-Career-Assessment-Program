import type { KnowledgeDimension } from "./types";

export const subjects: KnowledgeDimension[] = [
  { id: "mathematics", label: "Matematika", description: "Aljabar, logika, fungsi, peluang, statistik, dan pemodelan." },
  { id: "physics", label: "Fisika", description: "Gerak, energi, listrik, mekanika, dan prinsip alam." },
  { id: "biology", label: "Biologi", description: "Makhluk hidup, tubuh manusia, ekosistem, dan bioteknologi." },
  { id: "chemistry", label: "Kimia", description: "Zat, reaksi, formula, bahan, obat, pangan, dan proses industri." },
  { id: "economics", label: "Ekonomi", description: "Pasar, bisnis, perilaku konsumen, dan kebijakan ekonomi." },
  { id: "language", label: "Bahasa", description: "Bahasa Indonesia, bahasa asing, sastra, komunikasi, dan literasi." },
  { id: "arts_design", label: "Seni dan Desain", description: "Visual, estetika, karya, desain, dan ekspresi kreatif." },
  { id: "computer", label: "Komputer/TIK", description: "Teknologi informasi, aplikasi, jaringan, data, dan pemrograman." },
  { id: "sports", label: "Olahraga", description: "Aktivitas fisik, latihan, performa tubuh, kesehatan, dan kompetisi." },
  { id: "sociology", label: "Sosiologi", description: "Masyarakat, kelompok, budaya, isu sosial, dan perilaku manusia." },
  { id: "history", label: "Sejarah", description: "Peristiwa masa lalu, perubahan sosial, negara, budaya, dan kebijakan." },
  { id: "accounting", label: "Akuntansi", description: "Pembukuan, laporan keuangan, audit, dan pencatatan transaksi." },
  { id: "entrepreneurship", label: "Kewirausahaan", description: "Ide bisnis, model usaha, pemasaran, operasional, dan inovasi." },
  // v3.3.0
  { id: "geography", label: "Geografi", description: "Bumi, peta, wilayah, bencana, sumber daya alam, dan tata ruang." },
  { id: "civics", label: "Pendidikan Pancasila (PPKn)", description: "Hak dan kewajiban warga, hukum, negara, dan demokrasi." },
  { id: "religion", label: "Pendidikan Agama dan Budi Pekerti", description: "Nilai, etika, karakter, dan kepedulian pada sesama." },
  { id: "anthropology", label: "Antropologi", description: "Budaya, tradisi, identitas, dan cara hidup kelompok manusia." },
  { id: "performing_arts", label: "Seni Musik/Tari/Teater", description: "Musik, gerak, panggung, ekspresi, dan pertunjukan." },
  { id: "advanced_mathematics", label: "Matematika Tingkat Lanjut", description: "Kalkulus, matriks, vektor, dan pemodelan yang lebih mendalam." },
  { id: "foreign_language", label: "Bahasa Asing", description: "Bahasa Inggris dan bahasa asing lain untuk komunikasi dan teks." }
];

export const subjectsById = Object.fromEntries(subjects.map((item) => [item.id, item]));
