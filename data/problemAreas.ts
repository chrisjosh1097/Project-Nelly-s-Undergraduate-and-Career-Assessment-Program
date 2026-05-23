import type { KnowledgeDimension } from "./types";

export const problemAreas: KnowledgeDimension[] = [
  { id: "education", label: "Pendidikan", description: "Masalah belajar, sekolah, literasi, akses pendidikan, dan pengembangan siswa." },
  { id: "health", label: "Kesehatan", description: "Kesehatan individu, masyarakat, klinis, gizi, obat, dan kualitas hidup." },
  { id: "business", label: "Bisnis", description: "Penjualan, pelanggan, operasional, pertumbuhan usaha, dan inovasi pasar." },
  { id: "technology", label: "Teknologi", description: "Aplikasi, data, keamanan, otomasi, infrastruktur digital, dan AI." },
  { id: "environment", label: "Lingkungan", description: "Keberlanjutan, alam, air, tanah, hutan, limbah, dan perubahan iklim." },
  { id: "social", label: "Sosial", description: "Kesejahteraan, komunitas, relasi manusia, budaya, dan ketimpangan." },
  { id: "finance", label: "Keuangan", description: "Uang, risiko, pembiayaan, investasi, pajak, dan akuntabilitas." },
  { id: "law", label: "Hukum", description: "Keadilan, aturan, kebijakan, konflik, regulasi, dan hak warga." },
  { id: "creative_media", label: "Kreatif dan media", description: "Komunikasi visual, cerita, konten, hiburan, reputasi, dan publikasi." },
  { id: "infrastructure", label: "Infrastruktur", description: "Bangunan, kota, transportasi, energi, logistik, dan fasilitas publik." },
  { id: "food", label: "Pangan", description: "Produksi pangan, keamanan makanan, kuliner, nutrisi, dan rantai pasok." },
  { id: "public_service", label: "Layanan publik", description: "Administrasi, kebijakan, pelayanan masyarakat, dan tata kelola." }
];

export const problemAreasById = Object.fromEntries(problemAreas.map((item) => [item.id, item]));
