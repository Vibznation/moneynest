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
  Profile,
  Settings,
  UserSnapshot,
} from "@/types/domain";
import { buildDemoSnapshot, emptySnapshot } from "@/lib/mock-data";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";
import type { DataNotice, DataStore, Mode } from "@/lib/data-store-types";
import {
  appendIfPresent,
  migrateSnapshot,
  removeById,
  restoreById,
  uid,
} from "@/lib/data-store-helpers";

const STORAGE_KEY = "dueviq:snapshot:v1";
const MODE_KEY = "dueviq:mode";

const Ctx = createContext<DataStore | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<UserSnapshot>(() => emptySnapshot());
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>("fresh");
  const [notice, setNotice] = useState<DataNotice | null>(null);

  useEffect(() => {
    async function hydrate() {
      try {
        // Migrate from old key if new key doesn't exist yet
        const legacyRaw = localStorage.getItem("moneynest:snapshot:v1");
        if (legacyRaw && !localStorage.getItem(STORAGE_KEY)) {
          localStorage.setItem(STORAGE_KEY, legacyRaw);
          const legacyMode = localStorage.getItem("moneynest:mode");
          if (legacyMode) localStorage.setItem(MODE_KEY, legacyMode);
          localStorage.removeItem("moneynest:snapshot:v1");
          localStorage.removeItem("moneynest:mode");
        }
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

  const pushNotice = useCallback((message: string) => {
    setNotice({ id: Date.now(), message });
  }, []);

  const dismissNotice = useCallback(() => {
    setNotice(null);
  }, []);

  const userId = snapshot.profile?.id ?? "local-user";
  const isCloudUser = isSupabaseConfigured() && userId !== "local-user" && userId !== "demo-user";
  const runCloudMutation = useCallback(
    async (action: () => Promise<void>, rollback: () => void, message: string) => {
      if (!isCloudUser) return;
      try {
        await action();
      } catch {
        pushNotice(message);
        rollback();
      }
    },
    [isCloudUser, pushNotice],
  );

  const value: DataStore = useMemo(
    () => ({
      snapshot,
      ready,
      mode,
      notice,
      dismissNotice,
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
        if (isCloudUser) {
          const supabase = getSupabaseBrowser();
          try { await supabase.from("accounts").update({ ...patch, updated_at: new Date().toISOString() }).eq("user_id", userId); } catch { /* ignore */ }
        }
      },
      updateSettings: async (patch) => {
        setSnapshot((s) => ({
          ...s,
          settings: { ...(s.settings as Settings), ...patch },
        }));
        if (isCloudUser) {
          const supabase = getSupabaseBrowser();
          try { await supabase.from("settings").update(patch).eq("user_id", userId); } catch { /* ignore */ }
        }
      },
      updateProfile: async (patch) => {
        setSnapshot((s) => ({
          ...s,
          profile: { ...(s.profile as Profile), ...patch },
        }));
        if (isCloudUser) {
          const supabase = getSupabaseBrowser();
          try {
            await supabase.from("profiles").upsert(
              {
                id: userId,
                email: snapshot.profile?.email ?? null,
                ...patch,
              },
              { onConflict: "id" },
            );
          } catch { /* ignore */ }
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
        await runCloudMutation(
          async () => {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.from("income").insert([incomeItem]);
            if (error) throw error;
          },
          () => {
            setSnapshot((s) => ({
              ...s,
              income: removeById(s.income, incomeItem.id),
            }));
          },
          "Could not save that income. Changes were reverted.",
        );
      },
      updateIncome: async (id, patch) => {
        const prev = snapshot.income.find((i) => i.id === id);
        setSnapshot((s) => ({
          ...s,
          income: s.income.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        }));
        await runCloudMutation(
          async () => {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase
              .from("income")
              .update({ ...patch })
              .eq("id", id);
            if (error) throw error;
          },
          () => {
            setSnapshot((s) => ({
              ...s,
              income: restoreById(s.income, id, prev),
            }));
          },
          "Could not update that income. Changes were reverted.",
        );
      },
      deleteIncome: async (id) => {
        const prev = snapshot.income.find((i) => i.id === id);
        setSnapshot((s) => ({
          ...s,
          income: s.income.filter((i) => i.id !== id),
        }));
        await runCloudMutation(
          async () => {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.from("income").delete().eq("id", id);
            if (error) throw error;
          },
          () => {
            setSnapshot((s) => ({
              ...s,
              income: appendIfPresent(s.income, prev),
            }));
          },
          "Could not delete that income. Changes were reverted.",
        );
      },
      addBill: async (input) => {
        const now = new Date().toISOString();
        const bill = { ...input, id: uid(), user_id: userId, created_at: now };
        setSnapshot((s) => ({ ...s, bills: [...s.bills, bill] }));
        await runCloudMutation(
          async () => {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.from("bills").insert([bill]);
            if (error) throw error;
          },
          () => {
            setSnapshot((s) => ({ ...s, bills: removeById(s.bills, bill.id) }));
          },
          "Could not save that bill. Changes were reverted.",
        );
      },
      updateBill: async (id, patch) => {
        const prev = snapshot.bills.find((b) => b.id === id);
        setSnapshot((s) => ({ ...s, bills: s.bills.map((b) => (b.id === id ? { ...b, ...patch } : b)) }));
        await runCloudMutation(
          async () => {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.from("bills").update(patch).eq("id", id);
            if (error) throw error;
          },
          () => {
            setSnapshot((s) => ({ ...s, bills: restoreById(s.bills, id, prev) }));
          },
          "Could not update that bill. Changes were reverted.",
        );
      },
      deleteBill: async (id) => {
        const prev = snapshot.bills.find((b) => b.id === id);
        setSnapshot((s) => ({ ...s, bills: s.bills.filter((b) => b.id !== id) }));
        await runCloudMutation(
          async () => {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.from("bills").delete().eq("id", id);
            if (error) throw error;
          },
          () => {
            setSnapshot((s) => ({ ...s, bills: appendIfPresent(s.bills, prev) }));
          },
          "Could not delete that bill. Changes were reverted.",
        );
      },
      addSubscription: async (input) => {
        const now = new Date().toISOString();
        const sub = { ...input, id: uid(), user_id: userId, created_at: now };
        setSnapshot((s) => ({ ...s, subscriptions: [...s.subscriptions, sub] }));
        await runCloudMutation(
          async () => {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.from("subscriptions").insert([sub]);
            if (error) throw error;
          },
          () => {
            setSnapshot((s) => ({ ...s, subscriptions: removeById(s.subscriptions, sub.id) }));
          },
          "Could not save that subscription. Changes were reverted.",
        );
      },
      updateSubscription: async (id, patch) => {
        const prev = snapshot.subscriptions.find((x) => x.id === id);
        setSnapshot((s) => ({ ...s, subscriptions: s.subscriptions.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
        await runCloudMutation(
          async () => {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.from("subscriptions").update(patch).eq("id", id);
            if (error) throw error;
          },
          () => {
            setSnapshot((s) => ({ ...s, subscriptions: restoreById(s.subscriptions, id, prev) }));
          },
          "Could not update that subscription. Changes were reverted.",
        );
      },
      deleteSubscription: async (id) => {
        const prev = snapshot.subscriptions.find((x) => x.id === id);
        setSnapshot((s) => ({ ...s, subscriptions: s.subscriptions.filter((x) => x.id !== id) }));
        await runCloudMutation(
          async () => {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.from("subscriptions").delete().eq("id", id);
            if (error) throw error;
          },
          () => {
            setSnapshot((s) => ({ ...s, subscriptions: appendIfPresent(s.subscriptions, prev) }));
          },
          "Could not delete that subscription. Changes were reverted.",
        );
      },
      addGoal: async (input) => {
        const now = new Date().toISOString();
        const goal = { ...input, id: uid(), user_id: userId, created_at: now };
        setSnapshot((s) => ({ ...s, goals: [...s.goals, goal] }));
        await runCloudMutation(
          async () => {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.from("goals").insert([goal]);
            if (error) throw error;
          },
          () => {
            setSnapshot((s) => ({ ...s, goals: removeById(s.goals, goal.id) }));
          },
          "Could not save that goal. Changes were reverted.",
        );
      },
      updateGoal: async (id, patch) => {
        const prev = snapshot.goals.find((g) => g.id === id);
        setSnapshot((s) => ({ ...s, goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
        await runCloudMutation(
          async () => {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.from("goals").update(patch).eq("id", id);
            if (error) throw error;
          },
          () => {
            setSnapshot((s) => ({ ...s, goals: restoreById(s.goals, id, prev) }));
          },
          "Could not update that goal. Changes were reverted.",
        );
      },
      deleteGoal: async (id) => {
        const prev = snapshot.goals.find((g) => g.id === id);
        setSnapshot((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }));
        await runCloudMutation(
          async () => {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.from("goals").delete().eq("id", id);
            if (error) throw error;
          },
          () => {
            setSnapshot((s) => ({ ...s, goals: appendIfPresent(s.goals, prev) }));
          },
          "Could not delete that goal. Changes were reverted.",
        );
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
        await runCloudMutation(
          async () => {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.from("financial_accounts").insert([account]);
            if (error) throw error;
          },
          () => {
            setSnapshot((s) => ({
              ...s,
              financial_accounts: removeById(s.financial_accounts, account.id),
            }));
          },
          "Could not save that account. Changes were reverted.",
        );
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
        await runCloudMutation(
          async () => {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase
              .from("financial_accounts")
              .update({ ...patch, updated_at: new Date().toISOString() })
              .eq("id", id);
            if (error) throw error;
          },
          () => {
            setSnapshot((s) => ({
              ...s,
              financial_accounts: restoreById(s.financial_accounts, id, prev),
            }));
          },
          "Could not update that account. Changes were reverted.",
        );
      },
      deleteFinancialAccount: async (id) => {
        const prev = snapshot.financial_accounts.find((a) => a.id === id);
        setSnapshot((s) => ({
          ...s,
          financial_accounts: s.financial_accounts.filter((a) => a.id !== id),
        }));
        await runCloudMutation(
          async () => {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.from("financial_accounts").delete().eq("id", id);
            if (error) throw error;
          },
          () => {
            setSnapshot((s) => ({
              ...s,
              financial_accounts: appendIfPresent(s.financial_accounts, prev),
            }));
          },
          "Could not delete that account. Changes were reverted.",
        );
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
        await runCloudMutation(
          async () => {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.from("transactions").insert([tx]);
            if (error) throw error;
          },
          () => {
            setSnapshot((s) => ({
              ...s,
              transactions: removeById(s.transactions, tx.id),
            }));
          },
          "Could not save that transaction. Changes were reverted.",
        );
      },
      updateTransaction: async (id, patch) => {
        const prev = snapshot.transactions.find((t) => t.id === id);
        setSnapshot((s) => ({
          ...s,
          transactions: s.transactions.map((t) =>
            t.id === id ? { ...t, ...patch } : t,
          ),
        }));
        await runCloudMutation(
          async () => {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase
              .from("transactions")
              .update({ ...patch })
              .eq("id", id);
            if (error) throw error;
          },
          () => {
            setSnapshot((s) => ({
              ...s,
              transactions: restoreById(s.transactions, id, prev),
            }));
          },
          "Could not update that transaction. Changes were reverted.",
        );
      },
      deleteTransaction: async (id) => {
        const prev = snapshot.transactions.find((t) => t.id === id);
        setSnapshot((s) => ({
          ...s,
          transactions: s.transactions.filter((t) => t.id !== id),
        }));
        await runCloudMutation(
          async () => {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.from("transactions").delete().eq("id", id);
            if (error) throw error;
          },
          () => {
            setSnapshot((s) => ({
              ...s,
              transactions: appendIfPresent(s.transactions, prev),
            }));
          },
          "Could not delete that transaction. Changes were reverted.",
        );
      },
      reloadFinancialAccounts: async () => {
        if (!isCloudUser) return;
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
    [snapshot, ready, mode, notice, dismissNotice, reset, userId, isCloudUser, runCloudMutation],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData(): DataStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}
