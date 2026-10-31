/** Human-curated practice suggestions. Not admission, employment, safety training, or licensing requirements. */
export interface SkillTarget { gap: string; target: string; proof: string }
export interface WeekAction { week: 1 | 2 | 3 | 4; action: string; durationLabel: string; proof: string }
export interface AspirationRoute { id: string; keywords: string[]; title: string; steps: string[]; verify: string }
export interface GlossaryTerm { term: string; plain: string; aliases?: string[] }
export interface FieldAiNote { cluster: string; note: string }
export interface AspirationRouteKeywordRule { routeId: string; keywords: string[] }
export interface StudentGuidanceCatalog {
  skillTargets: SkillTarget[];
  skillTargetsBySubCluster: Record<string, SkillTarget[]>;
  weekPlansBySubCluster: Record<string, WeekAction[]>;
  weekPlansByCluster: Record<string, WeekAction[]>;
  genericWeekPlan: WeekAction[];
  aspirationRoutes: AspirationRoute[];
  aspirationRouteKeywordRules: AspirationRouteKeywordRule[];
  glossary: GlossaryTerm[];
  fieldAiNotes: FieldAiNote[];
}

// Labels follow the possible gap sources: related skills, certification suggestions, and portfolio suggestions.
const targetRows: [string, string, string][] = [
  ["Buat studi kasus sederhana yang menunjukkan proses berpikir.", "Bisa menjelaskan satu masalah, dua pilihan solusi, dan alasan memilih solusi.", "Tunjukkan satu halaman studi kasus dengan urutan alasanmu."],
  ["Dokumentasikan proyek sekolah, lomba, atau kegiatan organisasi.", "Bisa menjelaskan tugasmu, proses kerja, dan hasil satu kegiatan.", "Susun tiga catatan proses tanpa menampilkan data pribadi orang lain."],
  ["Susun portofolio digital berisi hasil karya dan refleksi belajar.", "Bisa memilih tiga karya dan menjelaskan pelajaran dari setiap karya.", "Simpan tiga karya beserta catatan perubahan dan refleksinya."],
  ["Komunikasi", "Bisa menjelaskan satu ide dan merangkum tanggapan teman dengan tepat.", "Tulis ringkasan obrolan berizin dan minta teman memeriksa maksudnya."],
  ["Disiplin", "Bisa mengikuti jadwal latihan singkat selama satu minggu.", "Tunjukkan daftar latihan dan catatan hambatan setiap hari."],
  ["Problem solving", "Bisa membandingkan dua solusi untuk satu masalah sederhana.", "Catat masalah, percobaan, hasil, dan alasan memilih solusi."],
  ["Teknologi", "Bisa membuat tabel sederhana dan menjelaskan fungsi tiga alat digital.", "Simpan tabel berisi sepuluh data rekaan dan catatan langkah pembuatannya."],
  ["Ketelitian", "Bisa menemukan dan memperbaiki lima kesalahan dalam dokumen latihan.", "Tandai kesalahan dan simpan daftar pemeriksaan sebelum menyerahkan tugas."],
  ["Kerja praktik", "Bisa mengikuti urutan kerja pada satu model kertas yang aman.", "Simpan foto model dan catat langkah yang perlu diperbaiki."],
  ["Riset", "Bisa membandingkan dua sumber dan memisahkan temuan dari pendapat.", "Susun tabel sumber, tanggal baca, temuan, dan pertanyaan lanjutan."],
  ["Berpikir kritis", "Bisa memeriksa satu klaim menggunakan dua sumber berbeda.", "Tulis bukti pendukung, keterbatasan, dan kesimpulan sementara."],
  ["Numerik", "Bisa menyelesaikan lima hitungan dasar dan memeriksa satuannya.", "Simpan langkah hitung serta pemeriksaan ulang dengan cara lain."],
  ["Kreativitas", "Bisa membuat tiga gagasan untuk satu kebutuhan sederhana.", "Simpan tiga sketsa dan alasan memilih satu gagasan."],
  ["Logika", "Bisa menyusun lima langkah penyelesaian masalah tanpa lompatan alasan.", "Gambarkan urutan langkah dan uji menggunakan satu contoh berbeda."],
  ["Public speaking", "Bisa menjelaskan satu topik selama dua menit dengan urutan jelas.", "Minta teman memberi catatan tentang pembukaan, isi, dan penutup."],
  ["K3 dasar", "Bisa mengenali tiga bahaya pada gambar tempat kerja dan menyebut tindakan pencegahan.", "Buat daftar bahaya dari gambar; periksa bersama guru sebelum praktik nyata."],
  ["Empati", "Bisa mendengarkan cerita teman tanpa menyimpulkan perasaannya sendiri.", "Tulis ringkasan tanpa identitas dan minta izin untuk memeriksa pemahamanmu."],
  ["Menulis", "Bisa menyusun tiga paragraf dengan gagasan utama yang jelas.", "Simpan tulisan awal, tanggapan pembaca, dan hasil perbaikannya."],
  ["Leadership", "Bisa membagi tugas kecil sesuai kesepakatan kelompok.", "Catat pembagian tugas, pemeriksaan kemajuan, dan evaluasi bersama."],
  ["Bahasa asing", "Bisa memperkenalkan diri dan menjelaskan minat belajar dalam lima kalimat.", "Simpan lima kalimat dan catatan koreksi dari guru bahasa."],
  ["Desain visual", "Bisa membuat satu poster dengan judul dan informasi yang mudah dibaca.", "Bandingkan dua rancangan dan catat tanggapan tiga pembaca berizin."],
  ["Magang industri atau praktik terarah", "Bisa menjelaskan tiga tugas dari pengalaman pengamatan berizin.", "Susun catatan obrolan atau pengamatan tanpa memasuki area terbatas."],
  ["Sertifikasi alat kerja dasar", "Bisa menjelaskan fungsi satu alat dan batas penggunaan latihan yang aman.", "Tunjukkan diagram fungsi dan pertanyaan untuk pembimbing; latihan bukan bukti sertifikasi."],
  ["Edukasi kesehatan dasar", "Bisa merangkum satu pesan kesehatan dari sumber resmi untuk pembaca sebaya.", "Cantumkan sumber dan minta guru memeriksa ringkasan tanpa memberi diagnosis."],
  ["K3 atau keselamatan dasar", "Bisa mengenali tiga risiko pada skenario latihan dan memilih langkah aman.", "Susun daftar risiko bersama guru; hindari mencoba prosedur berbahaya."],
  ["Workshop etika pelayanan", "Bisa memilih respons sopan pada tiga skenario pelayanan rekaan.", "Catat alasan respons dan batas informasi pribadi yang boleh dibagikan."],
  ["Kelas storytelling atau branding", "Bisa menyusun cerita pendek dengan pembuka, masalah, dan penyelesaian.", "Simpan naskah satu halaman dan catatan pembaca tentang pesan utamanya."],
  ["Komunikasi konseling dasar", "Bisa menggunakan tiga pertanyaan terbuka dalam percakapan latihan.", "Catat contoh pertanyaan dan batas peran pendengar bersama guru BK."],
  ["Negosiasi", "Bisa membandingkan dua pilihan kesepakatan dalam permainan peran.", "Tulis kebutuhan kedua pihak dan alasan kesepakatan yang dipilih."],
  ["Portofolio digital", "Bisa menyajikan tiga hasil latihan beserta proses dan refleksinya.", "Simpan folder karya tanpa data pribadi dan tunjukkan urutan perbaikannya."],
  ["Riset sosial dasar", "Bisa menyusun tiga pertanyaan pengamatan yang tidak menghakimi.", "Tunjukkan rancangan pertanyaan dan catatan izin sebelum mengamati orang lain."],
  ["Software desain dasar", "Bisa membuat satu rancangan dengan teks, bentuk, dan susunan yang terbaca.", "Simpan rancangan awal dan hasil perbaikan berdasarkan masukan pembaca."],
  ["CAD atau gambar teknik dasar", "Bisa menggambar satu benda sederhana dengan ukuran yang konsisten.", "Tunjukkan sketsa berdimensi dan periksa ukurannya bersama guru."],
  ["Workshop alat ukur atau simulasi", "Bisa membandingkan tiga ukuran pada gambar atau simulasi aman.", "Simpan tabel pengukuran dan catatan perbedaan hasil."],
  ["Database atau SQL dasar", "Bisa menata sepuluh data rekaan dan memilih data sesuai satu syarat.", "Simpan tabel, aturan pemilihan, dan hasil yang sudah diperiksa."],
  ["Digital marketing dasar", "Bisa membuat satu pesan promosi rekaan untuk kebutuhan pembaca tertentu.", "Simpan pesan, alasan pemilihan pembaca, dan tanggapan teman tanpa membeli iklan."],
  ["Kerja tim", "Bisa menyelesaikan satu tugas dengan pembagian peran yang disepakati.", "Tunjukkan hasil bersama dan catatan kontribusi setiap anggota."],
  ["Presentasi dan analisis pasar", "Bisa menjelaskan perbedaan tiga contoh produk menggunakan data sederhana.", "Susun tabel perbandingan dan tiga halaman presentasi tanpa klaim penjualan."],
  ["Spreadsheet bisnis", "Bisa menghitung jumlah dan rata-rata pada tabel usaha rekaan.", "Simpan tabel sepuluh transaksi rekaan dan periksa dua hasil hitung."],
  ["Cloud, data, atau keamanan dasar", "Bisa menjelaskan perbedaan penyimpanan lokal, penyimpanan daring, dan pencadangan.", "Gambar alur penyimpanan berkas rekaan tanpa membagikan sandi atau data pribadi."],
  ["Dasar pemrograman", "Bisa menyusun aturan sederhana dengan masukan, proses, dan keluaran.", "Tunjukkan urutan aturan dan hasil uji pada tiga contoh."],
  ["GIS dasar", "Bisa membuat peta kertas dengan simbol, arah, dan keterangan sumber.", "Simpan peta tempat umum tanpa menandai lokasi pribadi orang lain."],
  ["Jaringan dasar", "Bisa menjelaskan hubungan tiga perangkat pada diagram jaringan rekaan.", "Tunjukkan diagram dan urutan pemeriksaan tanpa mengubah jaringan milik orang lain."],
  ["Policy brief", "Bisa merangkum satu masalah dan dua pilihan tindakan dalam satu halaman.", "Cantumkan sumber, keterbatasan informasi, dan alasan pilihan sementara."],
  ["Dasar logistik", "Bisa menyusun alur pengiriman lima barang rekaan.", "Simpan diagram alur dan catatan kemungkinan keterlambatan."],
  ["Dasar pajak", "Bisa membedakan tiga istilah pajak dari penjelasan lembaga resmi.", "Tulis ringkasan sumber tanpa menganggap latihan sebagai nasihat perpajakan."],
  ["Food safety", "Bisa mengenali tiga risiko kebersihan dari gambar pengolahan makanan.", "Susun daftar pemeriksaan dan diskusikan dengan guru sebelum praktik."],
  ["IT support fundamental", "Bisa mencatat gejala dan dua kemungkinan penyebab masalah perangkat rekaan.", "Tunjukkan catatan pemeriksaan tanpa membongkar perangkat atau mengubah akun."],
  ["Keselamatan lab", "Bisa membaca simbol bahaya pada tiga contoh label latihan.", "Catat arti simbol dan pertanyaan untuk guru tanpa menggunakan bahan kimia."],
  ["Linux dasar", "Bisa menjelaskan fungsi folder dan izin berkas pada contoh sistem rekaan.", "Simpan diagram folder dan contoh aturan akses tanpa mengubah perangkat utama."],
  ["Penerjemahan dasar", "Bisa menerjemahkan lima kalimat pendek sambil menjelaskan pilihan kata.", "Simpan teks asal, terjemahan, dan koreksi guru bahasa."],
  ["Spreadsheet akuntansi", "Bisa mencatat sepuluh transaksi rekaan dan memeriksa keseimbangan jumlah.", "Simpan tabel dan penjelasan dua koreksi yang kamu lakukan."],
  ["PLC fundamental", "Bisa menggambar aturan hidup dan mati satu lampu dalam simulasi pengendali.", "Tunjukkan diagram dan tiga hasil uji tanpa merakit listrik nyata."],
  ["Instrumentasi dan sensor dasar", "Bisa menjelaskan masukan dan keluaran satu sensor pada diagram rekaan.", "Simpan diagram, tabel pembacaan rekaan, dan pertanyaan untuk pembimbing."],
  ["K3 listrik dasar", "Bisa mengenali tiga bahaya listrik dari gambar latihan.", "Susun daftar bahaya bersama guru tanpa menyentuh instalasi atau merakit rangkaian."],
];
export const skillTargets: SkillTarget[] = targetRows.map(([gap, target, proof]) => ({ gap, target, proof }));

