-- Backup logico antes da migration multi-familia.
-- Rode este arquivo no Supabase SQL Editor ANTES de aplicar:
-- supabase/migrations/202607080001_multi_family_invites.sql
--
-- Ele nao altera as tabelas publicas usadas pelo app. Apenas cria copias
-- em um schema separado para inspecao/restauracao manual se algo der errado.

create schema if not exists backup_20260708_multi_family;

create table if not exists backup_20260708_multi_family.families
as select * from public.families;

create table if not exists backup_20260708_multi_family.family_members
as select * from public.family_members;

create table if not exists backup_20260708_multi_family.shopping_lists
as select * from public.shopping_lists;

create table if not exists backup_20260708_multi_family.shopping_items
as select * from public.shopping_items;

create table if not exists backup_20260708_multi_family.finance_transactions
as select * from public.finance_transactions;

create table if not exists backup_20260708_multi_family.finance_bills
as select * from public.finance_bills;

create table if not exists backup_20260708_multi_family.finance_bill_payments
as select * from public.finance_bill_payments;

create table if not exists backup_20260708_multi_family.finance_budgets
as select * from public.finance_budgets;

create table if not exists backup_20260708_multi_family.finance_reserve_settings
as select * from public.finance_reserve_settings;

create table if not exists backup_20260708_multi_family.routine_tasks
as select * from public.routine_tasks;

create table if not exists backup_20260708_multi_family.routine_entries
as select * from public.routine_entries;

create table if not exists backup_20260708_multi_family.audit_log
as select * from public.audit_log;

do $$
begin
  if to_regclass('public.family_invites') is not null then
    execute 'create table if not exists backup_20260708_multi_family.family_invites as select * from public.family_invites';
  end if;
end $$;

alter table backup_20260708_multi_family.families enable row level security;
alter table backup_20260708_multi_family.family_members enable row level security;
alter table backup_20260708_multi_family.shopping_lists enable row level security;
alter table backup_20260708_multi_family.shopping_items enable row level security;
alter table backup_20260708_multi_family.finance_transactions enable row level security;
alter table backup_20260708_multi_family.finance_bills enable row level security;
alter table backup_20260708_multi_family.finance_bill_payments enable row level security;
alter table backup_20260708_multi_family.finance_budgets enable row level security;
alter table backup_20260708_multi_family.finance_reserve_settings enable row level security;
alter table backup_20260708_multi_family.routine_tasks enable row level security;
alter table backup_20260708_multi_family.routine_entries enable row level security;
alter table backup_20260708_multi_family.audit_log enable row level security;

do $$
begin
  if to_regclass('backup_20260708_multi_family.family_invites') is not null then
    execute 'alter table backup_20260708_multi_family.family_invites enable row level security';
  end if;
end $$;

revoke all on all tables in schema backup_20260708_multi_family from anon, authenticated;

select
  'backup_20260708_multi_family' as schema_name,
  (select count(*) from backup_20260708_multi_family.families) as families,
  (select count(*) from backup_20260708_multi_family.family_members) as family_members,
  (select count(*) from backup_20260708_multi_family.shopping_lists) as shopping_lists,
  (select count(*) from backup_20260708_multi_family.finance_transactions) as finance_transactions,
  (select count(*) from backup_20260708_multi_family.routine_tasks) as routine_tasks;
