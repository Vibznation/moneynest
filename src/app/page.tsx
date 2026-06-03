"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/lib/data-store";
import { isSupabaseConfigured, getSupabaseBrowser } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();
  const { ready, snapshot } = useData();

  useEffect(() => {
    if (!ready) return;

    async function route() {
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
      } else {
        router.replace("/today");
      }
    }

    route();
  }, [ready, snapshot, router]);

  return (
    <div className="flex flex-1 items-center justify-center text-foreground-muted">
      Loading your nest…
    </div>
  );
}
