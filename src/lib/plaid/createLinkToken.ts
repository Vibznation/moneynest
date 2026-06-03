import { CountryCode, Products } from "plaid";
import { getPlaidClient } from "./client";

export async function createLinkToken(userId: string): Promise<{ link_token: string }> {
  const client = getPlaidClient();
  const res = await client.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: "MoneyNest",
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: "en",
  });
  return { link_token: res.data.link_token };
}
