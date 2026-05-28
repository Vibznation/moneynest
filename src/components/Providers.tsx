"use client";

import { DataProvider } from "@/lib/data-store";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <DataProvider>{children}</DataProvider>
    </ThemeProvider>
  );
}
