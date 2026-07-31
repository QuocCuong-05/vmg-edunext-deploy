-- ============================================================
-- VMG EduNext — Migration: add school, ward to profiles
-- Chạy 1 lần trên Supabase SQL Editor (cả staging + production)
-- ============================================================

alter table public.profiles add column if not exists school text;
alter table public.profiles add column if not exists ward text;
