"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { useData } from "@/lib/data-store";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PremiumGate } from "@/components/plus/PremiumGate";
import { formatCurrency } from "@/lib/utils";

// ── Category colour palette ──────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  "Food and Drink": "bg-orange-400",
  "Shopping": "bg-pink-400",
  "Transportation": "bg-blue-400",
  "Entertainment": "bg-purple-400",
  "Health": "bg-green-400",
  "Utilities": "bg-yellow-400",
  "Travel": "bg-cyan-400",
  "Rent/Mortgage": "bg-red-400",
  "Other": "bg-gray-400",
};

function categoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? "bg-accent";
}

// ── Monthly spending calculation ─────────────────────────────────────────────

interface MonthlySummary {
  label: string;
  total: number;
  byCategory: Record<string, number>;
}

function buildMonthlySummaries(
  transactions: { amount: number; category: string | null; transaction_date: string }[],
  monthsBack: number,
): MonthlySummary[] {
  const summaries: MonthlySummary[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const ref = subMonths(new Date(), i);
    const start = startOfMonth(ref);
    const end = endOfMonth(ref);
    const label = format(ref, "MMM yyyy");

    const byCategory: Record<string, number> = {};
    let total = 0;

    transactions.forEach((tx) => {
      const d = parseISO(tx.transaction_date);
      if (d < start || d > end) return;
      if (tx.amount <= 0) return; // skip income / refunds
      const cat = tx.category ?? "Other";
      byCategory[cat] = (byCategory[cat] ?? 0) + tx.amount;
      total += tx.amount;
    });

    summaries.push({ label, total, byCategory });
  }

  return summaries;
}

// ── Bar component ────────────────────────────────────────────────────────────

function CategoryBar({
  category,
  amount,
  max,
  currency,
}: {
  category: string;
  amount: number;
  max: number;
  currency: string;
}) {
  const pct = max > 0 ? Math.max(2, (amount / max) * 100) : 2;
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 shrink-0 truncate text-sm text-foreground-muted">
        {category}
      </div>
      <div className="flex-1 overflow-hidden rounded-full bg-surface-muted h-2.5">
        <div
          className={`h-full rounded-full transition-all ${categoryColor(category)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-20 shrink-0 text-right text-sm tabular font-medium">
        {formatCurrency(amount, currency)}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SpendingInsightsPage() {
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
          Smart Spending Insights
        </h1>
        <p className="mt-1 text-foreground-muted">
          Understand where your money is going month by month.
        </p>
      </header>

      <PremiumGate
        feature="advanced_analytics"
        title="Smart Spending Insights"
        description="Upgrade to Dueviq+ Personal to see category breakdowns, monthly trends, and where your spending is changing."
      >
        <InsightsContent />
      </PremiumGate>
    </div>
  );
}

function InsightsContent() {
  const { snapshot } = useData();
  const currency = snapshot.settings?.currency ?? "USD";
  const transactions = snapshot.transactions;

  const summaries = useMemo(
    () => buildMonthlySummaries(transactions, 6),
    [transactions],
  );

  const currentIdx = summaries.length - 1;
  const prevIdx = summaries.length - 2;

  const current = summaries[currentIdx];
  const prev = summaries[prevIdx];

  const categories = useMemo(() => {
    if (!current) return [];
    return Object.entries(current.byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);
  }, [current]);

  const maxAmount = categories.length > 0 ? categories[0][1] : 1;

  if (transactions.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <BarChart3 size={36} className="text-foreground-muted" />
          <p className="font-medium text-foreground">No transactions yet</p>
          <p className="text-sm text-foreground-muted max-w-xs">
            Connect a bank account or add transactions manually to see spending
            insights here.
          </p>
          <Link href="/accounts" className="text-sm text-accent underline underline-offset-2">
            Go to Accounts
          </Link>
        </div>
      </Card>
    );
  }

  const trend =
    prev && prev.total > 0
      ? ((current.total - prev.total) / prev.total) * 100
      : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Monthly totals row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-wide text-foreground-muted">
            This month
          </p>
          <p className="mt-1 text-3xl font-bold tabular text-foreground">
            {formatCurrency(current?.total ?? 0, currency)}
          </p>
          {trend !== null && (
            <div className="mt-1 flex items-center gap-1">
              {trend > 0 ? (
                <TrendingUp size={13} className="text-danger" />
              ) : (
                <TrendingDown size={13} className="text-accent" />
              )}
              <span
                className={`text-xs font-medium ${trend > 0 ? "text-danger" : "text-accent"}`}
              >
                {trend > 0 ? "+" : ""}
                {trend.toFixed(1)}% vs last month
              </span>
            </div>
          )}
        </Card>

        <Card>
          <p className="text-xs uppercase tracking-wide text-foreground-muted">
            Last month
          </p>
          <p className="mt-1 text-3xl font-bold tabular text-foreground">
            {formatCurrency(prev?.total ?? 0, currency)}
          </p>
          <p className="mt-1 text-xs text-foreground-muted">
            {prev?.label ?? "—"}
          </p>
        </Card>

        <Card>
          <p className="text-xs uppercase tracking-wide text-foreground-muted">
            Top category
          </p>
          {categories.length > 0 ? (
            <>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {categories[0][0]}
              </p>
              <p className="text-sm tabular text-foreground-muted">
                {formatCurrency(categories[0][1], currency)}
              </p>
            </>
          ) : (
            <p className="mt-1 text-foreground-muted text-sm">—</p>
          )}
        </Card>
      </div>

      {/* Monthly trend bars */}
      <Card>
        <CardTitle>Monthly spending</CardTitle>
        <div className="mt-4 flex items-end gap-2 h-28">
          {summaries.map((s) => {
            const maxTotal = Math.max(...summaries.map((x) => x.total), 1);
            const h = Math.max(4, (s.total / maxTotal) * 100);
            return (
              <div
                key={s.label}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <span className="text-[10px] text-foreground-muted tabular">
                  {formatCurrency(s.total, currency).replace(/\.00$/, "")}
                </span>
                <div
                  className="w-full rounded-t-lg bg-accent transition-all"
                  style={{ height: `${h}%`, minHeight: "4px" }}
                />
                <span className="text-[10px] text-foreground-muted">
                  {s.label.split(" ")[0]}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Category breakdown for current month */}
      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>
            Spending by category · {current?.label}
          </CardTitle>
          {trend !== null && (
            <Badge tone={trend > 0 ? "danger" : "accent"}>
              {trend > 0 ? "+" : ""}
              {trend.toFixed(1)}%
            </Badge>
          )}
        </div>

        {categories.length === 0 ? (
          <p className="mt-4 text-sm text-foreground-muted">
            No spending recorded this month.
          </p>
        ) : (
          <div className="mt-5 flex flex-col gap-3">
            {categories.map(([cat, amount]) => (
              <CategoryBar
                key={cat}
                category={cat}
                amount={amount}
                max={maxAmount}
                currency={currency}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Month-by-month table */}
      <Card>
        <CardTitle>6-month overview</CardTitle>
        <div className="mt-4 divide-y divide-border">
          {[...summaries].reverse().map((s) => (
            <div
              key={s.label}
              className="flex items-center justify-between py-2.5 text-sm"
            >
              <span className="text-foreground-muted">{s.label}</span>
              <span className="tabular font-medium text-foreground">
                {formatCurrency(s.total, currency)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
