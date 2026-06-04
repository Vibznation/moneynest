"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import { PremiumGate } from "@/components/plus/PremiumGate";
import { formatCurrency } from "@/lib/utils";
import { useData } from "@/lib/data-store";

// ── Types ────────────────────────────────────────────────────────────────────

interface Debt {
  id: string;
  name: string;
  balance: number;
  apr: number; // annual percentage rate
  minPayment: number;
}

// ── Payoff calculations ──────────────────────────────────────────────────────

interface PayoffResult {
  months: number;
  totalInterest: number;
  payoffOrder: string[];
}

function calcPayoff(
  debts: Debt[],
  extraPayment: number,
  method: "avalanche" | "snowball",
): PayoffResult {
  if (debts.length === 0) return { months: 0, totalInterest: 0, payoffOrder: [] };

  // Clone mutable balances
  const state = debts.map((d) => ({ ...d, remaining: d.balance }));
  let months = 0;
  let totalInterest = 0;
  const payoffOrder: string[] = [];

  const sorted = [...state].sort((a, b) =>
    method === "avalanche" ? b.apr - a.apr : a.remaining - b.remaining,
  );

  while (state.some((d) => d.remaining > 0) && months < 600) {
    months++;
    let extra = extraPayment;

    // Apply interest
    state.forEach((d) => {
      if (d.remaining <= 0) return;
      const interest = (d.remaining * (d.apr / 100)) / 12;
      d.remaining += interest;
      totalInterest += interest;
    });

    // Pay minimums
    state.forEach((d) => {
      if (d.remaining <= 0) return;
      const pay = Math.min(d.minPayment, d.remaining);
      d.remaining -= pay;
    });

    // Apply extra to the priority debt
    for (const priority of sorted) {
      if (extra <= 0) break;
      const target = state.find((d) => d.id === priority.id);
      if (!target || target.remaining <= 0) continue;
      const pay = Math.min(extra, target.remaining);
      target.remaining -= pay;
      extra -= pay;
    }

    // Record payoffs
    state.forEach((d) => {
      if (d.remaining <= 0 && !payoffOrder.includes(d.name)) {
        payoffOrder.push(d.name);
      }
    });
  }

  return { months, totalInterest, payoffOrder };
}

