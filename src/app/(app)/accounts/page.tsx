"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Plus,
  Pencil,
  Trash2,
  Landmark,
  ShieldCheck,
  RefreshCw,
  Wallet,
  PiggyBank,
  CreditCard,
  CircleDollarSign,
  Banknote,
  Building2,
} from "lucide-react";
import { useData } from "@/lib/data-store";
import { Card, CardTitle, CardValue } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
  DEFAULT_INCLUDE_BY_TYPE,
} from "@/lib/constants";
import { getAccountTotals } from "@/lib/calculations";
import type {
  FinancialAccount,
  FinancialAccountType,
  Transaction,
} from "@/types/domain";
import { TransactionList } from "@/components/accounts/TransactionList";
import { TransactionModal } from "@/components/accounts/TransactionModal";
import { formatCurrency } from "@/lib/utils";

export default function AccountsPage() {
  const {
    snapshot,
    addFinancialAccount,
    updateFinancialAccount,
    deleteFinancialAccount,
  } = useData();
  const accounts = snapshot.financial_accounts;
  const currency = snapshot.settings?.currency ?? "USD";
  const totals = useMemo(() => getAccountTotals(accounts), [accounts]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialAccount | null>(null);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(a: FinancialAccount) {
    setEditing(a);
    setOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Your Accounts</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Connect your bank or add accounts manually. You are always in control.
        </p>
      </header>

      {/* Summary tiles */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <SummaryTile
          label="Total Available"
          value={formatCurrency(totals.available, currency)}
          icon={<Wallet size={14} />}
          tone="accent"
        />
        <SummaryTile
          label="Savings"
          value={formatCurrency(totals.savings, currency)}
          icon={<PiggyBank size={14} />}
          tone="info"
        />
        <SummaryTile
          label="Credit Debt"
          value={formatCurrency(totals.creditDebt, currency)}
          icon={<CreditCard size={14} />}
          tone={totals.creditDebt > 0 ? "warning" : "neutral"}
        />
        <SummaryTile
          label="Net Position"
          value={formatCurrency(totals.net, currency)}
          icon={<CircleDollarSign size={14} />}
          tone={totals.net < 0 ? "danger" : "neutral"}
        />
      </div>

      {/* Actions */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Add a manual account</p>
            <p className="mt-0.5 text-xs text-foreground-muted">
              Track checking, savings, cash, credit cards and loans.
            </p>
          </div>
          <Button onClick={openNew} variant="primary">
            <Plus size={16} /> Add account
          </Button>
        </Card>

        <Card className="flex items-center justify-between gap-3 bg-accent-soft border-accent-soft">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Connect your bank securely</p>
            <p className="mt-0.5 text-xs text-foreground-muted">
              Automatically sync balances and transactions.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() =>
              alert(
                "Bank connection is coming soon. You can add accounts manually for now.",
              )
            }
          >
            <Landmark size={16} /> Connect
          </Button>
        </Card>
      </div>

      {/* Privacy note */}
      <p className="flex items-start gap-2 text-xs text-foreground-muted">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-accent" />
        Bank linking is optional. MoneyNest works even if you prefer to enter
        your money manually.
      </p>

      {/* Account list */}
      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Accounts</CardTitle>
          <span className="text-xs text-foreground-muted">
            {accounts.length} total
          </span>
        </div>
        {accounts.length === 0 ? (
          <EmptyState
            title="No accounts yet"
            description="Add your first account to make Safe to Spend more accurate."
            action={
              <Button onClick={openNew}>
                <Plus size={16} /> Add account
              </Button>
            }
            className="mt-3"
          />
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {accounts.map((a) => (
              <AccountRow
                key={a.id}
                account={a}
                currency={currency}
                onEdit={() => openEdit(a)}
                onDelete={() => {
                  if (confirm(`Remove ${a.account_name}?`)) {
                    deleteFinancialAccount(a.id);
                  }
                }}
                onToggleInclude={(v) =>
                  updateFinancialAccount(a.id, {
                    include_in_safe_to_spend: v,
                  })
                }
              />
            ))}
          </ul>
        )}
      </Card>

      <AccountModal
        open={open}
        onClose={() => setOpen(false)}
        initial={editing}
        currency={currency}
        onSubmit={(data) => {
          if (editing) {
            updateFinancialAccount(editing.id, data);
          } else {
            addFinancialAccount(data);
          }
          setOpen(false);
        }}
      />


    </div>
  );
}


function SummaryTile({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "accent" | "info" | "warning" | "danger" | "neutral";
}) {
  const ring = {
    accent: "bg-accent-soft",
    info: "bg-info-soft",
    warning: "bg-warning-soft",
    danger: "bg-danger-soft",
    neutral: "bg-surface-muted",
  }[tone];
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-foreground-muted">
        <span
          className={`inline-flex h-6 w-6 items-center justify-center rounded-lg ${ring}`}
        >
          {icon}
        </span>
        <span>{label}</span>
      </div>
      <CardValue className="tabular text-2xl mt-2">{value}</CardValue>
    </Card>
  );
}

function typeIcon(type: FinancialAccountType) {
  switch (type) {
    case "checking":
      return <Wallet size={18} />;
    case "savings":
      return <PiggyBank size={18} />;
    case "credit_card":
      return <CreditCard size={18} />;
    case "loan":
      return <Building2 size={18} />;
    case "cash":
      return <Banknote size={18} />;
    default:
      return <Landmark size={18} />;
  }
}

function statusBadge(a: FinancialAccount) {
  switch (a.status) {
    case "connected":
      return <Badge tone="accent">Connected</Badge>;
    case "sync_needed":
      return (
        <Badge tone="warning">
          <RefreshCw size={10} /> Sync Needed
        </Badge>
      );
    case "disconnected":
      return <Badge tone="danger">Disconnected</Badge>;
    default:
      return <Badge tone="neutral">Manual</Badge>;
  }
}

function AccountRow({
  account,
  currency,
  onEdit,
  onDelete,
  onToggleInclude,
}: {
  account: FinancialAccount;
  currency: string;
  onEdit: () => void;
  onDelete: () => void;
  onToggleInclude: (v: boolean) => void;
}) {
  const { snapshot, addTransaction, updateTransaction, deleteTransaction } = useData();
  const negative = account.balance < 0;
  const synced = account.last_synced_at ? new Date(account.last_synced_at) : null;
  const isToday = synced && synced.toDateString() === new Date().toDateString();
  const [txOpen, setTxOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const txs = useMemo(
    () => snapshot.transactions.filter((t) => t.financial_account_id === account.id),
    [snapshot.transactions, account.id],
  );
  return (
    <li className="flex flex-col gap-2 py-3.5 border-b-0">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-foreground-muted">
          {typeIcon(account.account_type)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{account.account_name}</p>
            {statusBadge(account)}
          </div>
          <p className="text-xs text-foreground-muted truncate">
            {ACCOUNT_TYPE_LABELS[account.account_type]}
            {account.institution_name ? ` · ${account.institution_name}` : ""}
            {synced ? ` · Last updated ${isToday ? "Today" : format(synced, "MMM d, yyyy")}` : ""}
          </p>
        </div>
        <div className="text-right">
          <p className={`tabular text-lg font-semibold ${negative ? "text-danger" : ""}`}>
            {formatCurrency(account.balance, currency)}
          </p>
          <label className="mt-1 flex items-center justify-end gap-1.5 text-[11px] text-foreground-muted cursor-pointer">
            <input
              type="checkbox"
              checked={account.include_in_safe_to_spend}
              onChange={(e) => onToggleInclude(e.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--accent)]"
            />
            Safe-to-spend
          </label>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-surface-muted text-foreground-muted"
            aria-label="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-danger-soft text-foreground-muted"
            aria-label="Remove"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="mt-2">
        <TransactionList
          transactions={txs}
          currency={currency}
          onAdd={() => { setEditingTx(null); setTxOpen(true); }}
          onEdit={(tx) => { setEditingTx(tx); setTxOpen(true); }}
          onDelete={(tx) => { if (confirm(`Delete transaction '${tx.name}'?`)) deleteTransaction(tx.id); }}
        />
        <TransactionModal
          open={txOpen}
          onClose={() => setTxOpen(false)}
          initial={editingTx ? { ...editingTx, financial_account_id: account.id } : null}
          currency={currency}
          onSubmit={(data) => {
            if (editingTx) {
              updateTransaction(editingTx.id, data);
            } else {
              addTransaction({ ...data, financial_account_id: account.id });
            }
            setTxOpen(false);
          }}
        />
      </div>
    </li>
  );
}

function AccountModal({
  open,
  onClose,
  initial,
  currency,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  initial: FinancialAccount | null;
  currency: string;
  onSubmit: (
    data: Omit<FinancialAccount, "id" | "user_id" | "created_at" | "updated_at">,
  ) => void;
}) {
  const [accountName, setAccountName] = useState("");
  const [institution, setInstitution] = useState("");
  const [type, setType] = useState<FinancialAccountType>("checking");
  const [balance, setBalance] = useState("");
  const [notes, setNotes] = useState("");
  const [include, setInclude] = useState(true);
  // Track whether the user has manually overridden the include toggle so we
  // don't keep resetting it as they pick different account types.
  const [includeTouched, setIncludeTouched] = useState(false);

  useEffect(() => {
    setAccountName(initial?.account_name ?? "");
    setInstitution(initial?.institution_name ?? "");
    setType(initial?.account_type ?? "checking");
    setBalance(initial?.balance?.toString() ?? "");
    setNotes(initial?.notes ?? "");
    setInclude(
      initial?.include_in_safe_to_spend ??
        DEFAULT_INCLUDE_BY_TYPE.checking,
    );
    setIncludeTouched(false);
  }, [initial, open]);

  // When type changes and the user hasn't overridden the include flag, follow
  // the recommended default for that type.
  useEffect(() => {
    if (!includeTouched) {
      setInclude(DEFAULT_INCLUDE_BY_TYPE[type]);
    }
  }, [type, includeTouched]);

  const canSave = accountName.trim().length > 0 && !isNaN(parseFloat(balance));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit account" : "Add account"}
    >
      <div className="grid gap-3">
        <Field label="Account name">
          <Input
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="Chase Checking"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Account type">
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as FinancialAccountType)}
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ACCOUNT_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Institution (optional)">
            <Input
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="Chase, Ally, …"
            />
          </Field>
        </div>
        <Field
          label="Current balance"
          hint={
            type === "credit_card" || type === "loan"
              ? "Enter a negative number for debt (e.g. -640)."
              : undefined
          }
        >
          <Input
            type="number"
            step="0.01"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="0.00"
          />
        </Field>
        <Field label="Notes (optional)">
          <Textarea
            value={notes ?? ""}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything to remember about this account…"
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={include}
            onChange={(e) => {
              setIncludeTouched(true);
              setInclude(e.target.checked);
            }}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Include in Safe-to-Spend calculation
        </label>
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!canSave}
            onClick={() =>
              onSubmit({
                account_name: accountName.trim(),
                institution_name: institution.trim() || null,
                account_type: type,
                balance: parseFloat(balance || "0"),
                currency,
                source: initial?.source ?? "manual",
                status: initial?.status ?? "manual",
                notes: notes.trim() || null,
                plaid_item_id: initial?.plaid_item_id ?? null,
                plaid_account_id: initial?.plaid_account_id ?? null,
                include_in_safe_to_spend: include,
                last_synced_at:
                  initial?.last_synced_at ?? new Date().toISOString(),
              })
            }
          >
            {initial ? "Save changes" : "Add account"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
