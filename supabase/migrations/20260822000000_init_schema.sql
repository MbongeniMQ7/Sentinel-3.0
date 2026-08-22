-- ============================================================================
-- SentinelAI Workforce — complete schema
-- Multi-tenant workforce management, attendance, earnings, shifts,
-- IoT wristband biometrics, fatigue monitoring, alerts, audit & reports.
-- Idempotent: safe to run multiple times. Realtime enabled on all tables.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ─── ENUMS ──────────────────────────────────────────────────────────────────
do $$ begin create type user_role as enum ('owner','manager','employee'); exception when duplicate_object then null; end $$;
do $$ begin create type employee_status as enum ('active','inactive'); exception when duplicate_object then null; end $$;
do $$ begin create type org_industry as enum ('mining','manufacturing','logistics','construction','other'); exception when duplicate_object then null; end $$;
do $$ begin create type currency_code as enum ('ZAR','USD','GBP','EUR'); exception when duplicate_object then null; end $$;
do $$ begin create type attendance_status as enum ('present','absent','late','early_departure','excused_absence'); exception when duplicate_object then null; end $$;
do $$ begin create type correction_issue as enum ('missed_clock_in','missed_clock_out','wrong_time','other'); exception when duplicate_object then null; end $$;
do $$ begin create type correction_status as enum ('pending','approved','rejected'); exception when duplicate_object then null; end $$;
do $$ begin create type device_connection as enum ('connected','disconnected','syncing'); exception when duplicate_object then null; end $$;
do $$ begin create type movement_level as enum ('low','moderate','high'); exception when duplicate_object then null; end $$;
do $$ begin create type risk_level as enum ('low','moderate','high'); exception when duplicate_object then null; end $$;
do $$ begin create type fatigue_alert_type as enum ('fatigue_risk','heat_stress','overtime_threshold','irregular_pattern'); exception when duplicate_object then null; end $$;
do $$ begin create type alert_severity as enum ('info','warning','critical'); exception when duplicate_object then null; end $$;
do $$ begin create type activity_event as enum ('clock_in','clock_out','break_start','break_end','device_sync','alert_triggered','shift_start','shift_end'); exception when duplicate_object then null; end $$;
do $$ begin create type pattern_type as enum ('attendance','working_hour','team','site'); exception when duplicate_object then null; end $$;
do $$ begin create type notification_type as enum ('fatigue_alert','late_arrival','device_disconnection','weekly_summary','correction_response','attendance_update'); exception when duplicate_object then null; end $$;
do $$ begin create type report_type as enum ('workforce','attendance','working_hours','estimated_earnings','fatigue','activity_patterns','devices','management_summary'); exception when duplicate_object then null; end $$;
do $$ begin create type report_format as enum ('PDF','CSV','XLSX'); exception when duplicate_object then null; end $$;
do $$ begin create type report_status as enum ('pending','generating','completed','failed'); exception when duplicate_object then null; end $$;
do $$ begin create type rule_type as enum ('shift','pay','fatigue','attendance'); exception when duplicate_object then null; end $$;

