"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";

type Tab = "signin" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  // Defer env check to client to avoid SSR/client hydration mismatch
  const [supabaseReady, setSupabaseReady] = useState<boolean | null>(null);
  useEffect(() => { setSupabaseReady(isSupabaseConfigured()); }, []);

  if (supabaseReady === false) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <h1 className="text-2xl font-semibold mb-2">Dueviq</h1>
          <p className="text-foreground-muted text-sm mb-6">
            Supabase is not configured. Set{" "}
            <code className="text-xs bg-surface-muted px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
            and{" "}
            <code className="text-xs bg-surface-muted px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
            in <code className="text-xs bg-surface-muted px-1 py-0.5 rounded">.env.local</code> to enable auth.
          </p>
          <Button variant="primary" onClick={() => router.push("/today")}>
            Continue without auth
          </Button>
        </div>
      </div>
    );
  }

  if (supabaseReady === null) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const supabase = getSupabaseBrowser();
      if (tab === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) { setError(err.message); return; }
        router.replace("/");
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) { setError(err.message); return; }
        setSuccess("Check your email for a confirmation link, then sign in.");
        setTab("signin");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-1.5 text-2xl font-semibold tracking-tight text-foreground">
            <Sparkles size={20} className="text-accent" /> Dueviq
          </span>
          <p className="text-sm text-foreground-muted mt-1">Know what&apos;s due. Know what&apos;s safe to spend.</p>
        </div>

        {/* Google OAuth */}
        <Button
          variant="secondary"
          type="button"
          onClick={() => {
            const supabase = getSupabaseBrowser();
            supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: `${window.location.origin}/auth/callback` },
            });
          }}
          className="w-full mb-4"
        >
          <GoogleIcon />
          Continue with Google
        </Button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs text-foreground-muted">
            <span className="bg-background px-2">or use email</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-surface-muted p-1 mb-6">
          {(["signin", "signup"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError(null); setSuccess(null); }}
              className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              {t === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Email">
            <Input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              required
              autoComplete={tab === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          {error && <p className="text-sm text-danger">{error}</p>}
          {success && <p className="text-sm text-accent">{success}</p>}

          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? "Loading…" : tab === "signin" ? "Sign in" : "Create account"}
          </Button>

          {tab === "signup" && (
            <p className="text-xs text-foreground-muted text-center leading-relaxed">
              By creating an account you agree to our{" "}
              <Link href="/privacy" className="text-accent underline underline-offset-2 hover:opacity-80 transition-opacity">
                Privacy Policy
              </Link>
              .
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
