-- ============================================================
-- VMG EduNext — Bảng wards (xã/phường 2025) + schools (trường học)
-- Chạy 1 lần trên Supabase SQL Editor (cả staging + production)
-- ============================================================

create table if not exists public.wards (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists public.schools (
  id        uuid primary key default gen_random_uuid(),
  name      text not null unique,
  ward_name text,
  level     text
);

alter table public.wards enable row level security;
drop policy if exists "wards_select_all" on public.wards;
create policy "wards_select_all" on public.wards for select using (true);

alter table public.schools enable row level security;
drop policy if exists "schools_select_all" on public.schools;
create policy "schools_select_all" on public.schools for select using (true);

grant all privileges on public.wards, public.schools to service_role;
grant select on public.wards, public.schools to anon, authenticated;
