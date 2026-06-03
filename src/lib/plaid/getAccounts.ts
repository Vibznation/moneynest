import type { SupabaseClient } from "@supabase/supabase-js";
import { getPlaidClient } from "./client";
import { decryptToken } from "./tokenCrypto";

export interface PlaidAccountSummary {
  plaid_account_id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

/**
 * Fetches accounts for a linked Plaid item.
 * Server-only — requires the Supabase server client so RLS applies.
 */
export async function getAccounts(
  supabase: SupabaseClient,
  plaidItemId: string,
): Promise<PlaidAccountSummary[]> {
  const { data: item, error } = await supabase
    .from("plaid_items")
    .select("plaid_access_token_encrypted")
    .eq("id", plaidItemId)
    .single();
  if (error || !item) throw new Error("Plaid item not found or access denied.");

  const access_token = decryptToken(item.plaid_access_token_encrypted as string);
  const plaid = getPlaidClient();
  const { data } = await plaid.accountsGet({ access_token });

  return data.accounts.map((a) => ({
    plaid_account_id: a.account_id,
    name: a.name,
    type: a.type.toString(),
    balance: a.balances.current ?? 0,
    currency: a.balances.iso_currency_code ?? "USD",
  }));
}
