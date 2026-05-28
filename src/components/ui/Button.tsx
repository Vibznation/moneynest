import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "soft";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-background hover:opacity-90 dark:bg-primary dark:text-background",
  secondary:
    "bg-surface border border-border text-foreground hover:bg-surface-muted",
  ghost: "text-foreground hover:bg-surface-muted",
  danger: "bg-danger text-white hover:opacity-90",
  soft: "bg-accent-soft text-foreground hover:opacity-90",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-sm rounded-lg",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-5 text-base rounded-2xl",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: Props) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    />
  );
}
