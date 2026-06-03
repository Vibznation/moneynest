import { NextResponse } from "next/server";
import { isPlaidConfigured, getPlaidClient } from "@/lib/plaid/client";
import { exchangePublicToken } from "@/lib/plaid/exchangePublicToken";
import { encryptToken } from "@/lib/plaid/tokenCrypto";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { FinancialAccountType } from "@/types/domain";

export async function POST(req: Request) {
  if (!isPlaidConfigured()) {
    return NextResponse.json({ error: "Plaid is not configured." }, { status: 503 });
  }
  try {
    const body = await req.json();
    const { public_token } = body as { public_token: string };
    if (!public_token) {
      return NextResponse.json({ error: "public_token is required." }, { status: 400 });
    }

    // Verify the caller is authenticated
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    // Exchange the public token for an access token (server-side only)
    const { item_id, access_token } = await exchangePublicToken(public_token);

    // Require encryption key — do not store plaintext access tokens
    if (!process.env.PLAID_ENCRYPTION_KEY) {
      console.error("[plaid] PLAID_ENCRYPTION_KEY is not set. Token not persisted.");
      return NextResponse.json({ item_id, status: "connected", accounts_imported: 0 });
    }

    const encrypted = encryptToken(access_token);

    // Upsert the Plaid item row
    const { data: plaidItem, error: piErr } = await supabase
      .from("plaid_items")
      .upsert(
        {
          user_id: user.id,
          plaid_item_id: item_id,
          plaid_access_token_encrypted: encrypted,
          status: "active",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "plaid_item_id" },
      )
      .select()
      .single();

    if (piErr || !plaidItem) {
      console.error("[plaid] Failed to upsert plaid_item:", piErr?.message);
      return NextResponse.json({ item_id, status: "connected", accounts_imported: 0 });
    }

    // Fetch accounts from Plaid and import them into financial_accounts
    let accountsImported = 0;
    try {
      const plaid = getPlaidClient();
      const { data: plaidData } = await plaid.accountsGet({ access_token });
      const now = new Date().toISOString();

      const rows = plaidData.accounts.map((a) => ({
        user_id: user.id,
        plaid_item_id: plaidItem.id as string,
        plaid_account_id: a.account_id,
        institution_name: plaidData.item.institution_id ?? null,
        account_name: a.name,
        account_type: mapPlaidType(a.type.toString()) as FinancialAccountType,
        balance: a.balances.current ?? 0,
        currency: a.balances.iso_currency_code ?? "USD",
        source: "plaid" as const,
        status: "connected" as const,
        include_in_safe_to_spend: ["checking", "savings"].includes(
          mapPlaidType(a.type.toString()),
        ),
        last_synced_at: now,
        updated_at: now,
      }));

      const { error: faErr } = await supabase
        .from("financial_accounts")
        .upsert(rows, { onConflict: "plaid_account_id", ignoreDuplicates: false });

      if (!faErr) accountsImported = rows.length;
      else console.error("[plaid] Account import error:", faErr.message);
    } catch (err) {
      console.error("[plaid] Account import failed:", err);
    }

    return NextResponse.json({ item_id, status: "connected", accounts_imported: accountsImported });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function mapPlaidType(plaidType: string): string {
  switch (plaidType) {
    case "depository": return "checking";
    case "credit": return "credit_card";
    case "loan": return "loan";
    case "investment": return "savings";
    default: return "other";
  }
}
