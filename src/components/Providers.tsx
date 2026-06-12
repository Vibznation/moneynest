"use client";

import { DataNoticeBanner } from "@/components/DataNoticeBanner";
import { DataProvider } from "@/lib/data-store";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <DataProvider>
        {children}
        <DataNoticeBanner />
      </DataProvider>
    </ThemeProvider>
  );
}
