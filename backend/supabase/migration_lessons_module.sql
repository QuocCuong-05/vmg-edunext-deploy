-- ============================================================
-- VMG EduNext — Thêm cột module cho lessons (nhóm bài theo module)
-- Chạy 1 lần trên Supabase SQL Editor (cả staging + production)
-- ============================================================

alter table public.lessons add column if not exists module text;
