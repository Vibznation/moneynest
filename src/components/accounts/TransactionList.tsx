"use client";

import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { Transaction } from "@/types/domain";
import { formatCurrency } from "@/lib/utils";

export function TransactionList({
  transactions,
  currency,
  onAdd,
  onEdit,
  onDelete,
}: {
  transactions: Transaction[];
  currency: string;
  onAdd: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold">Transactions</span>
        <button
          className="p-1.5 rounded-lg hover:bg-surface-muted text-foreground-muted border border-border"
          onClick={onAdd}
        >
          + Add
        </button>
      </div>
      {transactions.length === 0 ? (
        <p className="text-xs text-foreground-muted mt-2">No transactions yet.</p>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {transactions.map((tx) => (
            <li key={tx.id} className="flex items-center gap-3 py-2.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{tx.name}</span>
                  {tx.category && <Badge tone="neutral">{tx.category}</Badge>}
                </div>
                <p className="text-xs text-foreground-muted">
                  {tx.merchant_name || ""}
                  {tx.merchant_name && " · "}
                  {format(new Date(tx.transaction_date), "MMM d, yyyy")}
                </p>
              </div>
              <div className={`tabular text-right font-semibold ${tx.amount < 0 ? "text-danger" : "text-foreground"}`}>
                {formatCurrency(tx.amount, currency)}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(tx)}
                  className="p-1.5 rounded-lg hover:bg-surface-muted text-foreground-muted"
                  aria-label="Edit"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => onDelete(tx)}
                  className="p-1.5 rounded-lg hover:bg-danger-soft text-foreground-muted"
                  aria-label="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