-- ─── HELPERS ────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ─── CORE IDENTITY & ORGANIZATION ───────────────────────────────────────────
create table if not exists public.organizations (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  industry        org_industry default 'other',
  currency        currency_code default 'ZAR',
  country         text default 'South Africa',
  timezone        text default 'Africa/Johannesburg',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  email           text unique not null,
  role            user_role not null default 'employee',
  status          employee_status not null default 'active',
  first_name      text,
  last_name       text,
  phone           text,
  language        text default 'English',
  last_login      timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists public.sites (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  location        text,
  timezone        text default 'Africa/Johannesburg',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ─── WORKFORCE MANAGEMENT ───────────────────────────────────────────────────
create table if not exists public.employees (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles(id) on delete set null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id         uuid references public.sites(id) on delete set null,
  status          employee_status not null default 'active',
  role_title      text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists public.shifts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id         uuid references public.sites(id) on delete set null,
  name            text not null,
  start_time      time not null,
  end_time        time not null,
  break_duration  integer default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists public.shift_assignments (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  shift_id        uuid not null references public.shifts(id) on delete cascade,
  employee_id     uuid not null references public.employees(id) on delete cascade,
  assigned_date   date not null,
  created_at      timestamptz default now(),
  unique (shift_id, employee_id, assigned_date)
);

-- ─── ATTENDANCE & TIME TRACKING ─────────────────────────────────────────────
create table if not exists public.attendance_records (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references public.organizations(id) on delete cascade,
  employee_id          uuid not null references public.employees(id) on delete cascade,
  site_id              uuid references public.sites(id) on delete set null,
  shift_id             uuid references public.shifts(id) on delete set null,
  date                 date not null,
  clock_in_time        timestamptz,
  clock_out_time       timestamptz,
  status               attendance_status default 'present',
  hours_worked         numeric(5,2) default 0,
  regular_hours        numeric(5,2) default 0,
  overtime_hours       numeric(5,2) default 0,
  late_minutes         integer default 0,
  correction_requested boolean default false,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now(),
  unique (employee_id, date)
);

create table if not exists public.correction_requests (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  attendance_id    uuid not null references public.attendance_records(id) on delete cascade,
  employee_id      uuid not null references public.employees(id) on delete cascade,
  issue_type       correction_issue not null,
  requested_change text not null,
  reason           text not null,
  status           correction_status not null default 'pending',
  resolved_by_id   uuid references public.profiles(id) on delete set null,
  created_at       timestamptz default now(),
  resolved_at      timestamptz
);

-- ─── EARNINGS & PAY ─────────────────────────────────────────────────────────
create table if not exists public.pay_rates (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  site_id             uuid references public.sites(id) on delete set null,
  employee_id         uuid references public.employees(id) on delete cascade,
  rate_per_hour       numeric(10,2) not null,
  overtime_multiplier numeric(3,2) default 1.5,
  effective_date      date not null,
  end_date            date,
  created_at          timestamptz default now()
);

create table if not exists public.earnings_records (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  employee_id       uuid not null references public.employees(id) on delete cascade,
  period_start      date not null,
  period_end        date not null,
  regular_hours     numeric(7,2) default 0,
  overtime_hours    numeric(7,2) default 0,
  regular_earnings  numeric(12,2) default 0,
  overtime_earnings numeric(12,2) default 0,
  total_earnings    numeric(12,2) default 0,
  currency          currency_code default 'ZAR',
  created_at        timestamptz default now(),
  unique (employee_id, period_start, period_end)
);

-- ─── DEVICES & BIOMETRICS ───────────────────────────────────────────────────
create table if not exists public.devices (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  device_id         text unique not null,
  site_id           uuid references public.sites(id) on delete set null,
  employee_id       uuid references public.employees(id) on delete set null,
  connection_status device_connection default 'disconnected',
  battery_level     integer default 0 check (battery_level between 0 and 100),
  last_sync_time    timestamptz,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create table if not exists public.biometric_readings (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  device_id        uuid not null references public.devices(id) on delete cascade,
  employee_id      uuid not null references public.employees(id) on delete cascade,
  site_id          uuid references public.sites(id) on delete set null,
  reading_time     timestamptz not null default now(),
  heart_rate       integer,
  hrv              integer,
  skin_temperature numeric(4,1),
  movement         movement_level,
  activity_score   integer check (activity_score between 0 and 100),
  created_at       timestamptz default now()
);

-- ─── FATIGUE MONITORING ─────────────────────────────────────────────────────
create table if not exists public.fatigue_assessments (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  employee_id      uuid not null references public.employees(id) on delete cascade,
  site_id          uuid references public.sites(id) on delete set null,
  assessed_at      timestamptz not null default now(),
  risk_level       risk_level not null,
  fatigue_score    numeric(5,2) check (fatigue_score between 0 and 100),
  heart_rate_avg   integer,
  hrv_avg          integer,
  temperature_avg  numeric(4,1),
  movement_pattern text,
  factors          jsonb default '[]'::jsonb,
  created_at       timestamptz default now()
);

create table if not exists public.fatigue_alerts (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  employee_id      uuid not null references public.employees(id) on delete cascade,
  site_id          uuid references public.sites(id) on delete set null,
  alert_type       fatigue_alert_type not null default 'fatigue_risk',
  risk_level       risk_level not null,
  message          text,
  severity         alert_severity not null default 'warning',
  acknowledged     boolean default false,
  acknowledged_at  timestamptz,
  acknowledged_by  uuid references public.profiles(id) on delete set null,
  created_at       timestamptz default now()
);

-- ─── ACTIVITY & PATTERNS ────────────────────────────────────────────────────
create table if not exists public.activity_logs (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  employee_id      uuid references public.employees(id) on delete cascade,
  site_id          uuid references public.sites(id) on delete set null,
  event_type       activity_event not null,
  event_time       timestamptz not null default now(),
  metadata         jsonb default '{}'::jsonb,
  created_at       timestamptz default now()
);

create table if not exists public.activity_patterns (
  id                      uuid primary key default gen_random_uuid(),
  organization_id         uuid not null references public.organizations(id) on delete cascade,
  site_id                 uuid references public.sites(id) on delete set null,
  pattern                 pattern_type not null,
  entity_id               uuid,
  date_range_start        date,
  date_range_end          date,
  peak_hours              text[],
  average_attendance_rate numeric(5,2),
  observations            text,
  created_at              timestamptz default now()
);

-- ─── NOTIFICATIONS ──────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  notification_type notification_type not null,
  title             text not null,
  message           text,
  related_entity_id uuid,
  read_at           timestamptz,
  created_at        timestamptz default now()
);

create table if not exists public.notification_preferences (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.profiles(id) on delete cascade,
  fatigue_alerts        boolean default true,
  late_arrivals         boolean default true,
  device_disconnections boolean default true,
  weekly_summary        boolean default true,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now(),
  unique (user_id)
);

-- ─── AUDIT & COMPLIANCE ─────────────────────────────────────────────────────
create table if not exists public.audit_logs (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  actor_id         uuid references public.profiles(id) on delete set null,
  action           text not null,
  target_type      text,
  target_id        uuid,
  target_name      text,
  site_id          uuid references public.sites(id) on delete set null,
  changes          jsonb,
  ip_address       inet,
  user_agent       text,
  created_at       timestamptz default now()
);

-- ─── SYSTEM CONFIGURATION ───────────────────────────────────────────────────
create table if not exists public.company_settings (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  setting_key     text not null,
  setting_value   jsonb,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (organization_id, setting_key)
);

create table if not exists public.workforce_rules (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  rule            rule_type not null,
  rule_name       text not null,
  description     text,
  rule_definition jsonb,
  enabled         boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ─── REPORTS ────────────────────────────────────────────────────────────────
create table if not exists public.reports (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  created_by_id    uuid references public.profiles(id) on delete set null,
  report_type      report_type not null,
  name             text,
  date_range_start date,
  date_range_end   date,
  site_id          uuid references public.sites(id) on delete set null,
  format           report_format default 'PDF',
  file_path        text,
  status           report_status default 'pending',
  error_message    text,
  created_at       timestamptz default now(),
  generated_at     timestamptz
);

-- ─── INDEXES ────────────────────────────────────────────────────────────────
create index if not exists idx_profiles_org on public.profiles(organization_id);
create index if not exists idx_sites_org on public.sites(organization_id);
create index if not exists idx_employees_org on public.employees(organization_id);
create index if not exists idx_employees_site on public.employees(site_id);
create index if not exists idx_employees_user on public.employees(user_id);
create index if not exists idx_shifts_org on public.shifts(organization_id);
create index if not exists idx_shift_assignments_shift on public.shift_assignments(shift_id);
create index if not exists idx_shift_assignments_emp on public.shift_assignments(employee_id);
create index if not exists idx_attendance_org on public.attendance_records(organization_id);
create index if not exists idx_attendance_emp on public.attendance_records(employee_id);
create index if not exists idx_attendance_date on public.attendance_records(date);
create index if not exists idx_corrections_emp on public.correction_requests(employee_id);
create index if not exists idx_corrections_status on public.correction_requests(status);
create index if not exists idx_pay_rates_org on public.pay_rates(organization_id);
create index if not exists idx_earnings_emp on public.earnings_records(employee_id);
create index if not exists idx_devices_org on public.devices(organization_id);
create index if not exists idx_devices_emp on public.devices(employee_id);
create index if not exists idx_biometric_emp on public.biometric_readings(employee_id);
create index if not exists idx_biometric_time on public.biometric_readings(reading_time);
create index if not exists idx_fatigue_assess_emp on public.fatigue_assessments(employee_id);
create index if not exists idx_fatigue_alerts_emp on public.fatigue_alerts(employee_id);
create index if not exists idx_fatigue_alerts_ack on public.fatigue_alerts(acknowledged);
create index if not exists idx_activity_logs_emp on public.activity_logs(employee_id);
create index if not exists idx_activity_logs_time on public.activity_logs(event_time);
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_audit_org on public.audit_logs(organization_id);
create index if not exists idx_reports_org on public.reports(organization_id);

-- ─── updated_at TRIGGERS ────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'organizations','profiles','sites','employees','shifts',
    'attendance_records','devices','notification_preferences',
    'company_settings','workforce_rules'
  ] loop
    execute format('drop trigger if exists trg_set_updated_at on public.%I', t);
    execute format('create trigger trg_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────────────
-- Current user's organization (SECURITY DEFINER bypasses RLS to avoid recursion)
create or replace function public.current_org_id()
returns uuid language plpgsql stable security definer set search_path = public as $$
declare oid uuid;
begin
  select organization_id into oid from public.profiles where id = auth.uid();
  return oid;
end $$;

-- Organization-scoped tables: members of the same org get full access.
do $$
declare t text;
begin
  foreach t in array array[
    'sites','employees','shifts','shift_assignments','attendance_records',
    'correction_requests','pay_rates','earnings_records','devices',
    'biometric_readings','fatigue_assessments','fatigue_alerts',
    'activity_logs','activity_patterns','audit_logs','company_settings',
    'workforce_rules','reports'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists org_members on public.%I', t);
    execute format(
      'create policy org_members on public.%I for all to authenticated using (organization_id = public.current_org_id()) with check (organization_id = public.current_org_id())', t);
  end loop;
end $$;

-- organizations
alter table public.organizations enable row level security;
drop policy if exists org_select on public.organizations;
create policy org_select on public.organizations for select to authenticated using (id = public.current_org_id());
drop policy if exists org_insert on public.organizations;
create policy org_insert on public.organizations for insert to authenticated with check (true);
drop policy if exists org_update on public.organizations;
create policy org_update on public.organizations for update to authenticated using (id = public.current_org_id()) with check (id = public.current_org_id());

-- profiles
alter table public.profiles enable row level security;
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (organization_id = public.current_org_id() or id = auth.uid());
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- notifications & preferences (user-scoped)
alter table public.notifications enable row level security;
drop policy if exists notifications_own on public.notifications;
create policy notifications_own on public.notifications for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.notification_preferences enable row level security;
drop policy if exists notif_prefs_own on public.notification_preferences;
create policy notif_prefs_own on public.notification_preferences for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─── REALTIME ───────────────────────────────────────────────────────────────
-- Add every table to the supabase_realtime publication with full row images.
do $$
declare t text;
begin
  foreach t in array array[
    'organizations','profiles','sites','employees','shifts','shift_assignments',
    'attendance_records','correction_requests','pay_rates','earnings_records',
    'devices','biometric_readings','fatigue_assessments','fatigue_alerts',
    'activity_logs','activity_patterns','notifications','notification_preferences',
    'audit_logs','company_settings','workforce_rules','reports'
  ] loop
    execute format('alter table public.%I replica identity full', t);
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ─── AUTO-PROVISION PROFILE ON SIGNUP ───────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'employee')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
