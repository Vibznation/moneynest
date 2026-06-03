"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const CONSENT_KEY = "moneynest:consent:v1";

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) setVisible(true);
    } catch {
      // localStorage unavailable (private mode, etc.) — don't block the user
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: true, at: new Date().toISOString() }));
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Privacy consent"
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6"
    >
      <div className="mx-auto max-w-xl rounded-2xl bg-surface border border-border shadow-lg p-5">
        <p className="text-sm font-semibold mb-1">Before you continue</p>
        <p className="text-sm text-foreground-muted leading-relaxed">
          MoneyNest stores your financial data locally and, if you sign in, via{" "}
          <strong className="text-foreground">Supabase</strong> (authentication &amp; database). If you
          link a bank account, your data passes through{" "}
          <strong className="text-foreground">Plaid</strong> (read-only). We do not sell your data
          or run third-party advertising.
        </p>
        <p className="text-sm text-foreground-muted mt-2">
          By tapping &quot;I agree&quot; you acknowledge our{" "}
          <Link
            href="/privacy"
            className="text-accent underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            Privacy Policy
          </Link>
          .
        </p>
        <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-end">
          <Button variant="primary" onClick={accept}>
            I agree
          </Button>
        </div>
      </div>
    </div>
  );
}
