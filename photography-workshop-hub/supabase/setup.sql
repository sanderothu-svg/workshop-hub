-- Compare Workshop - initial schema + RLS + storage policies
-- Run this in Supabase SQL Editor (one time).

create extension if not exists "pgcrypto";

-- 1) Core workshop table
create table if not exists public.workshops (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled Workshop',
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Photographers in a workshop
create table if not exists public.photographers (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- 3) Uploaded photos metadata
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  photographer_id uuid not null references public.photographers(id) on delete cascade,
  storage_path text not null,
  original_filename text,
  width int,
  height int,
  created_at timestamptz not null default now()
);

-- 4) Setup categories/themes
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  round_index int not null,
  theme text not null,
  created_at timestamptz not null default now(),
  unique (workshop_id, round_index)
);

-- 5) One selected photo per photographer per category
create table if not exists public.selections (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  photographer_id uuid not null references public.photographers(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete cascade,
  is_starred boolean not null default false,
  created_at timestamptz not null default now(),
  unique (category_id, photographer_id)
);

-- 6) Helpful indexes
create index if not exists idx_workshops_owner on public.workshops(owner_user_id);
create index if not exists idx_photographers_workshop on public.photographers(workshop_id);
create index if not exists idx_photos_workshop on public.photos(workshop_id);
create index if not exists idx_photos_photographer on public.photos(photographer_id);
create index if not exists idx_categories_workshop on public.categories(workshop_id);
create index if not exists idx_selections_category on public.selections(category_id);
create index if not exists idx_selections_workshop on public.selections(workshop_id);

-- 7) Enable RLS
alter table public.workshops enable row level security;
alter table public.photographers enable row level security;
alter table public.photos enable row level security;
alter table public.categories enable row level security;
alter table public.selections enable row level security;

-- 8) RLS policies (owner-based)
drop policy if exists workshops_owner_all on public.workshops;
create policy workshops_owner_all on public.workshops
for all
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists photographers_owner_all on public.photographers;
create policy photographers_owner_all on public.photographers
for all
to authenticated
using (
  exists (
    select 1 from public.workshops w
    where w.id = photographers.workshop_id
      and w.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workshops w
    where w.id = photographers.workshop_id
      and w.owner_user_id = auth.uid()
  )
);

drop policy if exists photos_owner_all on public.photos;
create policy photos_owner_all on public.photos
for all
to authenticated
using (
  exists (
    select 1 from public.workshops w
    where w.id = photos.workshop_id
      and w.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workshops w
    where w.id = photos.workshop_id
      and w.owner_user_id = auth.uid()
  )
);

drop policy if exists categories_owner_all on public.categories;
create policy categories_owner_all on public.categories
for all
to authenticated
using (
  exists (
    select 1 from public.workshops w
    where w.id = categories.workshop_id
      and w.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workshops w
    where w.id = categories.workshop_id
      and w.owner_user_id = auth.uid()
  )
);

drop policy if exists selections_owner_all on public.selections;
create policy selections_owner_all on public.selections
for all
to authenticated
using (
  exists (
    select 1 from public.workshops w
    where w.id = selections.workshop_id
      and w.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workshops w
    where w.id = selections.workshop_id
      and w.owner_user_id = auth.uid()
  )
);

-- 9) Storage bucket + policies
insert into storage.buckets (id, name, public)
values ('workshop-photos', 'workshop-photos', false)
on conflict (id) do nothing;

drop policy if exists workshop_photos_select on storage.objects;
create policy workshop_photos_select on storage.objects
for select
to authenticated
using (bucket_id = 'workshop-photos');

drop policy if exists workshop_photos_insert on storage.objects;
create policy workshop_photos_insert on storage.objects
for insert
to authenticated
with check (bucket_id = 'workshop-photos');

drop policy if exists workshop_photos_update on storage.objects;
create policy workshop_photos_update on storage.objects
for update
to authenticated
using (bucket_id = 'workshop-photos')
with check (bucket_id = 'workshop-photos');

drop policy if exists workshop_photos_delete on storage.objects;
create policy workshop_photos_delete on storage.objects
for delete
to authenticated
using (bucket_id = 'workshop-photos');
