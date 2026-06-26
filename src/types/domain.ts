export type IncomeFrequency = "weekly" | "biweekly" | "monthly" | "custom";

export type Gender = "male" | "female" | "non_binary" | "prefer_not_to_say" | "other";

export type AnnualIncomeRange =
  | "under_25k"
  | "25k_50k"
  | "50k_75k"
  | "75k_100k"
  | "100k_150k"
  | "over_150k"
  | "prefer_not_to_say";

export type ConsentType =
  | "privacy_policy"
  | "terms_of_service"
  | "email_marketing"
  | "sms_marketing"
  | "analytics"
  | "personalization";

export type ConsentSource = "onboarding" | "settings" | "banner" | "api";

export type ConsentAction = "granted" | "withdrawn" | "updated";

export type BillCategory =
  | "Rent/Mortgage"
  | "Car"
  | "Insurance"
  | "Phone"
  | "Credit Card"
  | "Utilities"
  | "Loan"
  | "Childcare"
  | "Other";

export type SubscriptionCategory =
  | "Streaming"
  | "Music"
  | "Cloud Storage"
  | "Fitness"
  | "Apps"
  | "Shopping"
  | "Other";

export type GoalCategory =
  | "Emergency Fund"
  | "Vacation"
  | "Car"
  | "Home"
  | "Kids"
  | "Business"
  | "Debt Payoff"
  | "Other";

export type BillStatus = "paid" | "unpaid";
export type SubscriptionStatus = "Keep" | "Cancel" | "Review";

export interface Profile {
  id: string;
  email: string | null;
  name: string | null;
  // Extended marketing profile fields
  phone: string | null;
  phone_country_code: string | null;
  date_of_birth: string | null; // ISO date
  city: string | null;
  state: string | null;
  country: string | null;
  zip: string | null;
  gender: Gender | null;
  occupation: string | null;
  annual_income_range: AnnualIncomeRange | null;
  marketing_source: string | null;
  onboarding_complete: boolean;
  created_at: string;
}

export interface UserConsent {
  id: string;
  user_id: string;
  consent_type: ConsentType;
  granted: boolean;
  consent_version: string;
  consent_text_shown: string;
  consent_source: ConsentSource;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

export interface Income {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  frequency: IncomeFrequency;
  next_payday: string; // ISO date
  created_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  checking_balance: number;
  savings_balance: number;
  updated_at: string;
}

export interface Bill {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_date: string;
  category: BillCategory;
  autopay: boolean;
  status: BillStatus;
  notes: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  renewal_date: string;
  category: SubscriptionCategory;
  status: SubscriptionStatus;
  notes: string | null;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  monthly_target: number;
  category: GoalCategory;
  created_at: string;
}

export interface Settings {
  id: string;
  user_id: string;
  minimum_cushion: number;
  currency: string;
  pay_frequency: IncomeFrequency;
  dark_mode: boolean;
  notification_preferences: Record<string, unknown>;
  created_at: string;
}

export type FinancialAccountType =
  | "checking"
  | "savings"
  | "credit_card"
  | "loan"
  | "cash"
  | "other";

export type FinancialAccountSource = "manual" | "plaid";

export type FinancialAccountStatus =
  | "manual"
  | "connected"
  | "sync_needed"
  | "disconnected";

export interface FinancialAccount {
  id: string;
  user_id: string;
  institution_name: string | null;
  account_name: string;
  account_type: FinancialAccountType;
  balance: number;
  currency: string;
  source: FinancialAccountSource;
  status: FinancialAccountStatus;
  notes: string | null;
  plaid_item_id: string | null;
  plaid_account_id: string | null;
  include_in_safe_to_spend: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export type TransactionSource = "manual" | "plaid";

export interface Transaction {
  id: string;
  user_id: string;
  financial_account_id: string | null;
  plaid_transaction_id: string | null;
  name: string;
  merchant_name: string | null;
  amount: number;
  category: string | null;
  transaction_date: string;
  pending: boolean;
  source: TransactionSource;
  notes: string | null;
  created_at: string;
}

export interface UserSnapshot {
  profile: Profile | null;
  account: Account | null;
  income: Income[];
  bills: Bill[];
  subscriptions: Subscription[];
  goals: Goal[];
  settings: Settings | null;
  financial_accounts: FinancialAccount[];
  transactions: Transaction[];
}