type FieldTargetRow = [gap: string, target: string, proof: string];
const fieldTargetRows: Record<string, FieldTargetRow[]> = {
  "Otomasi dan instrumentasi": [
    ["Teknologi", "Bisa menjelaskan alur sensor, pengendali, dan aktuator pada satu mesin sederhana.", "Simpan diagram blok berlabel dan contoh pembacaan rekaan."],
    ["Problem solving", "Bisa menelusuri tiga penyebab lampu indikator tidak menyala pada diagram rekaan.", "Tulis urutan pemeriksaan dan alasan tiap langkah."],
    ["Ketelitian", "Bisa mencocokkan sepuluh label kabel dan simbol pada diagram latihan.", "Simpan diagram bertanda dan daftar kesalahan yang kamu temukan."],
  ],
  "Elektronika terapan": [
    ["Teknologi", "Bisa membaca nilai lima komponen dari kode warna atau label.", "Simpan tabel komponen dan cara kamu membaca nilainya."],
    ["Ketelitian", "Bisa memeriksa satu diagram rangkaian rekaan dan menemukan tiga sambungan salah.", "Tandai sambungan salah dan tulis perbaikannya."],
  ],
  "HVAC dan instalasi": [
    ["Teknologi", "Bisa menjelaskan fungsi kompresor, kondensor, dan evaporator pada diagram.", "Simpan diagram berlabel dan ringkasan tiga kalimat."],
    ["Ketelitian", "Bisa menyusun daftar pemeriksaan rutin AC dari buku petunjuk resmi.", "Tunjukkan daftar pemeriksaan dan sumber petunjuknya."],
  ],
  "Kendaraan dan perawatan otomotif": [
    ["Teknologi", "Bisa menjelaskan fungsi lima komponen mesin motor dari gambar.", "Simpan gambar berlabel dan penjelasan singkat tiap komponen."],
    ["Ketelitian", "Bisa menyusun jadwal servis berkala dari buku manual kendaraan.", "Tunjukkan tabel jadwal dan halaman manual yang dipakai."],
  ],
  "Mesin terapan dan perawatan": [
    ["Problem solving", "Bisa menyusun tiga kemungkinan penyebab mesin rekaan berbunyi kasar.", "Tulis urutan pemeriksaan dan alasan tiap langkah."],
    ["Ketelitian", "Bisa mengukur lima benda dengan penggaris dan mencatat ukurannya rapi.", "Simpan tabel ukuran dan gambar sederhana tiap benda."],
    ["Logika", "Bisa menjelaskan urutan kerja mesin empat langkah dengan diagram.", "Simpan diagram berurutan dan penjelasan tiap langkah."],
  ],
  "Permesinan kapal dan maritim": [
    ["Disiplin", "Bisa mengikuti jadwal latihan fisik dan belajar selama dua minggu.", "Catat jadwal harian dan hari yang terlewat beserta alasannya."],
    ["Kerja tim", "Bisa membagi tugas dalam simulasi jaga bergiliran bersama dua teman.", "Simpan jadwal giliran dan catatan serah terima rekaan."],
    ["Problem solving", "Bisa menelusuri tiga penyebab mesin diesel rekaan sulit menyala.", "Tulis urutan pemeriksaan dan alasan tiap langkah."],
  ],
  "Operasi tambang terapan": [
    ["Disiplin", "Bisa menyusun dan mengikuti daftar keselamatan sebelum kegiatan lapangan sekolah.", "Simpan daftar keselamatan dan catatan pemeriksaannya."],
    ["Kerja tim", "Bisa membagi peran dalam simulasi rapat keselamatan bersama tiga teman.", "Simpan pembagian peran dan ringkasan keputusan rapat."],
    ["Problem solving", "Bisa membandingkan dua cara mengurangi debu di lokasi kerja rekaan.", "Tulis kelebihan, kekurangan, dan pilihanmu."],
  ],
};
export const skillTargetsBySubCluster: Record<string, SkillTarget[]> = Object.fromEntries(
  Object.entries(fieldTargetRows).map(([key, rows]) => [key, rows.map(([gap, target, proof]) => ({ gap, target, proof }))]),
);

