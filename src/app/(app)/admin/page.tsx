"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/Card";
import { type EntitlementType } from "@/lib/entitlements";

const PLANS: { id: EntitlementType; label: string; desc: string }[] = [
  { id: "free", label: "Free", desc: "Default — no premium features" },
  { id: "plus_personal", label: "Dueviq+ Personal", desc: "All Personal tier features" },
  { id: "business", label: "Dueviq Business", desc: "All features including Tax Organizer & Business Workspace" },
];

const TABS = ["Plan Override", "Consent Overview"] as const;
type Tab = (typeof TABS)[number];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Plan Override");

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto py-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Owner Panel</h1>
        <p className="text-sm text-foreground-muted mt-1">Dev-only tools. Stored in this browser only.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-surface border border-border p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
              activeTab === tab
                ? "bg-accent text-white shadow-sm"
                : "text-foreground-muted hover:text-foreground",
            ].join(" ")}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Plan Override" && <PlanOverrideTab />}
      {activeTab === "Consent Overview" && <ConsentOverviewTab />}
    </div>
  );
}

// ─── Plan Override tab ────────────────────────────────────────────────────────

function PlanOverrideTab() {
  const router = useRouter();
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    setCurrent(localStorage.getItem("dueviq:plan-override") ?? "free");
  }, []);

  function setPlan(plan: EntitlementType) {
    if (plan === "free") {
      localStorage.removeItem("dueviq:plan-override");
      setCurrent("free");
    } else {
      localStorage.setItem("dueviq:plan-override", plan);
      setCurrent(plan);
    }
    router.replace("/today");
    router.refresh();
  }

  return (
    <Card>
      <CardTitle>Active Plan Override</CardTitle>
      <p className="text-sm text-foreground-muted mt-1 mb-4">
        Current: <span className="font-semibold text-accent">{current ?? "loading…"}</span>
      </p>
      <div className="flex flex-col gap-3">
        {PLANS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPlan(p.id)}
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
  );
}

// ─── Consent Overview tab ─────────────────────────────────────────────────────

interface ConsentRow {
  consent_type: string;
  granted: boolean;
  consent_version: string;
  consent_source: string;
  updated_at: string;
}

function ConsentOverviewTab() {
  const [consents, setConsents] = useState<ConsentRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/consent");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as { consents: Record<string, { granted: boolean; updatedAt: string; version: string }> };
        const rows: ConsentRow[] = Object.entries(data.consents).map(([type, val]) => ({
          consent_type: type,
          granted: val.granted,
          consent_version: val.version,
          consent_source: "–",
          updated_at: val.updatedAt,
        }));
        setConsents(rows);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <Card><p className="text-sm text-foreground-muted">Loading consent data…</p></Card>;
  }
  if (error) {
    return <Card><p className="text-sm text-danger">Error: {error}</p></Card>;
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardTitle>Current Consent State</CardTitle>
        <p className="text-xs text-foreground-muted mt-1 mb-3">
          Your own consent records as returned by /api/consent.
        </p>
        {!consents || consents.length === 0 ? (
          <p className="text-sm text-foreground-muted">No consent records found. Sign in to see your data.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-foreground-muted border-b border-border">
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4">Granted</th>
                  <th className="pb-2 pr-4">Version</th>
                  <th className="pb-2">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {consents.map((row) => (
                  <tr key={row.consent_type} className="text-foreground">
                    <td className="py-2 pr-4 font-mono">{row.consent_type}</td>
                    <td className="py-2 pr-4">
                      <span className={row.granted ? "text-accent font-medium" : "text-danger"}>
                        {row.granted ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-foreground-muted">{row.consent_version}</td>
                    <td className="py-2 text-foreground-muted">
                      {new Date(row.updated_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Audit History</CardTitle>
        <p className="text-xs text-foreground-muted mt-1">
          Full audit trail is stored in the <code className="bg-surface-muted px-1 rounded">consent_audit</code> table in Supabase and is only accessible via the Supabase dashboard or service-role queries. It is not exposed here to protect user privacy.
        </p>
      </Card>
    </div>
  );
}
