import { NextResponse } from "next/server";
import { isPlaidConfigured } from "@/lib/plaid/client";
import { createLinkToken } from "@/lib/plaid/createLinkToken";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  if (!isPlaidConfigured()) {
    return NextResponse.json({ error: "Plaid is not configured." }, { status: 503 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    // Prefer the authenticated user's real ID; fall back to client-supplied value
    let userId: string = body.userId ?? "anonymous";
    try {
      const supabase = await getSupabaseServer();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) userId = user.id;
    } catch {
      // auth check failed — use client-supplied userId
    }
    const result = await createLinkToken(userId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
