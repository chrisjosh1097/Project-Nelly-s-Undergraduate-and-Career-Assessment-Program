import { createConstraintRule } from "./helpers";
import type { ConstraintRule, KnowledgeDimension } from "./types";

export const constraints: KnowledgeDimension[] = [
  { id: "cost_sensitive", label: "Biaya menjadi pertimbangan", description: "Siswa perlu pilihan yang realistis secara biaya." },
  { id: "parent_permission", label: "Perlu izin orang tua", description: "Keputusan perlu didiskusikan dengan keluarga." },
  { id: "far_location", label: "Lokasi jauh menjadi kendala", description: "Siswa perlu mempertimbangkan jarak, biaya hidup, dan dukungan keluarga." },
  { id: "competitive_admission", label: "Khawatir persaingan masuk", description: "Siswa perlu strategi pilihan utama dan cadangan." },
  { id: "unsure_interest", label: "Belum yakin minat", description: "Siswa masih perlu eksplorasi bidang." },
  { id: "afraid_wrong_major", label: "Takut salah jurusan", description: "Siswa perlu jurusan fleksibel dan kesempatan mencoba." },
  { id: "wants_fast_employment", label: "Ingin cepat kerja", description: "Siswa mengutamakan jalur terapan, portofolio, dan magang." },
  { id: "wants_scholarship", label: "Ingin beasiswa", description: "Siswa perlu strategi beasiswa dan pilihan kampus realistis." },
  { id: "prefers_ptn_java", label: "Prefer PTN di Jawa", description: "Siswa ingin memprioritaskan PTN di Jawa." },
  { id: "prefers_ptn_outside_java", label: "Prefer PTN luar Jawa", description: "Siswa terbuka pada PTN luar Jawa." },
  { id: "prefers_good_private_university", label: "Prefer PTS bagus", description: "Siswa terbuka pada PTS dengan koneksi industri yang kuat." },
  { id: "prefers_near_home", label: "Prefer dekat rumah", description: "Siswa mengutamakan kampus atau jalur yang dekat." },
  { id: "prefers_vocational", label: "Prefer vokasi", description: "Siswa tertarik jalur D3, D4, politeknik, atau praktik terapan." },
  { id: "prefers_certification", label: "Prefer sertifikasi", description: "Siswa tertarik jalur pendek berbasis skill dan portofolio." }
];