type PlanSeed = [basics: string, project: string, proof: string, practitioner: string];
function fourWeeks([basics, project, proof, practitioner]: PlanSeed): WeekAction[] {
  return [
    { week: 1, action: `Pelajari dasar ${basics} dengan materi gratis di peramban; catat tiga hal baru.`, durationLabel: "2 jam", proof: "Tunjukkan satu halaman catatan dan satu pertanyaan." },
    { week: 2, action: `Buat ${project} memakai kertas atau alat digital gratis.`, durationLabel: "2–3 jam", proof: `Simpan ${proof}.` },
    { week: 3, action: `Tanyakan kepada ${practitioner}${practitioner.startsWith("guru") ? "" : " melalui guru"}: tugas harian, alat yang dipakai, dan skill paling dibutuhkan.`, durationLabel: "20–30 menit", proof: "Catat tiga jawaban dan satu tantangan tanpa merekam data pribadi." },
    { week: 4, action: `Ulangi ${project} dengan satu perbaikan dari jawaban minggu 3.`, durationLabel: "1–2 jam", proof: "Tulis bagian yang kamu nikmati, bagian yang berat, dan keputusan lanjut atau ganti." },
  ];
}

const clusterSeeds: Record<string, PlanSeed> = {
  "Technology & Data": ["pengolahan informasi", "tabel dua puluh data rekaan", "tabel dan penjelasan aturan pengolahan", "pengolah data"],
  "Business & Management": ["pengelolaan kegiatan", "rencana kegiatan kelompok kecil", "rencana pembagian tugas", "pengelola usaha"],
  "Finance & Accounting": ["pencatatan uang", "catatan sepuluh transaksi rekaan", "tabel dan pemeriksaan jumlah", "petugas pembukuan"],
  "Health & Life Sciences": ["pengamatan kesehatan", "poster kebiasaan sehat bersumber resmi", "poster dan daftar sumber", "pendidik kesehatan"],
  "Engineering & Infrastructure": ["rancangan teknik", "gambar benda beserta ukurannya", "gambar dan pemeriksaan ukuran", "praktisi teknik"],
  "Creative & Media": ["penyampaian pesan", "dua rancangan poster kegiatan", "poster dan masukan pembaca", "pembuat konten"],
  "Law, Governance & International": ["aturan masyarakat", "perbandingan dua penjelasan aturan", "tabel sumber dan pertanyaan", "pengajar hukum"],
  "Social, Psychology & Education": ["pengamatan pembelajaran", "rancangan kegiatan belajar singkat", "rancangan dan catatan umpan balik", "pendidik"],
  "Agriculture, Food & Environment": ["pengamatan lingkungan", "catatan pengamatan tanaman sekitar", "tabel pengamatan tanpa percobaan berbahaya", "penyuluh pertanian"],
  "Language & Culture": ["pemahaman bahasa", "ringkasan dua teks pendek", "ringkasan dan catatan pilihan kata", "pengajar bahasa"],
  "Hospitality, Tourism & Culinary": ["pelayanan tamu", "rencana layanan kunjungan rekaan", "alur pelayanan dan daftar kebutuhan", "praktisi pelayanan"],
  "Sports & Physical Performance": ["pengamatan gerak", "catatan teknik gerak dari video", "catatan tanpa latihan berisiko", "guru olahraga"],
  "Vocational & Applied Skills": ["prosedur kerja", "diagram proses kerja sederhana", "diagram dan daftar pemeriksaan", "praktisi bidang terapan"],
};
export const weekPlansByCluster: Record<string, WeekAction[]> = Object.fromEntries(Object.entries(clusterSeeds).map(([key, seed]) => [key, fourWeeks(seed)]));
export const genericWeekPlan = fourWeeks(["bidang pilihanmu", "peta tiga pilihan belajar", "peta pilihan dan alasanmu", "guru atau praktisi bidang terkait"]);

