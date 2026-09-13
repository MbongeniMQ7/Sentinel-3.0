-- Fixes the misspelled owner email from 20260914010000 (nqobilekmogelo -> nqobilekamogelo)
-- so the sign-in registration check recognises the correct address.
update public.employees
set email = 'nqobilekamogelo.27@gmail.com'
where lower(email) = 'nqobilekmogelo.27@gmail.com';

-- Safety net: if the original insert never ran (e.g. no organizations existed),
-- create the owner invite with the correct email.
insert into public.employees (organization_id, full_name, email, invited_role, status, role_title)
select o.id, 'Kamogelo Nqobile Ratsela', 'nqobilekamogelo.27@gmail.com', 'owner', 'active', 'Owner'
from public.organizations o
where not exists (
  select 1 from public.employees e where lower(e.email) = 'nqobilekamogelo.27@gmail.com'
)
order by o.created_at
limit 1;
