-- ============================================================
-- VMG EduNext — Cấp quyền bảng user_vocabulary (sổ từ)
-- Bảng tạo qua SQL editor thiếu GRANT -> service_role bị
-- "permission denied" (kể cả khi bypass RLS). Cần dán lên
-- Supabase SQL Editor (staging + production)
-- ============================================================

grant all privileges on table public.user_vocabulary to service_role;
grant select, insert, update, delete on table public.user_vocabulary to authenticated;
