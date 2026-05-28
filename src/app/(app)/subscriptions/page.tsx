"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, Repeat, Filter as FilterIcon } from "lucide-react";
import { useData } from "@/lib/data-store";
import { Card, CardTitle, CardValue } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { SUBSCRIPTION_CATEGORIES } from "@/lib/constants";
import {
  daysUntil,
  getRenewingSoon,
  getReviewSavings,
  getSubscriptionMonthlyTotal,
  toDate,
} from "@/lib/calculations";
import type { Subscription, SubscriptionCategory } from "@/types/domain";
import { formatCurrency, formatCurrencyPrecise } from "@/lib/utils";

type Filter = "all" | "Keep" | "Review" | "Cancel";

export default function SubscriptionsPage() {
  const { snapshot, addSubscription, updateSubscription, deleteSubscription } =
    useData();
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const currency = snapshot.settings?.currency ?? "USD";

  const monthly = useMemo(
    () => getSubscriptionMonthlyTotal(snapshot.subscriptions),
    [snapshot],
  );
  const yearly = monthly * 12;
  const savings = useMemo(
    () => getReviewSavings(snapshot.subscriptions),
    [snapshot],
  );
  const renewals = useMemo(
    () => getRenewingSoon(snapshot.subscriptions, 7),
    [snapshot],
  );

  const filtered = useMemo(() => {
    const sorted = [...snapshot.subscriptions].sort(
      (a, b) =>
        toDate(a.renewal_date).getTime() - toDate(b.renewal_date).getTime(),
    );
    if (filter === "all") return sorted;
    return sorted.filter((s) => s.status === filter);
  }, [snapshot.subscriptions, filter]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Subscriptions</h1>
          <p className="text-sm text-foreground-muted">
            What you&apos;re paying for, in plain numbers.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus size={16} /> Add subscription
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardTitle>Per month</CardTitle>
          <CardValue>{formatCurrencyPrecise(monthly, currency)}</CardValue>
        </Card>
        <Card>
          <CardTitle>Per year</CardTitle>
          <CardValue>{formatCurrencyPrecise(yearly, currency)}</CardValue>
        </Card>
        <Card className="bg-accent-soft border-accent-soft">
          <CardTitle>Could save</CardTitle>
          <CardValue>{formatCurrencyPrecise(savings, currency)}/mo</CardValue>
          <p className="mt-1 text-xs text-foreground-muted">
            If you cancel items marked Review or Cancel.
          </p>
        </Card>
      </div>

      {renewals.length > 0 && (
        <Card>
          <CardTitle>Renewing in 7 days</CardTitle>
          <ul className="mt-3 divide-y divide-border">
            {renewals.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Repeat size={14} className="text-foreground-muted" />
                  <span>{s.name}</span>
                </div>
                <div className="text-sm text-foreground-muted">
                  {format(toDate(s.renewal_date), "MMM d")} ·{" "}
                  {formatCurrencyPrecise(s.amount, currency)}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>All subscriptions</CardTitle>
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <FilterIcon size={14} />
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value as Filter)}
              className="h-8 w-auto py-1"
            >
              <option value="all">All</option>
              <option value="Keep">Keep</option>
              <option value="Review">Review</option>
              <option value="Cancel">Cancel</option>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No subscriptions yet"
            description="Track what's renewing so nothing surprises you."
            className="mt-3"
            action={
              <Button
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                }}
              >
                <Plus size={16} /> Add subscription
              </Button>
            }
          />
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {filtered.map((s) => {
              const d = daysUntil(s.renewal_date);
              const tone =
                s.status === "Review"
                  ? "warning"
                  : s.status === "Cancel"
                    ? "danger"
                    : "accent";
              return (
                <li key={s.id} className="flex items-center gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{s.name}</p>
                    <p className="text-xs text-foreground-muted">
                      {s.category} · renews{" "}
                      {format(toDate(s.renewal_date), "MMM d")}
                      {d >= 0 && d <= 7 ? ` · in ${d}d` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrencyPrecise(s.amount, currency)}
                    </p>
                    <p className="text-xs text-foreground-muted">
                      {formatCurrency(s.amount * 12, currency)}/yr
                    </p>
                  </div>
                  <Select
                    value={s.status}
                    onChange={(e) =>
                      updateSubscription(s.id, {
                        status: e.target.value as Subscription["status"],
                      })
                    }
                    className="h-8 w-auto py-1"
                  >
                    <option>Keep</option>
                    <option>Review</option>
                    <option>Cancel</option>
                  </Select>
                  <Badge tone={tone}>{s.status}</Badge>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditing(s);
                        setOpen(true);
                      }}
                      className="p-1.5 rounded-lg hover:bg-surface-muted text-foreground-muted"
                      aria-label="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => deleteSubscription(s.id)}
                      className="p-1.5 rounded-lg hover:bg-danger-soft text-foreground-muted"
                      aria-label="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <SubModal
        open={open}
        onClose={() => setOpen(false)}
        initial={editing}
        onSubmit={(data) => {
          if (editing) {
            updateSubscription(editing.id, data);
          } else {
            addSubscription(data);
          }
          setOpen(false);
        }}
      />
    </div>
  );
}

function SubModal({
  open,
  onClose,
  initial,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  initial: Subscription | null;
  onSubmit: (
    data: Omit<Subscription, "id" | "user_id" | "created_at">,
  ) => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [renewal, setRenewal] = useState("");
  const [category, setCategory] = useState<SubscriptionCategory>("Other");
  const [status, setStatus] = useState<Subscription["status"]>("Review");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setName(initial?.name ?? "");
    setAmount(initial?.amount?.toString() ?? "");
    setRenewal(initial?.renewal_date ?? new Date().toISOString().slice(0, 10));
    setCategory(initial?.category ?? "Other");
    setStatus(initial?.status ?? "Review");
    setNotes(initial?.notes ?? "");
  }, [initial, open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit subscription" : "Add subscription"}
    >
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name || !amount || !renewal) return;
          onSubmit({
            name,
            amount: parseFloat(amount),
            renewal_date: renewal,
            category,
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
          <Field label="Renewal date">
            <Input
              type="date"
              value={renewal}
              onChange={(e) => setRenewal(e.target.value)}
              required
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
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
          <Field label="Status">
            <Select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as Subscription["status"])
              }
            >
              <option>Keep</option>
              <option>Review</option>
              <option>Cancel</option>
            </Select>
          </Field>
        </div>
        <Field label="Notes">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 mt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{initial ? "Save" : "Add subscription"}</Button>
        </div>
      </form>
    </Modal>
  );
}
