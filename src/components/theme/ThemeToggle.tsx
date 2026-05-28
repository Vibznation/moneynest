"use client";

import { useTheme } from "@/components/theme/ThemeProvider";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-foreground hover:bg-surface-muted"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
