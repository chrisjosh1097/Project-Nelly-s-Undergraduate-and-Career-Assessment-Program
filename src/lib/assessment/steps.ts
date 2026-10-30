import type {EducationPathway,StudentAnswer} from "@/lib/types";
import {schoolMajorOptions,favoriteSubjectOptions,favoriteActivityOptions,skillStrengthOptions,workStyleOptions,problemAreaOptions,collegePathPreferenceOptions,personalConstraintOptions,techComfortOptions} from "./options";
export type AssessmentSection="profile"|"direction"|"interests"|"considerations"|"review";
type Base={title:string;section:AssessmentSection;guidance?:string;options?:readonly string[]};
export type AssessmentStep=Base & (
 {key:keyof StudentAnswer;type:"text"|"email"|"single"|"multi"|"textarea"|"pathway"} |
 {key:"profileDetails";type:"profile"} |
 {key:"review";type:"review"}
);
export const assessmentSections:Record<AssessmentSection,string>={profile:"Profil & latar sekolah",direction:"Arah pendidikan",interests:"Minat & kekuatan",considerations:"Pertimbanganmu",review:"Tinjau & kirim"};
export function getAssessmentSteps(pathway?:EducationPathway):AssessmentStep[]{
 const activityHelp=pathway==="vocational"?"Pilih maksimal 3 aktivitas yang kamu sukai, misalnya praktik alat, proyek, atau kegiatan usaha.":pathway==="university"?"Pilih maksimal 3 aktivitas yang kamu sukai, misalnya eksplorasi ide, analisis, atau eksperimen.":"Pilih maksimal 3 aktivitas yang paling menggambarkan dirimu.";
 return [
 {key:"fullName",title:"Nama lengkap",section:"profile",type:"text"},
 {key:"email",title:"Email Google terverifikasi",section:"profile",type:"email",guidance:"Email dari akun Google yang sedang masuk, tidak dapat diubah."},
 {key:"profileDetails",title:"Sedikit tentang dirimu",section:"profile",type:"profile",guidance:"Gender dan umur hanya untuk analitik admin, bukan penentu rekomendasi."},
 {key:"school",title:"Asal sekolah",section:"profile",type:"text"},
 {key:"className",title:"Kelas",section:"profile",type:"text"},
 {key:"currentSchoolMajor",title:"Jurusan sekolah saat ini",section:"profile",type:"single",options:schoolMajorOptions},
 {key:"educationPathway",title:"Setelah lulus, kamu ingin belajar lewat jalur apa?",section:"direction",type:"pathway",guidance:"Kami menyesuaikan pertanyaan dan rekomendasi dengan rencanamu. Kamu bisa mengubah pilihan sebelum mengirim."},
 {key:"favoriteSubjects",title:"Mata pelajaran yang paling disukai",section:"interests",type:"multi",options:favoriteSubjectOptions,guidance:"Pilih maksimal 3 mata pelajaran yang paling kamu nikmati."},
 {key:"favoriteActivities",title:"Aktivitas apa yang paling kamu nikmati?",section:"interests",type:"multi",options:favoriteActivityOptions,guidance:activityHelp},
 {key:"skillStrengths",title:"Skill atau kekuatan utamamu",section:"interests",type:"multi",options:skillStrengthOptions},
 {key:"workStyle",title:"Gaya kerja yang paling cocok",section:"interests",type:"single",options:workStyleOptions},
 {key:"problemAreas",title:"Masalah apa yang ingin kamu bantu selesaikan?",section:"interests",type:"multi",options:problemAreaOptions},
 {key:"collegePathPreferences",title:"Preferensi kampus dan lokasi",section:"considerations",type:"multi",options:collegePathPreferenceOptions,guidance:"PTN dan PTS bisa menawarkan S1 maupun vokasi. Pilih yang sesuai pertimbanganmu."},
 {key:"personalConstraints",title:"Apa yang perlu kamu pertimbangkan?",section:"considerations",type:"multi",options:personalConstraintOptions},
 {key:"techComfort",title:"Seberapa nyaman kamu dengan teknologi dan AI?",section:"considerations",type:"single",options:techComfortOptions},
 {key:"dreamProfession",title:"Profesi impian atau bidang yang membuatmu penasaran",section:"considerations",type:"textarea",guidance:"Opsional. Tulis singkat, atau lewati jika masih mengeksplorasi."},
 {key:"futureVision",title:"Kamu ingin masa depan seperti apa?",section:"considerations",type:"textarea",guidance:"Opsional. Ceritakan dalam 2–4 kalimat jika sudah punya gambaran."},
 {key:"review",title:"Sudah menggambarkan dirimu?",section:"review",type:"review",guidance:"Periksa jawabanmu sebelum mengirim. Satu email Google hanya dapat mengirim satu asesmen."}
 ];
}
