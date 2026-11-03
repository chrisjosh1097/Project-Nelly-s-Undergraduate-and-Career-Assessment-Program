import { majors, majorsById } from "../../../data/majors";
import { careersById } from "../../../data/careers";
import { campusMajorMap } from "../../../data/campusMajorMap";
import { displayCluster, getAIFutureResilienceLabel } from "@/lib/recommendation/scoring";

// Public, KB-only major profile. No student data and no scoring of individuals.
export interface PublicMajorProfile {
  id: string;
  name: string;
  alternativeNames: string[];
  cluster: string;
  subCluster: string;
  description: string;
  degreeTypes: string[];
  subjects: string[];
  skills: string[];
  interests: string[];
  careers: string[];
  careerDirections: string[];
  aiScore: number;
  aiLabel: string;
  aiReason: string;
  firstSteps: string[];
  cautionNotes: string[];
  intensity: { label: string; level: string }[];
  hasCampusData: boolean;
}

export const MAJOR_ID_PATTERN = /^[a-z0-9_]{1,64}$/;

const ACADEMIC_DEGREES = new Set(["D3", "D4", "S1"]);

export function publicMajorProfile(id: string): PublicMajorProfile | null {
  if (!MAJOR_ID_PATTERN.test(id)) return null;
  const major = majorsById[id];
  if (!major) return null;
  return {
    id: major.id,
    name: major.name,
    alternativeNames: major.alternativeNames,
    cluster: displayCluster(major.cluster),
    subCluster: major.subCluster,
    description: major.description,
    degreeTypes: major.degreeTypes.filter((d) => ACADEMIC_DEGREES.has(d)),
    subjects: major.relatedSubjects.map((t) => t.label),
    skills: major.relatedSkills.map((t) => t.label),
    interests: major.relatedInterests.map((t) => t.label),
    careers: major.relatedCareers.map((cid) => careersById[cid]?.title).filter((t): t is string => !!t),
    careerDirections: major.careerDirections,
    aiScore: major.aiFutureResilienceScore,
    aiLabel: getAIFutureResilienceLabel(major.aiFutureResilienceScore),
    aiReason: major.aiFutureResilienceReason,
    firstSteps: major.beginnerFriendlyNextSteps,
    cautionNotes: major.cautionNotes,
    intensity: [
      { label: "Matematika", level: major.mathIntensity },
      { label: "Sains", level: major.scienceIntensity },
      { label: "Komunikasi", level: major.communicationIntensity },
      { label: "Kreativitas", level: major.creativityIntensity },
      { label: "Kerja lapangan", level: major.fieldWorkIntensity },
    ],
    hasCampusData: !!campusMajorMap[major.id] && !("none" in campusMajorMap[major.id]),
  };
}

export interface MajorIndexEntry { id: string; name: string; cluster: string; degreeTypes: string[] }

export function majorIndex(): { cluster: string; majors: MajorIndexEntry[] }[] {
  const groups = new Map<string, MajorIndexEntry[]>();
  for (const major of majors) {
    const cluster = displayCluster(major.cluster);
    const list = groups.get(cluster) ?? [];
    list.push({ id: major.id, name: major.name, cluster, degreeTypes: major.degreeTypes.filter((d) => ACADEMIC_DEGREES.has(d)) });
    groups.set(cluster, list);
  }
  return [...groups.entries()].map(([cluster, list]) => ({
    cluster,
    majors: list.sort((a, b) => a.name.localeCompare(b.name, "id")),
  }));
}

export function allMajorIds(): string[] {
  return majors.map((m) => m.id);
}
