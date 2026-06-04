"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AppShell } from "@/components/app-shell/AppShell";
import { useData } from "@/lib/data-store";
import { isSupabaseConfigured, getSupabaseBrowser } from "@/lib/supabase/client";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, snapshot } = useData();

  useEffect(() => {
    if (!ready) return;
    async function guard() {
      if (isSupabaseConfigured()) {
        const supabase = getSupabaseBrowser();
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          router.replace("/auth");
          return;
        }
      }
      // Give a brief window after finishing onboarding for the state to settle
      // by checking localStorage directly as the source of truth
      const raw = localStorage.getItem("moneynest:snapshot:v1");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.profile?.onboarding_complete) return;
        } catch {}
      }
      if (!snapshot.profile?.onboarding_complete) {
        router.replace("/onboarding");
      }
    }
    guard();
  }, [ready, snapshot, router, pathname]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="animate-pulse text-sm text-foreground-muted">Loading Dueviq…</p>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}

