"use client";

import { useState, useEffect } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { type EntitlementType } from "@/lib/entitlements";

const PLANS: { id: EntitlementType; label: string; desc: string }[] = [
  { id: "free", label: "Free", desc: "Default — no premium features" },
  { id: "plus_personal", label: "Dueviq+ Personal", desc: "All Personal tier features" },
  { id: "business", label: "Dueviq Business", desc: "All features including Tax Organizer & Business Workspace" },
];

export default function AdminPage() {
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    setCurrent(localStorage.getItem("dueviq:plan-override") ?? "free");
  }, []);

  function set(plan: EntitlementType) {
    if (plan === "free") {
      localStorage.removeItem("dueviq:plan-override");
      setCurrent("free");
    } else {
      localStorage.setItem("dueviq:plan-override", plan);
      setCurrent(plan);
    }
    // Force a full reload so all hooks re-read the override
    window.location.href = "/today";
  }

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto py-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Owner Panel</h1>
        <p className="text-sm text-foreground-muted mt-1">
          Set your local plan override. Stored in this browser only.
        </p>
      </div>

      <Card>
        <CardTitle>Active Plan Override</CardTitle>
        <p className="text-sm text-foreground-muted mt-1 mb-4">
          Current: <span className="font-semibold text-accent">{current ?? "loading…"}</span>
        </p>
        <div className="flex flex-col gap-3">
          {PLANS.map((p) => (
            <button
              key={p.id}
              onClick={() => set(p.id)}
              className={`text-left rounded-xl border px-4 py-3 transition-colors ${
                current === p.id
                  ? "border-accent bg-accent-soft"
                  : "border-border hover:border-accent/50"
              }`}
            >
              <div className="font-semibold text-foreground text-sm">{p.label}</div>
              <div className="text-xs text-foreground-muted">{p.desc}</div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
