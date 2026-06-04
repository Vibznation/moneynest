"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Bitcoin, Trash2 } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import { PremiumGate } from "@/components/plus/PremiumGate";
import { formatCurrency } from "@/lib/utils";
import { useData } from "@/lib/data-store";

// ── Types ────────────────────────────────────────────────────────────────────

interface CryptoHolding {
  id: string;
  name: string;
  symbol: string;
  quantity: number;
  priceUsd: number; // manually entered current price
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CryptoPage() {
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
          Crypto View
        </h1>
        <p className="mt-1 text-foreground-muted">
          Track your cryptocurrency holdings in one simple view.
        </p>
      </header>
      <PremiumGate
        feature="crypto_tracking"
        title="Crypto View"
        description="Upgrade to Dueviq+ Personal to track your crypto portfolio value alongside your other accounts."
      >
        <CryptoContent />
      </PremiumGate>
    </div>
  );
}

function CryptoContent() {
  const { snapshot } = useData();
  const currency = snapshot.settings?.currency ?? "USD";

  const [holdings, setHoldings] = useState<CryptoHolding[]>([]);
  const [form, setForm] = useState({ name: "", symbol: "", quantity: "", priceUsd: "" });
  const [showForm, setShowForm] = useState(false);

  const total = useMemo(
    () => holdings.reduce((s, h) => s + h.quantity * h.priceUsd, 0),
    [holdings],
  );

  function addHolding() {
    const quantity = parseFloat(form.quantity);
    const priceUsd = parseFloat(form.priceUsd);
    if (!form.symbol || isNaN(quantity) || isNaN(priceUsd)) return;
    setHoldings((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: form.name || form.symbol.toUpperCase(),
        symbol: form.symbol.toUpperCase(),
        quantity,
        priceUsd,
      },
    ]);
    setForm({ name: "", symbol: "", quantity: "", priceUsd: "" });
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-foreground-muted bg-surface-muted rounded-xl px-4 py-2">
        Crypto View is for tracking only. Dueviq does not execute trades,
        connect to exchanges, or provide investment advice.
        Prices are entered manually and are not live.
      </p>

      {/* Total value */}
      <Card>
        <p className="text-xs uppercase tracking-wide text-foreground-muted">
          Total crypto value
        </p>
        <p className="mt-1 text-4xl font-bold tabular text-foreground">
          {formatCurrency(total, currency)}
        </p>
        <p className="mt-1 text-sm text-foreground-muted">
          {holdings.length} holding{holdings.length !== 1 ? "s" : ""} · prices entered manually
        </p>
      </Card>

      {/* Holdings list */}
      {holdings.length > 0 && (
        <Card>
          <CardTitle>Holdings</CardTitle>
          <div className="mt-4 divide-y divide-border">
            {holdings.map((h) => {
              const value = h.quantity * h.priceUsd;
              const pct = total > 0 ? (value / total) * 100 : 0;
              return (
                <div key={h.id} className="flex items-center gap-3 py-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-muted font-bold text-xs text-foreground-muted">
                    {h.symbol.slice(0, 3)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{h.name}</p>
                    <p className="text-xs text-foreground-muted">
                      {h.quantity} × {formatCurrency(h.priceUsd, "USD")}
                    </p>
                    <Progress className="mt-1.5 h-1.5" value={Math.max(2, pct)} />
                  </div>
                  <div className="text-right shrink-0">
                    <p className="tabular font-semibold">{formatCurrency(value, currency)}</p>
                    <p className="text-xs text-foreground-muted">{pct.toFixed(1)}%</p>
                  </div>
                  <button
                    onClick={() => setHoldings((prev) => prev.filter((x) => x.id !== h.id))}
                    className="text-foreground-muted hover:text-danger transition-colors ml-1"
                    aria-label="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Add form */}
      {showForm ? (
        <Card>
          <CardTitle>Add holding</CardTitle>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Symbol (e.g. BTC)">
              <Input
                placeholder="BTC"
                value={form.symbol}
                onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
              />
            </Field>
            <Field label="Name (optional)">
              <Input
                placeholder="Bitcoin"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </Field>
            <Field label="Quantity">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                placeholder="0.5"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              />
            </Field>
            <Field label="Current price (USD)">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                placeholder="67000"
                value={form.priceUsd}
                onChange={(e) => setForm((f) => ({ ...f, priceUsd: e.target.value }))}
              />
            </Field>
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="primary" onClick={addHolding}>Add holding</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      ) : (
        <Button variant="secondary" onClick={() => setShowForm(true)}>
          <Plus size={15} /> Add holding
        </Button>
      )}

      {holdings.length === 0 && !showForm && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-14 text-center">
          <Bitcoin size={32} className="text-foreground-muted" />
          <p className="font-medium text-foreground">No crypto holdings yet</p>
          <p className="text-sm text-foreground-muted max-w-xs">
            Add your Bitcoin, Ethereum, or any other holdings to track their
            combined value here.
          </p>
        </div>
      )}
    </div>
  );
}
