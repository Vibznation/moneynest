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

const STORAGE_KEY = "dueviq:snapshot:v1";
const MODE_KEY = "dueviq:mode";

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
  reloadFinancialAccounts: () => Promise<void>;
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
        // Sync from Supabase using the real authenticated session
        if (isSupabaseConfigured()) {
          try {
            const supabase = getSupabaseBrowser();
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              const realUid = session.user.id;
              const realEmail = session.user.email ?? null;
              const [
                profileRes,
                accountRes,
                settingsRes,
                { data: income },
                { data: bills },
                { data: subs },
                { data: goals },
                { data: accounts },
                { data: txs },
              ] = await Promise.all([
                supabase.from("profiles").select("*").eq("id", realUid).maybeSingle(),
                supabase.from("accounts").select("*").eq("user_id", realUid).maybeSingle(),
                supabase.from("settings").select("*").eq("user_id", realUid).maybeSingle(),
                supabase.from("income").select("*").eq("user_id", realUid).order("created_at", { ascending: true }),
                supabase.from("bills").select("*").eq("user_id", realUid).order("due_date", { ascending: true }),
                supabase.from("subscriptions").select("*").eq("user_id", realUid).order("renewal_date", { ascending: true }),
                supabase.from("goals").select("*").eq("user_id", realUid).order("created_at", { ascending: true }),
                supabase.from("financial_accounts").select("*").eq("user_id", realUid).order("created_at", { ascending: true }),
                supabase.from("transactions").select("*").eq("user_id", realUid).order("transaction_date", { ascending: true }),
              ]);
              // Bootstrap rows in case the DB trigger missed them (graceful fallback)
              if (!profileRes.data) {
                await supabase.from("profiles").upsert({ id: realUid, email: realEmail, name: snap.profile?.name ?? null, onboarding_complete: snap.profile?.onboarding_complete ?? false });
              }
              if (!accountRes.data) {
                await supabase.from("accounts").upsert({ user_id: realUid, checking_balance: snap.account?.checking_balance ?? 0, savings_balance: snap.account?.savings_balance ?? 0 });
              }
              if (!settingsRes.data) {
                await supabase.from("settings").upsert({ user_id: realUid, minimum_cushion: snap.settings?.minimum_cushion ?? 100, currency: snap.settings?.currency ?? "USD", pay_frequency: snap.settings?.pay_frequency ?? "biweekly" });
              }
              setSnapshot((s) => ({
                ...s,
                profile: profileRes.data ?? { id: realUid, email: realEmail, name: null, onboarding_complete: false, created_at: new Date().toISOString() },
                account: accountRes.data ?? s.account,
                settings: settingsRes.data ?? s.settings,
                income: Array.isArray(income) ? income : s.income,
                bills: Array.isArray(bills) ? bills : s.bills,
                subscriptions: Array.isArray(subs) ? subs : s.subscriptions,
                goals: Array.isArray(goals) ? goals : s.goals,
                financial_accounts: Array.isArray(accounts) ? accounts : s.financial_accounts,
                transactions: Array.isArray(txs) ? txs : s.transactions,
              }));
            }
          } catch {
            // ignore — stay with local data
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

  // Reset local state when the user signs out
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabaseBrowser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        const demo = buildDemoSnapshot();
        setSnapshot(demo);
        setMode("demo");
        try {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(MODE_KEY);
        } catch {}
      }
    });
    return () => subscription.unsubscribe();
  }, []);

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
      updateAccount: async (patch) => {
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
        }));
        if (isSupabaseConfigured() && userId !== "local-user") {
          const supabase = getSupabaseBrowser();
          try { await supabase.from("accounts").update({ ...patch, updated_at: new Date().toISOString() }).eq("user_id", userId); } catch { /* ignore */ }
        }
      },
      updateSettings: async (patch) => {
        setSnapshot((s) => ({
          ...s,
          settings: { ...(s.settings as Settings), ...patch },
        }));
        if (isSupabaseConfigured() && userId !== "local-user") {
          const supabase = getSupabaseBrowser();
          try { await supabase.from("settings").update(patch).eq("user_id", userId); } catch { /* ignore */ }
        }
      },
      updateProfile: async (patch) => {
        setSnapshot((s) => ({
          ...s,
          profile: { ...(s.profile as Profile), ...patch },
        }));
        if (isSupabaseConfigured() && userId !== "local-user") {
          const supabase = getSupabaseBrowser();
          try { await supabase.from("profiles").update(patch).eq("id", userId); } catch { /* ignore */ }
        }
      },
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
      addBill: async (input) => {
        const now = new Date().toISOString();
        const bill = { ...input, id: uid(), user_id: userId, created_at: now };
        setSnapshot((s) => ({ ...s, bills: [...s.bills, bill] }));
        if (isSupabaseConfigured() && userId !== "local-user") {
          try {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.from("bills").insert([bill]);
            if (error) throw error;
          } catch {
            setSnapshot((s) => ({ ...s, bills: s.bills.filter((b) => b.id !== bill.id) }));
          }
        }
      },
      updateBill: async (id, patch) => {
        const prev = snapshot.bills.find((b) => b.id === id);
        setSnapshot((s) => ({ ...s, bills: s.bills.map((b) => (b.id === id ? { ...b, ...patch } : b)) }));
        if (isSupabaseConfigured() && userId !== "local-user") {
          try {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.from("bills").update(patch).eq("id", id);
            if (error) throw error;
          } catch {
            setSnapshot((s) => ({ ...s, bills: prev ? s.bills.map((b) => (b.id === id ? prev : b)) : s.bills }));
          }
        }
      },
      deleteBill: async (id) => {
        const prev = snapshot.bills.find((b) => b.id === id);
        setSnapshot((s) => ({ ...s, bills: s.bills.filter((b) => b.id !== id) }));
        if (isSupabaseConfigured() && userId !== "local-user") {
          try {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.from("bills").delete().eq("id", id);
            if (error) throw error;
          } catch {
            setSnapshot((s) => ({ ...s, bills: prev ? [...s.bills, prev] : s.bills }));
          }
        }
      },
      addSubscription: async (input) => {
        const now = new Date().toISOString();
        const sub = { ...input, id: uid(), user_id: userId, created_at: now };
        setSnapshot((s) => ({ ...s, subscriptions: [...s.subscriptions, sub] }));
        if (isSupabaseConfigured() && userId !== "local-user") {
          try {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.from("subscriptions").insert([sub]);
            if (error) throw error;
          } catch {
            setSnapshot((s) => ({ ...s, subscriptions: s.subscriptions.filter((x) => x.id !== sub.id) }));
          }
        }
      },
      updateSubscription: async (id, patch) => {
        const prev = snapshot.subscriptions.find((x) => x.id === id);
        setSnapshot((s) => ({ ...s, subscriptions: s.subscriptions.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
        if (isSupabaseConfigured() && userId !== "local-user") {
          try {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.from("subscriptions").update(patch).eq("id", id);
            if (error) throw error;
          } catch {
            setSnapshot((s) => ({ ...s, subscriptions: prev ? s.subscriptions.map((x) => (x.id === id ? prev : x)) : s.subscriptions }));
          }
        }
      },
      deleteSubscription: async (id) => {
        const prev = snapshot.subscriptions.find((x) => x.id === id);
        setSnapshot((s) => ({ ...s, subscriptions: s.subscriptions.filter((x) => x.id !== id) }));
        if (isSupabaseConfigured() && userId !== "local-user") {
          try {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.from("subscriptions").delete().eq("id", id);
            if (error) throw error;
          } catch {
            setSnapshot((s) => ({ ...s, subscriptions: prev ? [...s.subscriptions, prev] : s.subscriptions }));
          }
        }
      },
      addGoal: async (input) => {
        const now = new Date().toISOString();
        const goal = { ...input, id: uid(), user_id: userId, created_at: now };
        setSnapshot((s) => ({ ...s, goals: [...s.goals, goal] }));
        if (isSupabaseConfigured() && userId !== "local-user") {
          try {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.from("goals").insert([goal]);
            if (error) throw error;
          } catch {
            setSnapshot((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== goal.id) }));
          }
        }
      },
      updateGoal: async (id, patch) => {
        const prev = snapshot.goals.find((g) => g.id === id);
        setSnapshot((s) => ({ ...s, goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
        if (isSupabaseConfigured() && userId !== "local-user") {
          try {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.from("goals").update(patch).eq("id", id);
            if (error) throw error;
          } catch {
            setSnapshot((s) => ({ ...s, goals: prev ? s.goals.map((g) => (g.id === id ? prev : g)) : s.goals }));
          }
        }
      },
      deleteGoal: async (id) => {
        const prev = snapshot.goals.find((g) => g.id === id);
        setSnapshot((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }));
        if (isSupabaseConfigured() && userId !== "local-user") {
          try {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.from("goals").delete().eq("id", id);
            if (error) throw error;
          } catch {
            setSnapshot((s) => ({ ...s, goals: prev ? [...s.goals, prev] : s.goals }));
          }
        }
      },
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
      reloadFinancialAccounts: async () => {
        if (!isSupabaseConfigured() || userId === "local-user") return;
        const supabase = getSupabaseBrowser();
        const { data } = await supabase
          .from("financial_accounts")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: true });
        if (Array.isArray(data)) {
          setSnapshot((s) => ({ ...s, financial_accounts: data }));
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
