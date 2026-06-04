// POST /api/billing/verify
// Validates a Google Play purchase token server-side, then grants the entitlement
// in Supabase. Called from the mobile client (Phase 2 Android integration).
//
// Security requirements:
//   - Authenticate user via Supabase JWT in Authorization header
//   - Validate purchase_token against Google Play Developer API before granting
//   - Never trust client-supplied plan claims — derive plan from product_id
//   - Rate-limit: 10 requests / minute per user (add middleware in production)

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Maps Google Play product IDs → entitlement types
const PRODUCT_ENTITLEMENT: Record<string, string> = {
  dueviq_plus_monthly: "plus_personal",
  dueviq_plus_annual: "plus_personal",
  dueviq_business_monthly: "business",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { purchase_token, product_id } = body as {
      purchase_token?: string;
      product_id?: string;
    };

    if (!purchase_token || !product_id) {
      return NextResponse.json(
        { error: "purchase_token and product_id are required" },
        { status: 400 },
      );
    }

    const entitlementType = PRODUCT_ENTITLEMENT[product_id];
    if (!entitlementType) {
      return NextResponse.json(
        { error: "Unknown product_id" },
        { status: 400 },
      );
    }

    // ── Authenticate the user via Supabase SSR client ─────────────────────
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (toSet) => {
            toSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      },
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Google Play validation (Phase 2 TODO) ────────────────────────────
    // Replace this block with a real call to the Google Play Developer API:
    //
    //   const googleResult = await verifyGooglePlayPurchase({
    //     packageName: process.env.GOOGLE_PLAY_PACKAGE_NAME!,
    //     productId: product_id,
    //     purchaseToken: purchase_token,
    //     serviceAccountKey: process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY!,
    //   });
    //   if (!googleResult.valid) {
    //     return NextResponse.json({ error: "Invalid purchase" }, { status: 402 });
    //   }
    //
    // For Phase 2, return a placeholder success so the client can test the flow:
    const isValid = true; // TODO: replace with real Google Play validation
    if (!isValid) {
      return NextResponse.json({ error: "Purchase validation failed" }, { status: 402 });
    }

    // ── Use service_role client to write entitlement ──────────────────────
    // The browser anon key cannot write to entitlements (no insert policy).
    // We need the service_role key here. Add SUPABASE_SERVICE_ROLE_KEY to env.
    const serviceSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
      },
    );

    // Upsert user_subscriptions row
    await serviceSupabase.from("user_subscriptions").upsert(
      {
        user_id: user.id,
        plan_type: entitlementType,
        product_id,
        purchase_token,
        platform: "google_play",
        status: "active",
        start_date: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    // Upsert entitlement row
    await serviceSupabase.from("entitlements").upsert(
      {
        user_id: user.id,
        entitlement_type: entitlementType,
        active: true,
        expires_at: null, // subscription expiry managed via webhook
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    return NextResponse.json({ success: true, entitlement: entitlementType });
  } catch (err) {
    console.error("[billing/verify]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
