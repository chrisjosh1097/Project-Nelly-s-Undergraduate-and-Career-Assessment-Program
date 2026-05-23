import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

export function Button({ className, variant = "primary", children, ...props }: ButtonProps) {
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-leaf text-white hover:bg-[#1f5140] focus-visible:ring-leaf",
    secondary: "bg-white text-ink ring-1 ring-black/10 hover:bg-skysoft/45 focus-visible:ring-leaf",
    ghost: "bg-transparent text-ink hover:bg-black/5 focus-visible:ring-leaf",
    danger: "bg-coral text-white hover:bg-[#bf5f46] focus-visible:ring-coral"
  };

  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
