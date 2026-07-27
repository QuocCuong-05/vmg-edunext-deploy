-- ============================================================
-- VMG EduNext — Migration: Level Challenges
-- Chạy 1 lần trên Supabase SQL Editor sau full_schema.sql
-- ============================================================

-- 1. LEVEL_CHALLENGES — danh sách thử thách
-- Mỗi challenge có thể gắn với 1 quiz_set (người dùng làm quiz để hoàn thành)
create table if not exists public.level_challenges (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  xp_reward    integer not null default 0,
  quiz_set_id  uuid references public.quiz_sets(id) on delete set null,
  level_min    integer not null default 1,
  sort_order   integer not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 2. USER_CHALLENGES — trạng thái hoàn thành của từng user
create table if not exists public.user_challenges (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  challenge_id uuid not null references public.level_challenges(id) on delete cascade,
  completed    boolean not null default false,
  completed_at timestamptz,
  unique(user_id, challenge_id)
);

-- Indexes
create index if not exists idx_level_challenges_sort on public.level_challenges(sort_order);
create index if not exists idx_uchal_user on public.user_challenges(user_id);
create index if not exists idx_uchal_challenge on public.user_challenges(challenge_id);

-- RLS
alter table public.level_challenges enable row level security;
drop policy if exists "read_active_level_challenges" on public.level_challenges;
create policy "read_active_level_challenges" on public.level_challenges
  for select to authenticated using (is_active);

alter table public.user_challenges enable row level security;
drop policy if exists "manage_own_user_challenges" on public.user_challenges;
create policy "manage_own_user_challenges" on public.user_challenges
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Trigger tự động updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_level_challenges_updated_at on public.level_challenges;
create trigger trg_level_challenges_updated_at
  before update on public.level_challenges
  for each row execute function public.update_updated_at_column();
