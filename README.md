# Dueviq — Simple Money Organizer

> **Know what's due. Know what's safe to spend.**

Dueviq helps everyday people organize bills, subscriptions, savings goals, and accounts so they can clearly see what is due and what money is safe to spend before payday.

Built with **Next.js (App Router) · TypeScript · Tailwind CSS · Supabase · lucide-react · date-fns**.

> The MVP runs immediately in a local "demo mode" using your browser's localStorage, so you can try every screen without any setup. Real Supabase auth/database is wired and ready when you provide credentials.

**Public store name:** Dueviq: Simple Money Organizer  
**Pronunciation:** DOO-veek  
**Tagline:** Know what's due. Know what's safe to spend.

---

## Run locally

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

On first load the app seeds itself with demo data (Rent, Phone, Netflix, Emergency Fund, etc.) so you can explore every screen. Clear it from **Settings → Reset & delete data**.

### Build / lint

```bash
npm run build
npm run lint
```

---

## App structure

```
src/
  app/
    layout.tsx              # Root layout, theme + providers
    page.tsx                # Redirects to /onboarding or /today
    onboarding/page.tsx     # Multi-step setup flow
    (app)/
      layout.tsx            # App shell (header, nav, mobile tab bar)
      today/page.tsx        # Dashboard: safe-to-spend, calm score, Dueviq Guide
      bills/page.tsx        # Bill CRUD, paid/unpaid, overdue, upcoming
      subscriptions/page.tsx# Monthly + yearly totals, renewals, status
      goals/page.tsx        # Savings goals with progress
      money-map/page.tsx    # Monthly money map + fixed expense ratio
      settings/page.tsx     # Profile, cushion, currency, theme, data
  components/
    Providers.tsx           # Theme + data store
    app-shell/              # Header, desktop nav, mobile tab bar
    theme/                  # Theme provider, toggle, no-flash script
    ui/                     # Button, Card, Input, Modal, Badge, Progress…
  lib/
    calculations.ts         # Safe-to-spend, calm score, money map, Dueviq Guide
    constants.ts            # Categories + frequencies
    data-store.tsx          # Local-first store (CRUD over UserSnapshot)
    mock-data.ts            # Demo + empty snapshots
    supabase/client.ts      # Browser client (used when env vars are set)
    utils.ts                # cn(), formatCurrency()
  types/domain.ts           # Profile, Income, Account, Bill, Subscription, Goal, Settings
supabase/
  schema.sql                # Tables + indexes + RLS policies + signup trigger
```

---

## Core calculations

- **Safe to Spend** = `checking − bills due before next payday − monthly goal
  contributions − minimum cushion` (default cushion `$100`, editable in
  Settings).
- **Money Calm Score** starts at `100` and subtracts: `-20` if safe-to-spend is
  negative, `-10` per overdue bill, `-5` per unpaid bill due within 3 days,
  `-5` per Review subscription, `-10` if no savings goal. Clamped to `0–100`.
- **Before You Spend** compares the amount to safe-to-spend at the 25 / 50 /
  100% thresholds and replies like a calm friend, not a banker.
- **Dueviq Guide** is a rule-based message generator; the call site is the
  single seam for the future OpenAI assistant.

---

## Adding Supabase (real auth + database)

1. Create a Supabase project.
2. In the SQL editor, run `supabase/schema.sql`. This creates all tables,
   indexes, RLS policies, and a trigger that auto-creates `profiles`,
   `settings`, and `accounts` rows when a user signs up.
3. Copy `.env.example` to `.env.local` and fill in:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
4. The browser client lives in `src/lib/supabase/client.ts`. The data layer is
   abstracted behind `useData()`, so you can swap the local store for
   Supabase-backed loaders/mutators without touching pages. Recommended next
   steps:
   - Add `/sign-in`, `/sign-up`, `/reset-password` routes using
     `supabase.auth.signInWithPassword` etc.
   - Add middleware (or a layout guard) that redirects unauthenticated users
     out of `(app)/*` to `/sign-in`.
   - Replace the localStorage hydration in `data-store.tsx` with Supabase
     selects keyed on `auth.uid()` and replace each mutation with the matching
     `.insert/.update/.delete().eq("user_id", uid)` calls (RLS already enforces
     ownership).

Never put the service-role key in the frontend.

---

## Adding Plaid later

- Add a `plaid_items` table for linked institutions and a `transactions` table
  for synced activity.
- Build a server route that exchanges public tokens and stores Plaid access
  tokens server-side only.
- Reconcile carefully with manually entered bills/subscriptions — do not
  silently delete user-entered records.
- Keep manual entry as a first-class fallback.

## Adding the OpenAI "Dueviq Guide" assistant later

- `generateNestGuideMessage(snapshot)` in `src/lib/calculations.ts` is the
  single seam. Wrap it with a server action / route handler that sends a
  **summarized** snapshot (totals, counts, statuses — not raw credentials or
  PII) to the OpenAI API.
- Keep the deterministic version as the fallback for reliability and cost
  control.
- Add user consent and a clear "not financial advice" disclosure in the UI.

## Adding Stripe later

- Only if Dueviq itself becomes a paid product. Use Stripe Checkout /
  Billing Portal rather than custom payment UI. Keep user-tracked subscriptions
  (in the `subscriptions` table) separate from Dueviq's own product billing.

---

## Design philosophy

Calm, clean, trustworthy, soft, modern, minimal, mobile-first.

Avoid: complex charts, harsh red unless urgent, finance jargon, dozens of
categories, investment/stock tracking, overbuilt reports.

Use plain English. Numbers are large. Whitespace is generous. Red is reserved
for "you should look at this now."
