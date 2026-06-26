import type {
  BillCategory,
  FinancialAccountType,
  GoalCategory,
  IncomeFrequency,
  SubscriptionCategory,
  Gender,
  AnnualIncomeRange,
} from "@/types/domain";

export const BILL_CATEGORIES: BillCategory[] = [
  "Rent/Mortgage",
  "Car",
  "Insurance",
  "Phone",
  "Credit Card",
  "Utilities",
  "Loan",
  "Childcare",
  "Other",
];

export const SUBSCRIPTION_CATEGORIES: SubscriptionCategory[] = [
  "Streaming",
  "Music",
  "Cloud Storage",
  "Fitness",
  "Apps",
  "Shopping",
  "Other",
];

export const GOAL_CATEGORIES: GoalCategory[] = [
  "Emergency Fund",
  "Vacation",
  "Car",
  "Home",
  "Kids",
  "Business",
  "Debt Payoff",
  "Other",
];

export const FREQUENCIES: IncomeFrequency[] = [
  "weekly",
  "biweekly",
  "monthly",
  "custom",
];

export const DEFAULT_MINIMUM_CUSHION = 100;

export const ACCOUNT_TYPES: FinancialAccountType[] = [
  "checking",
  "savings",
  "credit_card",
  "loan",
  "cash",
  "other",
];

export const ACCOUNT_TYPE_LABELS: Record<FinancialAccountType, string> = {
  checking: "Checking",
  savings: "Savings",
  credit_card: "Credit Card",
  loan: "Loan",
  cash: "Cash",
  other: "Other",
};

export const DEFAULT_INCLUDE_BY_TYPE: Record<FinancialAccountType, boolean> = {
  checking: true,
  cash: true,
  savings: false,
  credit_card: false,
  loan: false,
  other: false,
};

// ─── Marketing profile options ────────────────────────────────────────────────

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non_binary", label: "Non-binary" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export const INCOME_RANGE_OPTIONS: { value: AnnualIncomeRange; label: string }[] = [
  { value: "under_25k", label: "Under $25,000" },
  { value: "25k_50k", label: "$25,000 – $50,000" },
  { value: "50k_75k", label: "$50,000 – $75,000" },
  { value: "75k_100k", label: "$75,000 – $100,000" },
  { value: "100k_150k", label: "$100,000 – $150,000" },
  { value: "over_150k", label: "Over $150,000" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export const MARKETING_SOURCE_OPTIONS = [
  "App Store",
  "Google Search",
  "Social Media",
  "Friend / Family",
  "YouTube",
  "Reddit",
  "Other",
] as const;

// ─── Consent text (versioned — stored verbatim at time of consent) ────────────

export const CONSENT_VERSION = "1.0";

export const CONSENT_TEXT = {
  privacy_policy:
    "I have read and agree to Dueviq's Privacy Policy, which describes how my personal and financial data is collected, used, and protected.",
  terms_of_service:
    "I have read and agree to Dueviq's Terms of Service.",
  email_marketing:
    "I agree to receive marketing and promotional emails from Dueviq, including product updates, tips, and special offers. I understand I can unsubscribe at any time by clicking the unsubscribe link in any email. Consent is not a condition of using the service.",
  sms_marketing:
    "By providing my phone number, I agree to receive marketing and promotional text messages from Dueviq, including product updates and special offers. Message and data rates may apply. Message frequency varies. Reply STOP to opt out at any time, HELP for help. Consent is not a condition of using the service.",
  analytics:
    "I agree to allow Dueviq to collect anonymised usage analytics to help improve the app experience.",
  personalization:
    "I agree to allow Dueviq to use my financial behaviour and preferences to personalise content, tips, and feature recommendations within the app.",
} as const satisfies Record<string, string>;
