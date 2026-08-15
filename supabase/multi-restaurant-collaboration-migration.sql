-- Menuva multi-restaurant and collaboration migration
-- Run once in Supabase > SQL Editor.

-- One account may now own up to two restaurants instead of exactly one.
alter table public.restaurants drop constraint if exists restaurants_owner_id_key;

create table if not exists public.restaurant_collaborators (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  added_at timestamptz not null default now(),
  unique (restaurant_id, user_id)
);

create table if not exists public.restaurant_invites (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  used_by uuid references auth.users(id) on delete set null,
  used_at timestamptz
);

create index if not exists restaurant_collaborators_user_idx on public.restaurant_collaborators(user_id);
create index if not exists restaurant_invites_token_idx on public.restaurant_invites(token) where used_at is null;

alter table public.restaurant_collaborators enable row level security;
alter table public.restaurant_invites enable row level security;

create or replace function public.is_restaurant_member(target_restaurant uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.restaurants r
    where r.id = target_restaurant and r.owner_id = target_user
  ) or exists (
    select 1 from public.restaurant_collaborators c
    where c.restaurant_id = target_restaurant and c.user_id = target_user
  );
$$;

create or replace function public.is_restaurant_owner(target_restaurant uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.restaurants r
    where r.id = target_restaurant and r.owner_id = target_user
  );
$$;

create or replace function public.enforce_two_owned_restaurants()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.owner_id::text, 0));
  if (select count(*) from public.restaurants where owner_id = new.owner_id) >= 2 then
    raise exception 'Ein Account kann maximal zwei Restaurants besitzen.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_two_owned_restaurants_trigger on public.restaurants;
create trigger enforce_two_owned_restaurants_trigger
before insert on public.restaurants
for each row execute function public.enforce_two_owned_restaurants();

create or replace function public.prevent_restaurant_owner_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'Der Restaurant-Eigentümer kann nicht geändert werden.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_restaurant_owner_change_trigger on public.restaurants;
create trigger prevent_restaurant_owner_change_trigger
before update on public.restaurants
for each row execute function public.prevent_restaurant_owner_change();

-- Replace the original single-owner policies with owner/collaborator policies.
drop policy if exists "Published restaurants are public" on public.restaurants;
drop policy if exists "Owners update their restaurant" on public.restaurants;
drop policy if exists "Published restaurants and members can read" on public.restaurants;
drop policy if exists "Members update their restaurant" on public.restaurants;
create policy "Published restaurants and members can read"
on public.restaurants for select
using (published = true or public.is_restaurant_member(id));
create policy "Members update their restaurant"
on public.restaurants for update
using (public.is_restaurant_member(id))
with check (public.is_restaurant_member(id));

drop policy if exists "Published categories are public" on public.categories;
drop policy if exists "Owners create categories" on public.categories;
drop policy if exists "Owners update categories" on public.categories;
drop policy if exists "Owners delete categories" on public.categories;
drop policy if exists "Published categories and members can read" on public.categories;
drop policy if exists "Members create categories" on public.categories;
drop policy if exists "Members update categories" on public.categories;
drop policy if exists "Members delete categories" on public.categories;
create policy "Published categories and members can read"
on public.categories for select
using (exists (select 1 from public.restaurants r where r.id = restaurant_id and (r.published or public.is_restaurant_member(r.id))));
create policy "Members create categories"
on public.categories for insert with check (public.is_restaurant_member(restaurant_id));
create policy "Members update categories"
on public.categories for update using (public.is_restaurant_member(restaurant_id)) with check (public.is_restaurant_member(restaurant_id));
create policy "Members delete categories"
on public.categories for delete using (public.is_restaurant_member(restaurant_id));

drop policy if exists "Published menu items are public" on public.menu_items;
drop policy if exists "Owners create menu items" on public.menu_items;
drop policy if exists "Owners update menu items" on public.menu_items;
drop policy if exists "Owners delete menu items" on public.menu_items;
drop policy if exists "Published menu items and members can read" on public.menu_items;
drop policy if exists "Members create menu items" on public.menu_items;
drop policy if exists "Members update menu items" on public.menu_items;
drop policy if exists "Members delete menu items" on public.menu_items;
create policy "Published menu items and members can read"
on public.menu_items for select
using (exists (select 1 from public.restaurants r where r.id = restaurant_id and (r.published or public.is_restaurant_member(r.id))));
create policy "Members create menu items"
on public.menu_items for insert with check (public.is_restaurant_member(restaurant_id));
create policy "Members update menu items"
on public.menu_items for update using (public.is_restaurant_member(restaurant_id)) with check (public.is_restaurant_member(restaurant_id));
create policy "Members delete menu items"
on public.menu_items for delete using (public.is_restaurant_member(restaurant_id));

drop policy if exists "Members can view collaborators" on public.restaurant_collaborators;
create policy "Members can view collaborators"
on public.restaurant_collaborators for select
using (public.is_restaurant_member(restaurant_id));

drop policy if exists "Owners can remove collaborators" on public.restaurant_collaborators;
create policy "Owners can remove collaborators"
on public.restaurant_collaborators for delete
using (public.is_restaurant_owner(restaurant_id));

drop policy if exists "Owners manage invites" on public.restaurant_invites;
create policy "Owners manage invites"
on public.restaurant_invites for all
using (public.is_restaurant_owner(restaurant_id))
with check (public.is_restaurant_owner(restaurant_id) and created_by = auth.uid());

create or replace function public.redeem_restaurant_invite(invite_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_invite public.restaurant_invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Bitte zuerst anmelden.' using errcode = 'P0001';
  end if;

  select * into selected_invite
  from public.restaurant_invites
  where token = invite_token and used_at is null
  for update;

  if selected_invite.id is null then
    raise exception 'Dieser Einladungslink ist ungültig oder wurde bereits verwendet.' using errcode = 'P0001';
  end if;

  if public.is_restaurant_owner(selected_invite.restaurant_id) then
    raise exception 'Du bist bereits Eigentümer dieses Restaurants.' using errcode = 'P0001';
  end if;

  insert into public.restaurant_collaborators (restaurant_id, user_id)
  values (selected_invite.restaurant_id, auth.uid())
  on conflict (restaurant_id, user_id) do nothing;

  update public.restaurant_invites
  set used_by = auth.uid(), used_at = now()
  where id = selected_invite.id;

  return selected_invite.restaurant_id;
end;
$$;

grant execute on function public.redeem_restaurant_invite(uuid) to authenticated;

create or replace function public.get_restaurant_collaborators(target_restaurant uuid)
returns table (collaboration_id uuid, user_id uuid, email text, added_at timestamptz)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_restaurant_owner(target_restaurant) then
    raise exception 'Nur der Eigentümer kann Kollaboratoren verwalten.' using errcode = 'P0001';
  end if;

  return query
  select c.id, c.user_id, u.email::text, c.added_at
  from public.restaurant_collaborators c
  join auth.users u on u.id = c.user_id
  where c.restaurant_id = target_restaurant
  order by c.added_at;
end;
$$;

grant execute on function public.get_restaurant_collaborators(uuid) to authenticated;
