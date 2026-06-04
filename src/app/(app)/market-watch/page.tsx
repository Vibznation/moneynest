"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, LineChart, Bell } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { PremiumGate } from "@/components/plus/PremiumGate";

// ── Types ────────────────────────────────────────────────────────────────────

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  type: "Stock" | "ETF" | "Crypto" | "Other";
  alertPrice: string; // optional alert threshold
  notes: string;
}

const ASSET_TYPES: WatchlistItem["type"][] = ["Stock", "ETF", "Crypto", "Other"];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function MarketWatchPage() {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/plus"
        className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground"
      >
        <ArrowLeft size={14} /> Dueviq+
      </Link>
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Market Watch
        </h1>
        <p className="mt-1 text-foreground-muted">
          Keep a personal watchlist of stocks and assets you want to follow.
        </p>
      </header>
      <PremiumGate
        feature="stock_charts"
        title="Market Watch"
        description="Upgrade to Dueviq+ Personal to build a personal watchlist and follow prices at a glance."
      >
        <MarketWatchContent />
      </PremiumGate>
    </div>
  );
}

function MarketWatchContent() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [form, setForm] = useState<Omit<WatchlistItem, "id">>({
    symbol: "",
    name: "",
    type: "Stock",
    alertPrice: "",
    notes: "",
  });
  const [showForm, setShowForm] = useState(false);

  function addItem() {
    if (!form.symbol.trim()) return;
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), ...form, symbol: form.symbol.toUpperCase() },
    ]);
    setForm({ symbol: "", name: "", type: "Stock", alertPrice: "", notes: "" });
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-foreground-muted bg-surface-muted rounded-xl px-4 py-2">
        Market Watch is a personal watchlist tool. Dueviq does not execute
        trades or provide financial advice. Prices are not live — this is for
        personal tracking only.
      </p>

      {/* Watchlist */}
      {items.length > 0 && (
        <Card>
          <CardTitle>Watchlist · {items.length} item{items.length !== 1 ? "s" : ""}</CardTitle>
          <div className="mt-4 divide-y divide-border">
            {items.map((item) => (
              <div key={item.id} className="flex items-start gap-3 py-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-muted font-bold text-xs text-foreground-muted">
                  {item.symbol.slice(0, 4)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{item.symbol}</p>
                    {item.name && (
                      <span className="text-xs text-foreground-muted truncate">{item.name}</span>
                    )}
                    <Badge tone="neutral">{item.type}</Badge>
                  </div>
                  {item.alertPrice && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-foreground-muted">
                      <Bell size={10} />
                      Alert at ${item.alertPrice}
                    </p>
                  )}
                  {item.notes && (
                    <p className="mt-0.5 text-xs text-foreground-muted">{item.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}
                  className="text-foreground-muted hover:text-danger transition-colors shrink-0"
                  aria-label="Remove"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add form */}
      {showForm ? (
        <Card>
          <CardTitle>Add to watchlist</CardTitle>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Ticker / Symbol">
              <Input
                placeholder="AAPL"
                value={form.symbol}
                onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
              />
            </Field>
            <Field label="Name (optional)">
              <Input
                placeholder="Apple Inc."
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </Field>
            <Field label="Type">
              <select
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as WatchlistItem["type"] }))}
              >
                {ASSET_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Alert price (optional)">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                placeholder="150.00"
                value={form.alertPrice}
                onChange={(e) => setForm((f) => ({ ...f, alertPrice: e.target.value }))}
              />
            </Field>
            <Field label="Notes (optional)" className="sm:col-span-2">
              <Input
                placeholder="Watching for earnings, etc."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </Field>
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="primary" onClick={addItem}>Add to watchlist</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      ) : (
        <Button variant="secondary" onClick={() => setShowForm(true)}>
          <Plus size={15} /> Add to watchlist
        </Button>
      )}

      {items.length === 0 && !showForm && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-14 text-center">
          <LineChart size={32} className="text-foreground-muted" />
          <p className="font-medium text-foreground">Your watchlist is empty</p>
          <p className="text-sm text-foreground-muted max-w-xs">
            Add tickers you want to keep an eye on. Set optional price alerts
            as reminders.
          </p>
        </div>
      )}
    </div>
  );
}
