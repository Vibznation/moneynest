"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Building2,
  FileText,
  TrendingUp,
  TrendingDown,
  Download,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Card, CardTitle, CardValue } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { PremiumGate } from "@/components/plus/PremiumGate";
import { formatCurrency } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type TxType = "income" | "expense";

interface BusinessTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TxType;
  category: string;
  notes: string;
}

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

interface Invoice {
  id: string;
  number: string;
  client: string;
  amount: number;
  issued: string;
  due: string;
  status: InvoiceStatus;
  notes: string;
}

const EXPENSE_CATEGORIES = [
  "Advertising",
  "Equipment",
  "Insurance",
  "Legal & Professional",
  "Office Supplies",
  "Rent / Utilities",
  "Software",
  "Travel",
  "Wages",
  "Other",
];

const INCOME_CATEGORIES = [
  "Client Payment",
  "Consulting",
  "Product Sales",
  "Service Revenue",
  "Other",
];

const INVOICE_STATUSES: InvoiceStatus[] = ["draft", "sent", "paid", "overdue"];

const STATUS_TONE: Record<InvoiceStatus, "neutral" | "accent" | "warning" | "danger"> = {
  draft: "neutral",
  sent: "warning",
  paid: "accent",
  overdue: "danger",
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function BusinessWorkspacePage() {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/plus"
        className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground"
      >
        <ArrowLeft size={14} /> Dueviq+
      </Link>
      <header>
        <div className="flex items-center gap-2">
          <Building2 size={22} className="text-accent" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Business Workspace
          </h1>
        </div>
        <p className="mt-1 text-foreground-muted">
          Separate business income and expenses, track invoices, and export summaries for your accountant.
        </p>
      </header>
      <PremiumGate
        feature="business_workspace"
        planLabel="Dueviq Business"
        title="Business Workspace"
        description="Upgrade to Dueviq Business to keep a clean separation between personal and business finances."
      >
        <BusinessContent />
      </PremiumGate>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

type WorkspaceTab = "overview" | "transactions" | "invoices";

function BusinessContent() {
  const [tab, setTab] = useState<WorkspaceTab>("overview");

  return (
    <div className="flex flex-col gap-5">
      {/* Disclaimer */}
      <p className="text-xs text-foreground-muted bg-surface-muted rounded-xl px-4 py-2">
        Business Workspace is a personal tracking tool. It is not a full accounting platform and does not file taxes, process payments, or integrate with payroll. Export summaries for use with your accountant.
      </p>

      {/* Tab bar */}
      <div className="flex rounded-xl bg-surface-muted p-1 gap-1">
        {(["overview", "transactions", "invoices"] as WorkspaceTab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors capitalize ${
              tab === t
                ? "bg-surface text-foreground shadow-sm"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "transactions" && <TransactionsTab />}
      {tab === "invoices" && <InvoicesTab />}
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────

function OverviewTab() {
  // Shared state lifted via context would be ideal; for now each tab has its own local state
  // The overview here shows guidance cards
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <FeatureCard
          icon={<TrendingUp size={20} className="text-accent" />}
          title="Income & expenses"
          description="Log business income and expenses separately from your personal finances. Categorize and filter by date."
        />
        <FeatureCard
          icon={<FileText size={20} className="text-accent" />}
          title="Invoice tracker"
          description="Create invoices, track sent/paid status, and chase overdue payments — all in one place."
        />
        <FeatureCard
          icon={<Download size={20} className="text-accent" />}
          title="CSV export"
          description="Export a clean, accountant-ready CSV of your business transactions at any time."
        />
      </div>
      <p className="text-sm text-foreground-muted text-center">
        Switch to the <strong>Transactions</strong> or <strong>Invoices</strong> tabs to get started.
      </p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft">
        {icon}
      </span>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-foreground-muted leading-relaxed">{description}</p>
      </div>
    </Card>
  );
}

// ── Transactions tab ──────────────────────────────────────────────────────────

function TransactionsTab() {
  const [transactions, setTransactions] = useState<BusinessTransaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [txType, setTxType] = useState<TxType>("expense");
  const [form, setForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    description: "",
    amount: "",
    category: "Other",
    notes: "",
  });

  const income = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0),
    [transactions],
  );
  const expenses = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0),
    [transactions],
  );
  const net = income - expenses;

  const categories = txType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function addTx() {
    const amt = parseFloat(form.amount);
    if (!form.description.trim() || isNaN(amt) || amt <= 0) return;
    setTransactions((prev) => [
      {
        id: crypto.randomUUID(),
        date: form.date,
        description: form.description,
        amount: amt,
        type: txType,
        category: form.category,
        notes: form.notes,
      },
      ...prev,
    ]);
    setForm({
      date: format(new Date(), "yyyy-MM-dd"),
      description: "",
      amount: "",
      category: "Other",
      notes: "",
    });
    setShowForm(false);
  }

  function exportCsv() {
    const header = "Date,Type,Description,Category,Amount,Notes\n";
    const rows = transactions
      .map(
        (t) =>
          `"${t.date}","${t.type}","${t.description.replace(/"/g, '""')}","${t.category}","${t.amount.toFixed(2)}","${t.notes.replace(/"/g, '""')}"`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dueviq-business-transactions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <p className="text-xs text-foreground-muted">Income</p>
          <p className="mt-1 text-lg font-bold text-accent">
            {formatCurrency(income, "USD")}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-foreground-muted">Expenses</p>
          <p className="mt-1 text-lg font-bold text-danger">
            {formatCurrency(expenses, "USD")}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-foreground-muted">Net</p>
          <p className={`mt-1 text-lg font-bold ${net >= 0 ? "text-accent" : "text-danger"}`}>
            {formatCurrency(net, "USD")}
          </p>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button variant="primary" onClick={() => { setTxType("income"); setShowForm(true); }}>
          <TrendingUp size={14} /> Income
        </Button>
        <Button variant="secondary" onClick={() => { setTxType("expense"); setShowForm(true); }}>
          <TrendingDown size={14} /> Expense
        </Button>
        {transactions.length > 0 && (
          <Button variant="ghost" onClick={exportCsv}>
            <Download size={14} /> Export
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardTitle>
            Add {txType === "income" ? "income" : "expense"}
          </CardTitle>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Date">
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </Field>
            <Field label="Amount">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step={0.01}
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description">
                <Input
                  placeholder="e.g. Client payment — Project Alpha"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </Field>
            </div>
            <Field label="Category">
              <select
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Notes (optional)">
              <Input
                placeholder="Reference number, client, etc."
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </Field>
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="primary" onClick={addTx}>Save</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {transactions.length > 0 ? (
        <Card>
          <CardTitle>{transactions.length} transactions</CardTitle>
          <div className="mt-4 divide-y divide-border">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-start gap-3 py-3">
                <span
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                    t.type === "income"
                      ? "bg-accent-soft text-accent"
                      : "bg-danger-soft text-danger"
                  }`}
                >
                  {t.type === "income" ? "+" : "−"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{t.description}</p>
                  <p className="text-xs text-foreground-muted">
                    {format(parseISO(t.date), "MMM d, yyyy")} · {t.category}
                    {t.notes ? ` · ${t.notes}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={`font-semibold ${
                      t.type === "income" ? "text-accent" : "text-danger"
                    }`}
                  >
                    {t.type === "income" ? "+" : "−"}
                    {formatCurrency(t.amount, "USD")}
                  </p>
                  <button
                    onClick={() =>
                      setTransactions((prev) => prev.filter((x) => x.id !== t.id))
                    }
                    className="mt-1 text-foreground-muted hover:text-danger transition-colors"
                    aria-label="Remove"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        !showForm && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-14 text-center">
            <Building2 size={32} className="text-foreground-muted" />
            <p className="font-medium text-foreground">No transactions yet</p>
            <p className="text-sm text-foreground-muted max-w-xs">
              Log your first business income or expense to get started.
            </p>
          </div>
        )
      )}
    </div>
  );
}

// ── Invoices tab ──────────────────────────────────────────────────────────────

function InvoicesTab() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    number: "",
    client: "",
    amount: "",
    issued: format(new Date(), "yyyy-MM-dd"),
    due: "",
    status: "draft" as InvoiceStatus,
    notes: "",
  });

  const totals = useMemo(() => {
    const paid = invoices
      .filter((i) => i.status === "paid")
      .reduce((s, i) => s + i.amount, 0);
    const outstanding = invoices
      .filter((i) => i.status !== "paid")
      .reduce((s, i) => s + i.amount, 0);
    return { paid, outstanding };
  }, [invoices]);

  function addInvoice() {
    const amt = parseFloat(form.amount);
    if (!form.client.trim() || isNaN(amt) || amt <= 0) return;
    const inv: Invoice = {
      id: crypto.randomUUID(),
      number: form.number || `INV-${String(invoices.length + 1).padStart(3, "0")}`,
      client: form.client,
      amount: amt,
      issued: form.issued,
      due: form.due,
      status: form.status,
      notes: form.notes,
    };
    setInvoices((prev) => [inv, ...prev]);
    setForm({
      number: "",
      client: "",
      amount: "",
      issued: format(new Date(), "yyyy-MM-dd"),
      due: "",
      status: "draft",
      notes: "",
    });
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {invoices.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-accent-soft border-accent-soft">
            <p className="text-xs text-foreground-muted">Collected</p>
            <p className="mt-1 text-xl font-bold text-accent">
              {formatCurrency(totals.paid, "USD")}
            </p>
          </Card>
          <Card>
            <p className="text-xs text-foreground-muted">Outstanding</p>
            <p className="mt-1 text-xl font-bold text-warning">
              {formatCurrency(totals.outstanding, "USD")}
            </p>
          </Card>
        </div>
      )}

      <Button variant="primary" onClick={() => setShowForm(true)}>
        <Plus size={14} /> New invoice
      </Button>

      {showForm && (
        <Card>
          <CardTitle>New invoice</CardTitle>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Invoice number (optional)">
              <Input
                placeholder="INV-001"
                value={form.number}
                onChange={(e) =>
                  setForm((f) => ({ ...f, number: e.target.value }))
                }
              />
            </Field>
            <Field label="Client name">
              <Input
                placeholder="Acme Corp"
                value={form.client}
                onChange={(e) =>
                  setForm((f) => ({ ...f, client: e.target.value }))
                }
              />
            </Field>
            <Field label="Amount">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step={0.01}
                placeholder="0.00"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
              />
            </Field>
            <Field label="Status">
              <select
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground capitalize"
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as InvoiceStatus,
                  }))
                }
              >
                {INVOICE_STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Issue date">
              <Input
                type="date"
                value={form.issued}
                onChange={(e) =>
                  setForm((f) => ({ ...f, issued: e.target.value }))
                }
              />
            </Field>
            <Field label="Due date (optional)">
              <Input
                type="date"
                value={form.due}
                onChange={(e) =>
                  setForm((f) => ({ ...f, due: e.target.value }))
                }
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Notes (optional)">
                <Input
                  placeholder="Services rendered, PO number, etc."
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                />
              </Field>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="primary" onClick={addInvoice}>Create invoice</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {invoices.length > 0 ? (
        <Card>
          <CardTitle>{invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</CardTitle>
          <div className="mt-4 divide-y divide-border">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-start gap-3 py-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-xs font-bold text-foreground-muted">
                  {inv.status === "paid" ? (
                    <CheckCircle2 size={16} className="text-accent" />
                  ) : (
                    <Clock size={16} />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{inv.number}</p>
                    <p className="text-sm text-foreground-muted">{inv.client}</p>
                    <Badge tone={STATUS_TONE[inv.status]} className="capitalize">
                      {inv.status}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-foreground-muted">
                    Issued {format(parseISO(inv.issued), "MMM d, yyyy")}
                    {inv.due
                      ? ` · Due ${format(parseISO(inv.due), "MMM d, yyyy")}`
                      : ""}
                    {inv.notes ? ` · ${inv.notes}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                  <p className="font-semibold">{formatCurrency(inv.amount, "USD")}</p>
                  <div className="flex gap-2">
                    {inv.status !== "paid" && (
                      <button
                        onClick={() =>
                          setInvoices((prev) =>
                            prev.map((x) =>
                              x.id === inv.id ? { ...x, status: "paid" } : x,
                            ),
                          )
                        }
                        className="text-xs text-accent hover:underline"
                      >
                        Mark paid
                      </button>
                    )}
                    <button
                      onClick={() =>
                        setInvoices((prev) => prev.filter((x) => x.id !== inv.id))
                      }
                      className="text-foreground-muted hover:text-danger transition-colors"
                      aria-label="Remove"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        !showForm && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-14 text-center">
            <FileText size={32} className="text-foreground-muted" />
            <p className="font-medium text-foreground">No invoices yet</p>
            <p className="text-sm text-foreground-muted max-w-xs">
              Create your first invoice to start tracking payments from clients.
            </p>
          </div>
        )
      )}
    </div>
  );
}
