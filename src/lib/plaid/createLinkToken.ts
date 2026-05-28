/**
 * Plaid: createLinkToken (server only).
 *
 * Future implementation:
 *   - Authenticate the request (Supabase session).
 *   - Call plaid.linkTokenCreate({ user: { client_user_id }, ... }).
 *   - Return { link_token } to the client.
 *   - Never expose any access_token.
 */
export async function createLinkToken(/* userId: string */): Promise<{
  link_token: string;
}> {
  throw new Error("Plaid integration is not configured yet.");
}
