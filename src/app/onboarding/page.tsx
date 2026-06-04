"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, format } from "date-fns";
import { ArrowRight, Building2, Check, Plus, Sparkles } from "lucide-react";
import { useData } from "@/lib/data-store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import {
  BILL_CATEGORIES,
  FREQUENCIES,
  GOAL_CATEGORIES,
  SUBSCRIPTION_CATEGORIES,
} from "@/lib/constants";
import type {
  BillCategory,
  GoalCategory,
  IncomeFrequency,
  SubscriptionCategory,
} from "@/types/domain";
import { formatCurrency } from "@/lib/utils";

const STEPS = [
  "welcome",
  "income",
  "balance",
  "bills",
  "subscriptions",
  "goal",
  "bank",
  "done",
] as const;

type Step = (typeof STEPS)[number];

export default function OnboardingPage() {
  const router = useRouter();
  const {
    reset,
    snapshot,
    addIncome,
    updateAccount,
    addBill,
    addSubscription,
    addGoal,
    updateProfile,
    updateSettings,
  } = useData();
  const [step, setStep] = useState<Step>("welcome");

  const currency = snapshot.settings?.currency ?? "USD";

  const next = () => {
    const idx = STEPS.indexOf(step);
    setStep(STEPS[Math.min(idx + 1, STEPS.length - 1)]);
  };
  const skip = next;

  const finish = () => {
    updateProfile({ onboarding_complete: true });
    router.replace("/today");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-foreground-muted mb-2">
            <span>Step {STEPS.indexOf(step) + 1} of {STEPS.length}</span>
            {step !== "welcome" && step !== "done" ? (
              <button
                onClick={() => {
                  updateProfile({ onboarding_complete: true });
                  router.replace("/today");
                }}
                className="hover:text-foreground"
              >
                Go to app
              </button>
            ) : null}
          </div>
          <div className="h-1.5 w-full rounded-full bg-surface-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${((STEPS.indexOf(step) + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {step === "welcome" && (
          <Card className="text-center">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft">
              <Sparkles size={20} />
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              Welcome to Dueviq
            </h1>
            <p className="mt-2 text-foreground-muted">
              Organize your bills, accounts, goals, and spending in one calm place.
            </p>
            <p className="mt-1 text-sm font-medium text-accent">
              Know what&apos;s due. Know what&apos;s safe to spend.
            </p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <Button
                onClick={() => {
                  reset("fresh");
                  next();
                }}
                size="lg"
              >
              Start Organizing <ArrowRight size={16} />
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  reset("demo");
                  updateProfile({ onboarding_complete: true });
                  router.replace("/today");
                }}
              >
                Explore with demo data
              </Button>
            </div>
          </Card>
        )}

        {step === "income" && <IncomeStep onNext={next} onSkip={skip} addIncome={addIncome} updateSettings={updateSettings} currency={currency} />}
        {step === "balance" && <BalanceStep onNext={next} updateAccount={updateAccount} />}
        {step === "bills" && <BillsStep onNext={next} onSkip={skip} addBill={addBill} currency={currency} count={snapshot.bills.length} />}
        {step === "subscriptions" && (
          <SubsStep
            onNext={next}
            onSkip={skip}
            addSub={addSubscription}
            currency={currency}
            count={snapshot.subscriptions.length}
          />
        )}
        {step === "goal" && (
          <GoalStep
            onNext={next}
            onSkip={skip}
            addGoal={addGoal}
            count={snapshot.goals.length}
          />
        )}

        {step === "bank" && <BankStep onNext={next} onSkip={skip} />}

        {step === "done" && (
          <Card className="text-center">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft">
              <Check size={20} />
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              You&apos;re all set.
            </h1>
            <p className="mt-2 text-foreground-muted">
              Dueviq is ready. You can always add more later.
            </p>
            <div className="mt-6 flex justify-center">
              <Button onClick={finish} size="lg">
                Open Dueviq <ArrowRight size={16} />
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function StepHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {subtitle ? (
        <p className="mt-1 text-sm text-foreground-muted">{subtitle}</p>
      ) : null}
    </div>
  );
}

