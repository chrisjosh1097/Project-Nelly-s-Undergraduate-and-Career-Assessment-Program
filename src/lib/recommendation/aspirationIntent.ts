import { careersById, type Major as KnowledgeMajor } from "../../../data";
import type { StudentAnswer } from "@/lib/types";
import { unique } from "@/lib/utils";

const EXACT_PHRASE_BOOST = 6;
const KEYWORD_PAIR_BOOST = 4;
const MIN_KEYWORD_PAIR_MATCHES = 2;

type AspirationRule = {
  keywords: string[];
  /** v3.2.0: one strong role keyword is enough for the keyword boost. */
  strongKeywords?: string[];
};

const GOVERNMENT_ROLE_KEYWORDS = ["staf khusus", "stafsus", "pns", "asn", "kementerian", "kebijakan publik", "gubernur", "dpr", "birokrat", "pemerintahan"];

const aspirationRulesByMajorId: Record<string, AspirationRule> = {
  informatika: {
    keywords: ["algoritma", "pemrograman", "programming", "coding", "software", "aplikasi", "website", "backend", "frontend"]
  },
  sistem_informasi: {
    keywords: ["sistem", "informasi", "bisnis", "proses", "organisasi", "product", "produk", "analyst", "analisis"]
  },
  data_science: {
    keywords: ["data", "statistik", "statistika", "machine learning", "analitik", "analytics", "dashboard", "model"]
  },
  cybersecurity: {
    keywords: ["cyber", "security", "keamanan", "hacker", "ethical hacking", "jaringan", "forensik", "siber"]
  },
  artificial_intelligence: {
    keywords: ["ai", "artificial intelligence", "kecerdasan buatan", "machine learning", "model", "otomasi", "robot"]
  },
  software_engineering: {
    keywords: ["software", "engineering", "aplikasi", "website", "program", "developer", "full stack", "backend", "frontend"]
  },
  teknologi_informasi: {
    keywords: ["it", "teknologi informasi", "jaringan", "cloud", "server", "sistem", "support", "infrastruktur digital"]
  },
  game_technology: {
    keywords: ["game", "gaming", "unity", "unreal", "level", "gameplay", "animasi", "interaktif"]
  },
  teknik_komputer: {
    keywords: ["komputer", "hardware", "perangkat keras", "embedded", "mikrokontroler", "jaringan", "iot", "robot"]
  },
  statistika: {
    keywords: ["statistik", "statistika", "probabilitas", "data", "riset", "survei", "model", "prediksi"]
  },
  manajemen: {
    keywords: ["manajemen", "manager", "mengelola", "bisnis", "tim", "operasional", "strategi", "organisasi"]
  },
  bisnis_digital: {
    keywords: ["bisnis digital", "startup", "ecommerce", "produk digital", "marketplace", "online", "growth", "digital"]
  },
  marketing: {
    keywords: ["marketing", "pemasaran", "brand", "iklan", "jualan", "konten", "campaign", "customer"]
  },
  akuntansi: {
    keywords: ["akuntansi", "accounting", "audit", "laporan keuangan", "pajak", "pembukuan", "keuangan"]
  },
  keuangan: {
    keywords: ["keuangan", "finance", "investasi", "bank", "risiko", "financial", "pasar modal", "uang"]
  },
  kedokteran: {
    keywords: ["dokter", "kedokteran", "medis", "pasien", "diagnosis", "rumah sakit", "klinis"]
  },
  keperawatan: {
    keywords: ["perawat", "keperawatan", "pasien", "rumah sakit", "klinis", "pelayanan", "care"]
  },
  farmasi: {
    keywords: ["farmasi", "apoteker", "obat", "resep", "klinik", "laboratorium", "pharmacy"]
  },
  gizi: {
    keywords: ["gizi", "nutrisi", "makanan", "diet", "kesehatan", "pangan", "nutrition"]
  },
  kesehatan_masyarakat: {
    keywords: ["kesehatan masyarakat", "public health", "promosi kesehatan", "epidemiologi", "komunitas", "pencegahan"]
  },
  psikologi: {
    keywords: ["psikologi", "psikolog", "konseling", "mental", "perilaku", "emosi", "manusia"]
  },
  bimbingan_konseling: {
    keywords: ["bk", "bimbingan", "konseling", "konselor", "siswa", "sekolah", "mental"]
  },
  hukum: {
    keywords: ["hukum", "law", "pengacara", "advokat", "keadilan", "hak", "regulasi", "kasus"]
  },
  hubungan_internasional: {
    keywords: ["hubungan internasional", "diplomasi", "diplomat", "global", "internasional", "politik luar negeri"]
  },
  administrasi_publik: {
    keywords: ["administrasi publik", "kebijakan", "pemerintah", "layanan publik", "birokrasi", "governance"],
    strongKeywords: GOVERNMENT_ROLE_KEYWORDS
  },
  ilmu_politik: {
    keywords: ["politik", "politisi", "partai", "demokrasi", "kebijakan", "pemilu", "parlemen", "pemerintah"],
    strongKeywords: GOVERNMENT_ROLE_KEYWORDS
  },
  komunikasi: {
    keywords: ["komunikasi", "media", "public speaking", "campaign", "brand", "konten", "publik"]
  },
  jurnalistik: {
    keywords: ["jurnalistik", "jurnalis", "berita", "reporter", "wawancara", "media", "liputan"]
  },
  public_relations: {
    keywords: ["public relations", "pr", "humas", "reputasi", "brand", "media", "komunikasi publik"]
  },
  desain_komunikasi_visual: {
    keywords: ["desain", "visual", "dkv", "branding", "ilustrasi", "grafis", "logo", "konten"]
  },
  animasi: {
    keywords: ["animasi", "motion", "karakter", "storyboard", "3d", "2d", "film"]
  },
  film_televisi: {
    keywords: ["film", "televisi", "sutradara", "produksi", "kamera", "editing", "video"]
  },
  arsitektur: {
    keywords: ["arsitektur", "arsitek", "bangunan", "ruang", "interior", "eksterior", "desain bangunan", "gedung"]
  },
  teknik_sipil: {
    keywords: ["sipil", "civil", "konstruksi", "struktur", "struktural", "bangunan", "gedung", "jalan", "jembatan", "site", "proyek", "infrastruktur", "transportasi", "drainase"]
  },
  teknik_mesin: {
    keywords: ["mesin", "mekanika", "mekanik", "manufaktur", "otomotif", "maintenance", "energi", "material", "alat"]
  },
  teknik_elektro: {
    keywords: ["elektro", "listrik", "elektronika", "rangkaian", "otomasi", "kontrol", "telekomunikasi", "energi"]
  },
  teknik_industri: {
    keywords: ["industri", "quality", "supply chain", "operasi", "proses", "efisiensi", "pabrik", "produksi", "logistik"]
  },
  teknik_kimia: {
    keywords: ["kimia", "proses", "material", "pabrik", "industri", "reaksi", "quality control", "laboratorium"]
  },
  teknik_lingkungan: {
    keywords: ["lingkungan", "limbah", "air", "amdal", "sanitasi", "polusi", "keberlanjutan", "sustainability"]
  },
  perencanaan_wilayah_kota: {
    keywords: ["kota", "wilayah", "urban", "transportasi", "tata ruang", "pemukiman", "perencanaan", "infrastruktur"]
  },
  teknik_logistik: {
    keywords: ["logistik", "supply chain", "gudang", "distribusi", "transportasi", "operasi", "rantai pasok"]
  },
  teknik_geologi: {
    keywords: ["geologi", "batuan", "tambang", "mineral", "geoteknik", "lapangan", "bumi"]
  },
  teknik_pertambangan: {
    keywords: ["tambang", "pertambangan", "mining", "mineral", "batubara", "geologi", "eksplorasi"]
  },
  teknik_geomatika_gis: {
    keywords: ["gis", "geospasial", "peta", "mapping", "survey", "drone", "lahan", "koordinat"]
  },
  pendidikan_guru_sekolah_dasar: {
    keywords: ["guru sd", "mengajar", "anak", "sekolah dasar", "pendidikan", "kelas", "belajar"]
  },
  pendidikan_bahasa_inggris: {
    keywords: ["bahasa inggris", "english", "mengajar", "penerjemah", "grammar", "speaking"]
  },
  pendidikan_matematika: {
    keywords: ["matematika", "mengajar", "guru", "angka", "logika", "kelas"]
  },
  pariwisata: {
    keywords: ["pariwisata", "travel", "wisata", "tour", "destinasi", "hotel", "hospitality"]
  },
  perhotelan: {
    keywords: ["hotel", "perhotelan", "hospitality", "tamu", "front office", "service", "akomodasi"]
  },
  tata_boga: {
    keywords: ["kuliner", "masak", "chef", "makanan", "restoran", "resep", "pangan"]
  },
  agribisnis: {
    keywords: ["agribisnis", "pertanian", "bisnis", "pangan", "petani", "komoditas", "supply"]
  },
  teknologi_pangan: {
    keywords: ["pangan", "makanan", "food", "quality", "keamanan pangan", "produksi", "laboratorium"]
  },
  ilmu_lingkungan: {
    keywords: ["lingkungan", "konservasi", "iklim", "sustainability", "hutan", "limbah", "alam"]
  },
  sport_science: {
    keywords: ["sport", "olahraga", "performa", "atlet", "latihan", "fisik", "kebugaran"]
  },
  vokasi_teknik: {
    keywords: ["vokasi teknik", "alat", "bengkel", "praktik", "workshop", "industri", "teknisi"]
  },
  teknik_otomotif: {
    keywords: ["otomotif", "mobil", "motor", "kendaraan", "mesin", "bengkel", "mekanik"]
  },
  teknik_pendingin_tata_udara: {
    keywords: ["pendingin", "ac", "hvac", "tata udara", "refrigerasi", "instalasi", "teknisi"]
  },
  uiux_design_applied: {
    keywords: ["ui", "ux", "user experience", "user interface", "prototype", "figma", "aplikasi", "desain"]
  },
  web_development_applied: {
    keywords: ["web", "website", "frontend", "backend", "developer", "aplikasi", "coding"]
  },
  data_analytics_applied: {
    keywords: ["data analytics", "data analyst", "dashboard", "spreadsheet", "sql", "visualisasi", "laporan"]
  },
  network_cloud_operations: {
    keywords: ["network", "cloud", "jaringan", "server", "operasi", "devops", "infrastruktur"]
  },
  teknika_permesinan_kapal: {
    keywords: ["kapal", "pelaut", "pelayaran", "maritim", "laut", "mesin kapal", "galangan", "teknika", "engineer", "mesin"]
  },
  teknik_mesin_terapan: {
    keywords: ["mesin", "mekanik", "mekanika", "maintenance", "perawatan", "manufaktur", "bengkel", "produksi", "engineer"]
  },
  teknik_pertambangan_terapan: {
    keywords: ["tambang", "pertambangan", "mining", "mineral", "batubara", "alat berat", "geologi", "engineer"]
  }
};

