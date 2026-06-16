create table if not exists public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  type text not null check (type in ('expense', 'income', 'reserve_deposit', 'reserve_withdrawal')),
  name text not null check (char_length(trim(name)) between 1 and 100),
  amount numeric(12,2) not null check (amount > 0),
  category text not null check (char_length(trim(category)) between 1 and 40),
  responsible text not null check (responsible in ('Família', 'Julio', 'Carol')),
  recurrence text not null check (recurrence in ('none', 'weekly', 'monthly', 'bimonthly', 'yearly')) default 'none',
  transaction_date date not null,
  expense_kind text check (expense_kind in ('fixed', 'variable')),
  notes text check (char_length(notes) <= 240),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_bills (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  amount numeric(12,2) not null check (amount > 0),
  due_day integer not null check (due_day between 1 and 31),
  category text not null check (char_length(trim(category)) between 1 and 40),
  responsible text not null check (responsible in ('Família', 'Julio', 'Carol')),
  recurrence text not null check (recurrence in ('none', 'weekly', 'monthly', 'bimonthly', 'yearly')) default 'none',
  start_date date not null,
  expense_kind text not null check (expense_kind in ('fixed', 'variable')) default 'fixed',
  notes text check (char_length(notes) <= 240),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_bill_payments (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  bill_id uuid not null references public.finance_bills(id) on delete cascade,
  month_date date not null check (extract(day from month_date) = 1),
  paid_at timestamptz not null default now(),
  unique (bill_id, month_date)
);

create table if not exists public.finance_budgets (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  category text not null check (char_length(trim(category)) between 1 and 40),
  emoji text not null check (char_length(emoji) between 1 and 16),
  monthly_limit numeric(12,2) not null check (monthly_limit > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (family_id, category)
);

create table if not exists public.finance_reserve_settings (
  family_id uuid primary key references public.families(id) on delete cascade,
  goal_amount numeric(12,2) not null check (goal_amount > 0) default 30000,
  updated_at timestamptz not null default now()
);

create index if not exists finance_transactions_family_date_idx on public.finance_transactions (family_id, transaction_date desc);
create index if not exists finance_transactions_family_category_idx on public.finance_transactions (family_id, category);
create index if not exists finance_bills_family_start_idx on public.finance_bills (family_id, start_date);
create index if not exists finance_bill_payments_family_month_idx on public.finance_bill_payments (family_id, month_date);
create index if not exists finance_budgets_family_category_idx on public.finance_budgets (family_id, category);

alter table public.finance_transactions enable row level security;
alter table public.finance_bills enable row level security;
alter table public.finance_bill_payments enable row level security;
alter table public.finance_budgets enable row level security;
alter table public.finance_reserve_settings enable row level security;

create policy "members manage finance transactions" on public.finance_transactions for all to authenticated
  using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));
create policy "members manage finance bills" on public.finance_bills for all to authenticated
  using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));
create policy "members manage finance bill payments" on public.finance_bill_payments for all to authenticated
  using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id) and exists (
    select 1 from public.finance_bills where id = bill_id and family_id = finance_bill_payments.family_id
  ));
create policy "members manage finance budgets" on public.finance_budgets for all to authenticated
  using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));
create policy "members manage finance reserve settings" on public.finance_reserve_settings for all to authenticated
  using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));

create or replace function public.set_finance_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.audit_finance_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  source_row jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
begin
  insert into public.audit_log (family_id, user_id, action, table_name, record_id, payload)
  values ((source_row ->> 'family_id')::uuid, auth.uid(), lower(tg_op), tg_table_name, nullif(source_row ->> 'id', '')::uuid, source_row);
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists finance_transactions_updated_at on public.finance_transactions;
create trigger finance_transactions_updated_at before update on public.finance_transactions for each row execute function public.set_finance_updated_at();
drop trigger if exists finance_bills_updated_at on public.finance_bills;
create trigger finance_bills_updated_at before update on public.finance_bills for each row execute function public.set_finance_updated_at();
drop trigger if exists finance_budgets_updated_at on public.finance_budgets;
create trigger finance_budgets_updated_at before update on public.finance_budgets for each row execute function public.set_finance_updated_at();
drop trigger if exists finance_reserve_updated_at on public.finance_reserve_settings;
create trigger finance_reserve_updated_at before update on public.finance_reserve_settings for each row execute function public.set_finance_updated_at();

drop trigger if exists audit_finance_transactions on public.finance_transactions;
create trigger audit_finance_transactions after insert or update or delete on public.finance_transactions for each row execute function public.audit_finance_change();
drop trigger if exists audit_finance_bills on public.finance_bills;
create trigger audit_finance_bills after insert or update or delete on public.finance_bills for each row execute function public.audit_finance_change();
drop trigger if exists audit_finance_bill_payments on public.finance_bill_payments;
create trigger audit_finance_bill_payments after insert or update or delete on public.finance_bill_payments for each row execute function public.audit_finance_change();
drop trigger if exists audit_finance_budgets on public.finance_budgets;
create trigger audit_finance_budgets after insert or update or delete on public.finance_budgets for each row execute function public.audit_finance_change();
drop trigger if exists audit_finance_reserve_settings on public.finance_reserve_settings;
create trigger audit_finance_reserve_settings after insert or update or delete on public.finance_reserve_settings for each row execute function public.audit_finance_change();
