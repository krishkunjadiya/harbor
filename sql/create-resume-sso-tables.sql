-- Resume SSO integration tables (Harbor side)
-- Execute in Supabase SQL editor before enabling SSO routes in production.

create table if not exists public.resume_user_links (
  id uuid primary key default gen_random_uuid(),
  harbor_user_id uuid not null references public.profiles(id) on delete cascade,
  resume_user_id uuid not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (harbor_user_id),
  unique (resume_user_id)
);

create index if not exists idx_resume_user_links_harbor_user_id
  on public.resume_user_links (harbor_user_id);

create index if not exists idx_resume_user_links_resume_user_id
  on public.resume_user_links (resume_user_id);

create table if not exists public.resume_sso_audit (
  id uuid primary key default gen_random_uuid(),
  harbor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  ip text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.resume_sso_consumed_tokens (
  jti text primary key,
  harbor_user_id uuid references public.profiles(id) on delete set null,
  expires_at timestamptz not null,
  consumed_at timestamptz not null default now()
);

create index if not exists idx_resume_sso_audit_harbor_user_id
  on public.resume_sso_audit (harbor_user_id);

create index if not exists idx_resume_sso_audit_action
  on public.resume_sso_audit (action);

create index if not exists idx_resume_sso_audit_created_at
  on public.resume_sso_audit (created_at desc);

create index if not exists idx_resume_sso_consumed_tokens_expires_at
  on public.resume_sso_consumed_tokens (expires_at);

alter table public.resume_user_links enable row level security;
alter table public.resume_sso_audit enable row level security;
alter table public.resume_sso_consumed_tokens enable row level security;

-- Users can read only their own mapping.
drop policy if exists "Users can read own resume mapping" on public.resume_user_links;
create policy "Users can read own resume mapping"
  on public.resume_user_links
  for select
  to authenticated
  using (auth.uid() = harbor_user_id);

-- Users can create only their own mapping row (if needed by future UI flow).
drop policy if exists "Users can insert own resume mapping" on public.resume_user_links;
create policy "Users can insert own resume mapping"
  on public.resume_user_links
  for insert
  to authenticated
  with check (auth.uid() = harbor_user_id);

-- Users can update only their own mapping row.
drop policy if exists "Users can update own resume mapping" on public.resume_user_links;
create policy "Users can update own resume mapping"
  on public.resume_user_links
  for update
  to authenticated
  using (auth.uid() = harbor_user_id)
  with check (auth.uid() = harbor_user_id);

-- Audit table is write/read restricted to service role only.
drop policy if exists "Service role manages resume sso audit" on public.resume_sso_audit;
create policy "Service role manages resume sso audit"
  on public.resume_sso_audit
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Service role manages resume sso consumed tokens" on public.resume_sso_consumed_tokens;
create policy "Service role manages resume sso consumed tokens"
  on public.resume_sso_consumed_tokens
  for all
  to service_role
  using (true)
  with check (true);
