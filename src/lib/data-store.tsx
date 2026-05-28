"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Account,
  Bill,
  FinancialAccount,
  Goal,
  Income,
  Profile,
  Settings,
  Subscription,
  UserSnapshot,
} from "@/types/domain";
import { buildDemoSnapshot, emptySnapshot } from "@/lib/mock-data";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";

function migrateSnapshot(s: UserSnapshot): UserSnapshot {
  return {
    ...s,
    financial_accounts: s.financial_accounts ?? [],
    transactions: s.transactions ?? [],
  };
}

const STORAGE_KEY = "moneynest:snapshot:v1";
const MODE_KEY = "moneynest:mode";

type Mode = "demo" | "fresh";

function uid() {
  return (
    "id-" +
    Math.random().toString(36).slice(2, 10) +
    Date.now().toString(36)
  );
}

interface DataStore {
  snapshot: UserSnapshot;
  ready: boolean;
  mode: Mode;
  reset: (mode: Mode) => void;
  // mutations
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
    input: Omit<import("@/types/domain").Transaction, "id" | "user_id" | "created_at">,
  ) => void;
  updateTransaction: (id: string, patch: Partial<import("@/types/domain").Transaction>) => void;
  deleteTransaction: (id: string) => void;
}

const Ctx = createContext<DataStore | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<UserSnapshot>(() => emptySnapshot());
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>("fresh");

  useEffect(() => {
    async function hydrate() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const storedMode = (localStorage.getItem(MODE_KEY) as Mode) || "fresh";
        let snap: UserSnapshot;
        if (raw) {
          snap = migrateSnapshot(JSON.parse(raw));
          setSnapshot(snap);
          setMode(storedMode);
        } else {
          const demo = buildDemoSnapshot();
          snap = demo;
          setSnapshot(demo);
          setMode("demo");
          localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
          localStorage.setItem(MODE_KEY, "demo");
        }
        // Supabase sync: fetch accounts, transactions, and income if configured and user is logged in
        if (isSupabaseConfigured() && snap.profile?.id) {
          try {
            const supabase = getSupabaseBrowser();
            const [
              { data: accounts, error: accErr },
              { data: txs, error: txErr },
              { data: income, error: incomeErr },
            ] = await Promise.all([
              supabase
                .from("financial_accounts")
                .select("*")
                .eq("user_id", snap.profile.id)
                .order("created_at", { ascending: true }),
              supabase
                .from("transactions")
                .select("*")
                .eq("user_id", snap.profile.id)
                .order("transaction_date", { ascending: true }),
              supabase
                .from("income")
                .select("*")
                .eq("user_id", snap.profile.id)
                .order("created_at", { ascending: true }),
            ]);
            if (!accErr && Array.isArray(accounts)) {
              setSnapshot((s) => ({ ...s, financial_accounts: accounts }));
            }
            if (!txErr && Array.isArray(txs)) {
              setSnapshot((s) => ({ ...s, transactions: txs }));
            }
            if (!incomeErr && Array.isArray(income)) {
              setSnapshot((s) => ({ ...s, income }));
            }
          } catch (err) {
            // ignore for now
          }
        }
      } catch {
        const demo = buildDemoSnapshot();
        setSnapshot(demo);
        setMode("demo");
      }
      setReady(true);
    }
    hydrate();
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      localStorage.setItem(MODE_KEY, mode);
    } catch {}
  }, [snapshot, mode, ready]);

  const reset = useCallback((nextMode: Mode) => {
    const next = nextMode === "demo" ? buildDemoSnapshot() : emptySnapshot();
    setSnapshot(next);
    setMode(nextMode);
  }, []);

  const userId = snapshot.profile?.id ?? "local-user";

  const value: DataStore = useMemo(
    () => ({
      snapshot,
      ready,
      mode,
      reset,
      updateAccount: (patch) =>
        setSnapshot((s) => ({
          ...s,
          account: {
            ...(s.account ?? {
              id: "local-account",
              user_id: userId,
              checking_balance: 0,
              savings_balance: 0,
              updated_at: new Date().toISOString(),
            }),
            ...patch,
            updated_at: new Date().toISOString(),
          },
        })),
      updateSettings: (patch) =>
        setSnapshot((s) => ({
          ...s,
          settings: { ...(s.settings as Settings), ...patch },
        })),
      updateProfile: (patch) =>
        setSnapshot((s) => ({
          ...s,
          profile: { ...(s.profile as Profile), ...patch },
        })),
      addIncome: async (input) => {
        const now = new Date().toISOString();
        const incomeItem = {
          ...input,
          id: uid(),
          user_id: userId,
          created_at: now,
        };
        setSnapshot((s) => ({
          ...s,
          income: [...s.income, incomeItem],
        }));
        if (isSupabaseConfigured() && userId && userId !== "local-user") {
          try {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.from("income").insert([incomeItem]);
            if (error) throw error;
          } catch (err) {
            alert("Failed to add income. Changes reverted.");
            setSnapshot((s) => ({
              ...s,
              income: s.income.filter((i) => i.id !== incomeItem.id),
            }));
          }
        }
      },
      updateIncome: async (id, patch) => {
        const prev = snapshot.income.find((i) => i.id === id);
        setSnapshot((s) => ({
          ...s,
          income: s.income.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        }));
        if (isSupabaseConfigured() && userId && userId !== "local-user") {
          try {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase
              .from("income")
              .update({ ...patch })
              .eq("id", id);
            if (error) throw error;
          } catch (err) {
            alert("Failed to update income. Changes reverted.");
            setSnapshot((s) => ({
              ...s,
              income: prev
                ? s.income.map((i) => (i.id === id ? prev : i))
                : s.income,
            }));
          }
        }
      },
      deleteIncome: async (id) => {
        const prev = snapshot.income.find((i) => i.id === id);
        setSnapshot((s) => ({
          ...s,
          income: s.income.filter((i) => i.id !== id),
        }));
        if (isSupabaseConfigured() && userId && userId !== "local-user") {
          try {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.from("income").delete().eq("id", id);
            if (error) throw error;
          } catch (err) {
            alert("Failed to delete income. Changes reverted.");
            setSnapshot((s) => ({
              ...s,
              income: prev
                ? [...s.income, prev]
                : s.income,
            }));
          }
        }
      },
      addBill: (input) =>
        setSnapshot((s) => ({
          ...s,
          bills: [
            ...s.bills,
            {
              ...input,
              id: uid(),
              user_id: userId,
              created_at: new Date().toISOString(),
            },
          ],
        })),
      updateBill: (id, patch) =>
        setSnapshot((s) => ({
          ...s,
          bills: s.bills.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),
      deleteBill: (id) =>
        setSnapshot((s) => ({
          ...s,
          bills: s.bills.filter((b) => b.id !== id),
        })),
      addSubscription: (input) =>
        setSnapshot((s) => ({
          ...s,
          subscriptions: [
            ...s.subscriptions,
            {
              ...input,
              id: uid(),
              user_id: userId,
              created_at: new Date().toISOString(),
            },
          ],
        })),
      updateSubscription: (id, patch) =>
        setSnapshot((s) => ({
          ...s,
          subscriptions: s.subscriptions.map((x) =>
            x.id === id ? { ...x, ...patch } : x,
          ),
        })),
      deleteSubscription: (id) =>
        setSnapshot((s) => ({
          ...s,
          subscriptions: s.subscriptions.filter((x) => x.id !== id),
        })),
      addGoal: (input) =>
        setSnapshot((s) => ({
          ...s,
          goals: [
            ...s.goals,
            {
              ...input,
              id: uid(),
              user_id: userId,
              created_at: new Date().toISOString(),
            },
          ],
        })),
      updateGoal: (id, patch) =>
        setSnapshot((s) => ({
          ...s,
          goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        })),
      deleteGoal: (id) =>
        setSnapshot((s) => ({
          ...s,
          goals: s.goals.filter((g) => g.id !== id),
        })),
      addFinancialAccount: async (input) => {
        const now = new Date().toISOString();
        const account = {
          ...input,
          id: uid(),
          user_id: userId,
          created_at: now,
          updated_at: now,
        };
        setSnapshot((s) => ({
          ...s,
          financial_accounts: [...s.financial_accounts, account],
        }));
        if (isSupabaseConfigured() && userId && userId !== "local-user") {
          try {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.from("financial_accounts").insert([account]);
            if (error) throw error;
          } catch (err) {
            alert("Failed to add account. Changes reverted.");
            setSnapshot((s) => ({
              ...s,
              financial_accounts: s.financial_accounts.filter((a) => a.id !== account.id),
            }));
          }
        }
      },
      updateFinancialAccount: async (id, patch) => {
        const prev = snapshot.financial_accounts.find((a) => a.id === id);
        setSnapshot((s) => ({
          ...s,
          financial_accounts: s.financial_accounts.map((a) =>
            a.id === id
              ? { ...a, ...patch, updated_at: new Date().toISOString() }
              : a,
          ),
        }));
        if (isSupabaseConfigured() && userId && userId !== "local-user") {
          try {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase
              .from("financial_accounts")
              .update({ ...patch, updated_at: new Date().toISOString() })
              .eq("id", id);
            if (error) throw error;
          } catch (err) {
            alert("Failed to update account. Changes reverted.");
            setSnapshot((s) => ({
              ...s,
              financial_accounts: prev
                ? s.financial_accounts.map((a) => (a.id === id ? prev : a))
                : s.financial_accounts,
            }));
          }
        }
      },
      deleteFinancialAccount: async (id) => {
        const prev = snapshot.financial_accounts.find((a) => a.id === id);
        setSnapshot((s) => ({
          ...s,
          financial_accounts: s.financial_accounts.filter((a) => a.id !== id),
        }));
        if (isSupabaseConfigured() && userId && userId !== "local-user") {
          try {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.from("financial_accounts").delete().eq("id", id);
            if (error) throw error;
          } catch (err) {
            alert("Failed to delete account. Changes reverted.");
            setSnapshot((s) => ({
              ...s,
              financial_accounts: prev
                ? [...s.financial_accounts, prev]
                : s.financial_accounts,
            }));
          }
        }
      },
      addTransaction: async (input) => {
        const now = new Date().toISOString();
        const tx = {
          ...input,
          id: uid(),
          user_id: userId,
          created_at: now,
        };
        setSnapshot((s) => ({
          ...s,
          transactions: [...s.transactions, tx],
        }));
        if (isSupabaseConfigured() && userId && userId !== "local-user") {
          try {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.from("transactions").insert([tx]);
            if (error) throw error;
          } catch (err) {
            alert("Failed to add transaction. Changes reverted.");
            setSnapshot((s) => ({
              ...s,
              transactions: s.transactions.filter((t) => t.id !== tx.id),
            }));
          }
        }
      },
      updateTransaction: async (id, patch) => {
        const prev = snapshot.transactions.find((t) => t.id === id);
        setSnapshot((s) => ({
          ...s,
          transactions: s.transactions.map((t) =>
            t.id === id ? { ...t, ...patch } : t,
          ),
        }));
        if (isSupabaseConfigured() && userId && userId !== "local-user") {
          try {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase
              .from("transactions")
              .update({ ...patch })
              .eq("id", id);
            if (error) throw error;
          } catch (err) {
            alert("Failed to update transaction. Changes reverted.");
            setSnapshot((s) => ({
              ...s,
              transactions: prev
                ? s.transactions.map((t) => (t.id === id ? prev : t))
                : s.transactions,
            }));
          }
        }
      },
      deleteTransaction: async (id) => {
        const prev = snapshot.transactions.find((t) => t.id === id);
        setSnapshot((s) => ({
          ...s,
          transactions: s.transactions.filter((t) => t.id !== id),
        }));
        if (isSupabaseConfigured() && userId && userId !== "local-user") {
          try {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.from("transactions").delete().eq("id", id);
            if (error) throw error;
          } catch (err) {
            alert("Failed to delete transaction. Changes reverted.");
            setSnapshot((s) => ({
              ...s,
              transactions: prev
                ? [...s.transactions, prev]
                : s.transactions,
            }));
          }
        }
      },
    }),
    [snapshot, ready, mode, reset, userId],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData(): DataStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}
