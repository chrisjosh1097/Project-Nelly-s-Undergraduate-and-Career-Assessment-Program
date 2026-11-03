import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MajorProfileView } from "@/components/majors/MajorProfileView";
import { allMajorIds, publicMajorProfile } from "@/lib/majors/publicProfile";

type Params = Promise<{ id: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return allMajorIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const major = publicMajorProfile((await params).id);
  return major
    ? { title: `${major.name} — jurusan`, description: major.description }
    : { title: "Jurusan tidak ditemukan" };
}

export default async function MajorPage({ params }: { params: Params }) {
  const major = publicMajorProfile((await params).id);
  if (!major) notFound();
  return <MajorProfileView major={major} />;
}
