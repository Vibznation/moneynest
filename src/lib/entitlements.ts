// Dueviq+ entitlement system
// Phase 1: client-side only — ready for Google Play Billing integration in Phase 2

export type EntitlementType = "free" | "plus_personal" | "business";

export interface PlanInfo {
  id: EntitlementType;
  name: string;
  price_monthly: string;
  price_annual: string;
  product_id_monthly: string | null;
  product_id_annual: string | null;
}

export const PLANS: PlanInfo[] = [
  {
    id: "free",
    name: "Dueviq Basic",
    price_monthly: "Free",
    price_annual: "Free",
    product_id_monthly: null,
    product_id_annual: null,
  },
  {
    id: "plus_personal",
    name: "Dueviq+ Personal",
    price_monthly: "$5.99/mo",
    price_annual: "$49.99/yr",
    product_id_monthly: "dueviq_plus_monthly",
    product_id_annual: "dueviq_plus_annual",
  },
  {
    id: "business",
    name: "Dueviq Business",
    price_monthly: "$12.99/mo",
    price_annual: "$12.99/mo",
    product_id_monthly: "dueviq_business_monthly",
    product_id_annual: "dueviq_business_monthly",
  },
];

export type PremiumFeature =
  | "advanced_analytics"
  | "monthly_reports"
  | "investment_tracking"
  | "crypto_tracking"
  | "stock_charts"
  | "portfolio_summary"
  | "tax_organizer"
  | "invoice_tracking"
  | "receipt_organization"
  | "business_reports"
  | "business_workspace"
  | "debt_planner";

const FEATURE_REQUIREMENTS: Record<PremiumFeature, EntitlementType[]> = {
  advanced_analytics: ["plus_personal", "business"],
  monthly_reports: ["plus_personal", "business"],
  investment_tracking: ["plus_personal", "business"],
  crypto_tracking: ["plus_personal", "business"],
  stock_charts: ["plus_personal", "business"],
  portfolio_summary: ["plus_personal", "business"],
  debt_planner: ["plus_personal", "business"],
  tax_organizer: ["business"],
  invoice_tracking: ["business"],
  receipt_organization: ["business"],
  business_reports: ["business"],
  business_workspace: ["business"],
};

export function canAccess(
  entitlement: EntitlementType,
  feature: PremiumFeature,
): boolean {
  return FEATURE_REQUIREMENTS[feature].includes(entitlement);
}

// Phase 1: all users are on free tier
// Replace this with Google Play Billing / Supabase entitlements lookup in Phase 2
export function getUserEntitlement(): EntitlementType {
  return "free";
}
