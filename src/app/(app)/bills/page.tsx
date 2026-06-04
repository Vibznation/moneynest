"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Filter as FilterIcon,
} from "lucide-react";
import { useData } from "@/lib/data-store";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { BILL_CATEGORIES } from "@/lib/constants";
import {
  daysUntil,
  getOverdueBills,
  getUpcomingBills,
  toDate,
} from "@/lib/calculations";
import type { Bill, BillCategory } from "@/types/domain";
import { formatCurrency } from "@/lib/utils";

type Filter = "all" | "unpaid" | "paid" | "upcoming" | "overdue";

export default function BillsPage() {
  const { snapshot, addBill, updateBill, deleteBill } = useData();
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<Bill | null>(null);
  const [open, setOpen] = useState(false);
  const currency = snapshot.settings?.currency ?? "USD";

  const overdue = useMemo(() => getOverdueBills(snapshot.bills), [snapshot]);
  const upcoming = useMemo(
    () => getUpcomingBills(snapshot.bills, 7),
    [snapshot],
  );
  const monthlyTotal = snapshot.bills.reduce((s, b) => s + b.amount, 0);

  const filtered = useMemo(() => {
    const sorted = [...snapshot.bills].sort(
      (a, b) => toDate(a.due_date).getTime() - toDate(b.due_date).getTime(),
    );
    const overdueIds = new Set(overdue.map((b) => b.id));
    const upcomingIds = new Set(upcoming.map((b) => b.id));
    switch (filter) {
      case "paid":
        return sorted.filter((b) => b.status === "paid");
      case "unpaid":
        return sorted.filter((b) => b.status === "unpaid");
      case "overdue":
        return sorted.filter(
          (b) => b.status === "unpaid" && daysUntil(b.due_date) < 0,
        );
      case "upcoming":
        return sorted.filter((b) => {
          if (b.status !== "unpaid") return false;
          const d = daysUntil(b.due_date);
          return d >= 0 && d <= 7;
        });
      default:
        // exclude bills already shown in the Overdue / Upcoming sections
        return sorted.filter((b) => !overdueIds.has(b.id) && !upcomingIds.has(b.id));
    }
  }, [snapshot.bills, filter, overdue, upcoming]);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(b: Bill) {
    setEditing(b);
    setOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bills</h1>
          <p className="text-sm text-foreground-muted">
            {snapshot.bills.length} bill{snapshot.bills.length === 1 ? "" : "s"} ·
            {" "}{formatCurrency(monthlyTotal, currency)} this cycle
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus size={16} /> Add bill
        </Button>
      </header>

      {overdue.length > 0 && (
        <Card className="bg-danger-soft border-danger-soft">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <CardTitle className="text-foreground">Overdue</CardTitle>
          </div>
          <BillList
            bills={overdue}
            currency={currency}
            onEdit={openEdit}
            onToggle={(b) =>
              updateBill(b.id, { status: b.status === "paid" ? "unpaid" : "paid" })
            }
            onDelete={(b) => deleteBill(b.id)}
          />
        </Card>
      )}

      {upcoming.length > 0 && (
        <Card>
          <CardTitle>Upcoming in 7 days</CardTitle>
          <BillList
            bills={upcoming}
            currency={currency}
            onEdit={openEdit}
            onToggle={(b) =>
              updateBill(b.id, { status: b.status === "paid" ? "unpaid" : "paid" })
            }
            onDelete={(b) => deleteBill(b.id)}
          />
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>All bills</CardTitle>
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <FilterIcon size={14} />
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value as Filter)}
              className="h-8 w-auto py-1"
            >
              <option value="all">All</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="upcoming">Upcoming</option>
              <option value="overdue">Overdue</option>
            </Select>
          </div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            title="No bills yet"
            description="Add your first bill to start tracking what's coming."
            action={
              <Button onClick={openNew}>
                <Plus size={16} /> Add bill
              </Button>
            }
            className="mt-3"
          />
        ) : (
          <BillList
            bills={filtered}
            currency={currency}
            onEdit={openEdit}
            onToggle={(b) =>
              updateBill(b.id, { status: b.status === "paid" ? "unpaid" : "paid" })
            }
            onDelete={(b) => deleteBill(b.id)}
          />
        )}
      </Card>

      <BillModal
        open={open}
        onClose={() => setOpen(false)}
        initial={editing}
        onSubmit={(data) => {
          if (editing) {
            updateBill(editing.id, data);
          } else {
            addBill(data);
          }
          setOpen(false);
        }}
      />
    </div>
  );
}

