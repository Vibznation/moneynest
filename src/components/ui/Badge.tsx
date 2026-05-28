import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "info" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-muted text-foreground-muted",
  accent: "bg-accent-soft text-foreground",
  info: "bg-info-soft text-foreground",
  warning: "bg-warning-soft text-foreground",
  danger: "bg-danger-soft text-foreground",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
