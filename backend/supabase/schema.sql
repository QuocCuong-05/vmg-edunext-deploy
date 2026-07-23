-- ============================================================
-- VMG EduNext — Extended Schema for LMS + Auth + Progress
-- Run this AFTER the existing content expansion SQL files
-- ============================================================

-- 1. ENUM types (if not already created)
do $$ begin
  create type public.course_level as enum ('A1','A2','B1','B1+','B2','C1');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.enrollment_status as enum ('active','completed','dropped');
exception when duplicate_object then null;
end $$;

-- 2. COURSES
create table if not exists public.courses (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  slug        text not null unique,
  description text not null default '',
  thumbnail   text,
  level       public.course_level not null default 'B1',
  category    text not null default 'general',
  duration_hours numeric(5,1) default 0,
  lesson_count integer default 0,
  instructor  text default 'VMG EduNext',
  is_published boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 3. LESSONS
create table if not exists public.lessons (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses(id) on delete cascade,
  title       text not null,
  slug        text not null,
  description text default '',
  sort_order  integer not null default 0,
  content_type text not null default 'video' check (content_type in ('video','article','quiz','assignment')),
  video_url   text,
  video_duration_seconds integer default 0,
  article_body text,
  is_free     boolean not null default false,
  created_at  timestamptz not null default now(),
  unique(course_id, slug)
);

-- 4. ENROLLMENTS
create table if not exists public.enrollments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  course_id   uuid not null references public.courses(id) on delete cascade,
  status      public.enrollment_status not null default 'active',
  progress_pct numeric(5,2) not null default 0,
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(user_id, course_id)
);

-- 5. LESSON PROGRESS
create table if not exists public.lesson_progress (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  lesson_id   uuid not null references public.lessons(id) on delete cascade,
  completed   boolean not null default false,
  watched_seconds integer default 0,
  score       integer,
  completed_at timestamptz,
  unique(user_id, lesson_id)
);

-- 6. USER PROFILES (extends auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  role        text not null default 'learner' check (role in ('learner','teacher','admin','super_admin')),
  xp          integer not null default 0,
  streak_days integer not null default 0,
  bio         text,
  created_at  timestamptz not null default now()
);

-- 7. USER ACHIEVEMENTS
create table if not exists public.achievements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text,
  icon        text,
  earned_at   timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.profiles enable row level security;
alter table public.achievements enable row level security;

-- Courses: authenticated can read published courses
drop policy if exists "authenticated_read_courses" on public.courses;
create policy "authenticated_read_courses" on public.courses
  for select to authenticated using (is_published);

-- Lessons: authenticated can read lessons of enrolled/published courses
drop policy if exists "authenticated_read_lessons" on public.lessons;
create policy "authenticated_read_lessons" on public.lessons
  for select to authenticated using (
    exists (select 1 from public.courses c where c.id = lessons.course_id and c.is_published)
  );

-- Enrollments: users can read/insert their own
drop policy if exists "user_manage_enrollments" on public.enrollments;
create policy "user_manage_enrollments" on public.enrollments
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Lesson progress: users can read/insert their own
drop policy if exists "user_manage_lesson_progress" on public.lesson_progress;
create policy "user_manage_lesson_progress" on public.lesson_progress
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Profiles: users can read all, update own
drop policy if exists "user_read_profiles" on public.profiles;
create policy "user_read_profiles" on public.profiles
  for select to authenticated using (true);

drop policy if exists "user_update_own_profile" on public.profiles;
create policy "user_update_own_profile" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'learner');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Update course lesson_count when lessons change
create or replace function public.update_course_lesson_count()
returns trigger as $$
begin
  update public.courses
  set lesson_count = (select count(*) from public.lessons where course_id = coalesce(new.course_id, old.course_id))
  where id = coalesce(new.course_id, old.course_id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_lesson_change on public.lessons;
create trigger on_lesson_change
  after insert or delete on public.lessons
  for each row execute function public.update_course_lesson_count();

-- Update enrollment progress when lesson progress changes
create or replace function public.update_enrollment_progress()
returns trigger as $$
declare
  v_course_id uuid;
  v_total_lessons integer;
  v_completed_lessons integer;
begin
  select course_id into v_course_id from public.lessons where id = new.lesson_id;
  select lesson_count into v_total_lessons from public.courses where id = v_course_id;
  select count(*) into v_completed_lessons
  from public.lesson_progress lp
  join public.lessons l on l.id = lp.lesson_id
  where lp.user_id = new.user_id and l.course_id = v_course_id and lp.completed = true;

  update public.enrollments
  set progress_pct = case when v_total_lessons > 0
    then round((v_completed_lessons::numeric / v_total_lessons) * 100, 2)
    else 0 end,
      status = case when v_completed_lessons >= v_total_lessons then 'completed' else status end,
      completed_at = case when v_completed_lessons >= v_total_lessons then now() else completed_at end
  where user_id = new.user_id and course_id = v_course_id;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_lesson_progress_change on public.lesson_progress;
create trigger on_lesson_progress_change
  after insert or update on public.lesson_progress
  for each row when (new.completed = true)
  execute function public.update_enrollment_progress();
