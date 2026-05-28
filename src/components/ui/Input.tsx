import { cn } from "@/lib/utils";
import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const base =
  "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(base, className)} />;
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(base, "pr-8", className)} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(base, "min-h-20", className)} />;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-foreground mb-1">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="mt-1 block text-xs text-foreground-muted">{hint}</span>
      ) : null}
    </label>
  );
}
