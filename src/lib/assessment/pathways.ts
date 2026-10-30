import type { EducationPathway } from "@/lib/types";

export const educationPathwayOptions = [
  {
    value: "university",
    title: "Universitas / Akademik",
    description: "S1 · Mendalami bidang ilmu dan penerapannya",
  },
  {
    value: "vocational",
    title: "Vokasi / Terapan",
    description: "D3 / D4 · Belajar melalui praktik dan proyek industri",
  },
  {
    value: "exploring",
    title: "Masih menjelajahi keduanya",
    description: "Bandingkan pilihan sebelum menentukan arah",
  },
] as const;

export function educationPathwayLabel(pathway?: EducationPathway): string {
  return (
    educationPathwayOptions.find((option) => option.value === pathway)?.title ??
    "Belum tercatat"
  );
}

export function eligibleDegreeTypes(
  degrees: readonly string[],
  pathway?: EducationPathway,
): string[] {
  if (pathway === "university")
    return degrees.filter((degree) => degree === "S1");
  if (pathway === "vocational")
    return degrees.filter((degree) => degree === "D3" || degree === "D4");
  return [...degrees];
}
