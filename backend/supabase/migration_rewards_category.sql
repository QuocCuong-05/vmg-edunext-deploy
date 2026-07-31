-- ============================================================
-- VMG EduNext — Migration: add category column to rewards
-- Chạy 1 lần trên Supabase SQL Editor (cả staging + production)
-- ============================================================

alter table public.rewards add column if not exists category text default 'hoc_lieu';
