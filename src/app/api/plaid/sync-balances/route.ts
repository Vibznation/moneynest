import { NextResponse } from "next/server";
import { isPlaidConfigured } from "@/lib/plaid/client";
import { getBalances } from "@/lib/plaid/getBalances";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * POST /api/plaid/sync-balances
 * Body: { plaid_item_id: string }
 *
 * Fetches real-time balances from Plaid and updates financial_accounts.balance.
 */
export async function POST(req: Request) {
  if (!isPlaidConfigured()) {
    return NextResponse.json({ error: "Plaid is not configured." }, { status: 503 });
  }
  try {
    const body = await req.json();
    const { plaid_item_id } = body as { plaid_item_id: string };
    if (!plaid_item_id) {
      return NextResponse.json({ error: "plaid_item_id is required." }, { status: 400 });
    }

    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const balances = await getBalances(supabase, plaid_item_id);
    const now = new Date().toISOString();

    // Update each account's balance
    await Promise.all(
      balances.map((b) =>
        supabase
          .from("financial_accounts")
          .update({ balance: b.balance, last_synced_at: now, updated_at: now })
          .eq("plaid_account_id", b.plaid_account_id)
          .eq("user_id", user.id),
      ),
    );

    return NextResponse.json({ updated: balances.length, balances });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
