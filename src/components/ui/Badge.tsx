import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "neutral",
  className
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "gold" | "blue" | "coral";
  className?: string;
}) {
  const tones = {
    neutral: "bg-black/5 text-ink",
    green: "bg-leaf/10 text-leaf",
    gold: "bg-marigold/20 text-[#7A4D0D]",
    blue: "bg-skysoft/70 text-[#24515B]",
    coral: "bg-coral/10 text-coral"
  };

  return (
    <span className={cn("inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}
