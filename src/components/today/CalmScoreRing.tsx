"use client";

import { getCalmTone } from "@/lib/calculations";
import { cn } from "@/lib/utils";

const toneVar: Record<ReturnType<typeof getCalmTone>, string> = {
  accent: "var(--accent)",
  info: "var(--info)",
  warning: "var(--warning)",
  danger: "var(--danger)",
};

export function CalmScoreRing({
  score,
  label,
  size = 96,
  stroke = 8,
  className,
}: {
  score: number;
  label: string;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const value = Math.max(0, Math.min(100, score));
  const offset = circ - (value / 100) * circ;
  const tone = getCalmTone(value);
  const color = toneVar[tone];

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Money calm score ${value} out of 100, ${label}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--surface-muted)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular text-2xl font-semibold leading-none">
          {value}
        </span>
        <span className="mt-1 text-[10px] uppercase tracking-wide text-foreground-muted">
          {label}
        </span>
      </div>
    </div>
  );
}
