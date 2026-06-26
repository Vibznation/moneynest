-- Dueviq schema
-- Run in the Supabase SQL editor. Enables RLS and per-user policies.

create extension if not exists "pgcrypto";

-- profiles -------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  -- Extended marketing / contact profile fields
  phone text,
  phone_country_code text not null default '+1',
  date_of_birth date,
  city text,
  state text,
  country text not null default 'US',
  zip text,
  gender text check (gender in ('male','female','non_binary','prefer_not_to_say','other')),
  occupation text,
  annual_income_range text check (annual_income_range in (
    'under_25k','25k_50k','50k_75k','75k_100k','100k_150k','over_150k','prefer_not_to_say'
  )),
  marketing_source text,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now()
);

-- income ---------------------------------------------------------------
create table if not exists public.income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(12,2) not null check (amount >= 0),
  frequency text not null check (frequency in ('weekly','biweekly','monthly','custom')),
  next_payday date not null,
  created_at timestamptz not null default now()
);
create index if not exists income_user_idx on public.income(user_id);
create index if not exists income_payday_idx on public.income(next_payday);

-- accounts -------------------------------------------------------------
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  checking_balance numeric(12,2) not null default 0,
  savings_balance numeric(12,2) not null default 0,
  updated_at timestamptz not null default now()
);

-- bills ----------------------------------------------------------------
create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(12,2) not null check (amount >= 0),
  due_date date not null,
  category text not null,
  autopay boolean not null default false,
  status text not null default 'unpaid' check (status in ('paid','unpaid')),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists bills_user_idx on public.bills(user_id);
create index if not exists bills_due_idx on public.bills(due_date);

-- subscriptions --------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(12,2) not null check (amount >= 0),
  renewal_date date not null,
  category text not null,
  status text not null default 'Review' check (status in ('Keep','Cancel','Review')),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists subs_user_idx on public.subscriptions(user_id);
create index if not exists subs_renewal_idx on public.subscriptions(renewal_date);

-- goals ----------------------------------------------------------------
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(12,2) not null check (target_amount >= 0),
  current_amount numeric(12,2) not null default 0,
  monthly_target numeric(12,2) not null default 0,
  category text not null default 'Other',
  created_at timestamptz not null default now()
);
create index if not exists goals_user_idx on public.goals(user_id);

-- settings -------------------------------------------------------------
create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  minimum_cushion numeric(12,2) not null default 100,
  currency text not null default 'USD',
  pay_frequency text not null default 'biweekly',
  dark_mode boolean not null default false,
  notification_preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- plaid_items ----------------------------------------------------------
