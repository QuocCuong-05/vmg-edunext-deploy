-- ============================================================
-- VMG EduNext — Practice đa loại (theo LMS/H5P)
-- ① speak_words ② voice_recorder ③ listen_choose ④ listen_mark ⑤ listen_fill
-- Chạy 1 lần trên Supabase SQL Editor (staging trước, production sau)
-- ============================================================

-- 1. lessons: loại practice
alter table public.lessons add column if not exists practice_type text default 'speak_words';

-- 2. PRACTICE_QUESTIONS — câu hỏi cho loại nghe (choose/fill/mark)
create table if not exists public.practice_questions (
  id           uuid primary key default gen_random_uuid(),
  lesson_id    uuid not null references public.lessons(id) on delete cascade,
  qtype        text not null default 'choose',
  position     integer not null default 0,
  audio_url    text,
  prompt       text,
  text_content text,
  options      jsonb,
  correct      jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists idx_practice_questions_lesson on public.practice_questions(lesson_id);

-- 3. PRACTICE_ANSWERS — câu trả lời (tự chấm máy)
create table if not exists public.practice_answers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  lesson_id   uuid not null references public.lessons(id) on delete cascade,
  question_id uuid references public.practice_questions(id) on delete cascade,
  answer      text,
  is_correct  boolean not null default false,
  score       integer not null default 0,
  created_at  timestamptz not null default now(),
  unique(user_id, question_id)
);
create index if not exists idx_practice_answers_user on public.practice_answers(user_id);
create index if not exists idx_practice_answers_lesson on public.practice_answers(lesson_id);

-- 4. submissions: phân loại bài nộp voice
alter table public.practice_submissions add column if not exists practice_type text;

-- 5. RLS
alter table public.practice_questions enable row level security;
drop policy if exists "read_practice_questions" on public.practice_questions;
create policy "read_practice_questions" on public.practice_questions
  for select to authenticated using (true);

alter table public.practice_answers enable row level security;
drop policy if exists "manage_own_answers" on public.practice_answers;
create policy "manage_own_answers" on public.practice_answers
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 6. GRANTS
grant select, insert, update, delete on public.practice_questions to service_role;
grant select, insert, update, delete on public.practice_answers to service_role;
grant select on public.practice_questions to authenticated;
grant select, insert, update, delete on public.practice_answers to authenticated;