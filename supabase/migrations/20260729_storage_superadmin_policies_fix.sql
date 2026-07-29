drop policy if exists "Superadmin insert admin-media" on storage.objects;

create policy "Superadmin insert admin-media"
on storage.objects
for insert
to public
with check (
    bucket_id = 'admin-media'
    and public.is_superadmin()
);

drop policy if exists "Superadmin delete admin-media" on storage.objects;

create policy "Superadmin delete admin-media"
on storage.objects
for delete
to public
using (
    bucket_id = 'admin-media'
    and public.is_superadmin()
);
