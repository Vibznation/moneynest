"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import {
  Calendar,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Repeat,
  Plus,
  Wallet,
  Target,
  ArrowRight,
  TrendingDown,
  BellRing,
} from "lucide-react";
import { useData } from "@/lib/data-store";
import {
  calculateCalmScore,
  calculateSafeToSpend,
  daysUntil,
  evaluateBeforeYouSpend,
  generateNestGuideMessage,
  getNextBill,
  getOverdueBills,
  getRenewingSoon,
  toDate,
} from "@/lib/calculations";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";
import { CalmScoreRing } from "@/components/today/CalmScoreRing";

export default function TodayPage() {
  const { snapshot, updateBill } = useData();
  const safe = useMemo(() => calculateSafeToSpend(snapshot), [snapshot]);
  const calm = useMemo(() => calculateCalmScore(snapshot), [snapshot]);
  const nextBill = useMemo(() => getNextBill(snapshot.bills), [snapshot]);
  const overdue = useMemo(() => getOverdueBills(snapshot.bills), [snapshot]);
  const renewals = useMemo(
    () => getRenewingSoon(snapshot.subscriptions, 7),
    [snapshot],
  );
  const message = useMemo(
    () => generateNestGuideMessage(snapshot),
    [snapshot],
  );
  const currency = snapshot.settings?.currency ?? "USD";
  const daysToPayday = daysUntil(safe.nextPayday);
  const firstName =
    snapshot.profile?.name?.trim().split(/\s+/)[0] ?? "there";

  const hour = new Date().getHours();
  const greeting =
    hour < 5
      ? "Good night"
      : hour < 12
        ? "Good morning"
        : hour < 18
          ? "Good afternoon"
          : "Good evening";

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-foreground-muted">
            {format(new Date(), "EEEE, MMM d")}
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">
            {greeting}, {firstName}.
          </h1>
        </div>
        <Badge tone="neutral" className="hidden sm:inline-flex">
          <Calendar size={12} />
          Payday {daysToPayday <= 0 ? "today" : `in ${daysToPayday}d`}
        </Badge>
      </header>

      {/* Hero: Safe to Spend + Calm Ring */}
      <Card className="relative overflow-hidden p-6 sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(600px 200px at 90% -20%, color-mix(in oklab, var(--accent) 22%, transparent), transparent 60%)",
          }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
              Safe to spend
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                className={`tabular text-5xl sm:text-6xl font-semibold ${
                  safe.amount < 0 ? "text-danger" : "text-foreground"
                }`}
              >
                {formatCurrency(safe.amount, currency)}
              </span>
            </div>
            <p className="mt-2 text-sm text-foreground-muted">
              {safe.amount < 0
                ? `Short by ${formatCurrency(Math.abs(safe.amount), currency)} before payday`
                : `Before payday on ${format(safe.nextPayday, "EEE, MMM d")}`}
            </p>

            <dl className="mt-5 grid grid-cols-3 gap-3 sm:max-w-md">
              <HeroStat
                label="Available"
                value={formatCurrency(safe.balance, currency)}
                icon={<Wallet size={14} />}
              />
              <HeroStat
                label="Bills due"
                value={formatCurrency(safe.upcomingBillsTotal, currency)}
                icon={<TrendingDown size={14} />}
                tone={
                  safe.upcomingBillsTotal > safe.balance ? "danger" : undefined
                }
              />
              <HeroStat
                label="Goals"
                value={formatCurrency(safe.goalContributions, currency)}
                icon={<Target size={14} />}
              />
            </dl>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end gap-4 sm:gap-3 self-start">
            <CalmScoreRing score={calm.score} label={calm.label} />
            <p className="text-xs text-foreground-muted text-right max-w-[10rem] hidden sm:block">
              Money Calm Score · cushion{" "}
              {formatCurrency(safe.cushion, currency)}
            </p>
          </div>
        </div>
      </Card>

      {/* Nest Guide message */}
      <Card className="bg-accent-soft border-accent-soft">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface text-foreground">
            <Sparkles size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
              Nest Guide
            </p>
            <p className="mt-1 text-foreground">{message}</p>
          </div>
        </div>
      </Card>

      {/* Overdue alert banner */}
      {overdue.length > 0 && (
        <Card className="bg-danger-soft border-danger-soft">
          <div className="flex items-start gap-3">
            <BellRing size={18} className="text-danger shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">
                {overdue.length} overdue bill{overdue.length > 1 ? "s" : ""}
              </p>
              <ul className="mt-1 space-y-1">
                {overdue.map((b) => (
                  <li key={b.id} className="flex items-center justify-between text-sm">
                    <span className="truncate text-foreground-muted">{b.name} · {formatCurrency(b.amount, currency)}</span>
                    <button
                      onClick={() => updateBill(b.id, { status: "paid" })}
                      className="ml-3 shrink-0 text-xs font-medium text-accent hover:underline"
                    >
                      Mark paid
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Calm score reasons */}
      {calm.reasons.length > 0 && (
        <Card>
          <CardTitle>What&apos;s pulling your score</CardTitle>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {calm.reasons.map((r) => (
              <li
                key={r}
                className="flex items-center gap-2 rounded-xl bg-surface-muted px-3 py-2 text-sm"
              >
                <AlertTriangle size={14} className="text-warning shrink-0" />
                <span className="truncate">{r}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Next bill + Renewals */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Next bill</CardTitle>
            <Link
              href="/bills"
              className="text-xs text-foreground-muted hover:text-foreground inline-flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {nextBill ? (
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-muted">
                <Calendar size={18} className="text-foreground-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{nextBill.name}</p>
                <p className="text-sm text-foreground-muted">
                  {format(toDate(nextBill.due_date), "EEE, MMM d")} ·{" "}
                  {daysUntil(nextBill.due_date) < 0
                    ? "overdue"
                    : daysUntil(nextBill.due_date) === 0
                      ? "today"
                      : `in ${daysUntil(nextBill.due_date)}d`}
                </p>
              </div>
              <div className="text-right">
                <p className="tabular text-lg font-semibold">
                  {formatCurrency(nextBill.amount, currency)}
                </p>
                <Badge
                  tone={
                    daysUntil(nextBill.due_date) < 0
                      ? "danger"
                      : daysUntil(nextBill.due_date) <= 3
                        ? "warning"
                        : "info"
                  }
                >
                  {daysUntil(nextBill.due_date) < 0
                    ? "Overdue"
                    : daysUntil(nextBill.due_date) <= 3
                      ? "Due soon"
                      : "Upcoming"}
                </Badge>
                {nextBill.status !== "paid" && (
                  <button
                    onClick={() => updateBill(nextBill.id, { status: "paid" })}
                    className="mt-1.5 block text-xs text-accent hover:underline w-full text-right"
                  >
                    Mark paid
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-foreground-muted flex items-center gap-2">
              <CheckCircle2 size={14} className="text-accent" /> No unpaid
              bills. Nice.
            </p>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Renewing in 7 days</CardTitle>
            <Link
              href="/subscriptions"
              className="text-xs text-foreground-muted hover:text-foreground inline-flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {renewals.length ? (
            <ul className="mt-3 divide-y divide-border">
              {renewals.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between py-2.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Repeat
                      size={14}
                      className="text-foreground-muted shrink-0"
                    />
                    <span className="text-sm truncate">{s.name}</span>
                    {s.status === "Review" && (
                      <Badge tone="warning">Review</Badge>
                    )}
                  </div>
                  <div className="text-sm text-foreground-muted tabular">
                    {format(toDate(s.renewal_date), "MMM d")} ·{" "}
                    {formatCurrency(s.amount, currency)}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-foreground-muted flex items-center gap-2">
              <CheckCircle2 size={14} className="text-accent" /> Nothing
              renewing this week.
            </p>
          )}
        </Card>
      </div>

      {/* Before You Spend */}
      <BeforeYouSpend />

      {/* Quick add */}
      <div className="grid gap-3 sm:grid-cols-3">
        <QuickAdd href="/bills" icon={<Wallet size={16} />} label="Add a bill" />
        <QuickAdd
          href="/subscriptions"
          icon={<Repeat size={16} />}
          label="Add subscription"
        />
        <QuickAdd href="/goals" icon={<Target size={16} />} label="Add a goal" />
      </div>
    </div>
  );
}

function HeroStat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "danger";
}) {
  return (
    <div className="rounded-xl bg-surface-muted/70 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-foreground-muted">
        {icon}
        <span>{label}</span>
      </div>
      <div
        className={`tabular mt-1 text-sm sm:text-base font-semibold ${
          tone === "danger" ? "text-danger" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function QuickAdd({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="tap group flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 hover:border-border-strong shadow-[var(--shadow-soft)]"
    >
      <span className="flex items-center gap-2 text-sm font-medium">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-surface-muted text-foreground-muted">
          {icon}
        </span>
        {label}
      </span>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-foreground transition-transform group-hover:translate-x-0.5">
        <Plus size={14} />
      </span>
    </Link>
  );
}

function BeforeYouSpend() {
  const { snapshot } = useData();
  const [amountStr, setAmountStr] = useState("");
  const [reason, setReason] = useState("");
  const amount = parseFloat(amountStr || "0");
  const currency = snapshot.settings?.currency ?? "USD";
  const evalResult =
    amount > 0 ? evaluateBeforeYouSpend(amount, snapshot) : null;

  const verdictTone =
    evalResult?.verdict === "ok"
      ? "accent"
      : evalResult?.verdict === "caution"
        ? "info"
        : evalResult?.verdict === "warn"
          ? "warning"
          : "danger";

  return (
    <Card>
      <CardTitle>Before you spend</CardTitle>
      <p className="mt-1 text-sm text-foreground-muted">
        Thinking of buying something? Ask first.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Amount">
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder="0.00"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
          />
        </Field>
        <Field label="Reason (optional)">
          <Input
            placeholder="dinner, gift…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
        <Button
          variant="secondary"
          onClick={() => {
            setAmountStr("");
            setReason("");
          }}
        >
          Clear
        </Button>
      </div>

      {evalResult && amount > 0 ? (
        <div className="mt-4 rounded-2xl bg-surface-muted/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <Badge tone={verdictTone}>
              {evalResult.verdict === "ok"
                ? "Looks safe"
                : evalResult.verdict === "caution"
                  ? "Caution"
                  : evalResult.verdict === "warn"
                    ? "Be careful"
                    : "Not recommended"}
            </Badge>
            <span className="text-xs text-foreground-muted tabular">
              After: {formatCurrency(evalResult.remaining, currency)}
            </span>
          </div>
          <p className="mt-2 text-sm">{evalResult.message}</p>
        </div>
      ) : (
        <p className="mt-3 text-xs text-foreground-muted">
          Enter an amount to see if it&apos;s safe.
        </p>
      )}
    </Card>
  );
}
