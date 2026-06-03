/**
 * Plaid client placeholder.
 *
 * Wire this up server-side only. Never import this from a client component.
 *
 * Example (future):
 *   import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
 *
 *   export const plaid = new PlaidApi(
 *     new Configuration({
 *       basePath: PlaidEnvironments[process.env.PLAID_ENV ?? "sandbox"],
 *       baseOptions: {
 *         headers: {
 *           "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
 *           "PLAID-SECRET": process.env.PLAID_SECRET!,
 *         },
 *       },
 *     }),
 *   );
 */
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

export function isPlaidConfigured() {
  return Boolean(
    process.env.PLAID_CLIENT_ID &&
      process.env.PLAID_SECRET &&
      process.env.PLAID_ENV,
  );
}

let _client: PlaidApi | null = null;

export function getPlaidClient(): PlaidApi {
  if (_client) return _client;
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  const env = process.env.PLAID_ENV ?? "sandbox";
  if (!clientId || !secret) {
    throw new Error(
      "Plaid env vars missing. Set PLAID_CLIENT_ID, PLAID_SECRET, and PLAID_ENV in .env.local",
    );
  }
  const envUrl = PlaidEnvironments[env as keyof typeof PlaidEnvironments] ?? PlaidEnvironments.sandbox;
  const config = new Configuration({ basePath: envUrl, baseOptions: { headers: { "PLAID-CLIENT-ID": clientId, "PLAID-SECRET": secret } } });
  _client = new PlaidApi(config);
  return _client;
}

// Keep backward-compat export
export const plaid = null;
