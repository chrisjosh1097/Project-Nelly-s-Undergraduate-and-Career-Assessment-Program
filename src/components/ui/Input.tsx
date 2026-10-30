import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";
export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {children}
      {error ? (
        <span className="block text-sm text-red-800">{error}</span>
      ) : null}
    </label>
  );
}
const style =
  "w-full min-h-12 rounded-xl border border-stone-500 bg-white px-4 py-3 text-base text-ink placeholder:text-stone-500 focus:border-ink focus:ring-2 focus:ring-ink/20 disabled:bg-stone-100";
export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(style, className)} {...props} />;
}
export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(style, "min-h-32", className)} {...props} />;
}
