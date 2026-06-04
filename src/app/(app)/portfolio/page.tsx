"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, TrendingUp, TrendingDown, Trash2, Building2 } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import { PremiumGate } from "@/components/plus/PremiumGate";
import { formatCurrency } from "@/lib/utils";
import { useData } from "@/lib/data-store";

// ── Types ────────────────────────────────────────────────────────────────────

interface InvestmentAccount {
  id: string;
  name: string;
  institution: string;
  type: string;
  balance: number;
}

const ACCOUNT_TYPES = [
  "Brokerage",
  "IRA",
  "401k",
  "Roth IRA",
  "Pension",
  "Other",
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/plus"
        className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground"
      >
        <ArrowLeft size={14} /> Dueviq+
      </Link>
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Portfolio View
        </h1>
        <p className="mt-1 text-foreground-muted">
          Track your investment accounts and total portfolio value.
        </p>
      </header>
      <PremiumGate
        feature="portfolio_summary"
        title="Portfolio View"
        description="Upgrade to Dueviq+ Personal to track your investment accounts and portfolio value."
      >
        <PortfolioContent />
      </PremiumGate>
    </div>
  );
}

function PortfolioContent() {
  const { snapshot } = useData();
  const currency = snapshot.settings?.currency ?? "USD";

  const [accounts, setAccounts] = useState<InvestmentAccount[]>([]);
  const [form, setForm] = useState({ name: "", institution: "", type: ACCOUNT_TYPES[0], balance: "" });
  const [showForm, setShowForm] = useState(false);

  const total = useMemo(() => accounts.reduce((s, a) => s + a.balance, 0), [accounts]);

  function addAccount() {
    const balance = parseFloat(form.balance);
    if (!form.name || isNaN(balance)) return;
    setAccounts((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: form.name, institution: form.institution, type: form.type, balance },
    ]);
    setForm({ name: "", institution: "", type: ACCOUNT_TYPES[0], balance: "" });
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-foreground-muted bg-surface-muted rounded-xl px-4 py-2">
        Portfolio View is for tracking only. Dueviq does not execute trades,
        manage investments, or provide financial advice.
      </p>

      {/* Total */}
      <Card className="relative overflow-hidden">
        <p className="text-xs uppercase tracking-wide text-foreground-muted">
          Total portfolio value
        </p>
        <p className="mt-1 text-4xl font-bold tabular text-foreground">
          {formatCurrency(total, currency)}
        </p>
        <p className="mt-1 text-sm text-foreground-muted">
          {accounts.length} account{accounts.length !== 1 ? "s" : ""} tracked
        </p>
      </Card>

      {/* Account list */}
      {accounts.length > 0 && (
        <Card>
          <CardTitle>Accounts</CardTitle>
          <div className="mt-4 divide-y divide-border">
            {accounts.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-muted">
                  <Building2 size={16} className="text-foreground-muted" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{a.name}</p>
                  <p className="text-xs text-foreground-muted">
                    {a.institution || a.type} · {a.type}
                  </p>
                  <Progress
                    className="mt-1.5 h-1.5"
                    value={total > 0 ? (a.balance / total) * 100 : 0}
                  />
                </div>
                <div className="text-right shrink-0">
                  <p className="tabular font-semibold">{formatCurrency(a.balance, currency)}</p>
                  <p className="text-xs text-foreground-muted">
                    {total > 0 ? ((a.balance / total) * 100).toFixed(1) : "0"}%
                  </p>
                </div>
                <button
                  onClick={() => setAccounts((prev) => prev.filter((x) => x.id !== a.id))}
                  className="text-foreground-muted hover:text-danger transition-colors ml-1"
                  aria-label="Remove"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Allocation breakdown */}
      {accounts.length > 1 && (
        <Card>
          <CardTitle>Allocation</CardTitle>
          <div className="mt-4 flex flex-col gap-3">
            {accounts.map((a) => {
              const pct = total > 0 ? (a.balance / total) * 100 : 0;
              return (
                <div key={a.id} className="flex items-center gap-3 text-sm">
                  <span className="w-28 shrink-0 truncate text-foreground-muted">{a.name}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-surface-muted h-2">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                  <span className="w-10 text-right tabular text-foreground-muted">
                    {pct.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Add account */}
      {showForm ? (
        <Card>
          <CardTitle>Add investment account</CardTitle>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Account name">
              <Input
                placeholder="Fidelity Brokerage"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </Field>
            <Field label="Institution (optional)">
              <Input
                placeholder="Fidelity"
                value={form.institution}
                onChange={(e) => setForm((f) => ({ ...f, institution: e.target.value }))}
              />
            </Field>
            <Field label="Type">
              <select
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Current balance ($)">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                placeholder="25000"
                value={form.balance}
                onChange={(e) => setForm((f) => ({ ...f, balance: e.target.value }))}
              />
            </Field>
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="primary" onClick={addAccount}>Add account</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      ) : (
        <Button variant="secondary" onClick={() => setShowForm(true)}>
          <Plus size={15} /> Add investment account
        </Button>
      )}

      {accounts.length === 0 && !showForm && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-14 text-center">
          <TrendingUp size={32} className="text-foreground-muted" />
          <p className="font-medium text-foreground">No investment accounts yet</p>
          <p className="text-sm text-foreground-muted max-w-xs">
            Add your brokerage, IRA, or 401k accounts to see your total
            portfolio value here.
          </p>
        </div>
      )}
    </div>
  );
}
