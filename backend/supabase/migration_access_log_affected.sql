-- ============================================================
-- VMG EduNext — affected_user_id cho event log (người bị ảnh hưởng)
-- Chạy 1 lần trên Supabase SQL Editor (cả staging + production)
-- ============================================================

alter table public.access_log add column affected_user_id uuid;
