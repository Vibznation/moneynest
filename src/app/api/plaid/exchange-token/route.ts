import { CountryCode } from "plaid";
import { NextResponse } from "next/server";
import { isPlaidConfigured, getPlaidClient } from "@/lib/plaid/client";
import { exchangePublicToken } from "@/lib/plaid/exchangePublicToken";
import { encryptToken } from "@/lib/plaid/tokenCrypto";
import { syncTransactions } from "@/lib/plaid/getTransactions";
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

    // Fetch accounts + institution name from Plaid and import them
    let accountsImported = 0;
    try {
      const plaid = getPlaidClient();
      const [accountsRes, itemRes] = await Promise.all([
        plaid.accountsGet({ access_token }),
        plaid.itemGet({ access_token }),
      ]);
      const plaidData = accountsRes.data;
      const institutionId = itemRes.data.item.institution_id ?? null;

      // Resolve human-readable institution name (best-effort)
      let institutionName: string | null = institutionId;
      if (institutionId) {
        try {
          const instRes = await plaid.institutionsGetById({
            institution_id: institutionId,
            country_codes: [CountryCode.Us],
            options: { include_optional_metadata: false },
          });
          institutionName = instRes.data.institution.name;
          // Also back-fill the plaid_items row with the human name
          await supabase
            .from("plaid_items")
            .update({ institution_name: institutionName })
            .eq("id", plaidItem.id as string);
        } catch {
          /* non-critical — name stays as ID */
        }
      }

      const now = new Date().toISOString();
      const rows = plaidData.accounts.map((account) => {
        const accountType = mapPlaidType(
          account.type.toString(),
          account.subtype?.toString() ?? null,
        ) as FinancialAccountType;

        return {
          user_id: user.id,
          plaid_item_id: plaidItem.id as string,
          plaid_account_id: account.account_id,
          institution_name: institutionName,
          account_name: account.name,
          account_type: accountType,
          balance: account.balances.current ?? account.balances.available ?? 0,
          currency: account.balances.iso_currency_code ?? "USD",
          source: "plaid" as const,
          status: "connected" as const,
          include_in_safe_to_spend: accountType === "checking",
          last_synced_at: now,
          updated_at: now,
          created_at: now,
        };
      });

      if (rows.length === 0) throw new Error("Plaid returned no accounts for this item.");

      // Delete stale accounts for this item (re-link after disconnect), then insert fresh
      const { error: deleteErr } = await supabase
        .from("financial_accounts")
        .delete()
        .eq("plaid_item_id", plaidItem.id as string)
        .eq("user_id", user.id);
      if (deleteErr) throw new Error(`Account cleanup error: ${deleteErr.message}`);

      const { error: faErr } = await supabase
        .from("financial_accounts")
        .insert(rows);

      if (faErr) throw new Error(`Account import error: ${faErr.message}`);
      accountsImported = rows.length;

      // Sync transactions (best-effort — failure doesn't block the response)
      if (!faErr && rows.length > 0) {
        try {
          await syncTransactions(supabase, plaidItem.id as string, user.id);
        } catch (txErr) {
          console.error("[plaid] Transaction sync failed:", txErr);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Account import failed.";
      console.error("[plaid] Account import failed:", err);
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({ item_id, status: "connected", accounts_imported: accountsImported });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function mapPlaidType(plaidType: string, plaidSubtype?: string | null): string {
  switch (plaidType) {
    case "depository": {
      if (["savings", "cd", "money market"].includes(plaidSubtype ?? "")) return "savings";
      return "checking";
    }
    case "credit": return "credit_card";
    case "loan": return "loan";
    case "investment": return "other";
    default: return "other";
  }
}
