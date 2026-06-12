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
      if (!snapshot.profile?.onboarding_complete) {
        router.replace("/onboarding");
      }
    }
    guard();
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

