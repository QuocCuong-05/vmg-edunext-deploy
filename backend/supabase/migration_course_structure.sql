-- ============================================================
-- VMG EduNext — Cấu trúc khóa học theo mô hình LMS (Canvas)
-- Course → Module (course_modules) → Item (lessons mở rộng)
-- Practice dạng "Speak the Words" (practice_words) + submissions chấm điểm
-- Chạy 1 lần trên Supabase SQL Editor (staging trước, production sau)
-- ============================================================

-- ------------------------------------------------------------------
-- 1. COURSE_MODULES — module/unit bên trong khóa học
-- ------------------------------------------------------------------
create table if not exists public.course_modules (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references public.courses(id) on delete cascade,
  title      text not null,
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_course_modules_course on public.course_modules(course_id);

-- ------------------------------------------------------------------
-- 2. LESSONS — mở rộng thành item (video_lesson | lesson | practice | quiz)
-- ------------------------------------------------------------------
alter table public.lessons add column if not exists item_type text;
alter table public.lessons add column if not exists module_id uuid references public.course_modules(id) on delete set null;
alter table public.lessons add column if not exists body_html text;
alter table public.lessons add column if not exists points integer not null default 0;
alter table public.lessons add column if not exists external_url text;
alter table public.lessons add column if not exists audio_url text;
alter table public.lessons add column if not exists image_url text;
alter table public.lessons add column if not exists quiz_slug text;

-- backfill item_type từ content_type cũ
update public.lessons
  set item_type = case
        when content_type = 'video'      then 'video_lesson'
        when content_type = 'article'    then 'lesson'
        when content_type = 'assignment' then 'practice'
        when content_type = 'quiz'       then 'quiz'
        else 'video_lesson'
      end
  where item_type is null or item_type = '';

alter table public.lessons alter column item_type set default 'video_lesson';
alter table public.lessons alter column item_type set not null;

create index if not exists idx_lessons_module on public.lessons(module_id);
create index if not exists idx_lessons_course_sort on public.lessons(course_id, sort_order);

-- ------------------------------------------------------------------
-- 3. PRACTICE_WORDS — danh sách từ luyện nói của 1 practice item
-- ------------------------------------------------------------------
create table if not exists public.practice_words (
  id         uuid primary key default gen_random_uuid(),
  lesson_id  uuid not null references public.lessons(id) on delete cascade,
  word       text not null,
  audio_url  text,
  image_url  text,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_practice_words_lesson on public.practice_words(lesson_id);

-- ------------------------------------------------------------------
-- 4. PRACTICE_SUBMISSIONS — bài ghi âm user gửi để chấm
-- ------------------------------------------------------------------
create table if not exists public.practice_submissions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  lesson_id       uuid not null references public.lessons(id) on delete cascade,
  practice_word_id uuid references public.practice_words(id) on delete set null,
  word            text,
  audio_url       text,
  transcript      text,
  ai_score        integer,
  ai_feedback     text,
  ai_status       text not null default 'pending',
  teacher_score   integer,
  teacher_feedback text,
  teacher_id      uuid references auth.users(id) on delete set null,
  review_status   text not null default 'new',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_practice_submissions_user on public.practice_submissions(user_id);
create index if not exists idx_practice_submissions_lesson on public.practice_submissions(lesson_id);
create index if not exists idx_practice_submissions_review on public.practice_submissions(review_status);

-- ------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ------------------------------------------------------------------
alter table public.course_modules enable row level security;
drop policy if exists "read_course_modules" on public.course_modules;
create policy "read_course_modules" on public.course_modules
  for select to authenticated using (
    exists (select 1 from public.courses c where c.id = course_modules.course_id and c.is_published)
  );

alter table public.practice_words enable row level security;
drop policy if exists "read_practice_words" on public.practice_words;
create policy "read_practice_words" on public.practice_words
  for select to authenticated using (true);

alter table public.practice_submissions enable row level security;
drop policy if exists "manage_own_submissions" on public.practice_submissions;
create policy "manage_own_submissions" on public.practice_submissions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ------------------------------------------------------------------
-- 6. GRANTS — bắt buộc: bảng mới không tự có quyền cho service_role
-- ------------------------------------------------------------------
grant select, insert, update, delete on public.course_modules to service_role;
grant select, insert, update, delete on public.practice_words to service_role;
grant select, insert, update, delete on public.practice_submissions to service_role;
grant select on public.course_modules to authenticated;
grant select on public.practice_words to authenticated;
grant select, insert, update, delete on public.practice_submissions to authenticated;
