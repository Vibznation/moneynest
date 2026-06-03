import { NextResponse } from "next/server";
import { isPlaidConfigured } from "@/lib/plaid/client";
import { createLinkToken } from "@/lib/plaid/createLinkToken";

export async function POST(req: Request) {
  if (!isPlaidConfigured()) {
    return NextResponse.json({ error: "Plaid is not configured." }, { status: 503 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const userId: string = body.userId ?? "anonymous";
    const result = await createLinkToken(userId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
