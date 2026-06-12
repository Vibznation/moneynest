import type {
  Account,
  Bill,
  FinancialAccount,
  Goal,
  Income,
  Profile,
  Settings,
  Subscription,
  Transaction,
  UserSnapshot,
} from "@/types/domain";

export type Mode = "demo" | "fresh";

export interface DataNotice {
  id: number;
  message: string;
}

export interface DataStore {
  snapshot: UserSnapshot;
  ready: boolean;
  mode: Mode;
  notice: DataNotice | null;
  dismissNotice: () => void;
  reset: (mode: Mode) => void;
  updateAccount: (patch: Partial<Account>) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  addIncome: (input: Omit<Income, "id" | "user_id" | "created_at">) => void;
  updateIncome: (id: string, patch: Partial<Income>) => void;
  deleteIncome: (id: string) => void;
  addBill: (input: Omit<Bill, "id" | "user_id" | "created_at">) => void;
  updateBill: (id: string, patch: Partial<Bill>) => void;
  deleteBill: (id: string) => void;
  addSubscription: (
    input: Omit<Subscription, "id" | "user_id" | "created_at">,
  ) => void;
  updateSubscription: (id: string, patch: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  addGoal: (input: Omit<Goal, "id" | "user_id" | "created_at">) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addFinancialAccount: (
    input: Omit<FinancialAccount, "id" | "user_id" | "created_at" | "updated_at">,
  ) => void;
  updateFinancialAccount: (id: string, patch: Partial<FinancialAccount>) => void;
  deleteFinancialAccount: (id: string) => void;
  addTransaction: (
    input: Omit<Transaction, "id" | "user_id" | "created_at">,
  ) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  reloadFinancialAccounts: () => Promise<void>;
}