-- One row per linked institution. The access_token must be stored encrypted
-- (e.g. via pgsodium / a server-side KMS) and NEVER exposed to the browser.
create table if not exists public.plaid_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  institution_name text,
  plaid_item_id text not null unique,
  plaid_access_token_encrypted text not null,
  status text not null default 'active' check (status in ('active','sync_needed','disconnected','error')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists plaid_items_user_idx on public.plaid_items(user_id);

-- financial_accounts ---------------------------------------------------
create table if not exists public.financial_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  institution_name text,
  account_name text not null,
  account_type text not null check (account_type in ('checking','savings','credit_card','loan','cash','other')),
  balance numeric(14,2) not null default 0,
  currency text not null default 'USD',
  source text not null default 'manual' check (source in ('manual','plaid')),
  status text not null default 'manual' check (status in ('manual','connected','sync_needed','disconnected')),
  notes text,
  plaid_item_id uuid references public.plaid_items(id) on delete set null,
  plaid_account_id text,
  include_in_safe_to_spend boolean not null default true,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists financial_accounts_user_idx on public.financial_accounts(user_id);
create unique index if not exists financial_accounts_plaid_uniq
  on public.financial_accounts(plaid_item_id, plaid_account_id)
  where plaid_item_id is not null and plaid_account_id is not null;

-- transactions ---------------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  financial_account_id uuid references public.financial_accounts(id) on delete set null,
  plaid_transaction_id text unique,
  name text not null,
  merchant_name text,
  amount numeric(14,2) not null,
  category text,
  transaction_date date not null,
  pending boolean not null default false,
  source text not null default 'manual' check (source in ('manual','plaid')),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists transactions_user_idx on public.transactions(user_id);
create index if not exists transactions_account_idx on public.transactions(financial_account_id);
create index if not exists transactions_date_idx on public.transactions(transaction_date);

-- RLS ------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.income enable row level security;
alter table public.accounts enable row level security;
alter table public.bills enable row level security;
alter table public.subscriptions enable row level security;
alter table public.goals enable row level security;
alter table public.settings enable row level security;
alter table public.plaid_items enable row level security;
alter table public.financial_accounts enable row level security;
alter table public.transactions enable row level security;

-- Profiles policies use auth.uid() = id
do $$ begin
  create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
  create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
  create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
exception when duplicate_object then null; end $$;

-- Generic per-user policies for user_id tables
do $$
declare t text;
begin
  foreach t in array array['income','accounts','bills','subscriptions','goals','settings','plaid_items','financial_accounts','transactions']
  loop
    execute format('create policy "%1$s_select_own" on public.%1$s for select using (auth.uid() = user_id);', t);
    execute format('create policy "%1$s_insert_own" on public.%1$s for insert with check (auth.uid() = user_id);', t);
    execute format('create policy "%1$s_update_own" on public.%1$s for update using (auth.uid() = user_id);', t);
    execute format('create policy "%1$s_delete_own" on public.%1$s for delete using (auth.uid() = user_id);', t);
  end loop;
exception when duplicate_object then null;
end $$;

-- Auto-create profile + settings + accounts on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict do nothing;
  insert into public.settings (user_id) values (new.id) on conflict do nothing;
  insert into public.accounts (user_id) values (new.id) on conflict do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- DUEVIQ+ PREMIUM TABLES
-- Phase 2: populated by Google Play Billing webhook / server-side validation.
-- The browser client may read these tables (to gate UI), but MUST NOT write to
-- them directly. All writes happen server-side after purchase verification.
-- ─────────────────────────────────────────────────────────────────────────────

-- user_subscriptions ---------------------------------------------------
-- Tracks active/inactive in-app purchases per user.
-- privacy: billing data is minimal; no card numbers; managed by Google Play.
-- compliance: purchase_token must be validated server-side before granting access.
create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_type text not null check (plan_type in ('free','plus_personal','business')),
  product_id text not null,         -- e.g. dueviq_plus_monthly
  purchase_token text,              -- Google Play purchase token (server-side only)
  platform text not null default 'google_play' check (platform in ('google_play','stripe','promo')),
  status text not null default 'active' check (status in ('active','expired','cancelled','paused','refunded')),
  start_date timestamptz not null default now(),
  renewal_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists user_subs_user_idx on public.user_subscriptions(user_id);
create index if not exists user_subs_status_idx on public.user_subscriptions(status);

-- entitlements ---------------------------------------------------------
-- Derived entitlement state for UI gating. Server writes this after verifying
-- purchase_token. Browser reads it to know which features to unlock.
create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entitlement_type text not null check (entitlement_type in ('free','plus_personal','business')),
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists entitlements_user_uniq on public.entitlements(user_id);
create index if not exists entitlements_active_idx on public.entitlements(user_id, active);

-- investment_accounts --------------------------------------------------
-- Tracks investment brokerage / retirement accounts linked via Plaid or manual.
-- privacy: balances are financial data — RLS enforced, never exposed server-wide.
-- compliance: tracking only; no trade execution; not a broker-dealer.
create table if not exists public.investment_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  institution_name text,
  account_type text not null check (account_type in ('brokerage','ira','401k','roth_ira','crypto_wallet','other')),
  balance numeric(14,2) not null default 0,
  currency text not null default 'USD',
  source text not null default 'manual' check (source in ('manual','plaid')),
  plaid_account_id text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists inv_accounts_user_idx on public.investment_accounts(user_id);

-- holdings -------------------------------------------------------------
-- Individual positions (stocks, ETFs, crypto) within investment accounts.
-- compliance: display only; no trading, no price advice, no recommendations.
create table if not exists public.holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  investment_account_id uuid not null references public.investment_accounts(id) on delete cascade,
  symbol text not null,
  name text,
  quantity numeric(20,8) not null default 0,
  cost_basis numeric(14,4),
  current_price numeric(14,4),
  current_value numeric(14,2),
  asset_type text not null default 'stock' check (asset_type in ('stock','etf','mutual_fund','crypto','bond','other')),
  last_updated_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists holdings_user_idx on public.holdings(user_id);
create index if not exists holdings_account_idx on public.holdings(investment_account_id);

-- watchlist_items ------------------------------------------------------
-- Simple price watchlist. No trade functionality.
create table if not exists public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  name text,
  asset_type text not null default 'stock' check (asset_type in ('stock','etf','crypto','other')),
  alert_price numeric(14,4),
  notes text,
  created_at timestamptz not null default now()
);
create unique index if not exists watchlist_user_symbol_uniq on public.watchlist_items(user_id, symbol);

