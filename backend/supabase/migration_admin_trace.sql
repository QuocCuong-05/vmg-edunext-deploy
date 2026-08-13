-- ============================================================
-- VMG EduNext — email trong profiles (cho admin truy vết)
-- Chạy 1 lần trên Supabase SQL Editor (cả staging + production)
-- ============================================================

alter table public.profiles add column email text;

update public.profiles p
set email = (select u.email from auth.users u where u.id = p.id)
where p.email is null;