function IncomeStep({
  onNext,
  onSkip,
  addIncome,
  updateSettings,
  currency,
}: {
  onNext: () => void;
  onSkip: () => void;
  addIncome: ReturnType<typeof useData>["addIncome"];
  updateSettings: ReturnType<typeof useData>["updateSettings"];
  currency: string;
}) {
  const [name, setName] = useState("Main Job");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<IncomeFrequency>("biweekly");
  const [payday, setPayday] = useState(
    format(addDays(new Date(), 7), "yyyy-MM-dd"),
  );

  return (
    <Card>
      <StepHeader
        title="Add your income"
        subtitle="So we know when money is coming in."
      />
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!amount) return;
          addIncome({
            name,
            amount: parseFloat(amount),
            frequency,
            next_payday: payday,
          });
          updateSettings({ pay_frequency: frequency });
          onNext();
        }}
      >
        <Field label="Income name">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label={`Amount (${currency})`}>
          <Input
            type="number"
            step="0.01"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </Field>
        <Field label="Frequency">
          <Select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as IncomeFrequency)}
          >
            {FREQUENCIES.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </Select>
        </Field>
        <Field label="Next payday">
          <Input
            type="date"
            value={payday}
            onChange={(e) => setPayday(e.target.value)}
          />
        </Field>
        <div className="sm:col-span-2 flex justify-between mt-2">
          <Button type="button" variant="ghost" onClick={onSkip}>
            Skip
          </Button>
          <Button type="submit">
            Continue <ArrowRight size={16} />
          </Button>
        </div>
      </form>
    </Card>
  );
}

function BalanceStep({
  onNext,
  updateAccount,
}: {
  onNext: () => void;
  updateAccount: ReturnType<typeof useData>["updateAccount"];
}) {
  const [checking, setChecking] = useState("");
  const [savings, setSavings] = useState("");
  return (
    <Card>
      <StepHeader
        title="Your current balance"
        subtitle="A snapshot of what's in your accounts today."
      />
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          updateAccount({
            checking_balance: parseFloat(checking || "0"),
            savings_balance: parseFloat(savings || "0"),
          });
          onNext();
        }}
      >
        <Field label="Checking balance">
          <Input
            type="number"
            step="0.01"
            min={0}
            value={checking}
            onChange={(e) => setChecking(e.target.value)}
            required
          />
        </Field>
        <Field label="Savings balance (optional)">
          <Input
            type="number"
            step="0.01"
            min={0}
            value={savings}
            onChange={(e) => setSavings(e.target.value)}
          />
        </Field>
        <div className="sm:col-span-2 flex justify-end mt-2">
          <Button type="submit">
            Continue <ArrowRight size={16} />
          </Button>
        </div>
      </form>
    </Card>
  );
}

function BillsStep({
  onNext,
  onSkip,
  addBill,
  currency,
  count,
}: {
  onNext: () => void;
  onSkip: () => void;
  addBill: ReturnType<typeof useData>["addBill"];
  currency: string;
  count: number;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(
    format(addDays(new Date(), 7), "yyyy-MM-dd"),
  );
  const [category, setCategory] = useState<BillCategory>("Other");
  const [autopay, setAutopay] = useState(false);

  function add(andContinue: boolean) {
    if (!name || !amount) return;
    addBill({
      name,
      amount: parseFloat(amount),
      due_date: dueDate,
      category,
      autopay,
      status: "unpaid",
      notes: null,
    });
    setName("");
    setAmount("");
    if (andContinue) onNext();
  }

  return (
    <Card>
      <StepHeader
        title="Add a few bills"
        subtitle="Rent, phone, car, insurance — anything that's due."
      />
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          add(true);
        }}
      >
        <Field label="Bill name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label={`Amount (${currency})`}>
          <Input
            type="number"
            step="0.01"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field label="Due date">
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </Field>
        <Field label="Category">
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value as BillCategory)}
          >
            {BILL_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={autopay}
            onChange={(e) => setAutopay(e.target.checked)}
          />
          Auto-pay
        </label>
        <div className="sm:col-span-2 flex flex-wrap justify-between items-center gap-2 mt-2">
          <p className="text-xs text-foreground-muted">
            {count} bill{count === 1 ? "" : "s"} added so far
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onSkip}>
              Skip
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => add(false)}
              disabled={!name || !amount}
            >
              <Plus size={14} /> Add another
            </Button>
            <Button type="submit">
              Continue <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}

