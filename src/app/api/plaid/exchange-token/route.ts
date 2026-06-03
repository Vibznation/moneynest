import { NextResponse } from "next/server";
import { isPlaidConfigured } from "@/lib/plaid/client";
import { exchangePublicToken } from "@/lib/plaid/exchangePublicToken";

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
    // Exchange the token server-side — access_token is NOT returned to the client
    const { item_id, access_token } = await exchangePublicToken(public_token);
    // TODO: persist access_token encrypted in Supabase plaid_items table
    // For now log on server only; never send access_token to client
    console.log("[plaid] item_id:", item_id, "access_token length:", access_token.length);
    return NextResponse.json({ item_id, status: "connected" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