export const constraintRules: ConstraintRule[] = [
  createConstraintRule({
    id: "cost_sensitive",
    label: "Biaya menjadi pertimbangan",
    description: "Memberi catatan pada jurusan biaya tinggi dan menyarankan alternatif serumpun yang lebih terjangkau.",
    boostMajorIds: [
      "kesehatan_masyarakat",
      "gizi",
      "teknologi_laboratorium_medis",
      "administrasi_publik",
      "pendidikan_guru_sekolah_dasar",
      "manajemen_informatika",
      "akuntansi_terapan"
    ],
    cautionMajorIds: ["kedokteran", "kedokteran_gigi", "kedokteran_hewan", "farmasi"],
    alternativeMajorIds: ["kesehatan_masyarakat", "gizi", "teknologi_laboratorium_medis", "keperawatan", "kebidanan", "akuntansi_terapan"],
    scoringModifier: -8,
    advice: [
      "Bandingkan biaya kuliah, biaya hidup, dan kebutuhan alat atau praktik.",
      "Cari jalur PTN, beasiswa, KIP Kuliah, atau kampus alternatif yang tetap berkualitas.",
      "Pertimbangkan jurusan serumpun dengan biaya lebih ringan tetapi arah karier tetap dekat."
    ]
  }),
  createConstraintRule({
    id: "parent_permission",
    label: "Perlu izin orang tua",
    description: "Mendorong siswa menyiapkan alasan, data biaya, dan prospek kerja untuk diskusi keluarga.",
    boostMajorIds: ["manajemen", "akuntansi", "pendidikan_guru_sekolah_dasar", "keperawatan", "teknologi_informasi"],
    cautionMajorIds: [],
    alternativeMajorIds: ["sistem_informasi", "manajemen", "komunikasi"],
    scoringModifier: 0,
    advice: [
      "Siapkan ringkasan jurusan, biaya, prospek kerja, dan kampus pilihan.",
      "Ajak guru BK atau wali kelas membantu menjelaskan alasan pilihanmu.",
      "Tunjukkan portofolio atau hasil eksplorasi agar pilihan terlihat serius."
    ]
  }),
  createConstraintRule({
    id: "far_location",
    label: "Lokasi jauh menjadi kendala",
    description: "Memberi catatan pada pilihan yang biasanya menuntut pindah kota jika fit belum sangat kuat.",
    boostMajorIds: [
      "administrasi_perkantoran",
      "digital_marketing_applied",
      "pendidikan_guru_sekolah_dasar",
      "manajemen",
      "akuntansi",
      "kebidanan",
      "manajemen_informatika",
      "akuntansi_terapan"
    ],
    cautionMajorIds: ["kedokteran", "kedokteran_gigi", "artificial_intelligence", "game_technology"],
    alternativeMajorIds: ["sistem_informasi", "manajemen", "komunikasi", "akuntansi", "manajemen_informatika", "akuntansi_terapan"],
    scoringModifier: -4,
    advice: [
      "Jika lokasi jauh, hitung biaya hidup, transportasi, dan dukungan keluarga.",
      "Cari kampus dekat rumah yang punya kurikulum, akreditasi, dan magang cukup baik.",
      "PTN luar Jawa tetap menarik jika kecocokan jurusan dan dukungan finansial kuat."
    ]
  }),
  createConstraintRule({
    id: "competitive_admission",
    label: "Khawatir persaingan masuk",
    description: "Mendorong pilihan cadangan serumpun untuk jurusan dengan persaingan tinggi.",
    boostMajorIds: [
      "teknologi_laboratorium_medis",
      "kesehatan_masyarakat",
      "sistem_informasi",
      "administrasi_bisnis",
      "vokasi_teknik",
      "manajemen_informatika",
      "teknologi_rekayasa_perangkat_lunak",
      "kebidanan"
    ],
    cautionMajorIds: ["kedokteran", "kedokteran_gigi", "informatika", "aktuaria", "arsitektur"],
    alternativeMajorIds: ["sistem_informasi", "teknologi_informasi", "statistika", "kesehatan_masyarakat", "teknik_industri", "manajemen_informatika"],
    scoringModifier: -5,
    advice: [
      "Buat daftar pilihan utama, pilihan aman, dan pilihan serumpun.",
      "Gunakan data daya tampung dan peminat tahun sebelumnya untuk strategi.",
      "Jangan hanya memilih jurusan populer; pilih yang cocok dan realistis."
    ]
  }),
  createConstraintRule({
    id: "unsure_interest",
    label: "Belum yakin minat",
    description: "Meningkatkan jurusan fleksibel yang membuka beberapa jalur karier.",
    boostMajorIds: [
      "sistem_informasi",
      "manajemen",
      "komunikasi",
      "psikologi",
      "bisnis_digital",
      "pendidikan_guru_sekolah_dasar",
      "manajemen_informatika"
    ],
    cautionMajorIds: ["kedokteran", "aktuaria", "teknik_kimia"],
    alternativeMajorIds: ["sistem_informasi", "manajemen", "komunikasi", "psikologi"],
    scoringModifier: 7,
    advice: [
      "Pilih jurusan yang cukup fleksibel sambil tetap punya skill jelas.",
      "Coba mini project dari 2-3 bidang sebelum membuat keputusan final.",
      "Diskusikan hasil eksplorasi dengan guru BK, orang tua, atau mentor."
    ]
  }),
  createConstraintRule({
    id: "afraid_wrong_major",
    label: "Takut salah jurusan",
    description: "Mendorong pilihan dengan lintasan karier luas dan kesempatan pindah arah skill.",
    boostMajorIds: ["sistem_informasi", "manajemen", "komunikasi", "psikologi", "teknik_industri"],
    cautionMajorIds: ["kedokteran", "kedokteran_gigi", "aktuaria"],
    alternativeMajorIds: ["sistem_informasi", "teknik_industri", "manajemen", "komunikasi"],
    scoringModifier: 5,
    advice: [
      "Cari kurikulum yang memberi ruang eksplorasi, magang, dan mata kuliah pilihan.",
      "Nilai kecocokan dari aktivitas nyata, bukan hanya nama jurusan.",
      "Bangun portofolio agar arah karier bisa tetap fleksibel."
    ]
  }),
  createConstraintRule({
    id: "wants_fast_employment",
    label: "Ingin cepat kerja",
    description: "Meningkatkan jalur vokasi, terapan, dan jurusan dengan entry-level pathway jelas.",
    boostMajorIds: [
      "vokasi_teknik",
      "teknik_otomotif",
      "teknologi_informasi",
      "digital_marketing_applied",
      "rekam_medis",
      "keperawatan",
      "administrasi_perkantoran",
      "web_development_applied",
      "mobile_app_development_applied",
      "data_analytics_applied",
      "network_cloud_operations",
      "software_quality_assurance_applied",
      "it_support_helpdesk",
      "industrial_automation_applied",
      "kebidanan",
      "manajemen_informatika",
      "teknologi_rekayasa_perangkat_lunak",
      "akuntansi_terapan"
    ],
    cautionMajorIds: ["biologi", "sosiologi", "ilmu_politik"],
    alternativeMajorIds: [
      "teknologi_informasi",
      "web_development_applied",
      "data_analytics_applied",
      "digital_marketing_applied",
      "rekam_medis",
      "vokasi_teknik",
      "manajemen_informatika",
      "teknologi_rekayasa_perangkat_lunak",
      "akuntansi_terapan"
    ],
    scoringModifier: 8,
    advice: [
      "Prioritaskan program yang punya magang, portofolio, sertifikasi, dan koneksi industri.",
      "Mulai bangun proyek nyata sejak kelas 10 atau 11.",
      "Cari jalur D3/D4/politeknik jika ingin lebih banyak praktik."
    ]
  }),
  createConstraintRule({
    id: "wants_scholarship",
    label: "Ingin beasiswa",
    description: "Mendorong persiapan prestasi, dokumen, dan pilihan kampus dengan bantuan biaya.",
    boostMajorIds: ["farmasi", "kesehatan_masyarakat", "teknik_lingkungan", "pendidikan_matematika", "statistika", "teknik_geomatika_gis"],
    cautionMajorIds: ["kedokteran", "kedokteran_gigi"],
    alternativeMajorIds: ["kesehatan_masyarakat", "gizi", "teknologi_laboratorium_medis", "farmasi", "kebidanan"],
    scoringModifier: 2,
    advice: [
      "Siapkan rapor, prestasi, esai, portofolio, dan dokumen ekonomi keluarga.",
      "Cari beasiswa kampus, KIP Kuliah, beasiswa daerah, dan beasiswa industri.",
      "Pilih jurusan yang tetap realistis jika beasiswa tidak penuh."
    ]
  }),
  createConstraintRule({
    id: "prefers_ptn_java",
    label: "Prefer PTN di Jawa",
    description: "Mengarahkan strategi ke PTN di Jawa tanpa mengabaikan persaingan.",
    boostMajorIds: ["informatika", "manajemen", "hukum", "teknik_industri", "kesehatan_masyarakat", "teknologi_rekayasa_perangkat_lunak"],
    cautionMajorIds: ["kedokteran", "informatika", "aktuaria"],
    alternativeMajorIds: ["sistem_informasi", "teknik_industri", "statistika", "administrasi_publik", "manajemen_informatika"],
    scoringModifier: 1,
    advice: [
      "Cek daya tampung dan keketatan pilihan PTN di Jawa.",
      "Siapkan pilihan serumpun dengan tingkat persaingan berbeda.",
      "Jangan abaikan PTS bagus atau vokasi jika koneksi industrinya kuat."
    ]
  }),
  createConstraintRule({
    id: "prefers_ptn_outside_java",
    label: "Prefer PTN luar Jawa",
    description: "Membuka peluang pada PTN luar Jawa yang relevan dengan jurusan dan biaya.",
    boostMajorIds: ["teknik_lingkungan", "agroteknologi", "perikanan", "kehutanan", "teknik_sipil", "teknik_geologi", "teknik_pertambangan", "teknik_geomatika_gis"],
    cautionMajorIds: [],
    alternativeMajorIds: ["agribisnis", "ilmu_lingkungan", "teknik_logistik", "teknik_geomatika_gis"],
    scoringModifier: 2,
    advice: [
      "PTN luar Jawa bisa punya kekuatan lokal yang cocok untuk agrikultur, lingkungan, dan infrastruktur.",
      "Hitung biaya hidup dan akses transportasi sebelum memilih.",
      "Cari alumni atau mahasiswa aktif untuk memahami pengalaman kuliah."
    ]
  }),
  createConstraintRule({
    id: "prefers_good_private_university",
    label: "Prefer PTS bagus",
    description: "Tidak mem penalti PTS jika major fit, kurikulum, dan koneksi industri kuat.",
    boostMajorIds: [
      "bisnis_digital",
      "desain_komunikasi_visual",
      "sistem_informasi",
      "komunikasi",
      "uiux_design_applied",
      "manajemen_informatika",
      "teknologi_rekayasa_perangkat_lunak"
    ],
    cautionMajorIds: [],
    alternativeMajorIds: ["digital_marketing_applied", "uiux_design_applied", "teknologi_informasi", "manajemen_informatika"],
    scoringModifier: 3,
    advice: [
      "PTS bagus bisa sangat kuat jika punya dosen praktisi, magang, dan portofolio.",
      "Bandingkan kurikulum, biaya, alumni, dan kerja sama industri.",
      "Pastikan akreditasi dan fasilitas sesuai kebutuhan bidang."
    ]
  }),
  createConstraintRule({
    id: "prefers_near_home",
    label: "Prefer dekat rumah",
    description: "Mendorong program yang tersedia luas di banyak kota.",
    boostMajorIds: ["manajemen", "akuntansi", "pendidikan_guru_sekolah_dasar", "administrasi_perkantoran", "keperawatan", "kebidanan", "akuntansi_terapan"],
    cautionMajorIds: ["game_technology", "artificial_intelligence", "kedokteran_gigi"],
    alternativeMajorIds: ["sistem_informasi", "manajemen", "komunikasi", "akuntansi", "akuntansi_terapan", "manajemen_informatika"],
    scoringModifier: 2,
    advice: [
      "Cari program dekat rumah yang tetap punya praktik, magang, dan kualitas pengajaran.",
      "Jika jurusan spesifik tidak tersedia, cari jurusan serumpun dan bangun skill tambahan.",
      "Gunakan sertifikasi online untuk melengkapi kekurangan fasilitas lokal."
    ]
  }),
  createConstraintRule({
    id: "prefers_vocational",
    label: "Prefer vokasi",
    description: "Meningkatkan D3/D4/vokasi dan jalur terapan yang dekat dengan praktik kerja.",
    boostMajorIds: [
      "vokasi_teknik",
      "teknik_otomotif",
      "teknik_pendingin_tata_udara",
      "rekam_medis",
      "digital_marketing_applied",
      "uiux_design_applied",
      "tata_boga",
      "web_development_applied",
      "mobile_app_development_applied",
      "data_analytics_applied",
      "network_cloud_operations",
      "cybersecurity_operations_applied",
      "software_quality_assurance_applied",
      "it_support_helpdesk",
      "industrial_automation_applied",
      "kebidanan",
      "manajemen_informatika",
      "teknologi_rekayasa_perangkat_lunak",
      "akuntansi_terapan",
      "teknik_geomatika_gis"
    ],
    cautionMajorIds: ["biologi", "ilmu_politik", "linguistik"],
    alternativeMajorIds: [
      "vokasi_teknik",
      "web_development_applied",
      "data_analytics_applied",
      "rekam_medis",
      "digital_marketing_applied",
      "tata_boga",
      "manajemen_informatika",
      "teknologi_rekayasa_perangkat_lunak",
      "akuntansi_terapan",
      "kebidanan"
    ],
    scoringModifier: 8,
    advice: [
      "Pilih vokasi yang punya workshop, lab, magang wajib, dan sertifikasi industri.",
      "Portofolio praktik lebih penting daripada hanya nilai teori.",
      "Bandingkan D3, D4, politeknik, dan sertifikasi sesuai target kerja."
    ]
  }),
  createConstraintRule({
    id: "prefers_certification",
    label: "Prefer sertifikasi",
    description: "Meningkatkan jalur skill pendek yang bisa dibuktikan dengan portofolio.",
    boostMajorIds: [
      "digital_marketing_applied",
      "uiux_design_applied",
      "teknologi_informasi",
      "cybersecurity",
      "tata_rias",
      "teknik_otomotif",
      "web_development_applied",
      "mobile_app_development_applied",
      "data_analytics_applied",
      "network_cloud_operations",
      "cybersecurity_operations_applied",
      "software_quality_assurance_applied",
      "it_support_helpdesk",
      "industrial_automation_applied",
      "manajemen_informatika",
      "teknologi_rekayasa_perangkat_lunak",
      "akuntansi_terapan",
      "teknik_geomatika_gis"
    ],
    cautionMajorIds: ["kedokteran", "kedokteran_gigi", "hukum"],
    alternativeMajorIds: [
      "teknologi_informasi",
      "web_development_applied",
      "data_analytics_applied",
      "digital_marketing_applied",
      "uiux_design_applied",
      "vokasi_teknik",
      "manajemen_informatika",
      "teknologi_rekayasa_perangkat_lunak",
      "akuntansi_terapan"
    ],
    scoringModifier: 7,
    advice: [
      "Sertifikasi bagus jika dibarengi proyek nyata dan portofolio.",
      "Pilih sertifikasi yang diakui industri atau punya asesmen praktik.",
      "Gunakan sertifikasi sebagai pelengkap kuliah, bukan pengganti semua jalur."
    ]
  })
];

export const constraintsById = Object.fromEntries(constraints.map((item) => [item.id, item]));
export const constraintRulesById = Object.fromEntries(constraintRules.map((item) => [item.id, item]));
