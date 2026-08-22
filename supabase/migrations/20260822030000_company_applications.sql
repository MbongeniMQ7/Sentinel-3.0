-- ─── COMPANY APPLICATIONS ────────────────────────────────────────────────────
-- Public intake for companies that want to JOIN (adopt) or ACQUIRE the software.
-- Anyone (anon) may submit an application; only owners can read / triage them.

do $$ begin
  create type application_type as enum ('join', 'acquire');
exception when duplicate_object then null; end $$;

do $$ begin
  create type application_status as enum ('new', 'reviewing', 'contacted', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

create table if not exists public.company_applications (
  id               uuid primary key default gen_random_uuid(),
  company_name     text not null,
  contact_name     text not null,
  contact_email    text not null,
  contact_phone    text,
  industry         text,
  country          text,
  company_size     text,
  website          text,
  application_type application_type not null default 'join',
  message          text,
  status           application_status not null default 'new',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_company_applications_status  on public.company_applications (status);
create index if not exists idx_company_applications_created on public.company_applications (created_at desc);

drop trigger if exists trg_company_applications_updated on public.company_applications;
create trigger trg_company_applications_updated
  before update on public.company_applications
  for each row execute function public.set_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.company_applications enable row level security;

-- Public submissions (both anonymous visitors and any signed-in user).
drop policy if exists "applications_public_insert" on public.company_applications;
create policy "applications_public_insert"
  on public.company_applications
  for insert
  to anon, authenticated
  with check (true);

-- Only owners may read applications.
drop policy if exists "applications_owner_select" on public.company_applications;
create policy "applications_owner_select"
  on public.company_applications
  for select
  to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'owner'
  ));

-- Only owners may triage (update status) applications.
drop policy if exists "applications_owner_update" on public.company_applications;
create policy "applications_owner_update"
  on public.company_applications
  for update
  to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'owner'
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'owner'
  ));

-- Realtime
do $$ begin
  alter publication supabase_realtime add table public.company_applications;
exception when duplicate_object then null; end $$;
