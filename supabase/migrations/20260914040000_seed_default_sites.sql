-- Every organization must have at least one site: workspaces showed
-- "no sites available" because orgs created before onboarding captured a site
-- (or where the site step was skipped) had zero rows in public.sites.

-- 1) Seed a default site for any org without one.
insert into public.sites (organization_id, name, location, timezone)
select o.id, 'Main Site', coalesce(o.country, 'South Africa'), coalesce(o.timezone, 'Africa/Johannesburg')
from public.organizations o
where not exists (select 1 from public.sites s where s.organization_id = o.id);

-- 2) Attach unassigned employees to their org's first site.
update public.employees e
set site_id = fs.id
from (
  select distinct on (organization_id) organization_id, id
  from public.sites
  order by organization_id, created_at
) fs
where e.site_id is null
  and fs.organization_id = e.organization_id;

-- 3) Same for devices, so device/site views line up.
update public.devices d
set site_id = fs.id
from (
  select distinct on (organization_id) organization_id, id
  from public.sites
  order by organization_id, created_at
) fs
where d.site_id is null
  and fs.organization_id = d.organization_id;
