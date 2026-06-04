"use client";

import Image from "next/image";
import Link from "next/link";
import { Settings as SettingsIcon } from "lucide-react";
import { DesktopNav, MobileTabBar } from "@/components/app-shell/Nav";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/today" className="flex items-center gap-2">
            <Image src="/icon-192.png" alt="Dueviq" width={28} height={28} className="rounded-lg" />
            <span className="font-semibold tracking-tight">Dueviq</span>
          </Link>
          <DesktopNav />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/settings"
              aria-label="Settings"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-foreground hover:bg-surface-muted"
            >
              <SettingsIcon size={16} />
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 pb-28 sm:pb-10">
        {children}
      </main>
      <MobileTabBar />
    </div>
  );
}