const subClusterSeeds: Record<string, PlanSeed> = {
  "AI dan machine learning": ["pengelompokan data", "pengelompokan dua puluh data rekaan", "tabel dan alasan pengelompokan", "pengolah data"],
  "Acara dan pengalaman": ["perencanaan acara", "rencana acara kelas rekaan", "jadwal dan pembagian tugas", "pengelola acara"],
  "Administrasi dan dokumen": ["penataan dokumen", "sistem folder dokumen rekaan", "diagram folder dan aturan penamaan", "petugas administrasi"],
  "Administrasi dan proses bisnis": ["alur administrasi", "alur peminjaman barang kelas", "diagram alur dan contoh formulir", "petugas administrasi"],
  "Administrasi kesehatan": ["pencatatan layanan", "formulir antrean dengan data rekaan", "formulir tanpa identitas pasien", "petugas administrasi kesehatan"],
  "Air, limbah, dan keberlanjutan": ["penggunaan air", "catatan penggunaan air rumah", "tabel dan gagasan penghematan", "pengajar lingkungan"],
  "Analisis dan perencanaan keuangan": ["perencanaan uang", "anggaran kegiatan rekaan", "anggaran dan alasan pembagian biaya", "perencana keuangan"],
  "Analisis performa olahraga": ["pencatatan pertandingan", "tabel hasil pengamatan pertandingan", "tabel dan dua kesimpulan sementara", "pelatih olahraga"],
  "Animasi dan motion": ["urutan gerak gambar", "enam gambar gerak berurutan", "gambar dan catatan perubahan gerak", "pembuat animasi"],
  "Bahasa dan budaya Jepang": ["percakapan bahasa Jepang", "lima kalimat perkenalan sederhana", "kalimat dan koreksi guru", "pengajar bahasa Jepang"],
  "Bahasa dan budaya Tiongkok": ["percakapan bahasa Mandarin", "lima kalimat tentang kegiatan sekolah", "kalimat dan koreksi guru", "pengajar bahasa Mandarin"],
  "Bahasa, sastra, dan budaya Inggris": ["pemahaman teks Inggris", "ringkasan cerita pendek berbahasa Inggris", "ringkasan dan catatan kosakata", "pengajar bahasa Inggris"],
  "Berita dan reportase": ["pemeriksaan berita", "perbandingan dua berita bertopik sama", "tabel fakta dan sumber", "wartawan"],
  "Bisnis berbasis teknologi": ["layanan usaha digital", "rancangan layanan pemesanan rekaan", "gambar alur dan kebutuhan pengguna", "pengelola usaha digital"],
  "Bisnis pertanian": ["alur usaha pertanian", "peta perjalanan satu hasil pertanian", "peta alur dan pertanyaan biaya", "pelaku usaha pertanian"],
  "Budidaya dan sumber daya perairan": ["pengamatan perairan", "ringkasan dua sumber budidaya", "tabel sumber tanpa percobaan hewan", "penyuluh perikanan"],
  "Bumi, mineral, dan risiko geologi": ["peta risiko bumi", "peta informasi wilayah dari sumber resmi", "peta dan daftar sumber", "pengajar geografi"],
  "Busana dan gaya": ["rancangan busana", "tiga sketsa pakaian kegiatan sekolah", "sketsa dan alasan pilihan bahan", "perancang busana"],
  "Data dan AI": ["pengolahan data", "grafik dua puluh data rekaan", "grafik dan pemeriksaan sumber", "analis data"],
  "Desain benda dan pengalaman": ["kebutuhan pengguna", "model wadah dari kertas bekas", "foto model dan tanggapan pengguna", "perancang produk"],
  "Desain produk digital": ["alur penggunaan aplikasi", "gambar lima layar aplikasi rekaan", "gambar dan hasil uji teman", "perancang aplikasi"],
  "Desain visual dan brand": ["susunan pesan visual", "dua poster kegiatan kelas", "poster dan tanggapan pembaca", "perancang visual"],
  "Destinasi dan pengalaman wisata": ["perencanaan kunjungan", "rencana wisata rekaan tanpa pemesanan", "rencana dan pertanyaan akses", "pemandu wisata"],
  "Diplomasi dan isu global": ["perbandingan isu internasional", "ringkasan dua sudut pandang", "tabel sumber dan perbedaan pandangan", "pengajar hubungan internasional"],
  "Ekonomi publik dan pembangunan": ["pembacaan data ekonomi", "grafik data publik sederhana", "grafik dan batas kesimpulan", "pengajar ekonomi"],
  "Elektronika terapan": ["simbol rangkaian", "diagram sakelar dan lampu rekaan", "diagram tanpa perakitan listrik", "guru elektronika"],
  "Game dan interaksi digital": ["aturan permainan", "permainan papan dengan tiga aturan", "aturan dan catatan percobaan", "perancang permainan"],
  "HVAC dan instalasi": ["alur pendinginan udara", "diagram alur pendinginan rekaan", "diagram tanpa membongkar perangkat", "teknisi pendingin"],
  "Hardware, jaringan, dan sistem tertanam": ["hubungan perangkat", "diagram tiga perangkat saling terhubung", "diagram dan penjelasan aliran data", "teknisi komputer"],
  "Hutan dan konservasi": ["pengamatan tumbuhan", "catatan tiga tumbuhan sekitar", "foto berizin dan catatan pengamatan", "pendidik konservasi"],
  "Ilmu bahasa": ["pola penggunaan bahasa", "perbandingan lima kalimat sehari-hari", "tabel pola dan penjelasanmu", "pengajar bahasa"],
  "Infrastruktur IT terapan": ["penyimpanan berkas", "diagram pencadangan berkas rekaan", "diagram dan daftar risiko", "petugas layanan komputer"],
  "Infrastruktur dan layanan IT": ["layanan jaringan", "diagram layanan komputer sekolah rekaan", "diagram tanpa mengubah jaringan", "pengelola jaringan"],
  "Keahlian teknik terapan": ["pembacaan ukuran", "gambar kotak dengan ukuran konsisten", "gambar dan pemeriksaan satuan", "guru teknik"],
  "Keamanan dan inovasi pangan": ["kebersihan pangan", "poster kebersihan dari sumber resmi", "poster tanpa percobaan konsumsi", "pengajar teknologi pangan"],
  "Keamanan digital": ["perlindungan akun", "daftar pemeriksaan akun rekaan", "daftar tanpa sandi nyata", "pendidik keamanan digital"],
  "Kecantikan dan rias": ["kombinasi warna", "sketsa rias pada gambar wajah", "sketsa tanpa percobaan bahan kulit", "penata rias"],
  "Kejahatan dan sistem sosial": ["pembacaan kasus sosial", "ringkasan kasus publik tanpa identitas", "ringkasan dan pertanyaan etika", "pengajar ilmu sosial"],
  "Kendaraan dan perawatan otomotif": ["fungsi bagian kendaraan", "diagram bagian kendaraan sederhana", "diagram tanpa membongkar kendaraan", "guru otomotif"],
  "Kesehatan dan performa olahraga": ["kebiasaan aktivitas sehat", "catatan aktivitas ringan sehari-hari", "catatan tanpa peningkatan beban latihan", "guru olahraga"],
  "Kesehatan gigi dan mulut": ["edukasi kebersihan mulut", "poster kebiasaan sehat bersumber resmi", "poster yang diperiksa guru", "pendidik kesehatan gigi"],
  "Kesehatan hewan": ["pengamatan perilaku hewan", "catatan perilaku dari video edukasi", "catatan tanpa tindakan pada hewan", "pendidik kesehatan hewan"],
  "Kesehatan ibu dan anak": ["informasi layanan kesehatan", "peta informasi layanan publik", "peta sumber tanpa data pasien", "pendidik kesehatan keluarga"],
  "Kesehatan klinis": ["pembacaan informasi kesehatan", "perbandingan dua materi kesehatan resmi", "tabel sumber tanpa penilaian pasien", "pendidik kesehatan"],
  "Keuangan praktis dan pembukuan digital": ["pencatatan transaksi", "tabel sepuluh transaksi rekaan", "tabel dan pemeriksaan jumlah", "petugas pembukuan"],
  "Konseling pendidikan": ["pertanyaan terbuka", "tiga skenario percakapan rekaan", "pertanyaan dan batas peran pendengar", "guru BK"],
  "Konstruksi dan struktur": ["bentuk struktur", "model jembatan kertas tanpa beban", "foto model dan pertanyaan kekuatan", "guru konstruksi"],
  "Konten digital dan produksi media": ["rencana konten", "naskah video edukasi singkat", "naskah dan urutan gambar", "pembuat konten"],
  "Kota dan kebijakan ruang": ["pengamatan ruang publik", "peta akses fasilitas umum", "peta tanpa alamat pribadi", "pengajar perencanaan kota"],
  "Kuliner dan produksi makanan": ["perencanaan menu", "rencana menu kegiatan rekaan", "menu dan daftar pemeriksaan kebersihan", "pendidik kuliner"],
  "Laboratorium kesehatan": ["pencatatan pengamatan", "tabel hasil pengamatan rekaan", "tabel tanpa sampel biologis", "pendidik laboratorium"],
  "Layanan IT terapan": ["pencatatan masalah perangkat", "catatan tiga masalah komputer rekaan", "catatan gejala dan urutan pemeriksaan", "petugas layanan komputer"],
  "Layanan dan operasional bank": ["alur pelayanan nasabah", "diagram layanan dengan data rekaan", "diagram tanpa data rekening", "praktisi layanan bank"],
  "Layanan hotel": ["alur pelayanan tamu", "skenario penyambutan tamu rekaan", "naskah dan daftar kebutuhan", "praktisi layanan hotel"],
  "Listrik, elektronika, dan energi": ["perubahan energi", "diagram aliran energi sederhana", "diagram tanpa rangkaian listrik nyata", "guru kelistrikan"],
  "Logistik dan distribusi": ["alur distribusi barang", "rencana pengiriman lima barang rekaan", "diagram dan perkiraan hambatan", "pengelola logistik"],
  "Marketing digital praktis": ["penyusunan pesan promosi", "dua pesan promosi usaha rekaan", "pesan dan tanggapan teman", "praktisi pemasaran"],
  "Masyarakat dan perubahan sosial": ["pengamatan kegiatan masyarakat", "peta kegiatan komunitas rekaan", "peta dan pertanyaan pengamatan", "pengajar sosiologi"],
  "Media, PR, dan komunikasi strategis": ["perencanaan pesan publik", "rencana pengumuman kegiatan sekolah", "naskah dan tujuan pembaca", "praktisi komunikasi"],
  "Mesin, energi, dan manufaktur": ["gerak bagian mesin", "model gerak dari kertas", "foto dan diagram gerakan", "guru mesin"],
  "Nutrisi dan edukasi kesehatan": ["informasi gizi umum", "poster gizi dari sumber resmi", "poster tanpa saran diet pribadi", "pendidik gizi"],
  "Obat dan pelayanan farmasi": ["pembacaan informasi obat", "ringkasan label latihan tanpa obat", "ringkasan tanpa anjuran pengobatan", "pendidik farmasi"],
  "Operasi dan proses": ["urutan proses kerja", "diagram proses kegiatan kelas", "diagram dan dua usulan perbaikan", "pengelola operasional"],
  "Operasi keamanan digital": ["pencatatan risiko digital", "tabel risiko akun rekaan", "tabel tanpa pengujian sistem nyata", "pendidik keamanan digital"],
  "Optimasi sistem dan proses": ["perbandingan proses", "dua alur antrean rekaan", "diagram dan perbandingan jumlah langkah", "pengajar teknik industri"],
  "Otomasi dan instrumentasi": ["masukan dan keluaran sensor", "diagram kendali sensor dan lampu", "diagram dan tabel pembacaan rekaan", "guru otomasi"],
  "Permesinan kapal dan maritim": ["cara kerja mesin diesel kapal", "diagram aliran bahan bakar dan pendingin mesin rekaan", "diagram dan daftar pemeriksaan jaga mesin rekaan", "alumni sekolah pelayaran"],
  "Mesin terapan dan perawatan": ["membaca gambar teknik mesin", "gambar tiga pandangan satu benda sederhana", "gambar beserta ukuran dan catatan pemeriksaan", "guru teknik mesin"],
  "Operasi tambang terapan": ["jenis batuan dan mineral", "peta alur kerja tambang dari eksplorasi sampai reklamasi", "peta alur dan daftar risiko keselamatan", "alumni bidang pertambangan"],
  "Pajak dan kepatuhan": ["istilah perpajakan", "ringkasan tiga istilah pajak resmi", "ringkasan sumber tanpa nasihat pajak", "pengajar perpajakan"],
  "Pelaporan dan audit": ["pemeriksaan catatan uang", "pemeriksaan sepuluh transaksi rekaan", "tabel kesalahan dan koreksinya", "pengajar akuntansi"],
  "Pelayanan dan tata kelola publik": ["alur layanan publik", "diagram pengurusan dokumen rekaan", "diagram dan pertanyaan kejelasan layanan", "praktisi pelayanan publik"],
  "Pelayanan keperawatan": ["komunikasi pelayanan", "naskah percakapan layanan rekaan", "naskah tanpa tindakan keperawatan", "pendidik keperawatan"],
  "Pemasaran dan pelanggan": ["kebutuhan pelanggan", "perbandingan tiga produk rekaan", "tabel kebutuhan dan perbedaan produk", "praktisi pemasaran"],
  "Pemetaan, survey, dan data spasial": ["simbol peta", "peta kertas fasilitas umum", "peta dan keterangan sumber", "pengajar pemetaan"],
  "Pemodelan dan optimasi": ["pola perhitungan", "model pembagian tugas rekaan", "tabel dan alasan pembagian", "pengajar matematika"],
  "Pemrograman dan komputasi": ["urutan instruksi", "aturan permainan tebak angka", "aturan dan tiga hasil uji", "pengajar pemrograman"],
  "Pendampingan sosial": ["pemetaan kebutuhan komunitas", "rencana kegiatan bantuan rekaan", "rencana tanpa data penerima nyata", "pendamping komunitas"],
  "Pendidikan dasar": ["penjelasan materi sederhana", "lembar belajar satu topik sekolah", "lembar dan tanggapan guru", "guru sekolah dasar"],
  "Pendidikan usia dini": ["permainan belajar", "rancangan permainan mengenal bentuk", "rancangan yang diperiksa guru", "pendidik anak usia dini"],
  "Pengajaran bahasa": ["penjelasan kosakata", "lembar latihan lima kosakata", "lembar dan koreksi guru", "guru bahasa"],
  "Pengajaran matematika": ["penjelasan langkah hitung", "lembar belajar satu persoalan angka", "langkah penyelesaian dan koreksi guru", "guru matematika"],
  "Pengajaran olahraga": ["penjelasan aturan permainan", "lembar aturan permainan sederhana", "lembar yang diperiksa guru", "guru olahraga"],
  "Pengelolaan organisasi": ["pembagian peran kelompok", "rencana tugas kegiatan kelas", "rencana dan evaluasi pembagian tugas", "pengelola organisasi"],
  "Pengembangan perangkat lunak": ["kebutuhan aplikasi", "rancangan aplikasi daftar kegiatan", "gambar alur dan tiga pengujian", "pengembang perangkat lunak"],
  "Pengembangan usaha": ["kebutuhan usaha", "rencana usaha rekaan satu halaman", "rencana dan pertanyaan calon pengguna", "pengelola usaha"],
  "Perilaku manusia": ["pengamatan perilaku", "catatan perilaku tokoh cerita", "catatan tanpa diagnosis atau identitas", "pengajar psikologi"],
  "Perjalanan dan layanan wisata": ["alur perjalanan", "rencana perjalanan rekaan tanpa pembelian", "rencana dan daftar pertanyaan akses", "praktisi perjalanan wisata"],
  "Politik dan kebijakan": ["perbandingan kebijakan", "ringkasan dua pilihan kebijakan publik", "tabel sumber dan dampak perkiraan", "pengajar ilmu politik"],
  "Produksi audiovisual": ["urutan gambar bercerita", "naskah enam adegan video", "naskah dan rancangan suara", "pembuat video"],
  "Produksi dan kesehatan ternak": ["pencatatan pemeliharaan ternak", "tabel pemeliharaan dengan data rekaan", "tabel tanpa tindakan pada hewan", "penyuluh peternakan"],
  "Promosi dan kebijakan kesehatan": ["pesan kesehatan publik", "poster kegiatan sehat dari sumber resmi", "poster dan tujuan pembaca", "pendidik kesehatan masyarakat"],
  "Proses kimia dan industri": ["alur proses bahan", "diagram proses industri dari bacaan", "diagram tanpa percobaan bahan kimia", "guru kimia"],
  "Rantai pasok dan logistik": ["hubungan pemasok dan pembeli", "peta perjalanan produk rekaan", "peta dan dua risiko keterlambatan", "pengelola rantai pasok"],
  "Regulasi dan advokasi": ["pembacaan aturan publik", "ringkasan hak dari sumber resmi", "ringkasan sumber tanpa nasihat hukum", "pengajar hukum"],
  "Rehabilitasi dan gerak tubuh": ["pengamatan gerak aman", "catatan gerak dari video edukasi", "catatan tanpa terapi atau diagnosis", "pendidik rehabilitasi"],
  "Reputasi dan hubungan publik": ["tanggapan komunikasi publik", "dua respons pengumuman rekaan", "naskah dan alasan pemilihan kata", "praktisi hubungan publik"],
  "Riset dan kebijakan lingkungan": ["pencatatan masalah lingkungan", "peta masalah sampah dari bacaan", "peta dan dua sumber informasi", "pendidik lingkungan"],
  "Riset sains hayati": ["pencatatan pengamatan hayati", "ringkasan percobaan dari bacaan", "tabel tanpa sampel atau bahan", "pengajar biologi"],
  "Risiko dan asuransi": ["perbandingan risiko", "tabel risiko kegiatan rekaan", "tabel tanpa pembelian produk keuangan", "pengajar keuangan"],
  "Ruang dan bangunan": ["susunan ruang", "denah ruang belajar berskala sederhana", "denah dan pemeriksaan ukuran", "perancang bangunan"],
  "SDM dan people development": ["pembagian peran kerja", "rancangan latihan kelompok kecil", "rancangan dan pertanyaan evaluasi", "praktisi pengembangan pegawai"],
  "Sains makhluk hidup": ["pola kehidupan", "catatan tumbuhan dari sumber bacaan", "catatan dan pertanyaan penelitian", "pengajar biologi"],
  "Siaran dan produksi media": ["penyusunan naskah siaran", "naskah pengumuman dua menit", "naskah dan catatan latihan", "praktisi penyiaran"],
  "Sistem informasi praktis dan administrasi IT": ["pencatatan kebutuhan informasi", "formulir peminjaman dengan data rekaan", "formulir dan diagram pengolahan", "petugas administrasi komputer"],
  "Software engineering terapan": ["penyusunan aturan aplikasi", "rancangan daftar tugas sederhana", "rancangan dan tiga hasil uji", "pengembang aplikasi"],
  "Statistik dan riset data": ["ringkasan data angka", "grafik dua puluh data rekaan", "grafik dan pemeriksaan rata-rata", "pengajar statistika"],
  "Tambang, energi, dan operasi lapangan": ["alur kegiatan pertambangan", "peta peran kerja dari bacaan", "peta tanpa kunjungan area tambang", "pengajar pertambangan"],
  "Tanaman dan teknologi pertanian": ["pencatatan pertumbuhan tanaman", "tabel pengamatan tanaman sekitar", "tabel tanpa penggunaan bahan kimia", "penyuluh pertanian"],
  "Tech school dan aplikasi mobile": ["alur aplikasi ponsel", "gambar lima layar aplikasi belajar", "gambar dan tanggapan pengguna", "pengembang aplikasi ponsel"],
  "Tech school dan data praktis": ["pengolahan tabel", "tabel dua puluh data rekaan", "tabel dan dua kesimpulan", "pengolah data"],
  "Tech school dan pengembangan web": ["susunan halaman web", "rancangan tiga halaman informasi kelas", "gambar halaman dan alur pembaca", "pengembang web"],
  "Teknologi dan proses bisnis": ["alur informasi usaha", "diagram pemesanan barang rekaan", "diagram dan kebutuhan pengguna", "analis sistem informasi"],
  "Terjemahan dan lokalisasi": ["pemilihan kata terjemahan", "terjemahan lima petunjuk penggunaan rekaan", "teks dan alasan pilihan kata", "penerjemah"],
  "Testing dan kualitas software": ["pemeriksaan aplikasi", "daftar sepuluh pengujian aplikasi rekaan", "daftar pengujian dan hasil perkiraan", "penguji perangkat lunak"],
};
export const weekPlansBySubCluster: Record<string, WeekAction[]> = Object.fromEntries(Object.entries(subClusterSeeds).map(([key, seed]) => [key, fourWeeks(seed)]));

