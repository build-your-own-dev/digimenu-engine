-- Menuva media upload migration
-- Run once in Supabase > SQL Editor for an existing Menuva project.

alter table public.restaurants add column if not exists logo_url text;
alter table public.restaurants add column if not exists banner_url text;
alter table public.menu_items add column if not exists image_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-assets', 'menu-assets', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Menu assets are public" on storage.objects;
create policy "Menu assets are public"
on storage.objects for select
using (bucket_id = 'menu-assets');

drop policy if exists "Owners upload menu assets" on storage.objects;
create policy "Owners upload menu assets"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'menu-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Owners update menu assets" on storage.objects;
create policy "Owners update menu assets"
on storage.objects for update to authenticated
using (
  bucket_id = 'menu-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'menu-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Owners delete menu assets" on storage.objects;
create policy "Owners delete menu assets"
on storage.objects for delete to authenticated
using (
  bucket_id = 'menu-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);
