"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Plus, Trash2, Tag, Receipt } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useData } from "@/lib/data-store";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { PremiumGate } from "@/components/plus/PremiumGate";
import { formatCurrency } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

type DeductionCategory =
  | "Business Expense"
  | "Home Office"
  | "Vehicle / Mileage"
  | "Medical"
  | "Charitable"
  | "Education"
  | "Other";

const DEDUCTION_CATEGORIES: DeductionCategory[] = [
  "Business Expense",
  "Home Office",
  "Vehicle / Mileage",
  "Medical",
  "Charitable",
  "Education",
  "Other",
];

interface TaxEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: DeductionCategory;
  notes: string;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TaxOrganizerPage() {
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
          Tax Organizer
        </h1>
        <p className="mt-1 text-foreground-muted">
          Tag expenses as tax-relevant and export a clean summary for your accountant.
        </p>
      </header>
      <PremiumGate
        feature="tax_organizer"
        planLabel="Dueviq Business"
        title="Tax Organizer"
        description="Upgrade to Dueviq Business to organize tax-relevant expenses and generate export-ready reports."
      >
        <TaxOrganizerContent />
      </PremiumGate>
    </div>
  );
}

// ── Content ───────────────────────────────────────────────────────────────────

function TaxOrganizerContent() {
  const { snapshot } = useData();
  const currency = snapshot.settings?.currency ?? "USD";

  const [entries, setEntries] = useState<TaxEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<TaxEntry, "id">>({
    date: format(new Date(), "yyyy-MM-dd"),
    description: "",
    amount: 0,
    category: "Business Expense",
    notes: "",
  });
  const [filterCat, setFilterCat] = useState<DeductionCategory | "All">("All");
  const [filterYear, setFilterYear] = useState<string>(
    new Date().getFullYear().toString(),
  );

  // Derive year options from entries + current year
  const yearOptions = useMemo(() => {
    const years = new Set<string>([new Date().getFullYear().toString()]);
    entries.forEach((e) => years.add(e.date.slice(0, 4)));
    return [...years].sort().reverse();
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const yearMatch = e.date.startsWith(filterYear);
      const catMatch = filterCat === "All" || e.category === filterCat;
      return yearMatch && catMatch;
    });
  }, [entries, filterYear, filterCat]);

  const totalByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((e) => {
      map[e.category] = (map[e.category] ?? 0) + e.amount;
    });
    return map;
  }, [filtered]);

  const grandTotal = filtered.reduce((s, e) => s + e.amount, 0);

  function addEntry() {
    if (!form.description.trim() || form.amount <= 0) return;
    setEntries((prev) => [
      { id: crypto.randomUUID(), ...form },
      ...prev,
    ]);
    setForm({
      date: format(new Date(), "yyyy-MM-dd"),
      description: "",
      amount: 0,
      category: "Business Expense",
      notes: "",
    });
    setShowForm(false);
  }

  function handleExport() {
    const header = "Date,Description,Category,Amount,Notes\n";
    const rows = filtered
      .map(
        (e) =>
          `"${e.date}","${e.description.replace(/"/g, '""')}","${e.category}","${e.amount.toFixed(2)}","${e.notes.replace(/"/g, '""')}"`,
      )
      .join("\n");
    const csv = header + rows;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dueviq-tax-${filterYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Disclaimer */}
      <p className="text-xs text-foreground-muted bg-surface-muted rounded-xl px-4 py-2">
        Tax Organizer is a personal tracking tool. It does not file taxes or
        provide tax advice. Consult a qualified tax professional for filing
        assistance.
      </p>

      {/* Filters + export */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex gap-2">
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={filterCat}
            onChange={(e) =>
              setFilterCat(e.target.value as DeductionCategory | "All")
            }
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground"
          >
            <option value="All">All categories</option>
            {DEDUCTION_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        {filtered.length > 0 && (
          <Button variant="secondary" onClick={handleExport}>
            <Download size={14} /> Export CSV
          </Button>
        )}
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Plus size={14} /> Add entry
        </Button>
      </div>

      {/* Summary tiles */}
      {filtered.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-accent-soft border-accent-soft">
            <p className="text-xs text-foreground-muted">Total deductible</p>
            <p className="mt-1 text-2xl font-bold text-accent">
              {formatCurrency(grandTotal, currency)}
            </p>
            <p className="text-xs text-foreground-muted">{filtered.length} entries · {filterYear}</p>
          </Card>
          {Object.entries(totalByCategory).map(([cat, total]) => (
            <Card key={cat}>
              <p className="text-xs text-foreground-muted truncate">{cat}</p>
              <p className="mt-1 text-xl font-semibold">
                {formatCurrency(total, currency)}
              </p>
              <p className="text-xs text-foreground-muted">
                {filtered.filter((e) => e.category === cat).length} entries
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <Card>
          <CardTitle>New tax entry</CardTitle>
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
                value={form.amount || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))
                }
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description">
                <Input
                  placeholder="e.g. Office supplies from Amazon"
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
                  setForm((f) => ({
                    ...f,
                    category: e.target.value as DeductionCategory,
                  }))
                }
              >
                {DEDUCTION_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Notes (optional)">
              <Input
                placeholder="Receipt ref, vendor, etc."
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </Field>
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="primary" onClick={addEntry}>
              Save entry
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Entries list */}
      {filtered.length > 0 ? (
        <Card>
          <CardTitle>
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"} · {filterYear}
          </CardTitle>
          <div className="mt-4 divide-y divide-border">
            {filtered.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 py-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-muted">
                  <Tag size={14} className="text-foreground-muted" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium truncate">{entry.description}</p>
                    <Badge tone="neutral">{entry.category}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-foreground-muted">
                    {format(parseISO(entry.date), "MMM d, yyyy")}
                    {entry.notes ? ` · ${entry.notes}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold">
                    {formatCurrency(entry.amount, currency)}
                  </p>
                  <button
                    onClick={() =>
                      setEntries((prev) => prev.filter((e) => e.id !== entry.id))
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
            <Receipt size={32} className="text-foreground-muted" />
            <p className="font-medium text-foreground">No tax entries yet</p>
            <p className="text-sm text-foreground-muted max-w-xs">
              Add expenses you want to track for tax purposes. Filter by year and category, then export to CSV.
            </p>
          </div>
        )
      )}
    </div>
  );
}
