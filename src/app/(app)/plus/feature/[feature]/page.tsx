"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Bitcoin,
  LineChart,
  FileText,
  Receipt,
  Building2,
  Lock,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const FEATURE_META: Record<
  string,
  {
    icon: React.ElementType;
    title: string;
    description: string;
    detail: string;
    plan: string;
    planId: string;
  }
> = {
  advanced_analytics: {
    icon: BarChart3,
    title: "Smart Spending Insights",
    description: "Understand where your money is going with deeper monthly patterns and spending trends.",
    detail:
      "See category-level breakdowns over time, spot where spending is rising, and get a monthly snapshot of where your money actually went — all in a clean, easy-to-read view.",
    plan: "Dueviq+ Personal",
    planId: "plus_personal",
  },
  portfolio_summary: {
    icon: TrendingUp,
    title: "Portfolio View",
    description: "Track connected investment accounts and view balances, holdings, and portfolio changes.",
    detail:
      "Connect your investment accounts to see total portfolio value, individual holdings, and performance summaries. Tracking only — no trades, no advice.",
    plan: "Dueviq+ Personal",
    planId: "plus_personal",
  },
  crypto_tracking: {
    icon: Bitcoin,
    title: "Crypto View",
    description: "Follow your cryptocurrency holdings and value in one simple view.",
    detail:
      "Add your crypto holdings manually or connect a supported wallet to see current value alongside your other accounts. Tracking only — no trading or exchange features.",
    plan: "Dueviq+ Personal",
    planId: "plus_personal",
  },
  stock_charts: {
    icon: LineChart,
    title: "Market Watch",
    description: "View stock charts and keep a simple watchlist without placing trades.",
    detail:
      "Add tickers to your watchlist, view price charts, and stay aware of how your watched stocks are moving. No brokerage, no trades, no financial advice.",
    plan: "Dueviq+ Personal",
    planId: "plus_personal",
  },
  monthly_reports: {
    icon: FileText,
    title: "Monthly Money Reports",
    description: "Download clear monthly summaries of income, spending, bills, goals, and balances.",
    detail:
      "Get a PDF or CSV snapshot of every month — income earned, bills paid, spending by category, goal progress, and net position — ready to save or share.",
    plan: "Dueviq+ Personal",
    planId: "plus_personal",
  },
  debt_planner: {
    icon: TrendingUp,
    title: "Debt Planner",
    description: "Compare payoff strategies and track payment progress.",
    detail:
      "Enter your debts and compare avalanche vs snowball payoff strategies. Track progress as you make payments. No loans, no credit applications, no lending features.",
    plan: "Dueviq+ Personal",
    planId: "plus_personal",
  },
  tax_organizer: {
    icon: Receipt,
    title: "Tax Organizer",
    description: "Organize tax-related expenses and export reports for tax preparation.",
    detail:
      "Tag transactions as tax-relevant, categorize by deduction type, and export a clean summary for your accountant or tax software. Electronic tax filing is not included.",
    plan: "Dueviq Business",
    planId: "business",
  },
  business_workspace: {
    icon: Building2,
    title: "Dueviq Business",
    description: "Separate business income and expenses with exportable summaries and invoice tracking.",
    detail:
      "Keep a clean separation between personal and business finances. Track income, expenses, invoices, and receipts. Export summaries for your accountant. Not a full accounting platform.",
    plan: "Dueviq Business",
    planId: "business",
  },
};

export default function FeaturePreviewPage({
  params,
}: {
  params: { feature: string };
}) {
  const meta = FEATURE_META[params.feature];
  if (!meta) notFound();

  const Icon = meta.icon;

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto">
      <Link
        href="/plus"
        className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground"
      >
        <ArrowLeft size={14} /> Back to Dueviq+
      </Link>

      {/* Icon + title */}
      <div className="flex flex-col items-center text-center gap-3 pt-4">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <Icon size={28} />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {meta.title}
          </h1>
          <p className="mt-2 text-foreground-muted max-w-xs mx-auto">
            {meta.description}
          </p>
        </div>
      </div>

      {/* Detail card */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="text-sm text-foreground-muted leading-relaxed">
          {meta.detail}
        </p>
      </div>

      {/* Locked state */}
      <div className="rounded-2xl border border-accent bg-accent-soft p-6 flex flex-col items-center gap-4 text-center">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface text-accent">
          <Lock size={18} />
        </span>
        <div>
          <p className="font-semibold text-foreground">
            Included in {meta.plan}
          </p>
          <p className="mt-1 text-sm text-foreground-muted">
            Upgrade to Dueviq+ to unlock deeper insights while keeping your
            everyday dashboard simple.
          </p>
        </div>
        <Button
          variant="primary"
          className="w-full"
          onClick={() =>
            alert("Google Play Billing — coming in Phase 2.")
          }
        >
          <Sparkles size={15} /> Upgrade to {meta.plan}
        </Button>
        <Link
          href="/today"
          className="text-xs text-foreground-muted hover:text-foreground underline underline-offset-2"
        >
          Return to my dashboard
        </Link>
      </div>
    </div>
  );
}
