-- Adds Kamogelo Nqobile Ratsela as an owner invite. claim_invite() links the
-- auth account and applies the owner role on their first sign-in.
insert into public.employees (organization_id, full_name, email, invited_role, status, role_title)
select o.id, 'Kamogelo Nqobile Ratsela', 'nqobilekmogelo.27@gmail.com', 'owner', 'active', 'Owner'
from public.organizations o
where not exists (
  select 1 from public.employees e where lower(e.email) = 'nqobilekmogelo.27@gmail.com'
)
order by o.created_at
limit 1;
