import { getPlaidClient } from "./client";

/**
 * Exchange a Plaid public_token for an access_token.
 * SECURITY: the access_token must NEVER be returned to the browser.
 * Store it server-side (e.g., encrypted in Supabase `plaid_items`).
 */
export async function exchangePublicToken(
  publicToken: string,
): Promise<{ item_id: string; access_token: string }> {
  const client = getPlaidClient();
  const res = await client.itemPublicTokenExchange({ public_token: publicToken });
  return { item_id: res.data.item_id, access_token: res.data.access_token };
}
