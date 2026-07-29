-- ============================================================
-- VMG EduNext — Migration: add notifications & user_follows
-- Chạy 1 lần trên Supabase SQL Editor
-- ============================================================

create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  from_user_id  uuid not null references public.profiles(id) on delete cascade,
  type          text not null default 'remind',
  message       text not null,
  read          boolean not null default false,
  created_at    timestamptz not null default now()
);

create table if not exists public.user_follows (
  follower_id   uuid not null references public.profiles(id) on delete cascade,
  following_id  uuid not null references public.profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (follower_id, following_id)
);

create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_user_follows_following on public.user_follows(following_id);

alter table public.notifications enable row level security;
alter table public.user_follows enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'notifications_select_own') then
    create policy notifications_select_own on public.notifications
      for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'notifications_update_own') then
    create policy notifications_update_own on public.notifications
      for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'notifications_insert_service') then
    create policy notifications_insert_service on public.notifications
      for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'follows_select_all') then
    create policy follows_select_all on public.user_follows
      for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'follows_insert_own') then
    create policy follows_insert_own on public.user_follows
      for insert with check (auth.uid() = follower_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'follows_delete_own') then
    create policy follows_delete_own on public.user_follows
      for delete using (auth.uid() = follower_id);
  end if;
end $$;
