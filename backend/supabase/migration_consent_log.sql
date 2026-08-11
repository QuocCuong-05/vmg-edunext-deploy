-- ============================================================
-- VMG EduNext — consent_log: lịch sử lựa chọn chính sách của user
-- Chạy 1 lần trên Supabase SQL Editor (cả staging + production)
-- ============================================================

create table if not exists public.consent_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  policy_key  text not null,
  version     integer not null default 1,
  accepted    boolean not null default false,
  ip          text,
  created_at  timestamptz not null default now(),
  unique (user_id, policy_key, version)
);

create index if not exists idx_consent_user on public.consent_log(user_id);

alter table public.consent_log enable row level security;
drop policy if exists "consent_select_own" on public.consent_log;
create policy "consent_select_own" on public.consent_log
  for select using (user_id = auth.uid());

grant all privileges on public.consent_log to service_role;
grant select on public.consent_log to authenticated;
