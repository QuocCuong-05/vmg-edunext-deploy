-- ============================================================
-- VMG EduNext — Tài khoản Plus (subscription) + ai_usage + quiz_attempts
-- YÊU CẦU: chạy migration_plus_enum.sql TRƯỚC (enum 'premium')
-- Chạy 1 lần trên Supabase SQL Editor (cả staging + production)
-- ============================================================

-- 1. profiles.last_active_at — phục vụ KPI "user hoạt động"
alter table public.profiles add column if not exists last_active_at timestamptz;

-- 2. rewards: nhóm quà dành riêng cho hạng Plus
alter table public.rewards add column if not exists tier text not null default 'free';

-- 3. orders mở rộng: bán gói Plus (item_type='plus'), course_id không bắt buộc
alter table public.orders add column if not exists item_type text not null default 'course';
alter table public.orders add column if not exists plan text;
alter table public.orders add column if not exists period integer;
alter table public.orders alter column course_id drop not null;

-- 4. subscriptions — tài khoản Plus
create table if not exists public.subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  plan       text not null default 'plus',
  period     integer not null default 1,
  price      integer,
  status     text not null default 'active',
  start_at   timestamptz not null default now(),
  end_at     timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_subs_user   on public.subscriptions(user_id);
create index if not exists idx_subs_status on public.subscriptions(status);
create index if not exists idx_subs_end    on public.subscriptions(end_at);

alter table public.subscriptions enable row level security;
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select using (user_id = auth.uid());

-- 5. ai_usage — đếm lượt AI theo ngày/tuần (chỉ backend ghi)
create table if not exists public.ai_usage (
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null,
  period_key text not null,
  count      integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, period_key)
);
alter table public.ai_usage enable row level security;

-- RPC tăng lượt (atomic, trả count mới) — múi giờ UTC+7, tuần tính từ thứ 2
create or replace function public.increment_ai_usage(p_user uuid, p_kind text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key  text;
  v_count integer;
begin
  if p_kind = 'lesson_plan' then
    v_key := to_char(date_trunc('week', now() + interval '7 hours'), 'YYYY-MM-DD');
  else
    v_key := to_char(now() + interval '7 hours', 'YYYY-MM-DD');
  end if;
  insert into public.ai_usage (user_id, kind, period_key, count, updated_at)
  values (p_user, p_kind, v_key, 1, now())
  on conflict (user_id, kind, period_key) do update
    set count = public.ai_usage.count + 1, updated_at = now()
  returning count into v_count;
  return v_count;
end;
$$;
grant execute on function public.increment_ai_usage(uuid, text) to service_role;

-- 6. quiz_attempts — lịch sử làm bài (lưu ẩn cho cả Free, hiển thị cho Plus)
create table if not exists public.quiz_attempts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  quiz_set_id     uuid not null references public.quiz_sets(id) on delete cascade,
  score           numeric(5,2) not null,
  total_questions integer not null default 0,
  correct_answers integer not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists idx_quiz_att_user on public.quiz_attempts(user_id, created_at desc);

alter table public.quiz_attempts enable row level security;
drop policy if exists "quiz_attempts_select_own" on public.quiz_attempts;
create policy "quiz_attempts_select_own" on public.quiz_attempts
  for select using (user_id = auth.uid());

-- 7. RPC giới hạn sổ từ: Free <= 100 từ, Plus không giới hạn
create or replace function public.check_wordbook_limit(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plus  boolean;
  v_count bigint;
begin
  select exists (
    select 1 from public.subscriptions
    where user_id = p_user_id and status = 'active' and end_at > now()
  ) into v_plus;
  if v_plus then
    return true;
  end if;
  select count(*) into v_count from public.user_vocabulary where user_id = p_user_id;
  return v_count < 100;
end;
$$;
grant execute on function public.check_wordbook_limit(uuid) to authenticated, service_role;

-- 8. Giá gói Plus (đồng bộ bảng giá đã chốt)
insert into public.app_settings (key, value) values
  ('plus_prices', '{"1":59000,"3":147000,"6":264000,"12":399000}'::jsonb)
on conflict (key) do nothing;

-- 9. Chuyển khóa bán lẻ cũ → 'premium' (mở toàn bộ khi có Plus, không bán lẻ)
update public.courses
   set access_type = 'premium', price = null, sale_price = null
 where access_type = 'paid';

-- 10. GRANT (phòng lỗi 42501 — bài học cũ)
grant all privileges on public.subscriptions, public.ai_usage, public.quiz_attempts to service_role;
grant select on public.subscriptions to authenticated;
grant select on public.quiz_attempts to authenticated;
