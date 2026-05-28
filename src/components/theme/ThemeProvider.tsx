"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const stored = (localStorage.getItem("moneynest-theme") as Theme | null);
    const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial: Theme = stored ?? (prefers ? "dark" : "light");
    setThemeState(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    try {
      localStorage.setItem("moneynest-theme", t);
    } catch {}
  };

  return (
    <Ctx.Provider
      value={{ theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme requires ThemeProvider");
  return ctx;
}
