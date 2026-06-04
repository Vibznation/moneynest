"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  BarChart3,
  TrendingUp,
  Bitcoin,
  LineChart,
  FileText,
  Receipt,
  Building2,
  Lock,
  Check,
  ChevronRight,
  ShieldCheck,
  X,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { PLANS, type EntitlementType } from "@/lib/entitlements";

// ─── Feature modules ────────────────────────────────────────────────────────

const PREMIUM_MODULES = [
  {
    id: "advanced_analytics",
    icon: BarChart3,
    title: "Smart Spending Insights",
    description:
      "Understand where your money is going with deeper monthly patterns and spending trends.",
    plan: "plus_personal" as EntitlementType,
    href: "/spending-insights",
  },
  {
    id: "portfolio_summary",
    icon: TrendingUp,
    title: "Portfolio View",
    description:
      "Track connected investment accounts and view balances, holdings, and portfolio changes.",
    plan: "plus_personal" as EntitlementType,
    href: "/portfolio",
  },
  {
    id: "crypto_tracking",
    icon: Bitcoin,
    title: "Crypto View",
    description:
      "Follow your cryptocurrency holdings and value in one simple view.",
    plan: "plus_personal" as EntitlementType,
    href: "/crypto",
  },
  {
    id: "stock_charts",
    icon: LineChart,
    title: "Market Watch",
    description:
      "View stock charts and keep a simple watchlist without placing trades.",
    plan: "plus_personal" as EntitlementType,
    href: "/market-watch",
  },
  {
    id: "monthly_reports",
    icon: FileText,
    title: "Monthly Money Reports",
    description:
      "Download clear monthly summaries of income, spending, bills, goals, and balances.",
    plan: "plus_personal" as EntitlementType,
    href: "/reports",
  },
  {
    id: "debt_planner",
    icon: TrendingUp,
    title: "Debt Planner",
    description:
      "Compare payoff strategies and track payment progress. No loans or credit applications.",
    plan: "plus_personal" as EntitlementType,
    href: "/debt-planner",
  },
  {
    id: "tax_organizer",
    icon: Receipt,
    title: "Tax Organizer",
    description:
      "Organize tax-related expenses and export reports for tax preparation. Electronic filing not included.",
    plan: "business" as EntitlementType,
    href: "/tax-organizer",
  },
  {
    id: "business_workspace",
    icon: Building2,
    title: "Dueviq Business",
    description:
      "Separate business income and expenses with exportable summaries and invoice tracking.",
    plan: "business" as EntitlementType,
    href: "/business-workspace",
  },
];

// ─── Free plan features ──────────────────────────────────────────────────────

const FREE_FEATURES = [
  "Today dashboard",
  "Bills organizer",
  "Manual accounts",
  "Subscriptions",
  "Goals",
  "Money Map",
  "Safe to Spend",
  "Before You Spend",
  "Calm Score",
  "Optional bank connection",
];

const PLUS_EXTRA = [
  "Smart Spending Insights",
  "Portfolio View",
  "Crypto View",
  "Market Watch",
  "Monthly Money Reports",
  "Debt Planner",
  "Ad-free experience",
];

const BUSINESS_EXTRA = [
  "Everything in Dueviq+ Personal",
  "Separate business workspace",
  "Business income & expense tracking",
  "Simple profit & loss overview",
  "Invoice tracking",
  "Receipt organization",
  "Exportable accountant reports",
  "Tax Organizer exports",
];

