"use client";

import { useState, useEffect } from "react";
import { type EntitlementType } from "@/lib/entitlements";
import { isSupabaseConfigured, getSupabaseBrowser } from "@/lib/supabase/client";

interface UseEntitlementResult {
  entitlement: EntitlementType;
  loading: boolean;
  /** Call after a successful purchase to re-fetch from Supabase */
  refresh: () => void;
}

export function useEntitlement(): UseEntitlementResult {
  const [entitlement, setEntitlement] = useState<EntitlementType>("free");
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      setLoading(true);

      // Dev/owner override — set via /admin page or browser console:
      // localStorage.setItem("dueviq:plan-override", "business")
      const override = typeof window !== "undefined"
        ? localStorage.getItem("dueviq:plan-override")
        : null;
      if (override === "business" || override === "plus_personal") {
        if (!cancelled) {
          setEntitlement(override as EntitlementType);
          setLoading(false);
        }
        return;
      }

      if (!isSupabaseConfigured()) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const supabase = getSupabaseBrowser();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (!cancelled) setLoading(false);
          return;
        }

        const { data } = await supabase
          .from("entitlements")
          .select("entitlement_type, active, expires_at")
          .eq("user_id", user.id)
          .eq("active", true)
          .maybeSingle();

        if (!cancelled && data) {
          const notExpired =
            !data.expires_at || new Date(data.expires_at) > new Date();
          if (notExpired) {
            setEntitlement(data.entitlement_type as EntitlementType);
          }
        }
      } catch {
        // Silent fallback to "free" — never crash the UI
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  return {
    entitlement,
    loading,
    refresh: () => setTick((t) => t + 1),
  };
}
