import type { KnowledgeDimension } from "./types";

export const interests: KnowledgeDimension[] = [
  { id: "tech_ai", label: "Teknologi dan AI", description: "Tertarik memahami teknologi baru, otomasi, dan kecerdasan buatan." },
  { id: "coding", label: "Coding", description: "Senang membuat aplikasi, website, sistem, atau logika program." },
  { id: "business_selling", label: "Bisnis dan jualan", description: "Suka melihat peluang usaha, menjual produk, dan memahami pelanggan." },
  { id: "organizing", label: "Mengorganisir", description: "Senang mengatur acara, tim, proses, dan jadwal." },
  { id: "finance_numbers", label: "Keuangan dan angka", description: "Tertarik uang, laporan, risiko, investasi, dan hitung-hitungan." },
  { id: "helping_people", label: "Membantu orang", description: "Ingin mendampingi, melayani, atau menyelesaikan masalah orang lain." },
  { id: "health_care", label: "Kesehatan", description: "Tertarik pelayanan kesehatan, tubuh manusia, dan kualitas hidup." },
  { id: "design_visual", label: "Desain visual", description: "Suka membuat tampilan, gambar, produk visual, atau identitas brand." },
  { id: "content_media", label: "Konten dan media", description: "Tertarik video, tulisan, media sosial, film, jurnalistik, atau siaran." },
  { id: "speaking_writing", label: "Berbicara dan menulis", description: "Nyaman menyampaikan ide lewat tulisan, presentasi, atau diskusi." },
  { id: "law_debate", label: "Hukum dan debat", description: "Suka argumentasi, aturan, keadilan, dan analisis kasus." },
  { id: "teaching", label: "Mengajar", description: "Senang menjelaskan sesuatu dan membantu orang belajar." },
  { id: "engineering_machines", label: "Mesin dan teknik", description: "Tertarik mesin, alat, elektronika, otomotif, atau perbaikan teknis." },
  { id: "building_infrastructure", label: "Bangunan dan infrastruktur", description: "Suka membayangkan kota, bangunan, jalan, jembatan, atau ruang publik." },
  { id: "nature_environment", label: "Alam dan lingkungan", description: "Peduli lingkungan, hewan, tumbuhan, pangan, air, dan keberlanjutan." },
  { id: "food_culinary", label: "Makanan dan kuliner", description: "Tertarik memasak, pangan, gizi, rasa, keamanan makanan, atau bisnis kuliner." },
  { id: "hospitality_service", label: "Hospitality dan pelayanan", description: "Suka melayani tamu, membuat pengalaman nyaman, dan bekerja di layanan." },
  { id: "language_culture", label: "Bahasa dan budaya", description: "Tertarik bahasa asing, budaya, sastra, penerjemahan, atau komunikasi lintas budaya." },
  { id: "sports_physical", label: "Olahraga dan fisik", description: "Senang aktivitas fisik, latihan, performa, kesehatan tubuh, dan kompetisi." },
  { id: "lab_experiment", label: "Eksperimen lab", description: "Suka percobaan, pengamatan, riset, dan pengujian." },
  { id: "field_work", label: "Kerja lapangan", description: "Nyaman bergerak di lapangan, observasi langsung, atau bekerja di lokasi nyata." },
  { id: "data_analysis", label: "Analisis data", description: "Tertarik membaca pola, grafik, data, dan membuat keputusan berbasis bukti." }
];

export const interestsById = Object.fromEntries(interests.map((item) => [item.id, item]));