function SubsStep({
  onNext,
  onSkip,
  addSub,
  currency,
  count,
}: {
  onNext: () => void;
  onSkip: () => void;
  addSub: ReturnType<typeof useData>["addSubscription"];
  currency: string;
  count: number;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [renewal, setRenewal] = useState(
    format(addDays(new Date(), 14), "yyyy-MM-dd"),
  );
  const [category, setCategory] = useState<SubscriptionCategory>("Streaming");

  function add(andContinue: boolean) {
    if (!name || !amount) return;
    addSub({
      name,
      amount: parseFloat(amount),
      renewal_date: renewal,
      category,
      status: "Keep",
      notes: null,
    });
    setName("");
    setAmount("");
    if (andContinue) onNext();
  }

  return (
    <Card>
      <StepHeader
        title="Add your subscriptions"
        subtitle="Streaming, gym, apps — small bills add up."
      />
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          add(true);
        }}
      >
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label={`Amount (${currency})`}>
          <Input
            type="number"
            step="0.01"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field label="Renewal date">
          <Input
            type="date"
            value={renewal}
            onChange={(e) => setRenewal(e.target.value)}
          />
        </Field>
        <Field label="Category">
          <Select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as SubscriptionCategory)
            }
          >
            {SUBSCRIPTION_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <div className="sm:col-span-2 flex flex-wrap justify-between items-center gap-2 mt-2">
          <p className="text-xs text-foreground-muted">
            {count} subscription{count === 1 ? "" : "s"} added so far
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onSkip}>
              Skip
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => add(false)}
              disabled={!name || !amount}
            >
              <Plus size={14} /> Add another
            </Button>
            <Button type="submit">
              Continue <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}

function GoalStep({
  onNext,
  onSkip,
  addGoal,
  count,
}: {
  onNext: () => void;
  onSkip: () => void;
  addGoal: ReturnType<typeof useData>["addGoal"];
  count: number;
}) {
  const [name, setName] = useState("Emergency Fund");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("0");
  const [monthly, setMonthly] = useState("");
  const [category, setCategory] = useState<GoalCategory>("Emergency Fund");
  return (
    <Card>
      <StepHeader
        title="Set a savings goal"
        subtitle="Pick one. Small goals work too."
      />
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name || !target) return;
          addGoal({
            name,
            target_amount: parseFloat(target),
            current_amount: parseFloat(current || "0"),
            monthly_target: parseFloat(monthly || "0"),
            category,
          });
          onNext();
        }}
      >
        <Field label="Goal name">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Category">
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value as GoalCategory)}
          >
            {GOAL_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Target amount">
          <Input
            type="number"
            step="0.01"
            min={0}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            required
          />
        </Field>
        <Field label="Saved so far">
          <Input
            type="number"
            step="0.01"
            min={0}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </Field>
        <Field label="Monthly contribution target">
          <Input
            type="number"
            step="0.01"
            min={0}
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
          />
        </Field>
        <div className="sm:col-span-2 flex flex-wrap justify-between items-center gap-2 mt-2">
          <p className="text-xs text-foreground-muted">
            {count} goal{count === 1 ? "" : "s"} added so far
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onSkip}>
              Skip
            </Button>
            <Button type="submit">
              Continue <ArrowRight size={16} />
            </Button>
          </div>
        </div>
        {target ? (
          <p className="sm:col-span-2 text-xs text-foreground-muted">
            Preview: saving {formatCurrency(parseFloat(monthly || "0"))}/mo toward{" "}
            {formatCurrency(parseFloat(target))}.
          </p>
        ) : null}
      </form>
    </Card>
  );
}

function BankStep({
  onNext,
  onSkip,
}: {
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <Card className="text-center">
      <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-info-soft">
        <Building2 size={22} className="text-info" />
      </div>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight">
        Connect a bank account
      </h2>
      <p className="mt-2 text-sm text-foreground-muted">
        Automatically sync your balances and transactions. This is optional — you can always do it later from the Accounts page.
      </p>
      <p className="mt-1 text-xs text-foreground-muted">
        Dueviq uses Plaid to connect securely. Your credentials are never stored.
      </p>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <Button onClick={onNext} size="lg">
          Connect bank <ArrowRight size={16} />
        </Button>
        <Button variant="secondary" size="lg" onClick={onSkip}>
          Skip for now
        </Button>
      </div>
    </Card>
  );
}
