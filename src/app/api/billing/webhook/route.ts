// POST /api/billing/webhook
// Google Play Real-Time Developer Notifications (RTDN) webhook.
// Google sends subscription lifecycle events here (renewal, cancellation, etc.).
//
// Security:
//   - Verify the Pub/Sub push notification with GOOGLE_PUBSUB_PUSH_SECRET
//   - Only accept POST from Google's Pub/Sub IPs (add Cloud Armor / middleware in prod)
//   - Use service_role key to write to Supabase — never exposed to browser
//
// Setup: https://developer.android.com/google/play/billing/rtdn-reference

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

interface PubSubMessage {
  data: string; // base64-encoded JSON
  messageId: string;
}

interface PubSubBody {
  message: PubSubMessage;
  subscription: string;
}

type NotificationType =
  | "SUBSCRIPTION_RECOVERED"
  | "SUBSCRIPTION_RENEWED"
  | "SUBSCRIPTION_CANCELED"
  | "SUBSCRIPTION_PURCHASED"
  | "SUBSCRIPTION_ON_HOLD"
  | "SUBSCRIPTION_IN_GRACE_PERIOD"
  | "SUBSCRIPTION_RESTARTED"
  | "SUBSCRIPTION_PRICE_CHANGE_CONFIRMED"
  | "SUBSCRIPTION_DEFERRED"
  | "SUBSCRIPTION_PAUSED"
  | "SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED"
  | "SUBSCRIPTION_REVOKED"
  | "SUBSCRIPTION_EXPIRED";

const ACTIVE_NOTIFICATIONS: NotificationType[] = [
  "SUBSCRIPTION_RECOVERED",
  "SUBSCRIPTION_RENEWED",
  "SUBSCRIPTION_PURCHASED",
  "SUBSCRIPTION_RESTARTED",
  "SUBSCRIPTION_IN_GRACE_PERIOD",
];

const INACTIVE_NOTIFICATIONS: NotificationType[] = [
  "SUBSCRIPTION_CANCELED",
  "SUBSCRIPTION_ON_HOLD",
  "SUBSCRIPTION_PAUSED",
  "SUBSCRIPTION_REVOKED",
  "SUBSCRIPTION_EXPIRED",
];

export async function POST(req: NextRequest) {
  try {
    // ── Verify shared secret ──────────────────────────────────────────────
    const secret = req.nextUrl.searchParams.get("secret");
    if (
      process.env.GOOGLE_PUBSUB_PUSH_SECRET &&
      secret !== process.env.GOOGLE_PUBSUB_PUSH_SECRET
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as PubSubBody;
    const rawData = Buffer.from(body.message.data, "base64").toString("utf-8");
    const notification = JSON.parse(rawData) as {
      packageName: string;
      eventTimeMillis: string;
      subscriptionNotification?: {
        notificationType: number;
        purchaseToken: string;
        subscriptionId: string;
      };
    };

    const sub = notification.subscriptionNotification;
    if (!sub) {
      // Not a subscription notification (e.g., one-time product) — ACK and ignore
      return NextResponse.json({ received: true });
    }

    // Map numeric type to string
    const typeMap: Record<number, NotificationType> = {
      1: "SUBSCRIPTION_RECOVERED",
      2: "SUBSCRIPTION_RENEWED",
      3: "SUBSCRIPTION_CANCELED",
      4: "SUBSCRIPTION_PURCHASED",
      5: "SUBSCRIPTION_ON_HOLD",
      6: "SUBSCRIPTION_IN_GRACE_PERIOD",
      7: "SUBSCRIPTION_RESTARTED",
      8: "SUBSCRIPTION_PRICE_CHANGE_CONFIRMED",
      9: "SUBSCRIPTION_DEFERRED",
      10: "SUBSCRIPTION_PAUSED",
      11: "SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED",
      12: "SUBSCRIPTION_REVOKED",
      13: "SUBSCRIPTION_EXPIRED",
    };
    const notificationType = typeMap[sub.notificationType];

    const serviceSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: { getAll: () => [], setAll: () => {} },
      },
    );

    // Find the user by purchase_token
    const { data: subRow } = await serviceSupabase
      .from("user_subscriptions")
      .select("user_id")
      .eq("purchase_token", sub.purchaseToken)
      .maybeSingle();

    if (!subRow) {
      // Unknown token — ACK anyway so Google doesn't retry
      return NextResponse.json({ received: true });
    }

    const isActive = ACTIVE_NOTIFICATIONS.includes(notificationType);
    const isInactive = INACTIVE_NOTIFICATIONS.includes(notificationType);

    if (isActive) {
      await serviceSupabase
        .from("user_subscriptions")
        .update({ status: "active", updated_at: new Date().toISOString() })
        .eq("purchase_token", sub.purchaseToken);

      await serviceSupabase
        .from("entitlements")
        .update({ active: true, updated_at: new Date().toISOString() })
        .eq("user_id", subRow.user_id);
    } else if (isInactive) {
      await serviceSupabase
        .from("user_subscriptions")
        .update({
          status: notificationType === "SUBSCRIPTION_EXPIRED" ? "expired" : "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("purchase_token", sub.purchaseToken);

      await serviceSupabase
        .from("entitlements")
        .update({
          active: false,
          expires_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", subRow.user_id);
    }

    // Always ACK with 200 — Google will retry on non-2xx
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[billing/webhook]", err);
    // Still return 200 to prevent Google from retrying a malformed payload
    return NextResponse.json({ received: true });
  }
}
