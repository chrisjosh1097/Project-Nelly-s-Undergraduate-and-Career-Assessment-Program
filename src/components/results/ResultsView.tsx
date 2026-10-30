"use client";
import {useState} from "react";
import {Download,ArrowUpRight} from "lucide-react";
import {Badge} from "@/components/ui/Badge";
import {Button} from "@/components/ui/Button";
import {Panel} from "@/components/ui/Panel";
import {StatusMessage} from "@/components/ui/StatusMessage";
import {useAuth} from "@/components/auth/AuthProvider";
import {educationPathwayLabel} from "@/lib/assessment/pathways";
import {studentStrengthHighlightsFor} from "@/lib/recommendation/display";
import {generatePtnPtsVokasiAdvice} from "@/lib/recommendation/advice";
import {downloadBlob,formatDateTime} from "@/lib/utils";
import type {Submission} from "@/lib/types";
import {RecommendationCard} from "./RecommendationCard";
import {createInstagramCardBlob} from "./shareCard";
export function ResultsView({submission,compact=false}:{submission:Submission;compact?:boolean}){
 const{getToken}=useAuth();const[error,setError]=useState(""),[busy,setBusy]=useState("");
 const top=submission.report.topRecommendation;const advice=submission.report.ptnPtsVokasiAdvice??generatePtnPtsVokasiAdvice(submission.answers);
 async function download(kind:"pdf"|"image"){
  if(busy)return;setBusy(kind);setError("");
  try{if(kind==="image")downloadBlob(await createInstagramCardBlob(submission),`kartu-instagram-${submission.id}.png`);else{const token=await getToken();const response=await fetch("/api/submissions/pdf",{headers:{authorization:`Bearer ${token}`}});if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.error??"Unduhan gagal. Coba lagi.")}downloadBlob(await response.blob(),`laporan-${submission.id}.pdf`)}}
  catch(e){setError(e instanceof Error?e.message:"Unduhan gagal.")}finally{setBusy("")}
 }
 return <div className="space-y-6"><header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="eyebrow">Peta arahmu · {formatDateTime(submission.createdAt)}</p><h1 className="section-heading mt-3">Banyak potensi. Ini titik mulainya.</h1><p className="mt-3 text-sm leading-7 text-stone-600">{submission.fullName} · {submission.school} · {submission.className}</p><div className="mt-2"><Badge>{educationPathwayLabel(submission.answers.educationPathway)}</Badge></div></div>{!compact?<div className="grid gap-2 sm:flex lg:shrink-0"><Button onClick={()=>download("pdf")} disabled={!!busy}><Download size={16}/>{busy==="pdf"?"Mengunduh…":"Laporan PDF"}</Button><Button variant="secondary" onClick={()=>download("image")} disabled={!!busy}><ArrowUpRight size={16}/>{busy==="image"?"Membuat…":"Kartu Instagram"}</Button></div>:null}</header>
 {error?<StatusMessage tone="error">{error}</StatusMessage>:null}
 <div className="result-grid"><section className="rounded-[22px] bg-ink p-6 text-white sm:p-8"><p className="text-xs font-bold uppercase tracking-wider text-orange-200">01 / Rekomendasi utama{top.degreeTypes?.length?` · ${top.degreeTypes.join(" / ")}`:""}</p><h2 className="my-5 text-4xl font-extrabold sm:text-5xl">{top.majorName}</h2><p className="text-sm leading-7 text-stone-200">{top.personalizedCareerDirection||top.careerDirection}</p><div className="mt-7 grid grid-cols-2 gap-5 border-t border-white/20 pt-5">{[{label:"Kecocokan profil",value:top.overallFitScore},{label:"Ketahanan terhadap perubahan AI",value:top.aiFutureResilienceScore}].map(item=><div key={item.label}><strong className="text-4xl text-orange-200">{item.value}<span className="text-sm text-white/70">/100</span></strong><p className="mt-2 text-xs leading-6 text-stone-200">{item.label}</p></div>)}</div><p className="mt-5 text-xs leading-6 text-stone-300">Skor kecocokan bukan peluang diterima. Ketahanan AI bukan jaminan pekerjaan.</p></section>
 <Panel><p className="eyebrow">Kelebihan kamu</p><ul className="mt-5 space-y-5 text-sm leading-7">{studentStrengthHighlightsFor(submission).map((s,i)=><li key={i} className="border-b border-stone-100 pb-4">{s}</li>)}</ul></Panel></div>
 <RecommendationCard recommendation={top} expanded/>
 {submission.answers.dreamProfession||submission.answers.futureVision?<Panel><h2 className="text-xl font-bold">Aspirasi yang kamu tulis</h2><p className="mt-4 text-sm leading-7">{submission.answers.dreamProfession}</p><p className="mt-3 text-sm leading-7 text-stone-600">{submission.answers.futureVision}</p></Panel>:null}
 <section><h2 className="section-heading mb-5">Arah lain untuk dijelajahi</h2><div className="space-y-3">{submission.report.recommendations.slice(1).map(r=><RecommendationCard key={r.majorId} recommendation={r}/>)}</div></section>
 <div className="result-grid"><Panel><h2 className="text-xl font-bold">Kampus dan jalur belajarmu</h2><ul className="mt-5 list-disc space-y-3 pl-5 text-sm leading-7 text-stone-600">{advice.map((a,i)=><li key={i}>{a}</li>)}</ul></Panel><Panel><h2 className="text-xl font-bold">Memahami kedua skor</h2><p className="mt-4 text-sm leading-7 text-stone-600">Kecocokan profil: 82–100 sangat cocok; 70–81 cocok; 58–69 cukup cocok; di bawah 58 perlu dipertimbangkan lagi.</p><p className="mt-4 text-sm leading-7 text-stone-600">Ketahanan AI: 80–100 tinggi; 60–79 sedang; di bawah 60 perlu adaptasi tinggi. Ini menggambarkan kebutuhan kemampuan manusia dan potensi AI sebagai alat bantu, bukan prediksi pasti.</p><p className="mt-4 text-xs leading-6 text-stone-600">Versi skor: {submission.report.scoringVersion}. {submission.report.narrative?.source==="gemini"?"Penjelasan telah diperkaya tanpa mengubah skor.":"Penjelasan berbasis aturan penilaian."}</p></Panel></div>
 {submission.report.answerPatternNotes?.length?<StatusMessage>{submission.report.answerPatternNotes.map((n,i)=><p key={i}>{n}</p>)}</StatusMessage>:null}
 <p className="border-t border-stone-200 pt-5 text-xs leading-7 text-stone-600"><strong>Hasil ini hanya analisis berdasarkan jawaban yang kamu isi, bukan fakta mutlak atau keputusan final.</strong> Gunakan untuk diskusi dengan orang tua, guru BK, atau mentor.</p>
 </div>;
}
