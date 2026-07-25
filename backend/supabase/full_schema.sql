-- ============================================================
-- VMG EduNext — Full Database Schema
-- File duy nhất: chạy 1 lần trên Supabase SQL Editor
-- Gồm: tất cả tables + enums + indexes + RLS + triggers
-- Thứ tự quan hệ: auth.users → profiles → courses →
--   lessons → enrollments → lesson_progress →
--   vocabulary_entries → classroom_phrase_categories →
--   classroom_phrases → quiz_sets → quiz_questions →
--   quiz_options → tips → quests → user_quests →
--   rewards → user_purchases → word_book_entries
-- ============================================================

-- ################################################################
-- PHẦN 1: ENUMS
-- ################################################################

do $$ begin
  create type public.course_level as enum ('A1','A2','B1','B1+','B2','C1');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.enrollment_status as enum ('active','completed','dropped');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.lesson_content_type as enum ('video','article','quiz','assignment');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.user_role as enum ('learner','teacher','admin','super_admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.quest_type as enum ('daily','weekly');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.reward_content_type as enum ('lessons','vocabulary','prompts','webinar');
exception when duplicate_object then null;
end $$;

-- ################################################################
-- PHẦN 2: TABLES
-- ################################################################

-- +---------------------------------------------------------------+
-- | 2a. PROFILES — mở rộng auth.users                             |
-- | Tự động tạo khi user signup (trigger)                         |
-- +---------------------------------------------------------------+
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  role        public.user_role not null default 'learner',
  xp          integer not null default 0,
  streak_days integer not null default 0,
  bio         text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- +---------------------------------------------------------------+
-- | 2b. COURSES — khóa học                                        |
-- | 1 course có nhiều lessons, enrollments                        |
-- +---------------------------------------------------------------+
create table if not exists public.courses (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  slug           text not null unique,
  description    text not null default '',
  thumbnail      text,
  level          public.course_level not null default 'B1',
  category       text not null default 'general',
  duration_hours numeric(5,1) default 0,
  lesson_count   integer default 0,
  instructor     text default 'VMG EduNext',
  is_published   boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- +---------------------------------------------------------------+
-- | 2c. LESSONS — bài học trong khóa học                          |
-- | FK: course_id → courses.id                                    |
-- +---------------------------------------------------------------+
create table if not exists public.lessons (
  id                     uuid primary key default gen_random_uuid(),
  course_id              uuid not null references public.courses(id) on delete cascade,
  title                  text not null,
  slug                   text not null,
  description            text default '',
  sort_order             integer not null default 0,
  content_type           public.lesson_content_type not null default 'video',
  video_url              text,
  video_duration_seconds integer default 0,
  article_body           text,
  is_free                boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique(course_id, slug)
);

-- +---------------------------------------------------------------+
-- | 2d. ENROLLMENTS — user tham gia khóa học                      |
-- | FK: user_id → auth.users, course_id → courses.id              |
-- +---------------------------------------------------------------+
create table if not exists public.enrollments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  course_id     uuid not null references public.courses(id) on delete cascade,
  status        public.enrollment_status not null default 'active',
  progress_pct  numeric(5,2) not null default 0,
  enrolled_at   timestamptz not null default now(),
  completed_at  timestamptz,
  unique(user_id, course_id)
);

-- +---------------------------------------------------------------+
-- | 2e. LESSON_PROGRESS — tiến độ từng bài của user               |
-- | FK: user_id → auth.users, lesson_id → lessons.id              |
-- +---------------------------------------------------------------+
create table if not exists public.lesson_progress (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  lesson_id       uuid not null references public.lessons(id) on delete cascade,
  completed       boolean not null default false,
  watched_seconds integer default 0,
  score           integer,
  completed_at    timestamptz,
  unique(user_id, lesson_id)
);

-- +---------------------------------------------------------------+
-- | 2f. ACHIEVEMENTS — thành tích đạt được của user               |
-- | FK: user_id → auth.users                                      |
-- +---------------------------------------------------------------+
create table if not exists public.achievements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text,
  icon        text,
  earned_at   timestamptz not null default now()
);

