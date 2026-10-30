import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "gold" | "blue" | "coral";
  className?: string;
}) {
  const tones = {
    neutral: "bg-stone-100 text-stone-700",
    green: "bg-orange-50 text-orange-900",
    gold: "bg-amber-50 text-amber-900",
    blue: "bg-stone-100 text-stone-800",
    coral: "bg-red-50 text-red-800",
  };
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-full px-3 py-1.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
