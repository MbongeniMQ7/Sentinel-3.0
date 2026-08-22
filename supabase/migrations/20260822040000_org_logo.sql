-- Company logo support: a column on organizations to store the public URL, and
-- a public storage bucket ("org-logos") that org members can upload to. Files
-- are namespaced by organization id: "<org_id>/logo.<ext>".

alter table public.organizations
  add column if not exists logo_url text;

-- Public bucket so logos can be shown via a plain URL (e.g. in emails / the app).
insert into storage.buckets (id, name, public)
values ('org-logos', 'org-logos', true)
on conflict (id) do nothing;

-- Anyone may read logos (bucket is public).
drop policy if exists org_logos_read on storage.objects;
create policy org_logos_read on storage.objects
  for select to public
  using (bucket_id = 'org-logos');

-- Only authenticated members may write into their own organization's folder.
drop policy if exists org_logos_insert on storage.objects;
create policy org_logos_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

drop policy if exists org_logos_update on storage.objects;
create policy org_logos_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  )
  with check (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

drop policy if exists org_logos_delete on storage.objects;
create policy org_logos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );
