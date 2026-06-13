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
    let cancelled = false;
    async function guard() {
      // sessionStorage flag set synchronously by the onboarding page before
      // navigation — clears itself on first check so it only fires once.
      try {
        if (sessionStorage.getItem("dueviq:onboarding-complete") === "1") {
          sessionStorage.removeItem("dueviq:onboarding-complete");
          return;
        }
      } catch {}

      if (isSupabaseConfigured()) {
        const supabase = getSupabaseBrowser();
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (!data.session) {
          router.replace("/auth");
          return;
        }
      }
      if (cancelled) return;
      // Check in-memory snapshot first
      if (snapshot.profile?.onboarding_complete) return;
      // Fallback: check localStorage in case the in-memory snapshot is stale
      try {
        const raw = localStorage.getItem("dueviq:snapshot:v1");
        if (raw) {
          const stored = JSON.parse(raw);
          if (stored?.profile?.onboarding_complete) return;
        }
      } catch {}
      router.replace("/onboarding");
    }
    guard();
    return () => { cancelled = true; };
  }, [ready, snapshot, router, pathname]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading MoneyNest">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" aria-hidden="true" />
          <p className="text-sm text-foreground-muted">Loading Dueviq…</p>
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}

