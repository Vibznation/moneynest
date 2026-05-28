/**
 * Plaid: getTransactions (server only).
 *
 * Future implementation:
 *   - Use plaid.transactionsSync({ access_token, cursor }) for incremental sync.
 *   - Upsert into public.transactions with source = 'plaid'.
 */
export async function getTransactions(/* plaidItemId: string */): Promise<
  unknown[]
> {
  throw new Error("Plaid integration is not configured yet.");
}