export const aspirationRoutes: AspirationRoute[] = [
  {
    id: "abroad", keywords: ["luar negeri", "overseas", "internasional", "international", "abroad"], title: "Menjelajahi pendidikan atau kerja di luar negeri",
    steps: [
      "Tentukan negara dan peran yang ingin kamu pahami; pisahkan tujuan belajar dari tujuan bekerja.",
      "Cari informasi pendidikan dan kerja melalui instansi resmi negara tujuan; catat persyaratan yang perlu ditanyakan.",
      "Bandingkan kebutuhan bahasa, pendidikan, dan izin melalui sumber resmi; jangan anggap rekomendasi sebagai bukti kelayakan.",
    ], verify: "Cek sumber resmi lembaga pendidikan dan instansi negara tujuan; konfirmasi ketentuan terbaru sebelum mendaftar atau membayar.",
  },
  {
    id: "japan", keywords: ["jepang", "japan"], title: "Menjelajahi tujuan ke Jepang",
    steps: [
      "Pelajari percakapan bahasa Jepang dasar dengan materi gratis; simpan lima kalimat tentang minat belajarmu.",
      "Cari informasi jalur pendidikan atau kerja ke Jepang dari lembaga resmi; pisahkan pilihan dari persyaratan yang belum dikonfirmasi.",
      "Tanyakan kebutuhan bahasa, pendidikan, dan izin untuk peran tujuan; jangan menyimpulkan kelayakan dari skor rekomendasi.",
    ], verify: "Cek sumber resmi lembaga pendidikan dan instansi terkait Jepang; pastikan syarat bahasa dan izin langsung pada penyelenggara resmi.",
  },
  {
    id: "maritime", keywords: ["maritim", "maritime", "kelautan", "perkapalan", "kapal", "pelayaran"], title: "Menjelajahi pekerjaan kapal dan maritim",
    steps: [
      "Gunakan rekomendasi ini untuk eksplorasi; jangan anggap sebagai jalur langsung menjadi pelaut atau pekerja kapal.",
      "Pelajari program Teknika / Permesinan Kapal (D3/D4); programnya biasanya ada di sekolah atau politeknik pelayaran.",
      "Tanyakan tugas, kebutuhan pendidikan, keselamatan, dan sertifikat kepada lembaga resmi sebelum mempertimbangkan program.",
    ], verify: "Cek sumber resmi sekolah pelayaran dan lembaga terkait; konfirmasi program, persyaratan profesi, dan sertifikat untuk peran tujuan.",
  },
  {
    id: "mining", keywords: ["tambang", "pertambangan", "mining", "mineral"], title: "Menjelajahi bidang pertambangan",
    steps: [
      "Bandingkan peran lapangan, pengolahan data, dan pendukung operasi; rekomendasi ini bukan bukti jalur langsung bekerja di tambang.",
      "Pelajari program Teknik Pertambangan Terapan (D3/D4); cek politeknik yang membukanya melalui sumber resmi.",
      "Tanyakan kebutuhan pendidikan, keselamatan, dan kompetensi untuk peran pilihan; hindari mencoba pekerjaan tambang sebagai latihan mandiri.",
    ], verify: "Cek sumber resmi sekolah, lembaga pendidikan, dan instansi pertambangan; konfirmasi ketersediaan program serta persyaratan peran tujuan.",
  },
  {
    id: "engineering", keywords: ["teknik", "engineer", "engineering", "insinyur", "teknisi"], title: "Menjelajahi pekerjaan teknik",
    steps: [
      "Bandingkan tugas teknisi, perancang, dan pendukung proyek melalui sumber pendidikan resmi.",
      "Coba gambar atau simulasi aman untuk memahami pekerjaan; jangan menyamakan latihan dengan kompetensi profesional.",
      "Tanyakan jalur pendidikan dan persyaratan profesi untuk peran pilihan kepada lembaga terkait.",
    ], verify: "Cek sumber resmi lembaga pendidikan dan instansi profesi terkait; pastikan syarat untuk peran dan lokasi tujuan.",
  },
  {
    id: "helping", keywords: ["membantu", "bantu", "menolong", "mendampingi", "melayani", "pelayanan", "berdampak", "impact"], title: "Menjelajahi kegiatan membantu orang",
    steps: [
      "Pilih satu kebutuhan komunitas yang ingin kamu pahami; tanyakan kebutuhan sebenarnya melalui guru.",
      "Buat rencana bantuan kecil tanpa meminta data pribadi atau menjanjikan penyelesaian masalah.",
      "Diskusikan batas peran, izin, dan pendampingan sebelum mengikuti kegiatan bersama orang lain.",
    ], verify: "Cek sumber resmi penyelenggara kegiatan; konfirmasi izin, pendampingan, dan perlindungan peserta bersama guru.",
  },
  {
    id: "rights", keywords: ["ham", "hak asasi", "keadilan", "advokasi", "memperjuangkan", "hukum", "legal", "kebijakan", "policy", "regulasi"], title: "Menjelajahi hukum, hak, dan kebijakan",
    steps: [
      "Baca satu penjelasan aturan dari sumber resmi; bedakan isi aturan dari pendapat penulis.",
      "Ringkas satu persoalan publik tanpa mencantumkan identitas orang atau memberi nasihat hukum.",
      "Tanyakan perbedaan peran hukum, kebijakan, dan pendampingan kepada pengajar terkait melalui sekolah.",
    ], verify: "Cek sumber resmi aturan dan lembaga pendidikan; konfirmasi persyaratan profesi sebelum menganggap jurusan sebagai jalur praktik hukum.",
  },
  {
    id: "environment", keywords: ["lingkungan", "iklim", "climate", "sustainability", "sustainable", "keberlanjutan", "konservasi", "hutan", "limbah", "alam", "esg"], title: "Menjelajahi lingkungan dan keberlanjutan",
    steps: [
      "Pilih satu persoalan lingkungan sekitar yang dapat diamati tanpa memasuki lokasi berbahaya.",
      "Bandingkan dua sumber tentang persoalan itu; pisahkan pengamatanmu dari kesimpulan yang belum terbukti.",
      "Diskusikan kegiatan pengamatan aman bersama guru atau penyelenggara lingkungan yang dapat diverifikasi.",
    ], verify: "Cek sumber resmi instansi lingkungan dan penyelenggara kegiatan; pastikan izin serta keselamatan sebelum pengamatan lapangan.",
  },
  {
    id: "education", keywords: ["pendidikan", "mengajar", "guru", "sekolah", "anak", "literasi"], title: "Menjelajahi pengajaran dan pembelajaran",
    steps: [
      "Pilih satu materi sekolah yang ingin kamu jelaskan kepada teman.",
      "Buat lembar belajar singkat; minta guru memeriksa isi sebelum digunakan.",
      "Tanyakan kebutuhan pendidikan dan batas pendampingan ketika kegiatan melibatkan anak atau peserta lain.",
    ], verify: "Cek sumber resmi lembaga pendidikan dan penyelenggara; konfirmasi kebutuhan profesi, izin, serta pendampingan kegiatan.",
  },
  {
    id: "health", keywords: ["kesehatan", "medis", "rumah sakit", "dokter", "perawat", "gizi", "mental"], title: "Menjelajahi pendidikan dan layanan kesehatan",
    steps: [
      "Bandingkan tugas beberapa peran kesehatan melalui sumber resmi tanpa menyimpulkan kelayakan profesimu.",
      "Ringkas satu materi edukasi kesehatan; hindari memberi diagnosis, saran pengobatan, atau tindakan pada orang lain.",
      "Tanyakan jalur pendidikan, izin praktik, dan batas kegiatan pengamatan kepada lembaga resmi melalui sekolah.",
    ], verify: "Cek sumber resmi lembaga pendidikan dan instansi kesehatan; konfirmasi persyaratan profesi serta izin kegiatan sebelum memilih jalur.",
  },
];

