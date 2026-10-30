import type {RecommendationResult} from "@/lib/types";
import {Badge} from "@/components/ui/Badge";
import {ChevronDown} from "lucide-react";
function Lines({title,items}:{title:string;items?:string[]}){return items?.length?<section><h3 className="mb-3 text-sm font-bold">{title}</h3><ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-stone-600">{items.map((line,i)=><li key={i}>{line}</li>)}</ul></section>:null}
export function RecommendationCard({recommendation:r,expanded=false}:{recommendation:RecommendationResult;expanded?:boolean}){
 const body=<div className="space-y-6 pt-6">
 <p className="text-sm leading-7 text-stone-600">{r.personalizedCareerDirection||r.careerDirection}</p>
 <div className="flex flex-wrap gap-2">{r.degreeTypes?.map(d=><Badge key={d}>{d}</Badge>)}<Badge>{r.fitLabel}</Badge></div>
 <div className="grid gap-6 md:grid-cols-2"><Lines title="Kenapa cocok" items={r.reasonBullets}/><Lines title="Karier yang sesuai" items={r.nicheCareerPaths?.length?r.nicheCareerPaths:r.relatedCareers}/><Lines title="Kekuatan yang mendukung" items={r.skillStrengthMatches}/><Lines title="Skill yang perlu ditingkatkan" items={r.skillGaps}/><Lines title="Langkah berikutnya" items={r.recommendedNextSteps}/><Lines title="Hal yang perlu dipertimbangkan" items={[...r.cautionNotes,...(r.careerCautions??[])]}/></div>
 {r.careerPersonalizationReason?<p className="text-sm leading-7">{r.careerPersonalizationReason}</p>:null}
 {r.aspirationReflection?<p className="rounded-xl bg-orange-50 p-4 text-sm leading-7">{r.aspirationReflection}</p>:null}
 <Lines title="Arah menuju kariermu" items={r.careerPathwayAdvice}/>
 <details className="border-t border-stone-200 pt-4"><summary className="touch-link text-sm font-semibold">Bagaimana skor dihitung? +</summary><dl className="grid grid-cols-2 gap-3 py-4 text-sm">{[["Minat",r.scoringBreakdown.interestScore],["Skill",r.scoringBreakdown.skillScore],["Mata pelajaran",r.scoringBreakdown.subjectScore],["Gaya kerja",r.scoringBreakdown.workStyleScore],["Area masalah",r.scoringBreakdown.problemAreaScore],["Pertimbangan pribadi",r.scoringBreakdown.constraintFitScore]].map(([label,value])=><div key={label}><dt className="text-stone-600">{label}</dt><dd className="font-bold">{value}/100</dd></div>)}</dl><p className="text-xs leading-6 text-stone-600">Bobot: minat 30%, skill 25%, mata pelajaran 15%, gaya kerja 10%, area masalah 10%, pertimbangan 10%. Aspirasi tertulis dapat memberi tambahan kecil ({r.scoringBreakdown.aspirationMajorBoost??0} poin).</p></details>
 </div>;
 return expanded?<article className="panel"><h2 className="text-xl font-bold">Kenali rekomendasi utamamu</h2>{body}</article>:<details className="recommendation-details panel"><summary className="flex min-h-14 items-center gap-4"><span className="text-xs text-stone-500">{String(r.rank).padStart(2,"0")}</span><span className="min-w-0 flex-1"><span className="block text-lg font-bold">{r.majorName}</span><span className="mt-1 block text-xs text-stone-600">Kecocokan {r.overallFitScore} · Ketahanan AI {r.aiFutureResilienceScore}</span></span><ChevronDown size={20} className="shrink-0" aria-hidden="true"/></summary>{body}</details>;
}