function monthsToHuman(months: number): string {
  if (months <= 0) return "—";
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m}mo`;
  if (m === 0) return `${y}yr`;
  return `${y}yr ${m}mo`;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DebtPlannerPage() {
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
          Debt Planner
        </h1>
        <p className="mt-1 text-foreground-muted">
          Compare payoff strategies and track your progress.
        </p>
      </header>

      <PremiumGate
        feature="debt_planner"
        title="Debt Planner"
        description="Upgrade to see avalanche vs snowball payoff comparisons and track how much interest you'll save."
      >
        <DebtPlannerContent />
      </PremiumGate>
    </div>
  );
}

function DebtPlannerContent() {
  const { snapshot } = useData();
  const currency = snapshot.settings?.currency ?? "USD";

  const [debts, setDebts] = useState<Debt[]>([]);
  const [form, setForm] = useState({
    name: "",
    balance: "",
    apr: "",
    minPayment: "",
  });
  const [extra, setExtra] = useState("100");

  function addDebt() {
    const balance = parseFloat(form.balance);
    const apr = parseFloat(form.apr);
    const minPayment = parseFloat(form.minPayment);
    if (!form.name || isNaN(balance) || isNaN(apr) || isNaN(minPayment)) return;
    setDebts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: form.name,
        balance,
        apr,
        minPayment,
      },
    ]);
    setForm({ name: "", balance: "", apr: "", minPayment: "" });
  }

  function removeDebt(id: string) {
    setDebts((prev) => prev.filter((d) => d.id !== id));
  }

  const extraAmt = parseFloat(extra) || 0;
  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);

  const avalanche = useMemo(
    () => calcPayoff(debts, extraAmt, "avalanche"),
    [debts, extraAmt],
  );
  const snowball = useMemo(
    () => calcPayoff(debts, extraAmt, "snowball"),
    [debts, extraAmt],
  );

  const interestSaved = snowball.totalInterest - avalanche.totalInterest;
  const monthsSaved = snowball.months - avalanche.months;

  return (
    <div className="flex flex-col gap-5">
      {/* Legal note */}
      <p className="text-xs text-foreground-muted bg-surface-muted rounded-xl px-4 py-2">
        Debt Planner is a calculation tool only. Dueviq does not process
        payments, apply for credit, or provide lending services.
      </p>

      {/* Extra payment input */}
      <Card>
        <CardTitle>Extra monthly payment</CardTitle>
        <p className="mt-1 text-sm text-foreground-muted">
          Amount you can put toward debt on top of minimums.
        </p>
        <div className="mt-3 max-w-xs">
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="10"
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
          />
        </div>
      </Card>

      {/* Add debt form */}
      <Card>
        <CardTitle>Add a debt</CardTitle>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Name">
            <Input
              placeholder="Credit card, car loan…"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <Field label="Balance ($)">
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="5000"
              value={form.balance}
              onChange={(e) =>
                setForm((f) => ({ ...f, balance: e.target.value }))
              }
            />
          </Field>
          <Field label="APR (%)">
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.1"
              placeholder="19.99"
              value={form.apr}
              onChange={(e) =>
                setForm((f) => ({ ...f, apr: e.target.value }))
              }
            />
          </Field>
          <Field label="Min. payment ($)">
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="100"
              value={form.minPayment}
              onChange={(e) =>
                setForm((f) => ({ ...f, minPayment: e.target.value }))
              }
            />
          </Field>
        </div>
        <Button
          variant="secondary"
          className="mt-3"
          onClick={addDebt}
        >
          <Plus size={15} /> Add
        </Button>
      </Card>

      {/* Debt list */}
      {debts.length > 0 && (
        <Card>
          <CardTitle>Your debts · {formatCurrency(totalDebt, currency)} total</CardTitle>
          <div className="mt-4 divide-y divide-border">
            {debts.map((d) => (
              <div key={d.id} className="flex items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{d.name}</p>
                  <p className="text-sm text-foreground-muted">
                    {d.apr}% APR · ${d.minPayment}/mo min
                  </p>
                  <Progress
                    className="mt-1.5 h-1.5"
                    value={Math.min(100, (d.balance / totalDebt) * 100)}
                  />
                </div>
                <p className="tabular font-semibold text-foreground">
                  {formatCurrency(d.balance, currency)}
                </p>
                <button
                  onClick={() => removeDebt(d.id)}
                  className="text-foreground-muted hover:text-danger transition-colors"
                  aria-label="Remove"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Strategy comparison */}
      {debts.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <StrategyCard
              title="Avalanche"
              subtitle="Highest APR first — saves the most interest"
              result={avalanche}
              currency={currency}
              recommended
            />
            <StrategyCard
              title="Snowball"
              subtitle="Smallest balance first — faster wins"
              result={snowball}
              currency={currency}
            />
          </div>

          {interestSaved > 0 && (
            <Card className="bg-accent-soft border-accent-soft">
              <p className="font-semibold text-foreground">
                Avalanche saves you{" "}
                <span className="text-accent">
                  {formatCurrency(interestSaved, currency)}
                </span>{" "}
                in interest
                {monthsSaved > 0 &&
                  ` and pays off ${monthsToHuman(monthsSaved)} sooner`}
                .
              </p>
            </Card>
          )}
        </>
      )}

      {debts.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-14 text-center">
          <p className="text-foreground-muted">Add your first debt above to compare strategies.</p>
        </div>
      )}
    </div>
  );
}

function StrategyCard({
  title,
  subtitle,
  result,
  currency,
  recommended,
}: {
  title: string;
  subtitle: string;
  result: PayoffResult;
  currency: string;
  recommended?: boolean;
}) {
  return (
    <Card className={recommended ? "border-accent" : ""}>
      <div className="flex items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {recommended && (
          <Badge tone="accent">Recommended</Badge>
        )}
      </div>
      <p className="mt-0.5 text-xs text-foreground-muted">{subtitle}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface-muted px-3 py-2">
          <dt className="text-[10px] uppercase tracking-wide text-foreground-muted">
            Payoff time
          </dt>
          <dd className="mt-1 text-lg font-bold tabular text-foreground">
            {monthsToHuman(result.months)}
          </dd>
        </div>
        <div className="rounded-xl bg-surface-muted px-3 py-2">
          <dt className="text-[10px] uppercase tracking-wide text-foreground-muted">
            Total interest
          </dt>
          <dd className="mt-1 text-lg font-bold tabular text-foreground">
            {formatCurrency(result.totalInterest, currency)}
          </dd>
        </div>
      </dl>
      {result.payoffOrder.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-foreground-muted mb-1.5">Payoff order</p>
          <div className="flex flex-wrap gap-1.5">
            {result.payoffOrder.map((name, i) => (
              <span
                key={name}
                className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs text-foreground-muted"
              >
                {i + 1}. {name}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