function normalizeAspirationText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s/+.]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function aspirationText(answer: StudentAnswer) {
  return normalizeAspirationText(`${answer.dreamProfession} ${answer.futureVision}`);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tokenCount(value: string) {
  const normalized = normalizeAspirationText(value);
  return normalized ? normalized.split(" ").length : 0;
}

function hasPhrase(text: string, phrase: string) {
  const normalizedPhrase = normalizeAspirationText(phrase);
  if (normalizedPhrase.length < 3) return false;
  return new RegExp(`(?:^|\\s)${escapeRegExp(normalizedPhrase)}(?=\\s|$)`).test(text);
}

function exactPhrasesForMajor(major: KnowledgeMajor) {
  const majorPhrases = [major.name, ...major.alternativeNames].filter((phrase) => normalizeAspirationText(phrase).length >= 4);
  const careerPhrases = major.relatedCareers
    .map((careerId) => careersById[careerId]?.title ?? careerId)
    .filter((phrase) => tokenCount(phrase) > 1);
  const directionPhrases = major.careerDirections.filter((phrase) => tokenCount(phrase) > 1);

  return unique([...majorPhrases, ...careerPhrases, ...directionPhrases]);
}

function keywordPairMatches(text: string, major: KnowledgeMajor) {
  const keywords = aspirationRulesByMajorId[major.id]?.keywords ?? [];
  return unique(keywords.filter((keyword) => hasPhrase(text, keyword))).slice(0, 5);
}

export function scoreAspirationMajorIntent(answer: StudentAnswer, major: KnowledgeMajor) {
  const text = aspirationText(answer);
  if (!text) {
    return {
      boost: 0,
      matchedSignals: []
    };
  }

  const exactMatches = exactPhrasesForMajor(major)
    .filter((phrase) => hasPhrase(text, phrase))
    .map(normalizeAspirationText)
    .slice(0, 5);

  if (exactMatches.length > 0) {
    return {
      boost: EXACT_PHRASE_BOOST,
      matchedSignals: exactMatches
    };
  }

  const matchedKeywords = keywordPairMatches(text, major);
  const strongMatches = unique((aspirationRulesByMajorId[major.id]?.strongKeywords ?? []).filter((keyword) => hasPhrase(text, keyword)));
  if (matchedKeywords.length >= MIN_KEYWORD_PAIR_MATCHES || strongMatches.length > 0) {
    return {
      boost: KEYWORD_PAIR_BOOST,
      matchedSignals: unique([...strongMatches, ...matchedKeywords]).slice(0, 5)
    };
  }

  return {
    boost: 0,
    matchedSignals: []
  };
}