function statusTone(bill: Bill) {
  if (bill.status === "paid") return "accent" as const;
  const d = daysUntil(bill.due_date);
  if (d < 0) return "danger" as const;
  if (d <= 3) return "warning" as const;
  return "info" as const;
}

function statusLabel(bill: Bill) {
  if (bill.status === "paid") return "Paid";
  const d = daysUntil(bill.due_date);
  if (d < 0) return "Overdue";
  if (d <= 3) return "Due soon";
  return "Upcoming";
}

function BillList({
  bills,
  currency,
  onEdit,
  onToggle,
  onDelete,
}: {
  bills: Bill[];
  currency: string;
  onEdit: (b: Bill) => void;
  onToggle: (b: Bill) => void;
  onDelete: (b: Bill) => void;
}) {
  return (
    <ul className="mt-3 divide-y divide-border">
      {bills.map((b) => (
        <li
          key={b.id}
          className="flex items-center gap-3 py-3"
        >
          <button
            onClick={() => onToggle(b)}
            aria-label={b.status === "paid" ? "Mark unpaid" : "Mark paid"}
            className="text-foreground-muted hover:text-accent"
          >
            {b.status === "paid" ? (
              <CheckCircle2 size={20} className="text-accent" />
            ) : (
              <Circle size={20} />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{b.name}</p>
              {b.autopay && <Badge tone="neutral">Auto-pay</Badge>}
            </div>
            <p className="text-xs text-foreground-muted">
              {b.category} · {format(toDate(b.due_date), "MMM d, yyyy")}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{formatCurrency(b.amount, currency)}</p>
            <Badge tone={statusTone(b)}>{statusLabel(b)}</Badge>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(b)}
              className="p-1.5 rounded-lg hover:bg-surface-muted text-foreground-muted"
              aria-label="Edit"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDelete(b)}
              className="p-1.5 rounded-lg hover:bg-danger-soft text-foreground-muted"
              aria-label="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function BillModal({
  open,
  onClose,
  initial,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  initial: Bill | null;
  onSubmit: (data: Omit<Bill, "id" | "user_id" | "created_at">) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? "");
  const [dueDate, setDueDate] = useState(
    initial?.due_date ?? new Date().toISOString().slice(0, 10),
  );
  const [category, setCategory] = useState<BillCategory>(
    initial?.category ?? "Other",
  );
  const [autopay, setAutopay] = useState(initial?.autopay ?? false);
  const [status, setStatus] = useState<Bill["status"]>(initial?.status ?? "unpaid");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  // reset when initial changes
  useEffect(() => {
    setName(initial?.name ?? "");
    setAmount(initial?.amount?.toString() ?? "");
    setDueDate(initial?.due_date ?? new Date().toISOString().slice(0, 10));
    setCategory(initial?.category ?? "Other");
    setAutopay(initial?.autopay ?? false);
    setStatus(initial?.status ?? "unpaid");
    setNotes(initial?.notes ?? "");
  }, [initial, open]);

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit bill" : "Add bill"}>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name || !amount || !dueDate) return;
          onSubmit({
            name,
            amount: parseFloat(amount),
            due_date: dueDate,
            category,
            autopay,
            status,
            notes: notes || null,
          });
        }}
      >
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount">
            <Input
              type="number"
              step="0.01"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </Field>
          <Field label="Due date">
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </Field>
        </div>
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
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autopay}
              onChange={(e) => setAutopay(e.target.checked)}
            />
            Auto-pay
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={status === "paid"}
              onChange={(e) => setStatus(e.target.checked ? "paid" : "unpaid")}
            />
            Marked paid
          </label>
        </div>
        <Field label="Notes">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 mt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{initial ? "Save" : "Add bill"}</Button>
        </div>
      </form>
    </Modal>
  );
}
