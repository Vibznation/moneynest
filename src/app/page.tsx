"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/lib/data-store";

export default function Home() {
  const router = useRouter();
  const { ready, snapshot } = useData();

  useEffect(() => {
    if (!ready) return;
    if (!snapshot.profile?.onboarding_complete) {
      router.replace("/onboarding");
    } else {
      router.replace("/today");
    }
  }, [ready, snapshot, router]);

  return (
    <div className="flex flex-1 items-center justify-center text-foreground-muted">
      Loading your nest…
    </div>
  );
}
