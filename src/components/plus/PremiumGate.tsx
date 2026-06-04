"use client";

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useEntitlement } from "@/lib/hooks/useEntitlement";
import { canAccess, type PremiumFeature, type EntitlementType } from "@/lib/entitlements";
import { cn } from "@/lib/utils";

interface PremiumGateProps {
  feature: PremiumFeature;
  /** Plan label shown in the upgrade CTA */
  planLabel?: string;
  /** Feature title shown in the locked card */
  title: string;
  /** Short description shown in the locked card */
  description?: string;
  /** The premium content — only rendered when user has access */
  children: React.ReactNode;
  /** Optional className on the outer wrapper */
  className?: string;
}

export function PremiumGate({
  feature,
  planLabel,
  title,
  description,
  children,
  className,
}: PremiumGateProps) {
  const { entitlement, loading } = useEntitlement();

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-20", className)}>
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (canAccess(entitlement, feature)) {
    return <div className={className}>{children}</div>;
  }

  const requiredPlan = planLabel ?? getPlanLabel(feature);

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-5 rounded-2xl border border-accent bg-accent-soft p-8 text-center",
        className,
      )}
    >
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-accent">
        <Lock size={22} />
      </span>
      <div>
        <p className="text-lg font-semibold text-foreground">{title}</p>
        {description && (
          <p className="mt-1.5 text-sm text-foreground-muted max-w-sm">
            {description}
          </p>
        )}
        <p className="mt-3 text-sm text-foreground-muted">
          Included in{" "}
          <span className="font-medium text-foreground">{requiredPlan}</span>.
          Upgrade to unlock deeper insights while keeping your everyday
          dashboard simple.
        </p>
      </div>
      <Link href="/plus" className="w-full max-w-xs">
        <Button variant="primary" className="w-full">
          <Sparkles size={15} />
          Upgrade to {requiredPlan}
        </Button>
      </Link>
      <Link
        href="/today"
        className="text-xs text-foreground-muted hover:text-foreground underline underline-offset-2"
      >
        Return to my dashboard
      </Link>
    </div>
  );
}

function getPlanLabel(feature: PremiumFeature): string {
  const businessOnly: PremiumFeature[] = [
    "tax_organizer",
    "invoice_tracking",
    "receipt_organization",
    "business_reports",
    "business_workspace",
  ];
  return businessOnly.includes(feature) ? "Dueviq Business" : "Dueviq+ Personal";
}

/** Lightweight inline badge — use inside cards to mark premium content */
export function PremiumBadge({ entitlement }: { entitlement: EntitlementType }) {
  if (entitlement !== "free") return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
      <Sparkles size={9} /> Plus
    </span>
  );
}
