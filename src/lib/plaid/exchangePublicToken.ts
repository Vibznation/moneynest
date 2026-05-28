/**
 * Plaid: exchangePublicToken (server only).
 *
 * Future implementation:
 *   - Receive public_token from the client after Plaid Link succeeds.
 *   - Call plaid.itemPublicTokenExchange({ public_token }).
 *   - Encrypt the resulting access_token and persist to plaid_items.
 *   - Return only safe metadata (institution_name, item_id) to the client.
 *
 * SECURITY: the access_token must never reach the browser.
 */
export async function exchangePublicToken(/*
  userId: string,
  publicToken: string,
*/): Promise<{ item_id: string; institution_name: string | null }> {
  throw new Error("Plaid integration is not configured yet.");
}
