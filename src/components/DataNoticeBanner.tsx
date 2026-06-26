"use client";

import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useData } from "@/lib/data-store";

export function DataNoticeBanner() {
  const { notice, dismissNotice } = useData();

  useEffect(() => {
    if (!notice) return;
    const timeoutId = window.setTimeout(() => {
      dismissNotice();
    }, 4500);
    return () => window.clearTimeout(timeoutId);
  }, [notice, dismissNotice]);

  if (!notice) return null;

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-20 z-50 flex justify-center sm:inset-x-auto sm:right-4 sm:left-auto sm:bottom-4">
      <div className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-danger bg-surface px-4 py-3 shadow-[var(--shadow-soft)]">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-danger-soft text-danger">
          <AlertTriangle size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">Sync issue</p>
          <p className="mt-0.5 text-sm text-foreground-muted">{notice.message}</p>
        </div>
        <button
          type="button"
          onClick={dismissNotice}
          aria-label="Dismiss notice"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-foreground-muted hover:bg-surface-muted hover:text-foreground"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}