-- business_workspaces --------------------------------------------------
-- Separate workspace for business income/expense tracking.
-- privacy: kept strictly separate from personal data at the app layer.
-- compliance: tracking only; not a full accounting platform; no bookkeeping guarantee.
create table if not exists public.business_workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  business_type text,
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists biz_workspace_user_uniq on public.business_workspaces(user_id);

-- business_transactions ------------------------------------------------
create table if not exists public.business_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.business_workspaces(id) on delete cascade,
  name text not null,
  amount numeric(14,2) not null,
  type text not null check (type in ('income','expense')),
  category text,
  transaction_date date not null,
  tax_relevant boolean not null default false,
  deduction_category text,        -- e.g. "office_supplies", "travel"
  receipt_url text,               -- storage path for receipt image
  invoice_id uuid,                -- FK added below after invoices table
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists biz_tx_user_idx on public.business_transactions(user_id);
create index if not exists biz_tx_workspace_idx on public.business_transactions(workspace_id);
create index if not exists biz_tx_date_idx on public.business_transactions(transaction_date);
create index if not exists biz_tx_tax_idx on public.business_transactions(user_id, tax_relevant) where tax_relevant = true;

-- invoices -------------------------------------------------------------
-- Simple invoice tracker. Not a payment processor; no money movement.
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.business_workspaces(id) on delete cascade,
  invoice_number text,
  client_name text not null,
  amount numeric(14,2) not null check (amount >= 0),
  currency text not null default 'USD',
  issue_date date not null,
  due_date date,
  status text not null default 'draft' check (status in ('draft','sent','paid','overdue','void')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists invoices_user_idx on public.invoices(user_id);
create index if not exists invoices_workspace_idx on public.invoices(workspace_id);

-- Add FK from business_transactions to invoices (after both tables exist)
do $$ begin
  alter table public.business_transactions
    add constraint biz_tx_invoice_fk
    foreign key (invoice_id) references public.invoices(id) on delete set null;
exception when duplicate_object then null;
end $$;

-- reports --------------------------------------------------------------
-- Stored generated report metadata (PDF/CSV stored in Supabase Storage).
-- privacy: reports contain financial summaries; access_url should be short-lived signed URL.
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_type text not null check (report_type in ('monthly_summary','annual_summary','tax_export','business_pl','custom')),
  period_start date not null,
  period_end date not null,
  storage_path text not null,     -- Supabase Storage object path
  format text not null default 'pdf' check (format in ('pdf','csv')),
  generated_at timestamptz not null default now()
);
create index if not exists reports_user_idx on public.reports(user_id);
create index if not exists reports_type_idx on public.reports(user_id, report_type);

-- RLS for new tables ---------------------------------------------------
alter table public.user_subscriptions enable row level security;
alter table public.entitlements enable row level security;
alter table public.investment_accounts enable row level security;
alter table public.holdings enable row level security;
alter table public.watchlist_items enable row level security;
alter table public.business_workspaces enable row level security;
alter table public.business_transactions enable row level security;
alter table public.invoices enable row level security;
alter table public.reports enable row level security;

-- RLS: entitlements — read-only for browser; server writes via service_role
create policy "entitlements_select_own" on public.entitlements for select using (auth.uid() = user_id);
-- No insert/update/delete policies for browser — server-side only via service_role key

-- RLS: user_subscriptions — read-only for browser
create policy "user_subs_select_own" on public.user_subscriptions for select using (auth.uid() = user_id);

