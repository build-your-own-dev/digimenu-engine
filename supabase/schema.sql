-- Menuva database schema
-- Run this file once in Supabase > SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  location text,
  currency text not null default 'CHF' check (char_length(currency) = 3),
  accent_color text not null default '#ff6038',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  description text,
  price numeric(10,2) not null check (price >= 0),
  available boolean not null default true,
  vegetarian boolean not null default false,
  vegan boolean not null default false,
  spicy boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Media fields (safe to run for existing Menuva projects)
alter table public.restaurants add column if not exists logo_url text;
alter table public.restaurants add column if not exists banner_url text;
alter table public.menu_items add column if not exists image_url text;

-- Public assets; owners may only write inside their own user-id folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-assets', 'menu-assets', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Menu assets are public" on storage.objects;
create policy "Menu assets are public" on storage.objects for select
using (bucket_id = 'menu-assets');

drop policy if exists "Owners upload menu assets" on storage.objects;
create policy "Owners upload menu assets" on storage.objects for insert to authenticated
with check (bucket_id = 'menu-assets' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Owners update menu assets" on storage.objects;
create policy "Owners update menu assets" on storage.objects for update to authenticated
using (bucket_id = 'menu-assets' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'menu-assets' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Owners delete menu assets" on storage.objects;
create policy "Owners delete menu assets" on storage.objects for delete to authenticated
using (bucket_id = 'menu-assets' and (storage.foldername(name))[1] = auth.uid()::text);

create index if not exists categories_restaurant_idx on public.categories(restaurant_id, sort_order);
create index if not exists menu_items_restaurant_idx on public.menu_items(restaurant_id, category_id, sort_order);
create index if not exists restaurants_slug_idx on public.restaurants(slug);

alter table public.restaurants enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;

create policy "Published restaurants are public"
on public.restaurants for select
using (published = true or owner_id = auth.uid());

create policy "Users create their own restaurant"
on public.restaurants for insert
with check (owner_id = auth.uid());

create policy "Owners update their restaurant"
on public.restaurants for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Owners delete their restaurant"
on public.restaurants for delete
using (owner_id = auth.uid());

create policy "Published categories are public"
on public.categories for select
using (exists (
  select 1 from public.restaurants r
  where r.id = restaurant_id and (r.published = true or r.owner_id = auth.uid())
));

create policy "Owners create categories"
on public.categories for insert
with check (exists (
  select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid()
));

create policy "Owners update categories"
on public.categories for update
using (exists (
  select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid()
));

create policy "Owners delete categories"
on public.categories for delete
using (exists (
  select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid()
));

create policy "Published menu items are public"
on public.menu_items for select
using (exists (
  select 1 from public.restaurants r
  where r.id = restaurant_id and (r.published = true or r.owner_id = auth.uid())
));

create policy "Owners create menu items"
on public.menu_items for insert
with check (exists (
  select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid()
));

create policy "Owners update menu items"
on public.menu_items for update
using (exists (
  select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid()
));

create policy "Owners delete menu items"
on public.menu_items for delete
using (exists (
  select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid()
));

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists restaurants_updated_at on public.restaurants;
create trigger restaurants_updated_at before update on public.restaurants
for each row execute function public.set_updated_at();

drop trigger if exists menu_items_updated_at on public.menu_items;
create trigger menu_items_updated_at before update on public.menu_items
for each row execute function public.set_updated_at();
