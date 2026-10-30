import type {ButtonHTMLAttributes,ReactNode} from "react";
import {cn} from "@/lib/utils";
type ButtonVariant="primary"|"secondary"|"ghost"|"danger";
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>{variant?:ButtonVariant;children:ReactNode}
export function Button({className,variant="primary",children,type="button",...props}:ButtonProps){
 const variants={primary:"bg-ink text-white hover:bg-black",secondary:"border border-stone-300 bg-white text-ink hover:bg-orange-50",ghost:"bg-transparent text-ink hover:bg-black/5",danger:"bg-red-700 text-white hover:bg-red-800"};
 return <button type={type} className={cn("inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",variants[variant],className)} {...props}>{children}</button>;
}
