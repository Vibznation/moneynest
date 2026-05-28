/**
 * Plaid: getAccounts (server only).
 *
 * Future implementation:
 *   - Look up the encrypted access_token for the given plaid_item_id.
 *   - Call plaid.accountsGet({ access_token }).
 *   - Upsert each account into public.financial_accounts.
 */
export async function getAccounts(/* plaidItemId: string */): Promise<
  unknown[]
> {
  throw new Error("Plaid integration is not configured yet.");
}
