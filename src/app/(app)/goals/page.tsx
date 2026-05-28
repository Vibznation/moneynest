"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useData } from "@/lib/data-store";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Progress } from "@/components/ui/Progress";
import { EmptyState } from "@/components/ui/EmptyState";
import { GOAL_CATEGORIES } from "@/lib/constants";
import type { Goal, GoalCategory } from "@/types/domain";
import { formatCurrency } from "@/lib/utils";

function encouragement(pct: number) {
  if (pct >= 100) return "Goal reached. Celebrate it.";
  if (pct >= 75) return "Almost there. Keep your pace.";
  if (pct >= 50) return "Halfway. You are building peace.";
  if (pct >= 25) return "Good momentum. Stay consistent.";
  return "Every contribution counts. Start small.";
}

export default function GoalsPage() {
  const { snapshot, addGoal, updateGoal, deleteGoal } = useData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const currency = snapshot.settings?.currency ?? "USD";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>
          <p className="text-sm text-foreground-muted">
            Save toward what matters. One step at a time.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus size={16} /> Add goal
        </Button>
      </header>

      {snapshot.goals.length === 0 ? (
        <EmptyState
          title="No goals yet"
          description="Set your first savings goal — even small ones add up."
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus size={16} /> Add goal
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {snapshot.goals.map((g) => {
            const pct = g.target_amount
              ? Math.min(100, (g.current_amount / g.target_amount) * 100)
              : 0;
            return (
              <Card key={g.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{g.category}</CardTitle>
                    <p className="text-lg font-semibold mt-1">{g.name}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditing(g);
                        setOpen(true);
                      }}
                      className="p-1.5 rounded-lg hover:bg-surface-muted text-foreground-muted"
                      aria-label="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => deleteGoal(g.id)}
                      className="p-1.5 rounded-lg hover:bg-danger-soft text-foreground-muted"
                      aria-label="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-foreground-muted">
                  {formatCurrency(g.current_amount, currency)} saved of{" "}
                  {formatCurrency(g.target_amount, currency)}
                </p>
                <Progress value={pct} className="mt-2" />
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-semibold">{Math.round(pct)}% complete</span>
                  <span className="text-foreground-muted">
                    {formatCurrency(g.monthly_target, currency)}/mo target
                  </span>
                </div>
                <p className="mt-3 text-sm text-foreground">{encouragement(pct)}</p>
              </Card>
            );
          })}
        </div>
      )}

      <GoalModal
        open={open}
        onClose={() => setOpen(false)}
        initial={editing}
        onSubmit={(data) => {
          if (editing) updateGoal(editing.id, data);
          else addGoal(data);
          setOpen(false);
        }}
      />
    </div>
  );
}

function GoalModal({
  open,
  onClose,
  initial,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  initial: Goal | null;
  onSubmit: (data: Omit<Goal, "id" | "user_id" | "created_at">) => void;
}) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [monthly, setMonthly] = useState("");
  const [category, setCategory] = useState<GoalCategory>("Emergency Fund");

  useEffect(() => {
    setName(initial?.name ?? "");
    setTarget(initial?.target_amount?.toString() ?? "");
    setCurrent(initial?.current_amount?.toString() ?? "0");
    setMonthly(initial?.monthly_target?.toString() ?? "");
    setCategory(initial?.category ?? "Emergency Fund");
  }, [initial, open]);

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit goal" : "Add goal"}>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name || !target) return;
          onSubmit({
            name,
            target_amount: parseFloat(target),
            current_amount: parseFloat(current || "0"),
            monthly_target: parseFloat(monthly || "0"),
            category,
          });
        }}
      >
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Category">
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value as GoalCategory)}
          >
            {GOAL_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Target">
            <Input
              type="number"
              step="0.01"
              min={0}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              required
            />
          </Field>
          <Field label="Saved">
            <Input
              type="number"
              step="0.01"
              min={0}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </Field>
          <Field label="Monthly">
            <Input
              type="number"
              step="0.01"
              min={0}
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{initial ? "Save" : "Add goal"}</Button>
        </div>
      </form>
    </Modal>
  );
}
