-- ============================================================
-- VMG EduNext — Thêm giá trị 'premium' cho enum course_access_type
-- PHẢI chạy TRƯỚC migration_plus_subscriptions.sql (PostgreSQL
-- không cho dùng enum value mới trong cùng transaction với ADD VALUE)
-- Chạy 1 lần trên Supabase SQL Editor (cả staging + production)
-- ============================================================

alter type public.course_access_type add value if not exists 'premium';
