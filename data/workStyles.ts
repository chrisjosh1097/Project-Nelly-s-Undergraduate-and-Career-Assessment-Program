import type { KnowledgeDimension } from "./types";

export const workStyles: KnowledgeDimension[] = [
  { id: "people_facing", label: "Banyak bertemu orang", description: "Cocok dengan interaksi, layanan, diskusi, dan kerja bersama." },
  { id: "independent_analysis", label: "Banyak analisis sendiri", description: "Nyaman fokus, membaca data, menyusun argumen, atau memecahkan masalah." },
  { id: "hands_on", label: "Praktik langsung", description: "Belajar dan bekerja melalui alat, percobaan, tindakan, atau prosedur nyata." },
  { id: "creative_flexible", label: "Kreatif dan fleksibel", description: "Nyaman dengan ide baru, eksplorasi, iterasi, dan perubahan." },
  { id: "structured_detail", label: "Terstruktur dan detail", description: "Suka standar, jadwal, dokumentasi, ketelitian, dan proses jelas." },
  { id: "dynamic_field", label: "Dinamis di lapangan", description: "Siap berpindah lokasi, observasi langsung, atau menghadapi kondisi nyata." }
];

export const workStylesById = Object.fromEntries(workStyles.map((item) => [item.id, item]));
