-- Employee profile photos: a column on employees for the public URL, plus a
-- public storage bucket ("employee-photos") that org members can upload to.
-- Files are namespaced by organization id: "<org_id>/<file>".

alter table public.employees
  add column if not exists photo_url text;

insert into storage.buckets (id, name, public)
values ('employee-photos', 'employee-photos', true)
on conflict (id) do nothing;

-- Anyone may read photos (bucket is public).
drop policy if exists employee_photos_read on storage.objects;
create policy employee_photos_read on storage.objects
  for select to public
  using (bucket_id = 'employee-photos');

-- Only authenticated members may write into their own organization's folder.
drop policy if exists employee_photos_insert on storage.objects;
create policy employee_photos_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'employee-photos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

drop policy if exists employee_photos_update on storage.objects;
create policy employee_photos_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'employee-photos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  )
  with check (
    bucket_id = 'employee-photos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

drop policy if exists employee_photos_delete on storage.objects;
create policy employee_photos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'employee-photos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );
