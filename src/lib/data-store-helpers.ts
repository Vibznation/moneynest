import type { UserSnapshot } from "@/types/domain";

export function migrateSnapshot(s: UserSnapshot): UserSnapshot {
  return {
    ...s,
    financial_accounts: s.financial_accounts ?? [],
    transactions: s.transactions ?? [],
    // Backfill new nullable Profile fields added in v1.1 so old cached snapshots
    // don't send `undefined` to Supabase upserts.
    profile: s.profile
      ? {
          ...s.profile,
          phone: s.profile.phone ?? null,
          phone_country_code: s.profile.phone_country_code ?? "+1",
          date_of_birth: s.profile.date_of_birth ?? null,
          city: s.profile.city ?? null,
          state: s.profile.state ?? null,
          country: s.profile.country ?? "US",
          zip: s.profile.zip ?? null,
          gender: s.profile.gender ?? null,
          occupation: s.profile.occupation ?? null,
          annual_income_range: s.profile.annual_income_range ?? null,
          marketing_source: s.profile.marketing_source ?? null,
        }
      : s.profile,
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
