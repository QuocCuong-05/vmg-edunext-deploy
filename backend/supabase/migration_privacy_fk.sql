-- ============================================================
-- VMG EduNext — quyền riêng tư: khử nhận dạng khi user bị xóa
-- 1. Bỏ NOT NULL trên user_id của 3 bảng (để có thể ẩn danh hóa)
-- 2. Trigger chạy tự động khi xóa bất kỳ user nào (web hoặc dashboard):
--    - consent_log: giữ lịch sử đồng ý ẩn danh (user_id = null, ip = null)
--    - lesson_progress / quiz_attempts: giữ dữ liệu học tập ẩn danh
-- Chạy 1 lần trên Supabase SQL Editor (cả staging + production)
-- ============================================================

alter table public.consent_log alter column user_id drop not null;
alter table public.lesson_progress alter column user_id drop not null;
alter table public.quiz_attempts alter column user_id drop not null;

create or replace function public.handle_user_anonymize()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.consent_log set user_id = null, ip = null where user_id = old.id;
  update public.lesson_progress set user_id = null where user_id = old.id;
  update public.quiz_attempts set user_id = null where user_id = old.id;
  return old;
end;
$$;

drop trigger if exists trg_anonymize_on_user_delete on auth.users;
create trigger trg_anonymize_on_user_delete
  before delete on auth.users
  for each row execute function public.handle_user_anonymize();
