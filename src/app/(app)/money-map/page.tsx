"use client";

import { useMemo } from "react";
import { useData } from "@/lib/data-store";
import { buildMoneyMap } from "@/lib/calculations";
import { Card, CardTitle, CardValue } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";

/** Pure-SVG donut chart — no library needed */
function DonutChart({
  slices,
  size = 160,
}: {
  slices: { value: number; color: string; label: string }[];
  size?: number;
}) {
  const r = 54;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const total = slices.reduce((s, sl) => s + sl.value, 0) || 1;

  let offset = 0;
  const arcs = slices.map((sl) => {
    const pct = sl.value / total;
    const dash = pct * circ;
    const arc = { ...sl, dash, gap: circ - dash, offset };
    offset += dash;
    return arc;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth={20}
          strokeDasharray={`${arc.dash} ${arc.gap}`}
          strokeDashoffset={-arc.offset + circ / 4}
          style={{ transform: `rotate(-90deg)`, transformOrigin: `${cx}px ${cy}px` }}
        />
      ))}
      <circle cx={cx} cy={cy} r={34} fill="var(--color-background)" />
    </svg>
  );
}

export default function MoneyMapPage() {
  const { snapshot } = useData();
  const currency = snapshot.settings?.currency ?? "USD";
  const map = useMemo(() => buildMoneyMap(snapshot), [snapshot]);

  const insight =
    map.fixedRatio < 0.5
      ? "You have room to breathe."
      : map.fixedRatio < 0.75
        ? "Your fixed expenses are notable. Keep an eye on them."
        : "Your bills are close to your income. Look for easy cuts.";

  const insightTone =
    map.fixedRatio < 0.5
      ? "bg-accent-soft"
      : map.fixedRatio < 0.75
        ? "bg-warning-soft"
        : "bg-danger-soft";

  const rows = [
    { label: "Bills", value: map.bills, color: "var(--color-primary)" },
    {
      label: "Subscriptions",
      value: map.subscriptions,
      color: "var(--color-info)",
    },
    { label: "Goals", value: map.goals, color: "var(--color-accent)" },
    {
      label: "Leftover",
      value: Math.max(0, map.leftover),
      color: "var(--color-warning)",
    },
  ];
  const total = rows.reduce((s, r) => s + r.value, 0) || 1;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Money Map</h1>
        <p className="text-sm text-foreground-muted">
          Where your money goes each month, at a glance.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardTitle>Monthly income</CardTitle>
          <CardValue className="text-accent">
            {formatCurrency(map.income, currency)}
          </CardValue>
        </Card>
        <Card>
          <CardTitle>Monthly leftover</CardTitle>
          <CardValue className={map.leftover < 0 ? "text-danger" : ""}>
            {formatCurrency(map.leftover, currency)}
          </CardValue>
          <p className="mt-1 text-xs text-foreground-muted">
            Fixed expenses: {Math.round(map.fixedRatio * 100)}% of income
          </p>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardTitle>Assets</CardTitle>
          <ul className="mt-3 divide-y divide-border">
            <li className="flex items-center justify-between py-2.5 text-sm">
              <span>Checking / Cash</span>
              <span className="tabular font-medium">
                {formatCurrency(map.assets.available, currency)}
              </span>
            </li>
            <li className="flex items-center justify-between py-2.5 text-sm">
              <span>Savings</span>
              <span className="tabular font-medium">
                {formatCurrency(map.assets.savings, currency)}
              </span>
            </li>
            <li className="flex items-center justify-between pt-3 text-sm font-semibold">
              <span>Total assets</span>
              <span className="tabular">
                {formatCurrency(map.assets.total, currency)}
              </span>
            </li>
          </ul>
        </Card>
        <Card>
          <CardTitle>Liabilities</CardTitle>
          <ul className="mt-3 divide-y divide-border">
            <li className="flex items-center justify-between py-2.5 text-sm">
              <span>Credit cards</span>
              <span className="tabular font-medium">
                {formatCurrency(map.liabilities.credit, currency)}
              </span>
            </li>
            <li className="flex items-center justify-between py-2.5 text-sm">
              <span>Loans</span>
              <span className="tabular font-medium">
                {formatCurrency(map.liabilities.loans, currency)}
              </span>
            </li>
            <li className="flex items-center justify-between pt-3 text-sm font-semibold">
              <span>Net position</span>
              <span
                className={`tabular ${map.net < 0 ? "text-danger" : ""}`}
              >
                {formatCurrency(map.net, currency)}
              </span>
            </li>
          </ul>
        </Card>
      </div>

      <Card>
        <CardTitle>Where it goes</CardTitle>
        {/* Donut chart + legend */}
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-6">
          <DonutChart slices={rows} size={160} />
          <ul className="flex-1 divide-y divide-border w-full">
            {rows.map((r) => (
              <li key={r.label} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ background: r.color }}
                  />
                  <span className="text-sm">{r.label}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-foreground-muted">{Math.round((r.value / total) * 100)}%</span>
                  <span className="font-medium tabular-nums">{formatCurrency(r.value, currency)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        {/* Stacked bar */}
        <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-surface-muted">
          {rows.map((r) => (
            <div
              key={r.label}
              style={{
                width: `${(r.value / total) * 100}%`,
                background: r.color,
              }}
            />
          ))}
        </div>
      </Card>

      <Card className={`${insightTone} border-transparent`}>
        <CardTitle>Insight</CardTitle>
        <p className="mt-2 text-foreground">{insight}</p>
      </Card>
    </div>
  );
}
