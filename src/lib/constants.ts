import type {
  BillCategory,
  FinancialAccountType,
  GoalCategory,
  IncomeFrequency,
  SubscriptionCategory,
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
