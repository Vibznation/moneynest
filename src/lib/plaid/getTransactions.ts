import type { SupabaseClient } from "@supabase/supabase-js";
import { getPlaidClient } from "./client";
import { decryptToken } from "./tokenCrypto";

export interface PlaidTransactionRow {
  user_id: string;
  financial_account_id: string;
  plaid_transaction_id: string;
  name: string;
  merchant_name: string | null;
  amount: number;
  category: string | null;
  transaction_date: string;
  pending: boolean;
  source: "plaid";
}

/**
 * Syncs transactions for a Plaid item using transactionsSync (cursor-based).
 * Upserts into public.transactions by plaid_transaction_id.
 * Returns the number of transactions upserted.
 */
export async function syncTransactions(
  supabase: SupabaseClient,
  plaidItemId: string,
  userId: string,
): Promise<number> {
  const { data: item, error: itemErr } = await supabase
    .from("plaid_items")
    .select("plaid_access_token_encrypted")
    .eq("id", plaidItemId)
    .eq("user_id", userId)
    .single();
  if (itemErr || !item) throw new Error("Plaid item not found.");

  const access_token = decryptToken(item.plaid_access_token_encrypted as string);
  const plaid = getPlaidClient();

  // Fetch account-id → financial_account.id map for this item
  const { data: faRows } = await supabase
    .from("financial_accounts")
    .select("id, plaid_account_id")
    .eq("plaid_item_id", plaidItemId)
    .eq("user_id", userId);

  const accountMap = new Map<string, string>(
    (faRows ?? []).map((r) => [r.plaid_account_id as string, r.id as string]),
  );

  // Pull up to 90 days of transactions (initial sync)
  const added: PlaidTransactionRow[] = [];
  let cursor: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const res = await plaid.transactionsSync({
      access_token,
      ...(cursor ? { cursor } : {}),
    });
    const { added: batch, next_cursor, has_more } = res.data;

    for (const t of batch) {
      const faId = accountMap.get(t.account_id);
      if (!faId) continue;
      added.push({
        user_id: userId,
        financial_account_id: faId,
        plaid_transaction_id: t.transaction_id,
        name: t.name,
        merchant_name: t.merchant_name ?? null,
        // Plaid amounts: positive = debit (money out), so we store as-is
        amount: t.amount,
        category: t.personal_finance_category?.primary ?? (t.category?.[0] ?? null),
        transaction_date: t.date,
        pending: t.pending,
        source: "plaid" as const,
      });
    }
    cursor = next_cursor;
    hasMore = has_more;

    // Safety cap for initial sync
    if (added.length >= 500) break;
  }

  if (added.length === 0) return 0;

  const { error } = await supabase
    .from("transactions")
    .upsert(added, { onConflict: "plaid_transaction_id", ignoreDuplicates: false });

  if (error) throw new Error(`Transaction upsert failed: ${error.message}`);
  return added.length;
}