// ─── Plan card ───────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  billing,
  current,
}: {
  plan: (typeof PLANS)[number];
  billing: "monthly" | "annual";
  current: boolean;
}) {
  const price =
    billing === "annual" ? plan.price_annual : plan.price_monthly;
  const isPaid = plan.id !== "free";
  const features =
    plan.id === "free"
      ? FREE_FEATURES
      : plan.id === "plus_personal"
        ? [...FREE_FEATURES, ...PLUS_EXTRA]
        : BUSINESS_EXTRA;

  return (
    <div
      className={cn(
        "relative flex flex-col gap-4 rounded-2xl border p-5",
        plan.id === "plus_personal"
          ? "border-accent bg-accent-soft"
          : "border-border bg-surface",
      )}
    >
      {plan.id === "plus_personal" && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-white">
          Most Popular
        </span>
      )}
      <div>
        <p className="font-semibold text-foreground">{plan.name}</p>
        <p className="mt-1 text-2xl font-bold tabular text-foreground">
          {price}
        </p>
        {isPaid && billing === "annual" && plan.id === "plus_personal" && (
          <p className="text-xs text-accent mt-0.5">Save ~30% vs monthly</p>
        )}
      </div>

      <ul className="flex flex-col gap-1.5 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check size={14} className="mt-0.5 shrink-0 text-accent" />
            <span className="text-foreground-muted">{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-2">
        {current ? (
          <Button variant="secondary" className="w-full" disabled>
            Current plan
          </Button>
        ) : (
          <Button
            variant={plan.id === "plus_personal" ? "primary" : "secondary"}
            className="w-full"
            onClick={() => alert("Google Play Billing — coming in Phase 2.")}
          >
            {isPaid ? `Upgrade to ${plan.name}` : "Current plan"}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Feature module card ─────────────────────────────────────────────────────

function ModuleCard({
  mod,
}: {
  mod: (typeof PREMIUM_MODULES)[number];
}) {
  const Icon = mod.icon;
  const planLabel =
    mod.plan === "business" ? "Dueviq Business" : "Dueviq+ Personal";

  return (
    <Link
      href={mod.href}
      className="group flex items-start gap-4 rounded-2xl border border-border bg-surface p-4 hover:border-accent transition-colors"
    >
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
        <Icon size={18} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground group-hover:text-accent transition-colors">
          {mod.title}
        </p>
        <p className="mt-0.5 text-sm text-foreground-muted line-clamp-2">
          {mod.description}
        </p>
        <Badge tone="neutral" className="mt-2 text-xs">
          <Lock size={10} /> {planLabel}
        </Badge>
      </div>
      <ChevronRight size={16} className="mt-1 shrink-0 text-foreground-muted group-hover:text-accent transition-colors" />
    </Link>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PlusPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Hero */}
      <header className="text-center pt-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent mb-3">
          <Sparkles size={12} /> Premium
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dueviq<span className="text-accent">+</span>
        </h1>
        <p className="mt-2 text-foreground-muted max-w-sm mx-auto">
          More insight when you are ready for more.
        </p>
      </header>

      {/* Billing toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-xl border border-border bg-surface p-1 gap-1">
          <button
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
              billing === "monthly"
                ? "bg-accent text-white"
                : "text-foreground-muted hover:text-foreground",
            )}
            onClick={() => setBilling("monthly")}
          >
            Monthly
          </button>
          <button
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
              billing === "annual"
                ? "bg-accent text-white"
                : "text-foreground-muted hover:text-foreground",
            )}
            onClick={() => setBilling("annual")}
          >
            Annual · Save 30%
          </button>
        </div>
      </div>

      {/* Plan comparison */}
      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            billing={billing}
            current={plan.id === "free"}
          />
        ))}
      </div>

      {/* Premium feature modules */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          What you unlock
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {PREMIUM_MODULES.map((mod) => (
            <ModuleCard key={mod.id} mod={mod} />
          ))}
        </div>
      </section>

      {/* Account management */}
      <Card>
        <CardTitle>Manage your subscription</CardTitle>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => alert("Restore Purchases — coming in Phase 2 with Google Play Billing.")}
          >
            Restore Purchases
          </Button>
          <Button
            variant="ghost"
            className="flex-1"
            onClick={() => alert("Opens Google Play subscription management.")}
          >
            Manage Subscription
          </Button>
        </div>
      </Card>

      {/* Privacy note */}
      <div className="flex flex-col items-center gap-2 text-xs text-foreground-muted text-center">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-accent" />
          <span>
            We do not sell your financial data or run targeted advertising.
          </span>
        </div>
        <div className="flex gap-4">
          <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
            Privacy Policy
          </Link>
          <Link href="/privacy#terms" className="underline underline-offset-2 hover:text-foreground">
            Terms of Use
          </Link>
        </div>
        <p className="max-w-xs mt-1 leading-relaxed">
          Subscriptions are billed through Google Play. Premium tools are
          designed as insight tools only. Dueviq does not process trades,
          apply for credit, file taxes, or process lending transactions.
        </p>
      </div>
    </div>
  );
}
