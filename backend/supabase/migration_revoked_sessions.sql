-- ============================================================
-- VMG EduNext — đăng xuất từng thiết bị: bảng revocation tự chủ
-- Không phụ thuộc cơ chế session của GoTrue (single-session/replay)
-- Chạy 1 lần trên Supabase SQL Editor (cả staging + production)
-- ============================================================

create table if not exists public.revoked_sessions (
  session_id uuid primary key,
  user_id    uuid,
  created_at timestamptz not null default now()
);

grant all privileges on public.revoked_sessions to anon, authenticated, service_role;

-- dọn revoked_sessions khi user bị khử nhận dạng
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
  update public.access_log set user_id = null, ip = null, user_agent = null where user_id = old.id;
  delete from public.login_sessions where user_id = old.id;
  delete from public.revoked_sessions where user_id = old.id;
  return old;
end;
$$;

drop trigger if exists trg_anonymize_on_user_delete on auth.users;
create trigger trg_anonymize_on_user_delete
  before delete on auth.users
  for each row execute function public.handle_user_anonymize();
