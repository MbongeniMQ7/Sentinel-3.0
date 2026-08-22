-- ─── EMPLOYEE INVITES & PROFILE LINKING ─────────────────────────────────────
-- Employees are created by owners/managers before the person has an auth login.
-- We store their name/email/intended role directly on the employees row, then
-- link the auth user on first sign-in via claim_invite().

alter table public.employees
  add column if not exists full_name    text,
  add column if not exists email        text,
  add column if not exists invited_role user_role not null default 'employee';

create index if not exists idx_employees_email on public.employees (lower(email));

-- Links the currently authenticated user to any employee invite matching their
-- email, and syncs their profile organization + role. SECURITY DEFINER so a
-- brand-new user (who has no org yet, and therefore no RLS access) can still
-- resolve their invite.
create or replace function public.claim_invite()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uemail text;
  emp    public.employees%rowtype;
begin
  select email into uemail from auth.users where id = auth.uid();
  if uemail is null then
    return jsonb_build_object('claimed', false);
  end if;

  select * into emp
  from public.employees
  where lower(email) = lower(uemail) and user_id is null
  order by created_at
  limit 1;

  if emp.id is not null then
    update public.employees
      set user_id = auth.uid(), updated_at = now()
      where id = emp.id;

    update public.profiles
      set organization_id = emp.organization_id,
          role            = emp.invited_role,
          first_name      = coalesce(profiles.first_name, split_part(coalesce(emp.full_name, ''), ' ', 1)),
          updated_at      = now()
      where id = auth.uid();

    return jsonb_build_object('claimed', true, 'organization_id', emp.organization_id, 'role', emp.invited_role);
  end if;

  return jsonb_build_object('claimed', false);
end $$;

grant execute on function public.claim_invite() to authenticated;
