/**
 * Plaid: getBalances (server only).
 *
 * Future implementation:
 *   - Call plaid.accountsBalanceGet({ access_token }).
 *   - Update financial_accounts.balance and last_synced_at.
 */
export async function getBalances(/* plaidItemId: string */): Promise<
  unknown[]
> {
  throw new Error("Plaid integration is not configured yet.");
}