-- +---------------------------------------------------------------+
-- | 2g. VOCABULARY_ENTRIES — từ vựng giáo dục                     |
-- | Hiển thị trên Vocabulary & Wordbook page                      |
-- | Route backend: /api/vocabulary                                |
-- +---------------------------------------------------------------+
create table if not exists public.vocabulary_entries (
  id             uuid primary key default gen_random_uuid(),
  word           text not null,
  part_of_speech text not null,
  level          public.course_level not null default 'B1',
  meaning_vi     text not null,
  definition_en  text not null,
  example_en     text,
  example_vi     text,
  collocation    text,
  topic          text,
  is_published   boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- +---------------------------------------------------------------+
-- | 2h. CLASSROOM_PHRASE_CATEGORIES — danh mục câu lệnh lớp      |
-- | 1 category có nhiều phrases                                   |
-- | Route backend: /api/classroom/categories                      |
-- +---------------------------------------------------------------+
create table if not exists public.classroom_phrase_categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name_vi    text not null,
  sort_order integer not null default 0,
  icon       text,
  created_at timestamptz not null default now()
);

-- +---------------------------------------------------------------+
-- | 2i. CLASSROOM_PHRASES — câu lệnh lớp song ngữ                |
-- | FK: category_id → classroom_phrase_categories.id              |
-- | Route backend: /api/classroom                                 |
-- +---------------------------------------------------------------+
create table if not exists public.classroom_phrases (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid references public.classroom_phrase_categories(id) on delete set null,
  phrase_en    text not null,
  phrase_vi    text not null,
  purpose      text,
  level        public.course_level,
  sort_order   integer not null default 0,
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- +---------------------------------------------------------------+
-- | 2j. QUIZ_SETS — bộ câu hỏi luyện tập                         |
-- | 1 set có nhiều questions → mỗi question có nhiều options      |
-- | Route backend: /api/quiz/sets                                 |
-- +---------------------------------------------------------------+
create table if not exists public.quiz_sets (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  slug           text not null unique,
  description    text,
  passing_score  integer not null default 70,
  xp_reward      integer not null default 0,
  level          public.course_level,
  question_count integer not null default 0,
  is_published   boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- +---------------------------------------------------------------+
-- | 2k. QUIZ_QUESTIONS — câu hỏi chi tiết                        |
-- | FK: quiz_set_id → quiz_sets.id                                |
-- | Route backend: /api/quiz/sets/:slug                           |
-- +---------------------------------------------------------------+
create table if not exists public.quiz_questions (
  id                 uuid primary key default gen_random_uuid(),
  quiz_set_id        uuid not null references public.quiz_sets(id) on delete cascade,
  prompt             text not null,
  prompt_translation text,
  correct_answer     text,
  explanation        text,
  explanation_vi     text,
  competency_code    text,
  level              public.course_level,
  sort_order         integer not null default 0,
  created_at         timestamptz not null default now()
);

-- +---------------------------------------------------------------+
-- | 2l. QUIZ_OPTIONS — lựa chọn trả lời                          |
-- | FK: question_id → quiz_questions.id                           |
-- | Mỗi câu hỏi có 4 options, 1 đáp án đúng                      |
-- +---------------------------------------------------------------+
create table if not exists public.quiz_options (
  id                 uuid primary key default gen_random_uuid(),
  question_id        uuid not null references public.quiz_questions(id) on delete cascade,
  option_text        text not null,
  is_correct         boolean not null default false,
  feedback_correct   text,
  feedback_incorrect text,
  sort_order         integer not null default 0,
  created_at         timestamptz not null default now()
);

-- +---------------------------------------------------------------+
-- | 2m. TIPS — mẹo dạy học (hiển thị trên Dashboard)             |
-- +---------------------------------------------------------------+
create table if not exists public.tips (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  content      text not null,
  category     text,
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- +---------------------------------------------------------------+
-- | 2n. QUESTS — nhiệm vụ hàng ngày / tuần                       |
-- | Dữ liệu tĩnh, ít thay đổi                                     |
-- +---------------------------------------------------------------+
create table if not exists public.quests (
  id         text primary key,
  type       public.quest_type not null,
  title      text not null,
  desc_text  text,
  xp         integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- +---------------------------------------------------------------+
-- | 2o. USER_QUESTS — trạng thái hoàn thành quest của user       |
-- | FK: user_id → auth.users, quest_id → quests.id               |
-- | date_key: "2026-07-24" (daily) hoặc "2026-W30" (weekly)      |
-- +---------------------------------------------------------------+
create table if not exists public.user_quests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  quest_id     text not null references public.quests(id) on delete cascade,
  date_key     text not null,
  completed    boolean not null default false,
  completed_at timestamptz,
  unique(user_id, quest_id, date_key)
);

-- +---------------------------------------------------------------+
-- | 2p. REWARDS — cửa hàng phần thưởng đổi bằng XP              |
-- | content_json chứa nội dung động (items array, webinar info)   |
-- +---------------------------------------------------------------+
create table if not exists public.rewards (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  desc_text    text not null,
  price        integer not null,
  icon_type    text not null,
  content_type public.reward_content_type not null,
  content_json jsonb not null default '{}',
  stock        integer,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- +---------------------------------------------------------------+
-- | 2q. USER_PURCHASES — lịch sử đổi thưởng                     |
-- | FK: user_id → auth.users, reward_id → rewards.id             |
-- +---------------------------------------------------------------+
create table if not exists public.user_purchases (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  reward_id     uuid not null references public.rewards(id) on delete cascade,
  xp_spent      integer not null,
  purchased_at  timestamptz not null default now()
);

-- +---------------------------------------------------------------+
-- | 2r. WORD_BOOK_ENTRIES — từ vựng cá nhân của user             |
-- | Mỗi user có thể tự thêm từ vào wordbook riêng                |
-- | FK: user_id → auth.users                                     |
-- +---------------------------------------------------------------+
create table if not exists public.word_book_entries (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  word           text not null,
  part_of_speech text,
  level          public.course_level,
  meaning_vi     text,
  definition_en  text,
  example_en     text,
  notes          text,
  mastered       boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique(user_id, word)
);

-- ################################################################
-- PHẦN 3: INDEXES
-- ################################################################

-- courses
create index if not exists idx_courses_slug      on public.courses(slug);
create index if not exists idx_courses_category  on public.courses(category);
create index if not exists idx_courses_level     on public.courses(level);

-- lessons
create index if not exists idx_lessons_course    on public.lessons(course_id);
create index if not exists idx_lessons_sort      on public.lessons(course_id, sort_order);

-- enrollments
create index if not exists idx_enroll_user       on public.enrollments(user_id);
create index if not exists idx_enroll_course     on public.enrollments(course_id);

-- lesson_progress
create index if not exists idx_lp_user           on public.lesson_progress(user_id);
create index if not exists idx_lp_lesson         on public.lesson_progress(lesson_id);

-- achievements
create index if not exists idx_achievements_user on public.achievements(user_id);

-- vocabulary
create index if not exists idx_vocab_level       on public.vocabulary_entries(level);
create index if not exists idx_vocab_topic       on public.vocabulary_entries(topic);

-- classroom phrases
create index if not exists idx_phrase_category   on public.classroom_phrases(category_id);
create index if not exists idx_phrase_level      on public.classroom_phrases(level);

-- quiz
create index if not exists idx_quizq_set         on public.quiz_questions(quiz_set_id);
create index if not exists idx_quizopt_question  on public.quiz_options(question_id);

-- tips
create index if not exists idx_tips_category     on public.tips(category);

-- user_quests
create index if not exists idx_uq_user           on public.user_quests(user_id);
create index if not exists idx_uq_datekey        on public.user_quests(date_key);

-- user_purchases
create index if not exists idx_up_user           on public.user_purchases(user_id);
create index if not exists idx_up_reward         on public.user_purchases(reward_id);

-- word_book
create index if not exists idx_wbe_user          on public.word_book_entries(user_id);

-- profiles
create index if not exists idx_profiles_role     on public.profiles(role);

-- ################################################################
-- PHẦN 4: ROW LEVEL SECURITY POLICIES
-- ################################################################

-- profiles: ai cũng đọc được, chỉ sửa profile của mình
alter table public.profiles enable row level security;
drop policy if exists "read_profiles" on public.profiles;
create policy "read_profiles" on public.profiles
  for select to authenticated using (true);

drop policy if exists "update_own_profile" on public.profiles;
create policy "update_own_profile" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- courses: đọc được published
alter table public.courses enable row level security;
drop policy if exists "read_published_courses" on public.courses;
create policy "read_published_courses" on public.courses
  for select to authenticated using (is_published);

-- lessons: đọc được lessons của course published
alter table public.lessons enable row level security;
drop policy if exists "read_course_lessons" on public.lessons;
create policy "read_course_lessons" on public.lessons
  for select to authenticated using (
    exists (select 1 from public.courses c where c.id = lessons.course_id and c.is_published)
  );

-- enrollments: user quản lý của mình
alter table public.enrollments enable row level security;
drop policy if exists "manage_own_enrollments" on public.enrollments;
create policy "manage_own_enrollments" on public.enrollments
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- lesson_progress: user quản lý của mình
alter table public.lesson_progress enable row level security;
drop policy if exists "manage_own_progress" on public.lesson_progress;
create policy "manage_own_progress" on public.lesson_progress
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- achievements: user đọc của mình
alter table public.achievements enable row level security;
drop policy if exists "read_own_achievements" on public.achievements;
create policy "read_own_achievements" on public.achievements
  for select to authenticated
  using (user_id = auth.uid());

-- vocabulary: đọc được published
alter table public.vocabulary_entries enable row level security;
drop policy if exists "read_published_vocab" on public.vocabulary_entries;
create policy "read_published_vocab" on public.vocabulary_entries
  for select to authenticated using (is_published);

-- classroom_phrase_categories: đọc được hết
alter table public.classroom_phrase_categories enable row level security;
drop policy if exists "read_phrase_categories" on public.classroom_phrase_categories;
create policy "read_phrase_categories" on public.classroom_phrase_categories
  for select to authenticated using (true);

-- classroom_phrases: đọc được published
alter table public.classroom_phrases enable row level security;
drop policy if exists "read_published_phrases" on public.classroom_phrases;
create policy "read_published_phrases" on public.classroom_phrases
  for select to authenticated using (is_published);

-- quiz_sets: đọc được published
alter table public.quiz_sets enable row level security;
drop policy if exists "read_published_quizsets" on public.quiz_sets;
create policy "read_published_quizsets" on public.quiz_sets
  for select to authenticated using (is_published);

-- quiz_questions: đọc được nếu quiz_set published
alter table public.quiz_questions enable row level security;
drop policy if exists "read_quiz_questions" on public.quiz_questions;
create policy "read_quiz_questions" on public.quiz_questions
  for select to authenticated using (
    exists (select 1 from public.quiz_sets qs where qs.id = quiz_set_id and qs.is_published)
  );

-- quiz_options: đọc được nếu câu hỏi thuộc quiz_set published
alter table public.quiz_options enable row level security;
drop policy if exists "read_quiz_options" on public.quiz_options;
create policy "read_quiz_options" on public.quiz_options
  for select to authenticated using (
    exists (select 1 from public.quiz_questions qq
            join public.quiz_sets qs on qs.id = qq.quiz_set_id
            where qq.id = question_id and qs.is_published)
  );

-- tips: đọc được published
alter table public.tips enable row level security;
drop policy if exists "read_published_tips" on public.tips;
create policy "read_published_tips" on public.tips
  for select to authenticated using (is_published);

-- quests: đọc được active
alter table public.quests enable row level security;
drop policy if exists "read_active_quests" on public.quests;
create policy "read_active_quests" on public.quests
  for select to authenticated using (is_active);

-- user_quests: user quản lý của mình
alter table public.user_quests enable row level security;
drop policy if exists "manage_own_quests" on public.user_quests;
create policy "manage_own_quests" on public.user_quests
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- rewards: đọc được active
alter table public.rewards enable row level security;
drop policy if exists "read_active_rewards" on public.rewards;
create policy "read_active_rewards" on public.rewards
  for select to authenticated using (is_active);

-- user_purchases: user đọc của mình, admin insert
alter table public.user_purchases enable row level security;
drop policy if exists "read_own_purchases" on public.user_purchases;
create policy "read_own_purchases" on public.user_purchases
  for select to authenticated
  using (user_id = auth.uid());

-- word_book_entries: user quản lý entries của mình
alter table public.word_book_entries enable row level security;
drop policy if exists "manage_own_wordbook" on public.word_book_entries;
create policy "manage_own_wordbook" on public.word_book_entries
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ################################################################
-- PHẦN 5: TRIGGERS
-- ################################################################

-- Tự động cập nhật updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  tbl text;
begin
  for tbl in
    select unnest(array[
      'profiles', 'courses', 'lessons', 'vocabulary_entries',
      'classroom_phrases', 'quiz_sets', 'tips', 'rewards',
      'word_book_entries', 'community_posts'
    ])
  loop
    execute format(
      'drop trigger if exists trg_%s_updated_at on public.%I;', tbl, tbl
    );
    execute format(
      'create trigger trg_%s_updated_at
       before update on public.%I
       for each row execute function public.update_updated_at_column();',
      tbl, tbl
    );
  end loop;
end;
$$;

-- Tự động tạo profile khi user signup
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

-- Tự động cập nhật lesson_count khi thay đổi lessons
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

-- Tự động cập nhật tiến độ enrollment khi lesson progress thay đổi
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

-- Tự động cập nhật question_count khi thay đổi quiz questions
create or replace function public.update_quiz_question_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.quiz_sets
    set question_count = (select count(*) from public.quiz_questions where quiz_set_id = new.quiz_set_id)
    where id = new.quiz_set_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.quiz_sets
    set question_count = (select count(*) from public.quiz_questions where quiz_set_id = old.quiz_set_id)
    where id = old.quiz_set_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_quiz_question_count on public.quiz_questions;
create trigger trg_quiz_question_count
  after insert or delete on public.quiz_questions
  for each row execute function public.update_quiz_question_count();

-- ============================================================
-- COMMUNITY TABLES
-- ============================================================

create table public.community_posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.community_likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.community_posts(id) on delete cascade,
  user_id uuid references public.profiles(id) not null,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

create table public.community_comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.community_posts(id) on delete cascade,
  user_id uuid references public.profiles(id) not null,
  content text not null,
  created_at timestamptz default now()
);

create table public.community_groups (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table public.community_group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.community_groups(id) on delete cascade,
  user_id uuid references public.profiles(id) not null,
  created_at timestamptz default now(),
  unique(group_id, user_id)
);

-- Indexes
create index idx_community_posts_user on public.community_posts(user_id);
create index idx_community_posts_created on public.community_posts(created_at desc);
create index idx_community_likes_post on public.community_likes(post_id);
create index idx_community_comments_post on public.community_comments(post_id);
create index idx_community_group_members_group on public.community_group_members(group_id);
create index idx_community_group_members_user on public.community_group_members(user_id);

-- ============================================================
-- KẾT THÚC full_schema.sql
-- ============================================================
-- Tổng số tables: 23
--   1. profiles          10. classroom_phrases
--   2. courses           11. quiz_sets
--   3. lessons           12. quiz_questions
--   4. enrollments       13. quiz_options
--   5. lesson_progress   14. tips
--   6. achievements      15. quests
--   7. vocabulary_entries 16. user_quests
--   8. classroom_phrase_categories  17. rewards
--   9. (tiếp)            18. user_purchases
--                        19. word_book_entries
--                        20. community_posts
--                        21. community_likes
--                        22. community_comments
--                        23. community_groups
--                         + community_group_members
-- Tổng: 23 tables
-- ============================================================