-- Generic per-user RLS for the remaining premium tables
do $$
declare t text;
begin
  foreach t in array array[
    'investment_accounts','holdings','watchlist_items',
    'business_workspaces','business_transactions','invoices','reports'
  ]
  loop
    execute format('create policy "%1$s_select_own" on public.%1$s for select using (auth.uid() = user_id);', t);
    execute format('create policy "%1$s_insert_own" on public.%1$s for insert with check (auth.uid() = user_id);', t);
    execute format('create policy "%1$s_update_own" on public.%1$s for update using (auth.uid() = user_id);', t);
    execute format('create policy "%1$s_delete_own" on public.%1$s for delete using (auth.uid() = user_id);', t);
  end loop;
exception when duplicate_object then null;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- MARKETING CONSENT TABLES
-- Granular, versioned, audit-logged consent for email, SMS, and analytics.
-- All writes from the browser go through the server-side /api/consent route
-- which uses the service_role key so consent_audit is never writable from the client.
-- ─────────────────────────────────────────────────────────────────────────────

-- user_consents --------------------------------------------------------
-- One row per user per consent_type. Upserted on every change.
-- granted=false means withdrawn — never hard-deleted so history is preserved.
create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null check (consent_type in (
    'privacy_policy', 'terms_of_service',
    'email_marketing', 'sms_marketing',
    'analytics', 'personalization'
  )),
  granted boolean not null,
  consent_version text not null default '1.0',
  consent_text_shown text not null,  -- exact text shown to user at time of consent
  consent_source text not null check (consent_source in (
    'onboarding', 'settings', 'banner', 'api'
  )),
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists user_consents_user_type_uniq
  on public.user_consents(user_id, consent_type);
create index if not exists user_consents_user_idx on public.user_consents(user_id);

-- consent_audit --------------------------------------------------------
-- Append-only audit trail. One row per consent change event.
-- Never updated or deleted. Browser cannot write — only service_role via API.
create table if not exists public.consent_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null,
  action text not null check (action in ('granted','withdrawn','updated')),
  granted boolean not null,
  consent_version text not null,
  consent_text_shown text not null,
  consent_source text not null,
  ip_address inet,
  user_agent text,
  recorded_at timestamptz not null default now()
);
create index if not exists consent_audit_user_idx on public.consent_audit(user_id);
create index if not exists consent_audit_type_idx on public.consent_audit(user_id, consent_type);

-- Trigger: auto-insert audit row whenever user_consents is inserted/updated
create or replace function public.log_consent_audit()
returns trigger language plpgsql security definer as $$
declare
  v_action text;
begin
  if TG_OP = 'INSERT' then
    v_action := case when NEW.granted then 'granted' else 'withdrawn' end;
  else
    v_action := case
      when NEW.granted and not OLD.granted then 'granted'
      when not NEW.granted and OLD.granted then 'withdrawn'
      else 'updated'
    end;
  end if;

  insert into public.consent_audit (
    user_id, consent_type, action, granted,
    consent_version, consent_text_shown, consent_source,
    ip_address, user_agent
  ) values (
    NEW.user_id, NEW.consent_type, v_action, NEW.granted,
    NEW.consent_version, NEW.consent_text_shown, NEW.consent_source,
    NEW.ip_address, NEW.user_agent
  );
  return NEW;
end; $$;

drop trigger if exists on_consent_change on public.user_consents;
create trigger on_consent_change
  after insert or update on public.user_consents
  for each row execute function public.log_consent_audit();

-- RLS for consent tables -----------------------------------------------
alter table public.user_consents enable row level security;
alter table public.consent_audit enable row level security;

-- user_consents: users can read and write their own rows via the browser.
-- Withdrawals are done by updating granted=false, not deleting.
do $$ begin
  create policy "user_consents_select_own" on public.user_consents for select using (auth.uid() = user_id);
  create policy "user_consents_insert_own" on public.user_consents for insert with check (auth.uid() = user_id);
  create policy "user_consents_update_own" on public.user_consents for update using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- consent_audit: users can read their own audit trail.
-- No insert/update/delete from browser — written only by the DB trigger (security definer).
do $$ begin
  create policy "consent_audit_select_own" on public.consent_audit for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