// A single keyword source; builders can consume these references without duplicating route wording.
export const aspirationRouteKeywordRules: AspirationRouteKeywordRule[] = aspirationRoutes.map(route => ({ routeId: route.id, keywords: [...route.keywords] }));

export const glossary: GlossaryTerm[] = [
  { term: "PLC", plain: "Pengendali terprogram untuk mengatur urutan kerja mesin atau perangkat." },
  { term: "K3", plain: "Keselamatan dan kesehatan kerja; cara mengenali risiko dan mencegah bahaya saat bekerja." },
  { term: "HVAC", plain: "Sistem pengaturan pemanasan, aliran udara, dan pendinginan ruangan." },
  { term: "D3", plain: "Jalur pendidikan diploma tiga dengan pembelajaran bidang terapan.", aliases: ["Diploma 3"] },
  { term: "D4", plain: "Jalur diploma empat atau sarjana terapan dengan pembelajaran bidang terapan.", aliases: ["Diploma 4", "sarjana terapan"] },
  { term: "S1", plain: "Jalur pendidikan sarjana untuk mempelajari bidang ilmu dan penerapannya.", aliases: ["strata satu"] },
  { term: "instrumentasi", plain: "Pengukuran dan pemantauan kondisi menggunakan alat, misalnya sensor suhu." },
  { term: "GIS", plain: "Sistem untuk menyimpan, membaca, dan mengolah informasi yang terhubung dengan lokasi." },
  { term: "portofolio", plain: "Kumpulan karya beserta proses pembuatan dan pelajaran yang kamu peroleh." },
  { term: "magang", plain: "Kegiatan belajar melalui pengalaman kerja dengan aturan dan pendampingan yang perlu dikonfirmasi." },
  { term: "sertifikasi", plain: "Proses penilaian atau pengakuan kemampuan tertentu; cakupan dan persyaratannya perlu diperiksa." },
  { term: "CAD", plain: "Penggunaan perangkat lunak untuk membantu membuat gambar atau rancangan teknik." },
  { term: "AI", plain: "Kecerdasan buatan; alat komputer yang membantu mengolah pola, teks, gambar, atau informasi.", aliases: ["kecerdasan buatan"] },
  { term: "sensor", plain: "Alat yang membaca kondisi tertentu dan menghasilkan informasi pengukuran." },
  { term: "simulasi", plain: "Latihan menggunakan model atau gambaran keadaan tanpa menjalankan pekerjaan nyata." },
  { term: "peramban", plain: "Aplikasi untuk membuka dan membaca halaman di internet." },
  { term: "spreadsheet", plain: "Lembar hitung digital yang menyusun data dalam baris dan kolom." },
  { term: "database", plain: "Kumpulan data yang ditata agar dapat dicari dan diperiksa kembali." },
  { term: "SQL", plain: "Bahasa perintah untuk memilih dan mengolah data dalam tabel tertentu." },
  { term: "cloud", plain: "Layanan pengolahan atau penyimpanan data melalui jaringan, bukan hanya pada perangkat sendiri." },
  { term: "Linux", plain: "Salah satu keluarga sistem operasi yang mengatur kerja perangkat komputer." },
  { term: "IT", plain: "Teknologi informasi; penggunaan komputer dan jaringan untuk mengelola informasi." },
  { term: "teknika kapal", plain: "Bidang pembelajaran dan pekerjaan tentang mesin serta sistem pendukung kapal." },
  { term: "vokasi", plain: "Pendidikan yang menekankan pembelajaran terapan dan persiapan keterampilan bidang kerja." },
  { term: "kompetensi", plain: "Kemampuan yang dapat ditunjukkan melalui pengetahuan, keterampilan, dan tindakan yang sesuai." },
  { term: "lisensi", plain: "Izin untuk kegiatan tertentu; aturan dan pihak pemberinya perlu diperiksa secara resmi." },
  { term: "visa", plain: "Izin terkait kunjungan ke negara lain; jenis dan ketentuannya perlu dikonfirmasi pada instansi resmi." },
  { term: "advokasi", plain: "Upaya menyampaikan kebutuhan atau memperjuangkan hak dengan cara yang bertanggung jawab." },
  { term: "regulasi", plain: "Aturan yang dibuat pihak berwenang dan perlu dibaca dari sumber resminya." },
  { term: "logistik", plain: "Pengaturan perjalanan barang, penyimpanan, dan kebutuhan pengirimannya." },
  { term: "rantai pasok", plain: "Hubungan pihak yang menyediakan bahan, membuat produk, dan menyalurkannya kepada pengguna." },
  { term: "audit", plain: "Pemeriksaan terencana untuk membandingkan catatan atau proses dengan ketentuan yang digunakan." },
  { term: "branding", plain: "Cara membentuk identitas dan pesan agar suatu kegiatan atau produk mudah dikenali." },
  { term: "storytelling", plain: "Cara menyampaikan pesan melalui cerita yang memiliki urutan dan tujuan jelas." },
  { term: "policy brief", plain: "Ringkasan masalah, bukti, dan pilihan tindakan untuk membantu pembahasan kebijakan." },
  { term: "food safety", plain: "Keamanan pangan; perhatian terhadap risiko yang dapat membuat makanan tidak aman dikonsumsi." },
  { term: "public speaking", plain: "Keterampilan menyampaikan gagasan secara lisan di hadapan orang lain." },
  { term: "leadership", plain: "Keterampilan mengarahkan kerja bersama, membagi peran, dan menjaga kesepakatan kelompok." },
  { term: "problem solving", plain: "Keterampilan mengenali masalah, membandingkan pilihan, mencoba solusi, dan memeriksa hasilnya." },
  { term: "BK", plain: "Bimbingan dan konseling; layanan sekolah untuk mendiskusikan belajar, diri, dan rencana pendidikan." },
];

