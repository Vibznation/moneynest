"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useData } from "@/lib/data-store";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { useTheme } from "@/components/theme/ThemeProvider";
import { FREQUENCIES, GENDER_OPTIONS, INCOME_RANGE_OPTIONS, MARKETING_SOURCE_OPTIONS } from "@/lib/constants";
import { isSupabaseConfigured, getSupabaseBrowser } from "@/lib/supabase/client";
import type { AnnualIncomeRange, Gender, IncomeFrequency } from "@/types/domain";
import { getUserEntitlement } from "@/lib/entitlements";

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
  // Extended profile fields
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [state, setStateVal] = useState(profile.state ?? "");
  const [zip, setZip] = useState(profile.zip ?? "");
  const [dob, setDob] = useState(profile.date_of_birth ?? "");
  const [gender, setGender] = useState<Gender | "">(profile.gender ?? "");
  const [occupation, setOccupation] = useState(profile.occupation ?? "");
  const [incomeRange, setIncomeRange] = useState<AnnualIncomeRange | "">(profile.annual_income_range ?? "");
  const [marketingSource, setMarketingSource] = useState(profile.marketing_source ?? "");
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
      new Notification("Dueviq reminders enabled", {
        body: "You'll be notified about upcoming bills and renewals.",
        icon: "/icon-192.png",
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
        <p className="text-sm text-foreground-muted">Make Dueviq feel like yours.</p>
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
          <Field label="Phone (optional)">
            <Input
              type="tel"
              value={phone}
              placeholder="+1 555-000-0000"
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          <Field label="Date of birth (optional)">
            <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </Field>
          <Field label="City (optional)">
            <Input value={city} placeholder="e.g. Austin" onChange={(e) => setCity(e.target.value)} />
          </Field>
          <Field label="State / Province (optional)">
            <Input value={state} placeholder="e.g. TX" onChange={(e) => setStateVal(e.target.value)} />
          </Field>
          <Field label="ZIP / Postal code (optional)">
            <Input value={zip} placeholder="e.g. 78701" onChange={(e) => setZip(e.target.value)} />
          </Field>
          <Field label="Gender (optional)">
            <Select value={gender} onChange={(e) => setGender(e.target.value as Gender | "")}>
              <option value="">Prefer not to say</option>
              {GENDER_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Occupation (optional)">
            <Input value={occupation} placeholder="e.g. Software engineer" onChange={(e) => setOccupation(e.target.value)} />
          </Field>
          <Field label="Annual household income (optional)">
            <Select value={incomeRange} onChange={(e) => setIncomeRange(e.target.value as AnnualIncomeRange | "")}>
              <option value="">Prefer not to say</option>
              {INCOME_RANGE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="How did you find Dueviq? (optional)">
            <Select value={marketingSource} onChange={(e) => setMarketingSource(e.target.value)}>
              <option value="">Select…</option>
              {MARKETING_SOURCE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            onClick={() =>
              updateProfile({
                name, email, phone: phone || null, date_of_birth: dob || null,
                city: city || null, state: state || null, zip: zip || null,
                gender: gender ? (gender as Gender) : null,
                occupation: occupation || null,
                annual_income_range: incomeRange ? (incomeRange as AnnualIncomeRange) : null,
                marketing_source: marketingSource || null,
              })
            }
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
                  "Reset Dueviq and clear all local data? This cannot be undone.",
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

      {/* Dueviq+ entry point */}
      <DueviqPlusSettingsCard />

      <Card>
        <CardTitle>Privacy &amp; Legal</CardTitle>
        <div className="mt-3 space-y-2">
          <p className="text-sm text-foreground-muted leading-relaxed">
            Dueviq uses <strong className="text-foreground">Supabase</strong> for authentication
            and cloud storage, and <strong className="text-foreground">Plaid</strong> for optional
            bank account linking (read-only). We do not sell your data or run advertising.
          </p>
          <Link
            href="/privacy"
            className="inline-block text-sm text-accent underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            Read our full Privacy Policy →
          </Link>
        </div>
      </Card>

      <MarketingConsentCard />
    </div>
  );
}

function DueviqPlusSettingsCard() {
  const entitlement = getUserEntitlement();
  const planLabel =
    entitlement === "free"
      ? "Dueviq Basic · Free"
      : entitlement === "plus_personal"
        ? "Dueviq+ Personal"
        : "Dueviq Business";

  return (
    <Link
      href="/plus"
      className="group flex items-center justify-between rounded-2xl border border-border bg-surface p-4 hover:border-accent transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
          </svg>
        </span>
        <div>
          <p className="font-medium text-foreground group-hover:text-accent transition-colors">
            Dueviq+
          </p>
          <p className="text-xs text-foreground-muted">{planLabel}</p>
        </div>
      </div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-foreground-muted group-hover:text-accent transition-colors"
        aria-hidden="true"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </Link>
  );
}

// ─── Privacy & Marketing consent card ────────────────────────────────────────

type ConsentEntry = { granted: boolean; updatedAt: string; version: string };
type ConsentMap = Record<string, ConsentEntry>;

const MARKETING_CONSENT_TYPES = [
  { key: "email_marketing", label: "Marketing emails", description: "Product updates, tips, and offers via email." },
  { key: "sms_marketing", label: "Marketing SMS", description: "Promotional texts. Reply STOP to opt out anytime." },
  { key: "analytics", label: "Usage analytics", description: "Anonymised data to help us improve the app." },
  { key: "personalization", label: "Personalisation", description: "Content and tips based on your usage." },
] as const;

function MarketingConsentCard() {
  const [consents, setConsents] = useState<ConsentMap | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/consent")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.consents) setConsents(data.consents); })
      .catch(() => {});
  }, []);

  async function toggle(key: string, currentGranted: boolean) {
    setSaving(key);
    try {
      const res = await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consents: [{ consentType: key, granted: !currentGranted, source: "settings" }],
        }),
      });
      if (res.ok) {
        setConsents((prev) => ({
          ...prev,
          [key]: { granted: !currentGranted, updatedAt: new Date().toISOString(), version: "1.0" },
        }));
      }
    } finally {
      setSaving(null);
    }
  }

  return (
    <Card>
      <CardTitle>Privacy &amp; Marketing</CardTitle>
      <p className="mt-1 text-xs text-foreground-muted">
        Manage how Dueviq may contact you and use your data. Changes apply immediately.
      </p>
      <div className="mt-3 divide-y divide-border">
        {MARKETING_CONSENT_TYPES.map(({ key, label, description }) => {
          const entry = consents?.[key];
          const granted = entry?.granted ?? false;
          const isSaving = saving === key;
          return (
            <div key={key} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-foreground-muted">{description}</p>
                {entry?.updatedAt && (
                  <p className="text-[10px] text-foreground-muted mt-0.5">
                    Last changed: {new Date(entry.updatedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <button
                role="switch"
                aria-checked={granted}
                aria-label={`Toggle ${label}`}
                disabled={isSaving || consents === null}
                onClick={() => toggle(key, granted)}
                className={[
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  granted ? "bg-accent" : "bg-surface-muted",
                ].join(" ")}
              >
                <span
                  className={[
                    "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200",
                    granted ? "translate-x-5" : "translate-x-0",
                  ].join(" ")}
                />
              </button>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-foreground-muted">
        Required consents (Privacy Policy &amp; Terms of Service) cannot be withdrawn here. To withdraw, contact us at privacy@dueviq.com.
      </p>
    </Card>
  );
}
