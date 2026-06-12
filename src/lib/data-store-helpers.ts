import type { UserSnapshot } from "@/types/domain";

export function migrateSnapshot(s: UserSnapshot): UserSnapshot {
  return {
    ...s,
    financial_accounts: s.financial_accounts ?? [],
    transactions: s.transactions ?? [],
  };
}

export function uid() {
  return (
    "id-" +
    Math.random().toString(36).slice(2, 10) +
    Date.now().toString(36)
  );
}

export function removeById<T extends { id: string }>(items: T[], id: string): T[] {
  return items.filter((item) => item.id !== id);
}

export function restoreById<T extends { id: string }>(items: T[], id: string, prev?: T): T[] {
  return prev ? items.map((item) => (item.id === id ? prev : item)) : items;
}

export function appendIfPresent<T>(items: T[], prev?: T): T[] {
  return prev ? [...items, prev] : items;
}
