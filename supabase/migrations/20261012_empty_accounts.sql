create extension if not exists pgcrypto;

create table if not exists public.empty_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_key text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.empty_account_votes (
  id bigint generated always as identity primary key,
  entry_id uuid not null references public.empty_accounts(id) on delete cascade,
  ip_hash text not null,
  vote text not null check (vote in ('correct','not_empty')),
  created_at timestamptz not null default now(),
  unique (entry_id, ip_hash)
);

create index if not exists empty_account_votes_entry_idx on public.empty_account_votes(entry_id);
create index if not exists empty_account_votes_ip_idx on public.empty_account_votes(ip_hash);

create or replace view public.empty_account_results as
select
  e.id,
  e.name,
  e.created_at,
  count(v.id) filter (where v.vote='correct')::int as correct_count,
  count(v.id) filter (where v.vote='not_empty')::int as not_empty_count
from public.empty_accounts e
left join public.empty_account_votes v on v.entry_id=e.id
group by e.id,e.name,e.created_at;

alter table public.empty_accounts enable row level security;
alter table public.empty_account_votes enable row level security;

revoke all on public.empty_accounts from anon, authenticated;
revoke all on public.empty_account_votes from anon, authenticated;
