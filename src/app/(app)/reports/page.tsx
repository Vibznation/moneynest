"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  parseISO,
} from "date-fns";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { useData } from "@/lib/data-store";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PremiumGate } from "@/components/plus/PremiumGate";
import { formatCurrency } from "@/lib/utils";
import type { UserSnapshot } from "@/types/domain";

// ── Month picker ─────────────────────────────────────────────────────────────

function buildMonthOptions(count = 12) {
  const opts: { value: string; label: string }[] = [];
  for (let i = 0; i < count; i++) {
    const d = subMonths(new Date(), i);
    opts.push({ value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy") });
  }
  return opts;
}

// ── Report data builder ──────────────────────────────────────────────────────

function buildReport(snapshot: UserSnapshot, month: string) {
  const [year, mon] = month.split("-").map(Number);
  const ref = new Date(year, mon - 1, 1);
  const start = startOfMonth(ref);
  const end = endOfMonth(ref);

  function inRange(dateStr: string) {
    const d = parseISO(dateStr);
    return d >= start && d <= end;
  }

  // Income
  const income = snapshot.income.reduce((s, i) => s + i.amount, 0);

  // Bills paid this month
  const billsPaid = snapshot.bills.filter(
    (b) => b.status === "paid" && inRange(b.due_date),
  );
  const billsTotal = billsPaid.reduce((s, b) => s + b.amount, 0);

  // Subscriptions renewing this month
  const subsRenewing = snapshot.subscriptions.filter((s) =>
    inRange(s.renewal_date),
  );
  const subsTotal = subsRenewing.reduce((s, sub) => s + sub.amount, 0);

  // Transactions (spending)
  const txSpending = snapshot.transactions.filter(
    (t) => inRange(t.transaction_date) && t.amount > 0,
  );
  const txTotal = txSpending.reduce((s, t) => s + t.amount, 0);

  // Spending by category
  const byCategory: Record<string, number> = {};
  txSpending.forEach((t) => {
    const cat = t.category ?? "Other";
    byCategory[cat] = (byCategory[cat] ?? 0) + t.amount;
  });

  // Goals progress
  const goalsProgress = snapshot.goals.map((g) => ({
    name: g.name,
    current: g.current_amount,
    target: g.target_amount,
    pct: g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0,
  }));

  // Balances
  const checking = snapshot.account?.checking_balance ?? 0;
  const savings = snapshot.account?.savings_balance ?? 0;
  const linkedBalance = snapshot.financial_accounts
    .filter((a) => a.include_in_safe_to_spend)
    .reduce((s, a) => s + a.balance, 0);

  const net = income - billsTotal - subsTotal - txTotal;

  return {
    month: format(ref, "MMMM yyyy"),
    income,
    billsPaid,
    billsTotal,
    subsRenewing,
    subsTotal,
    txTotal,
    byCategory,
    goalsProgress,
    checking,
    savings,
    linkedBalance,
    net,
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
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
          Monthly Money Reports
        </h1>
        <p className="mt-1 text-foreground-muted">
          A clear summary of each month — income, spending, bills, and goals.
        </p>
      </header>
      <PremiumGate
        feature="monthly_reports"
        title="Monthly Money Reports"
        description="Upgrade to Dueviq+ Personal to generate and download monthly financial summaries."
      >
        <ReportsContent />
      </PremiumGate>
    </div>
  );
}

function ReportsContent() {
  const { snapshot } = useData();
  const currency = snapshot.settings?.currency ?? "USD";
  const months = useMemo(() => buildMonthOptions(12), []);
  const printRef = useRef<HTMLDivElement>(null);
  const [picked, setPicked] = useState<string>(
    months[0]?.value ?? format(new Date(), "yyyy-MM"),
  );

  const report = useMemo(
    () => buildReport(snapshot, picked),
    [snapshot, picked],
  );

  function handlePrint() {
    if (!printRef.current) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Dueviq Report · ${report.monthLabel}</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:32px;color:#1a1a1a;max-width:600px;margin:0 auto}
        h2{font-size:14px;font-weight:600;margin-top:20px;border-bottom:1px solid #eee;padding-bottom:4px;text-transform:uppercase;letter-spacing:.04em;color:#666}
        .row{display:flex;justify-content:space-between;padding:3px 0;font-size:13px}
        .muted{color:#666}
        @media print{body{padding:16px}}
      </style></head><body>
      ${printRef.current.innerHTML}
      </body></html>`);
    win.document.close();
    win.print();
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Month selector */}
      <div className="flex items-center gap-3">
        <select
          className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground"
          value={picked}
          onChange={(e) => setPicked(e.target.value)}
        >
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <Button variant="secondary" onClick={handlePrint}>
          <Download size={15} /> Export
        </Button>
      </div>

      {/* Printable report */}
      <div ref={printRef}>
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <FileText size={18} />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-foreground-muted">
                Dueviq Monthly Report
              </p>
              <h2 className="text-lg font-bold text-foreground">{report.monthLabel}</h2>
            </div>
          </div>

          <ReportSection title="Summary">
            <ReportRow label="Estimated income" value={formatCurrency(report.income, currency)} />
            <ReportRow label="Bills paid" value={`-${formatCurrency(report.billsTotal, currency)}`} muted />
            <ReportRow label="Subscriptions" value={`-${formatCurrency(report.subsTotal, currency)}`} muted />
            <ReportRow label="Transaction spending" value={`-${formatCurrency(report.txTotal, currency)}`} muted />
            <ReportRow
              label="Net position"
              value={formatCurrency(report.net, currency)}
              bold
              tone={report.net >= 0 ? "positive" : "negative"}
            />
          </ReportSection>

          <ReportSection title="Bills paid this month">
            {report.billsPaid.length === 0 ? (
              <p className="text-sm text-foreground-muted">None recorded.</p>
            ) : (
              report.billsPaid.map((b) => (
                <ReportRow
                  key={b.id}
                  label={b.name}
                  value={formatCurrency(b.amount, currency)}
                  muted
                />
              ))
            )}
          </ReportSection>

          <ReportSection title="Subscriptions renewing">
            {report.subsRenewing.length === 0 ? (
              <p className="text-sm text-foreground-muted">None this month.</p>
            ) : (
              report.subsRenewing.map((s) => (
                <ReportRow
                  key={s.id}
                  label={s.name}
                  value={formatCurrency(s.amount, currency)}
                  muted
                />
              ))
            )}
          </ReportSection>

          {Object.keys(report.byCategory).length > 0 && (
            <ReportSection title="Spending by category">
              {Object.entries(report.byCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, amt]) => (
                  <ReportRow
                    key={cat}
                    label={cat}
                    value={formatCurrency(amt, currency)}
                    muted
                  />
                ))}
            </ReportSection>
          )}

          {report.goalsProgress.length > 0 && (
            <ReportSection title="Goals progress">
              {report.goalsProgress.map((g) => (
                <ReportRow
                  key={g.name}
                  label={g.name}
                  value={`${formatCurrency(g.current, currency)} / ${formatCurrency(g.target, currency)} (${g.pct.toFixed(0)}%)`}
                  muted
                />
              ))}
            </ReportSection>
          )}

          <ReportSection title="Account balances (snapshot)">
            <ReportRow label="Checking" value={formatCurrency(report.checking, currency)} muted />
            <ReportRow label="Savings" value={formatCurrency(report.savings, currency)} muted />
            {report.linkedBalance > 0 && (
              <ReportRow label="Linked accounts" value={formatCurrency(report.linkedBalance, currency)} muted />
            )}
          </ReportSection>

          <p className="mt-5 text-[10px] text-foreground-muted leading-relaxed">
            This report is based on data you entered in Dueviq. It is for
            personal budgeting purposes only and does not constitute financial
            advice, a tax document, or an official financial statement.
          </p>
        </Card>
      </div>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <CardTitle>{title}</CardTitle>
      <div className="mt-2 divide-y divide-border">{children}</div>
    </div>
  );
}

function ReportRow({
  label,
  value,
  bold,
  muted,
  tone,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
  tone?: "positive" | "negative";
}) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className={muted ? "text-foreground-muted" : "text-foreground"}>
        {label}
      </span>
      <span
        className={
          bold
            ? `font-semibold tabular ${tone === "positive" ? "text-accent" : tone === "negative" ? "text-danger" : "text-foreground"}`
            : "tabular text-foreground-muted"
        }
      >
        {value}
      </span>
    </div>
  );
}
