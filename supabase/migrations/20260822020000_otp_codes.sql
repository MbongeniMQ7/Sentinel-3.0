-- Custom OTP storage for the Sentinel-AI sign-in flow.
-- Codes are always exactly 6 digits, hashed at rest, single-use and short-lived.
-- Only the service_role (used by the request-otp / verify-otp edge functions)
-- may read or write this table — no RLS policies are granted to end users.
create table if not exists public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed boolean not null default false,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_otp_codes_email on public.otp_codes (lower(email));
create index if not exists idx_otp_codes_expires on public.otp_codes (expires_at);

alter table public.otp_codes enable row level security;
-- Intentionally no policies: only the service_role key (which bypasses RLS)
-- can access these rows.

-- Returns true when an email has been provisioned by an admin, i.e. it already
-- has a profile OR it exists as an invited employee/manager. Used by the
-- request-otp edge function to block sign-in attempts from unknown addresses.
create or replace function public.is_registered_email(p_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles  where lower(email) = lower(p_email))
      or exists (select 1 from public.employees where lower(email) = lower(p_email));
$$;
