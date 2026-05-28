import {
  addDays,
  differenceInCalendarDays,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
} from "date-fns";
import type {
  Bill,
  FinancialAccount,
  FinancialAccountType,
  Goal,
  Income,
  Subscription,
  UserSnapshot,
} from "@/types/domain";

export function toDate(value: string | Date): Date {
  return typeof value === "string" ? parseISO(value) : value;
}

export function today(): Date {
  return startOfDay(new Date());
}

export function daysUntil(value: string | Date): number {
  return differenceInCalendarDays(toDate(value), today());
}

export function getNextPayday(incomes: Income[]): Date {
  const now = today();
  const upcoming = incomes
    .map((i) => toDate(i.next_payday))
    .filter((d) => !isBefore(d, now))
    .sort((a, b) => a.getTime() - b.getTime());
  return upcoming[0] ?? addDays(now, 14);
}

export function getBillsBeforeNextPayday(
  bills: Bill[],
  nextPayday: Date,
): Bill[] {
  return bills.filter((b) => {
    if (b.status === "paid") return false;
    const due = toDate(b.due_date);
    return !isBefore(nextPayday, due); // due <= nextPayday
  });
}

export function getOverdueBills(bills: Bill[]): Bill[] {
  const now = today();
  return bills.filter(
    (b) => b.status === "unpaid" && isBefore(toDate(b.due_date), now),
  );
}

export function getDueSoonBills(bills: Bill[], withinDays = 3): Bill[] {
  return bills.filter((b) => {
    if (b.status !== "unpaid") return false;
    const d = daysUntil(b.due_date);
    return d >= 0 && d <= withinDays;
  });
}

export function getUpcomingBills(bills: Bill[], withinDays = 7): Bill[] {
  return bills.filter((b) => {
    if (b.status !== "unpaid") return false;
    const d = daysUntil(b.due_date);
    return d >= 0 && d <= withinDays;
  });
}

export function getNextBill(bills: Bill[]): Bill | null {
  const unpaid = bills
    .filter((b) => b.status === "unpaid")
    .sort(
      (a, b) =>
        toDate(a.due_date).getTime() - toDate(b.due_date).getTime(),
    );
  return unpaid[0] ?? null;
}

export function getRenewingSoon(
  subs: Subscription[],
  withinDays = 7,
): Subscription[] {
  return subs.filter((s) => {
    const d = daysUntil(s.renewal_date);
    return d >= 0 && d <= withinDays;
  });
}

export function getGoalContributionTotal(goals: Goal[]): number {
  return goals.reduce((sum, g) => sum + (g.monthly_target || 0), 0);
}

export function getSubscriptionMonthlyTotal(subs: Subscription[]): number {
  return subs.reduce((sum, s) => sum + s.amount, 0);
}

export function getReviewSavings(subs: Subscription[]): number {
  return subs
    .filter((s) => s.status === "Review" || s.status === "Cancel")
    .reduce((sum, s) => sum + s.amount, 0);
}

export interface SafeToSpendResult {
  amount: number;
  balance: number;
  upcomingBillsTotal: number;
  goalContributions: number;
  cushion: number;
  nextPayday: Date;
}

export function calculateSafeToSpend(snapshot: UserSnapshot): SafeToSpendResult {
  const balance = getAvailableBalance(snapshot);
  const cushion =
    snapshot.settings?.minimum_cushion ?? 100;
  const nextPayday = getNextPayday(snapshot.income);
  const upcoming = getBillsBeforeNextPayday(snapshot.bills, nextPayday);
  const upcomingBillsTotal = upcoming.reduce((s, b) => s + b.amount, 0);
  const goalContributions = getGoalContributionTotal(snapshot.goals);
  const amount =
    balance - upcomingBillsTotal - goalContributions - cushion;
  return {
    amount,
    balance,
    upcomingBillsTotal,
    goalContributions,
    cushion,
    nextPayday,
  };
}

// ---- Financial accounts ------------------------------------------------

export function sumAccountsByType(
  accounts: FinancialAccount[],
  types: FinancialAccountType[],
): number {
  return accounts
    .filter((a) => types.includes(a.account_type))
    .reduce((sum, a) => sum + a.balance, 0);
}

