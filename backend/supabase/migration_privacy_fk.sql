-- ============================================================
-- VMG EduNext — quyền riêng tư: giữ dữ liệu ẩn danh khi user bị xóa
-- consent_log: lịch sử đồng ý là nghĩa vụ pháp lý → giữ lại ẩn danh (user_id = null)
-- lesson_progress / quiz_attempts: dữ liệu học tập phi PII → giữ ẩn danh
-- Chạy 1 lần trên Supabase SQL Editor (cả staging + production)
-- ============================================================

alter table public.consent_log
  drop constraint if exists consent_log_user_id_fkey,
  add constraint consent_log_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete set null;

alter table public.lesson_progress
  drop constraint if exists lesson_progress_user_id_fkey,
  add constraint lesson_progress_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete set null;

alter table public.quiz_attempts
  drop constraint if exists quiz_attempts_user_id_fkey,
  add constraint quiz_attempts_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete set null;
