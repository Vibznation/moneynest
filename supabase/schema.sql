-- MoneyNest schema
-- Run in the Supabase SQL editor. Enables RLS and per-user policies.

create extension if not exists "pgcrypto";

-- profiles -------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
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
