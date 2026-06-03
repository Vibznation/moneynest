"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/lib/data-store";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { useTheme } from "@/components/theme/ThemeProvider";
import { FREQUENCIES } from "@/lib/constants";
import { isSupabaseConfigured, getSupabaseBrowser } from "@/lib/supabase/client";
import type { IncomeFrequency } from "@/types/domain";

export default function SettingsPage() {
  const router = useRouter();
  const { snapshot, updateSettings, updateProfile, updateAccount, addIncome, updateIncome, reset } =
    useData();
  const { theme, setTheme } = useTheme();

  const settings = snapshot.settings!;
  const profile = snapshot.profile!;
  const account = snapshot.account!;
  const incomeList = snapshot.income || [];

  // State for new income
  const [newIncome, setNewIncome] = useState({
    name: "",
    amount: "",
    frequency: "monthly" as IncomeFrequency,
    next_payday: "",
  });

  const [name, setName] = useState(profile.name ?? "");
  const [email, setEmail] = useState(profile.email ?? "");
  const [cushion, setCushion] = useState(settings.minimum_cushion.toString());
  const [currency, setCurrency] = useState(settings.currency);
  const [payFreq, setPayFreq] = useState<IncomeFrequency>(settings.pay_frequency);
  const [checking, setChecking] = useState(account.checking_balance.toString());
  const [savings, setSavings] = useState(account.savings_balance.toString());

  // Notifications
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("default");
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    } else {
      setNotifPermission("unsupported");
    }
  }, []);
  async function requestNotifications() {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === "granted") {
      new Notification("MoneyNest reminders enabled", {
        body: "You'll be notified about upcoming bills and renewals.",
        icon: "/icon.svg",
      });
    }
  }

  // Sign out (Supabase)
  async function handleSignOut() {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseBrowser();
      await supabase.auth.signOut();
    }
    router.push("/auth");
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-foreground-muted">Make MoneyNest feel like yours.</p>
      </header>

      <Card>
        <CardTitle>Income</CardTitle>
        <div className="mt-3 grid gap-3">
          {incomeList.length === 0 && <p className="text-sm text-foreground-muted">No income sources yet.</p>}
          {incomeList.map((inc) => (
            <div key={inc.id} className="flex flex-col sm:flex-row sm:items-end gap-2 border-b pb-3 mb-3">
              <div className="flex-1">
                <Field label="Name">
                  <Input
                    value={inc.name}
                    onChange={e => updateIncome(inc.id, { name: e.target.value })}
                  />
                </Field>
              </div>
              <div className="w-32">
                <Field label="Amount">
                  <Input
                    type="number"
                    step="0.01"
                    value={inc.amount}
                    onChange={e => updateIncome(inc.id, { amount: parseFloat(e.target.value) })}
                  />
                </Field>
              </div>
              <div className="w-32">
                <Field label="Frequency">
                  <Select
                    value={inc.frequency}
                    onChange={e => updateIncome(inc.id, { frequency: e.target.value as IncomeFrequency })}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom</option>
                  </Select>
                </Field>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <Field label="Name">
            <Input
              value={newIncome.name}
              onChange={e => setNewIncome(i => ({ ...i, name: e.target.value }))}
            />
          </Field>
          <Field label="Amount">
            <Input
              type="number"
              step="0.01"
              value={newIncome.amount}
              onChange={e => setNewIncome(i => ({ ...i, amount: e.target.value }))}
            />
          </Field>
          <Field label="Frequency">
            <Select
              value={newIncome.frequency}
              onChange={e => setNewIncome(i => ({ ...i, frequency: e.target.value as IncomeFrequency }))}
            >
              <option value="monthly">Monthly</option>
              <option value="biweekly">Biweekly</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom</option>
            </Select>
          </Field>
          <Button
            className="self-end"
            onClick={() => {
              if (!newIncome.name || !newIncome.amount) return;
              addIncome({
                name: newIncome.name,
                amount: parseFloat(newIncome.amount),
                frequency: newIncome.frequency,
                next_payday: new Date().toISOString(),
              });
              setNewIncome({ name: "", amount: "", frequency: "monthly", next_payday: "" });
            }}
          >
            Add income
          </Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Profile</CardTitle>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => updateProfile({ name, email })}
            variant="secondary"
          >
            Save profile
          </Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Balances</CardTitle>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Checking balance">
            <Input
              type="number"
              step="0.01"
              value={checking}
              onChange={(e) => setChecking(e.target.value)}
            />
          </Field>
          <Field label="Savings balance">
            <Input
              type="number"
              step="0.01"
              value={savings}
              onChange={(e) => setSavings(e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            onClick={() =>
              updateAccount({
                checking_balance: parseFloat(checking || "0"),
                savings_balance: parseFloat(savings || "0"),
              })
            }
            variant="secondary"
          >
            Save balances
          </Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Money preferences</CardTitle>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label="Minimum cushion" hint="The safety buffer kept aside.">
            <Input
              type="number"
              step="1"
              value={cushion}
              onChange={(e) => setCushion(e.target.value)}
            />
          </Field>
          <Field label="Currency">
            <Select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
              <option value="AUD">AUD</option>
            </Select>
          </Field>
          <Field label="Pay frequency">
            <Select
              value={payFreq}
              onChange={(e) => setPayFreq(e.target.value as IncomeFrequency)}
            >
              {FREQUENCIES.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            onClick={() =>
              updateSettings({
                minimum_cushion: parseFloat(cushion || "0"),
                currency,
                pay_frequency: payFreq,
              })
            }
          >
            Save preferences
          </Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Appearance</CardTitle>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm">Dark mode</p>
          <Button
            variant="secondary"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? "Switch to light" : "Switch to dark"}
          </Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Notifications</CardTitle>
        {notifPermission === "unsupported" ? (
          <p className="mt-2 text-sm text-foreground-muted">Browser notifications are not supported.</p>
        ) : notifPermission === "granted" ? (
          <p className="mt-2 text-sm text-accent">Notifications enabled. You&apos;ll be reminded about upcoming bills and renewals.</p>
        ) : notifPermission === "denied" ? (
          <p className="mt-2 text-sm text-danger">Notifications blocked. Enable them in your browser settings.</p>
        ) : (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-foreground-muted">Get reminders for upcoming bills and subscription renewals.</p>
            <Button variant="secondary" onClick={requestNotifications}>Enable</Button>
          </div>
        )}
      </Card>

      {isSupabaseConfigured() && (
        <Card>
          <CardTitle>Account</CardTitle>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-foreground-muted">Signed in as {profile.email || profile.name || "user"}.</p>
            <Button variant="danger" onClick={handleSignOut}>Sign out</Button>
          </div>
        </Card>
      )}

      <Card>
        <CardTitle>Data</CardTitle>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Button
            variant="secondary"
            onClick={() => {
              reset("demo");
              router.push("/today");
            }}
          >
            Load demo data
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (
                confirm(
                  "Reset MoneyNest and clear all local data? This cannot be undone.",
                )
              ) {
                reset("fresh");
                router.push("/onboarding");
              }
            }}
          >
            Reset & delete data
          </Button>
        </div>
      </Card>
    </div>
  );
}
