"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Mail, MessageSquare, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CONSENT_TEXT, CONSENT_VERSION } from "@/lib/constants";
import { isSupabaseConfigured, getSupabaseBrowser } from "@/lib/supabase/client";
import type { ConsentType } from "@/types/domain";

const LOCAL_KEY = "dueviq:consent:v1";
const LEGACY_KEY = "moneynest:consent:v1";

interface ConsentState {
  privacy_policy: boolean;
  terms_of_service: boolean;
  email_marketing: boolean;
  sms_marketing: boolean;
  analytics: boolean;
}

const DEFAULT_STATE: ConsentState = {
  privacy_policy: false,
  terms_of_service: false,
  email_marketing: false,
  sms_marketing: false,
  analytics: false,
};

async function saveConsentsToSupabase(state: ConsentState, source: "onboarding" | "banner") {
  const entries = Object.entries(state) as [ConsentType, boolean][];
  try {
    await fetch("/api/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consents: entries.map(([consentType, granted]) => ({
          consentType,
          granted,
          source,
        })),
      }),
    });
  } catch {
    // Non-critical — consent is also persisted in localStorage
  }
}

export function ConsentModal() {
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<ConsentState>(DEFAULT_STATE);
  const [expandedTexts, setExpandedTexts] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const stored =
        localStorage.getItem(LOCAL_KEY) ??
        localStorage.getItem(LEGACY_KEY);
      if (!stored) {
        setVisible(true);
        return;
      }
      const parsed = JSON.parse(stored);
      // Legacy consent (just { accepted: true }) — show expanded modal to collect granular choices
      if (parsed.accepted && !parsed.version) {
        setVisible(true);
        // Pre-tick required consents since they already clicked "I agree"
        setState((s) => ({ ...s, privacy_policy: true, terms_of_service: true }));
      }
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const requiredAccepted = state.privacy_policy && state.terms_of_service;

  function toggle(key: keyof ConsentState) {
    setState((s) => ({ ...s, [key]: !s[key] }));
  }

  function toggleText(key: string) {
    setExpandedTexts((s) => ({ ...s, [key]: !s[key] }));
  }

  async function handleSave() {
    if (!requiredAccepted) return;
    setSaving(true);
    try {
      // Always persist locally first
      localStorage.setItem(
        LOCAL_KEY,
        JSON.stringify({
          ...state,
          version: CONSENT_VERSION,
          savedAt: new Date().toISOString(),
        }),
      );
      localStorage.removeItem(LEGACY_KEY);

      // If signed in, also persist to Supabase
      if (isSupabaseConfigured()) {
        const supabase = getSupabaseBrowser();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await saveConsentsToSupabase(state, "banner");
        }
      }
    } finally {
      setSaving(false);
      setVisible(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Privacy & marketing preferences"
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

      {/* Modal panel */}
      <div className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-surface border border-border shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-5 pb-4 border-b border-border shrink-0">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <ShieldCheck size={20} aria-hidden="true" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">Your privacy choices</p>
            <p className="text-xs text-foreground-muted mt-0.5">
              We need your agreement on a few things before you continue.
            </p>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Required section */}
          <div>
            <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
              Required to continue
            </p>
            <div className="space-y-3">
              <ConsentRow
                id="privacy_policy"
                checked={state.privacy_policy}
                onChange={() => toggle("privacy_policy")}
                label="Privacy Policy"
                text={CONSENT_TEXT.privacy_policy}
                expanded={!!expandedTexts.privacy_policy}
                onToggleText={() => toggleText("privacy_policy")}
                required
                linkHref="/privacy"
                linkLabel="Read Privacy Policy →"
              />
              <ConsentRow
                id="terms_of_service"
                checked={state.terms_of_service}
                onChange={() => toggle("terms_of_service")}
                label="Terms of Service"
                text={CONSENT_TEXT.terms_of_service}
                expanded={!!expandedTexts.terms_of_service}
                onToggleText={() => toggleText("terms_of_service")}
                required
                linkHref="/privacy#terms"
                linkLabel="Read Terms of Service →"
              />
            </div>
          </div>

          {/* Optional marketing section */}
          <div>
            <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-0.5">
              Optional — Marketing
            </p>
            <p className="text-xs text-foreground-muted mb-2">
              You can use Dueviq fully without opting in to any of these.
            </p>
            <div className="space-y-3">
              <ConsentRow
                id="email_marketing"
                checked={state.email_marketing}
                onChange={() => toggle("email_marketing")}
                label="Marketing emails"
                description="Product updates, tips, and special offers via email."
                icon={<Mail size={15} />}
                text={CONSENT_TEXT.email_marketing}
                expanded={!!expandedTexts.email_marketing}
                onToggleText={() => toggleText("email_marketing")}
              />
              <ConsentRow
                id="sms_marketing"
                checked={state.sms_marketing}
                onChange={() => toggle("sms_marketing")}
                label="Marketing SMS"
                description="Text messages with offers and updates. Reply STOP to opt out anytime."
                icon={<MessageSquare size={15} />}
                text={CONSENT_TEXT.sms_marketing}
                expanded={!!expandedTexts.sms_marketing}
                onToggleText={() => toggleText("sms_marketing")}
              />
              <ConsentRow
                id="analytics"
                checked={state.analytics}
                onChange={() => toggle("analytics")}
                label="Usage analytics"
                description="Anonymised data to help us improve the app."
                icon={<BarChart3 size={15} />}
                text={CONSENT_TEXT.analytics}
                expanded={!!expandedTexts.analytics}
                onToggleText={() => toggleText("analytics")}
              />
            </div>
          </div>

          <p className="text-[11px] text-foreground-muted leading-relaxed">
            You can change your marketing preferences at any time in{" "}
            <strong className="text-foreground">Settings → Privacy & Marketing</strong>.
            We never sell your personal data.
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border shrink-0">
          {!requiredAccepted && (
            <p className="text-xs text-danger mb-2">
              Please accept the Privacy Policy and Terms of Service to continue.
            </p>
          )}
          <Button
            variant="primary"
            className="w-full"
            disabled={!requiredAccepted || saving}
            onClick={handleSave}
          >
            {saving ? "Saving…" : "Save preferences & continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Internal ConsentRow sub-component ───────────────────────────────────────

interface ConsentRowProps {
  id: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  text: string;
  expanded: boolean;
  onToggleText: () => void;
  required?: boolean;
  linkHref?: string;
  linkLabel?: string;
}

function ConsentRow({
  id,
  checked,
  onChange,
  label,
  description,
  icon,
  text,
  expanded,
  onToggleText,
  required,
  linkHref,
  linkLabel,
}: ConsentRowProps) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <label htmlFor={id} className="flex items-start gap-3 cursor-pointer">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-accent cursor-pointer"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            {icon && <span className="text-foreground-muted" aria-hidden="true">{icon}</span>}
            {label}
            {required && (
              <span className="text-[10px] font-medium text-accent bg-accent-soft rounded px-1 py-0.5 ml-0.5">
                Required
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-foreground-muted mt-0.5">{description}</p>
          )}
        </div>
      </label>

      {/* Expandable full consent text */}
      <div className="mt-2 pl-7">
        <button
          type="button"
          onClick={onToggleText}
          className="inline-flex items-center gap-1 text-[11px] text-foreground-muted hover:text-foreground"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? "Hide full text" : "View full consent text"}
        </button>
        {expanded && (
          <p className="mt-1.5 text-[11px] text-foreground-muted leading-relaxed border-l-2 border-border pl-2">
            {text}
          </p>
        )}
        {linkHref && linkLabel && (
          <Link
            href={linkHref}
            className="block mt-1 text-[11px] text-accent underline underline-offset-2 hover:opacity-80"
          >
            {linkLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Re-export a lightweight hook for reading saved consent from localStorage ─

export function useLocalConsent(): ConsentState | null {
  const [consent, setConsent] = useState<ConsentState | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) setConsent(JSON.parse(raw) as ConsentState);
    } catch { /* ignore */ }
  }, []);
  return consent;
}