export const fieldAiNotes: FieldAiNote[] = [
  { cluster: "Technology & Data", note: "Uji contoh kode atau ringkasan data dari AI. Periksa hasilnya dengan data rekaan dan catat kesalahan yang ditemukan." },
  { cluster: "Business & Management", note: "Bandingkan rancangan kegiatan dari AI dengan kebutuhan pengguna. Jelaskan asumsi dan pembagian tugas sebelum memilih rencana." },
  { cluster: "Finance & Accounting", note: "Periksa pola transaksi rekaan dengan bantuan AI. Hitung ulang jumlahnya dan hindari memasukkan informasi keuangan pribadi." },
  { cluster: "Health & Life Sciences", note: "Gunakan AI untuk merangkum materi belajar kesehatan. Cocokkan dengan sumber resmi dan jangan gunakan hasil latihan untuk menilai pasien." },
  { cluster: "Engineering & Infrastructure", note: "Bandingkan rancangan awal dengan bantuan AI. Periksa ukuran dan keselamatan bersama pembimbing sebelum mencoba pekerjaan nyata." },
  { cluster: "Creative & Media", note: "Jelajahi variasi gagasan visual dengan AI. Jelaskan pilihan desainmu dan periksa izin penggunaan bahan sebelum membagikan karya." },
  { cluster: "Law, Governance & International", note: "Susun pertanyaan bacaan hukum dengan bantuan AI. Periksa aturan pada sumber resmi karena ringkasan bukan nasihat hukum." },
  { cluster: "Social, Psychology & Education", note: "Rancang lembar belajar dengan bantuan AI. Periksa kesesuaiannya bersama guru tanpa memasukkan cerita pribadi peserta." },
  { cluster: "Agriculture, Food & Environment", note: "Bandingkan ringkasan pengamatan lingkungan dari AI. Periksa kondisi setempat bersama pembimbing dan hindari menganggap perkiraan sebagai hasil pengukuran." },
  { cluster: "Language & Culture", note: "Coba penjelasan kosakata dari AI. Periksa makna, konteks budaya, dan pilihan kata bersama sumber bahasa atau guru." },
  { cluster: "Hospitality, Tourism & Culinary", note: "Latih skenario layanan tamu dengan bantuan AI. Periksa kebutuhan tamu dan prosedur kebersihan melalui pembimbing sebelum praktik." },
  { cluster: "Sports & Physical Performance", note: "Susun catatan pengamatan gerak dengan bantuan AI. Minta guru memeriksa teknik dan hindari mengikuti peningkatan beban latihan tanpa pendampingan." },
  { cluster: "Vocational & Applied Skills", note: "Buat daftar pemeriksaan kerja dengan bantuan AI. Cocokkan dengan petunjuk alat dan arahan guru sebelum melakukan praktik." },
];

export const studentGuidance: StudentGuidanceCatalog = {
  skillTargets, skillTargetsBySubCluster, weekPlansBySubCluster, weekPlansByCluster, genericWeekPlan,
  aspirationRoutes, aspirationRouteKeywordRules, glossary, fieldAiNotes,
};
