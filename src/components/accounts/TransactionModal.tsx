"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Transaction } from "@/types/domain";

const CATEGORY_OPTIONS = [
  "Groceries",
  "Shopping",
  "Dining",
  "Bills",
  "Income",
  "Interest",
  "Payment",
  "Transfer",
  "Other",
];

export function TransactionModal({
  open,
  onClose,
  initial,
  onSubmit,
  currency,
}: {
  open: boolean;
  onClose: () => void;
  initial: Transaction | null;
  onSubmit: (data: Omit<Transaction, "id" | "user_id" | "created_at">) => void;
  currency: string;
}) {
  const [name, setName] = useState("");
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Other");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setName(initial?.name ?? "");
    setMerchant(initial?.merchant_name ?? "");
    setAmount(initial?.amount?.toString() ?? "");
    setCategory(initial?.category ?? "Other");
    setDate(initial?.transaction_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
    setNotes(initial?.notes ?? "");
  }, [initial, open]);

  const canSave = name.trim().length > 0 && !isNaN(parseFloat(amount)) && date;

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit transaction" : "Add transaction"}>
      <div className="grid gap-3">
        <Field label="Name">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Merchant or description" />
        </Field>
        <Field label="Merchant (optional)">
          <Input value={merchant} onChange={e => setMerchant(e.target.value)} placeholder="Merchant name" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Amount">
            <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder={currency || "0.00"} />
          </Field>
          <Field label="Date">
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </Field>
        </div>
        <Field label="Category">
          <Select value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORY_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
          </Select>
        </Field>
        <Field label="Notes (optional)">
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything to remember…" />
        </Field>
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!canSave}
            onClick={() => onSubmit({
              name: name.trim(),
              merchant_name: merchant.trim() || null,
              amount: parseFloat(amount || "0"),
              category: category || null,
              transaction_date: date,
              pending: false,
              source: "manual",
              notes: notes.trim() || null,
              financial_account_id: initial?.financial_account_id ?? null,
              plaid_transaction_id: initial?.plaid_transaction_id ?? null,
            })}
          >
            {initial ? "Save changes" : "Add transaction"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
