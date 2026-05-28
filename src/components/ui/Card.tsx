import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]",
        className,
      )}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "text-xs font-medium uppercase tracking-wide text-foreground-muted",
        className,
      )}
    />
  );
}

export function CardValue({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn("text-3xl font-semibold mt-1 text-foreground", className)}
    />
  );
}
