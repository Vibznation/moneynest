import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { CONSENT_TEXT, CONSENT_VERSION } from "@/lib/constants";
import type { ConsentSource, ConsentType } from "@/types/domain";

function getClientIP(req: NextRequest): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null
  );
}

// ── POST /api/consent ─────────────────────────────────────────────────────────
// Upserts one or more consent choices for the authenticated user.
// Body: { consents: Array<{ consentType, granted, source? }> }
// The DB trigger (log_consent_audit) automatically writes to consent_audit.
export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const body = await req.json() as {
      consents: Array<{
        consentType: ConsentType;
        granted: boolean;
        source?: ConsentSource;
      }>;
    };

    if (!Array.isArray(body.consents) || body.consents.length === 0) {
      return NextResponse.json({ error: "consents array is required" }, { status: 400 });
    }

    const ip = getClientIP(req);
    const ua = req.headers.get("user-agent") ?? null;

    const rows = body.consents.map(({ consentType, granted, source = "settings" }) => ({
      user_id: user.id,
      consent_type: consentType,
      granted,
      consent_version: CONSENT_VERSION,
      consent_text_shown: CONSENT_TEXT[consentType],
      consent_source: source,
      ip_address: ip,
      user_agent: ua,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("user_consents")
      .upsert(rows, { onConflict: "user_id,consent_type" });

    if (error) {
      console.error("[consent POST]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[consent POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── GET /api/consent ──────────────────────────────────────────────────────────
// Returns the current consent state for the authenticated user.
// Response: { consents: Record<ConsentType, { granted, updatedAt, version }> }
export async function GET() {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("user_consents")
      .select("consent_type, granted, consent_version, updated_at")
      .eq("user_id", user.id);

    if (error) {
      console.error("[consent GET]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const consents: Record<string, { granted: boolean; updatedAt: string; version: string }> = {};
    for (const row of data ?? []) {
      consents[row.consent_type] = {
        granted: row.granted,
        updatedAt: row.updated_at,
        version: row.consent_version,
      };
    }

    return NextResponse.json({ consents });
  } catch (err) {
    console.error("[consent GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