export function getIncludedBalance(accounts: FinancialAccount[]): number {
  return accounts
    .filter((a) => a.include_in_safe_to_spend)
    .reduce((sum, a) => sum + a.balance, 0);
}

/**
 * Available balance for Safe-to-Spend:
 *  - If any financial_accounts exist, use the sum of those flagged include_in_safe_to_spend.
 *  - Otherwise fall back to the legacy account.checking_balance from onboarding.
 */
export function getAvailableBalance(snapshot: UserSnapshot): number {
  if (snapshot.financial_accounts && snapshot.financial_accounts.length > 0) {
    return getIncludedBalance(snapshot.financial_accounts);
  }
  return snapshot.account?.checking_balance ?? 0;
}

export interface AccountTotals {
  available: number; // checking + cash
  savings: number;
  creditDebt: number; // positive number representing debt
  loans: number;
  net: number; // assets - liabilities
}

export function getAccountTotals(accounts: FinancialAccount[]): AccountTotals {
  const available = sumAccountsByType(accounts, ["checking", "cash"]);
  const savings = sumAccountsByType(accounts, ["savings"]);
  const creditBalance = sumAccountsByType(accounts, ["credit_card"]);
  const loanBalance = sumAccountsByType(accounts, ["loan"]);
  // Debt is stored as a negative balance; surface a positive magnitude.
  const creditDebt = creditBalance < 0 ? -creditBalance : 0;
  const loans = loanBalance < 0 ? -loanBalance : 0;
  const net = available + savings - creditDebt - loans;
  return { available, savings, creditDebt, loans, net };
}

export interface CalmScoreResult {
  score: number;
  label: string;
  reasons: string[];
}

export function calculateCalmScore(snapshot: UserSnapshot): CalmScoreResult {
  let score = 100;
  const reasons: string[] = [];

  const safe = calculateSafeToSpend(snapshot);
  if (safe.amount < 0) {
    score -= 20;
    reasons.push("Safe to spend is negative");
  }

  const overdue = getOverdueBills(snapshot.bills);
  if (overdue.length) {
    score -= overdue.length * 10;
    reasons.push(`${overdue.length} overdue bill${overdue.length > 1 ? "s" : ""}`);
  }

  const dueSoon = getDueSoonBills(snapshot.bills, 3);
  if (dueSoon.length) {
    score -= dueSoon.length * 5;
    reasons.push(`${dueSoon.length} bill${dueSoon.length > 1 ? "s" : ""} due within 3 days`);
  }

  const reviewSubs = snapshot.subscriptions.filter((s) => s.status === "Review");
  if (reviewSubs.length) {
    score -= reviewSubs.length * 5;
    reasons.push(`${reviewSubs.length} subscription${reviewSubs.length > 1 ? "s" : ""} to review`);
  }

  if (!snapshot.goals.length) {
    score -= 10;
    reasons.push("No savings goal yet");
  }

  score = Math.max(0, Math.min(100, score));
  return { score, label: getCalmLabel(score), reasons };
}

export function getCalmLabel(score: number): string {
  if (score >= 90) return "Calm";
  if (score >= 75) return "Stable";
  if (score >= 50) return "Pay Attention";
  if (score >= 25) return "Stressed";
  return "Urgent";
}

export function getCalmTone(score: number): "accent" | "info" | "warning" | "danger" {
  if (score >= 75) return "accent";
  if (score >= 50) return "info";
  if (score >= 25) return "warning";
  return "danger";
}

export type SpendVerdict = "ok" | "caution" | "warn" | "no";
export interface SpendEvaluation {
  verdict: SpendVerdict;
  message: string;
  remaining: number;
}

