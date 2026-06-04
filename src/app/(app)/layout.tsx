"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell/AppShell";
import { useData } from "@/lib/data-store";
import { isSupabaseConfigured, getSupabaseBrowser } from "@/lib/supabase/client";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
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
  }, [ready, snapshot, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="animate-pulse text-sm text-foreground-muted">Loading Dueviq…</p>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}

