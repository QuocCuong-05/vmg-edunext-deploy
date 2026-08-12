-- ============================================================
-- VMG EduNext — access_log + login_sessions (truy vết hoạt động & thiết bị)
-- Chạy 1 lần trên Supabase SQL Editor (cả staging + production)
-- Lưu ý: chạy SAU migration_privacy_fk.sql (trigger handle_user_anonymize)
-- ============================================================

-- Bảng lịch sử đăng nhập theo thiết bị (PII — xóa khi user bị xóa)
create table if not exists public.login_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  ip              text,
  user_agent      text,
  device_name     text,
  logged_in_at    timestamptz not null default now(),
  last_active_at  timestamptz not null default now()
);

create index if not exists idx_login_sessions_user
  on public.login_sessions(user_id, logged_in_at desc);

-- Bảng event log hoạt động (giữ ẩn danh khi user bị xóa)
create table if not exists public.access_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  event       text not null,
  description text,
  origin      text not null default 'web',
  ip          text,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_access_log_user
  on public.access_log(user_id, created_at desc);

alter table public.access_log enable row level security;
drop policy if exists "access_log_select_own" on public.access_log;
create policy "access_log_select_own" on public.access_log
  for select using (user_id = auth.uid());

-- Cập nhật trigger khử nhận dạng: login_sessions xóa hẳn, access_log ẩn danh
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
  return old;
end;
$$;

drop trigger if exists trg_anonymize_on_user_delete on auth.users;
create trigger trg_anonymize_on_user_delete
  before delete on auth.users
  for each row execute function public.handle_user_anonymize();
