"use client";

import Image from "next/image";
import Link from "next/link";
import { Settings as SettingsIcon } from "lucide-react";
import { DesktopNav, MobileTabBar } from "@/components/app-shell/Nav";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ToastRegion } from "@/components/ui/Toast";
import { useData } from "@/lib/data-store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { notice, dismissNotice } = useData();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/today" className="flex items-center gap-2" aria-label="Dueviq home">
            <Image src="/icon-192.png" alt="" aria-hidden="true" width={28} height={28} className="rounded-lg" priority />
            <span className="font-semibold tracking-tight">Dueviq</span>
          </Link>
          <DesktopNav />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/settings"
              aria-label="Settings"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info"
            >
              <SettingsIcon size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>
      <main id="main-content" className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 pb-28 sm:pb-10">
        {children}
      </main>
      <MobileTabBar />
      <ToastRegion notice={notice} onDismiss={dismissNotice} />
    </div>
  );
}
