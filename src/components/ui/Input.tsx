import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

export function Field({ label, error, children }: FieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {children}
      {error ? <span className="block text-sm text-coral">{error}</span> : null}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-ink outline-none transition placeholder:text-black/35 focus:border-leaf focus:ring-2 focus:ring-leaf/20 disabled:bg-black/5",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-ink outline-none transition placeholder:text-black/35 focus:border-leaf focus:ring-2 focus:ring-leaf/20",
        className
      )}
      {...props}
    />
  );
}