export function evaluateBeforeYouSpend(
  amount: number,
  snapshot: UserSnapshot,
): SpendEvaluation {
  const safe = calculateSafeToSpend(snapshot);
  const remaining = safe.amount - amount;
  const nextBill = getNextBill(snapshot.bills);
  const nextBillNote =
    nextBill && daysUntil(nextBill.due_date) <= 5
      ? ` Your ${nextBill.name} is due in ${Math.max(
          0,
          daysUntil(nextBill.due_date),
        )} day${daysUntil(nextBill.due_date) === 1 ? "" : "s"}.`
      : "";

  if (amount <= 0) {
    return {
      verdict: "ok",
      remaining: safe.amount,
      message: "Enter an amount to check.",
    };
  }
  if (safe.amount <= 0 || amount > safe.amount) {
    return {
      verdict: "no",
      remaining,
      message: `Not recommended. This would put you short before payday.${nextBillNote}`,
    };
  }
  const ratio = amount / safe.amount;
  if (ratio < 0.25) {
    return {
      verdict: "ok",
      remaining,
      message: `Yes, this looks safe. You'd still have $${remaining.toFixed(0)} left after this.`,
    };
  }
  if (ratio < 0.5) {
    return {
      verdict: "caution",
      remaining,
      message: `You can, but keep it light. This would use about ${Math.round(
        ratio * 100,
      )}% of your safe money.${nextBillNote}`,
    };
  }
  return {
    verdict: "warn",
    remaining,
    message: `Careful — this would use over half of your safe money.${nextBillNote}`,
  };
}

export interface MoneyMap {
  income: number;
  bills: number;
  subscriptions: number;
  goals: number;
  leftover: number;
  fixedRatio: number;
  assets: { available: number; savings: number; total: number };
  liabilities: { credit: number; loans: number; total: number };
  net: number;
}

export function getMonthlyIncome(incomes: Income[]): number {
  return incomes.reduce((sum, i) => {
    switch (i.frequency) {
      case "weekly":
        return sum + i.amount * 4.33;
      case "biweekly":
        return sum + i.amount * 2.166;
      case "monthly":
        return sum + i.amount;
      default:
        return sum + i.amount;
    }
  }, 0);
}

export function getMonthlyBillsTotal(bills: Bill[]): number {
  // Treat all listed bills as monthly recurring for the MVP overview.
  return bills.reduce((sum, b) => sum + b.amount, 0);
}

export function buildMoneyMap(snapshot: UserSnapshot): MoneyMap {
  const income = getMonthlyIncome(snapshot.income);
  const bills = getMonthlyBillsTotal(snapshot.bills);
  const subscriptions = getSubscriptionMonthlyTotal(snapshot.subscriptions);
  const goals = getGoalContributionTotal(snapshot.goals);
  const leftover = income - bills - subscriptions - goals;
  const fixedRatio = income > 0 ? (bills + subscriptions) / income : 0;
  const totals = getAccountTotals(snapshot.financial_accounts ?? []);
  return {
    income,
    bills,
    subscriptions,
    goals,
    leftover,
    fixedRatio,
    assets: {
      available: totals.available,
      savings: totals.savings,
      total: totals.available + totals.savings,
    },
    liabilities: {
      credit: totals.creditDebt,
      loans: totals.loans,
      total: totals.creditDebt + totals.loans,
    },
    net: totals.net,
  };
}

export function generateNestGuideMessage(snapshot: UserSnapshot): string {
  const safe = calculateSafeToSpend(snapshot);
  const overdue = getOverdueBills(snapshot.bills);
  const dueSoon = getDueSoonBills(snapshot.bills, 5);
  const renewing = getRenewingSoon(snapshot.subscriptions, 7);

  if (safe.amount < 0) {
    return `You are short by $${Math.abs(safe.amount).toFixed(
      0,
    )} before payday. Focus only on essentials this week.`;
  }
  if (overdue.length) {
    const b = overdue[0];
    return `${b.name} is overdue. Take a moment to handle it when you can.`;
  }
  if (dueSoon.length) {
    const b = dueSoon[0];
    const d = daysUntil(b.due_date);
    const when =
      d === 0 ? "today" : d === 1 ? "tomorrow" : `in ${d} days`;
    return `Your ${b.name} is due ${when}. Keep spending light until then.`;
  }
  if (renewing.length >= 2) {
    return `You have ${renewing.length} subscriptions renewing soon. A quick review could save you money.`;
  }
  if (safe.amount > 0) {
    return `Your bills are covered and you have $${safe.amount.toFixed(
      0,
    )} safe to spend before payday. Stay steady.`;
  }
  return "Things look quiet. A calm week for your money.";
}

export function isSameDayIso(a: string, b: string) {
  return isSameDay(toDate(a), toDate(b));
}
