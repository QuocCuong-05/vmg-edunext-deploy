-- ============================================================
-- VMG EduNext — Migration: add topic column to community_posts
-- Chạy 1 lần trên Supabase SQL Editor (cả staging + production)
-- ============================================================

alter table public.community_posts add column if not exists topic text default 'General';
create index if not exists idx_community_posts_topic on public.community_posts(topic);
