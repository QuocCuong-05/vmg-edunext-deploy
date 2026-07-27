-- ============================================================
-- VMG EduNext — Anon read policies
-- Cho phép anon (unauthenticated) đọc dữ liệu nội dung
-- Chạy 1 lần trên Supabase SQL Editor
-- ============================================================

-- vocabulary_entries: đọc được published
drop policy if exists "anon_read_published_vocab" on public.vocabulary_entries;
create policy "anon_read_published_vocab" on public.vocabulary_entries
  for select to anon using (is_published);

-- classroom_phrase_categories: đọc được hết
drop policy if exists "anon_read_phrase_categories" on public.classroom_phrase_categories;
create policy "anon_read_phrase_categories" on public.classroom_phrase_categories
  for select to anon using (true);

-- classroom_phrases: đọc được published
drop policy if exists "anon_read_published_phrases" on public.classroom_phrases;
create policy "anon_read_published_phrases" on public.classroom_phrases
  for select to anon using (is_published);

-- quiz_sets: đọc được published
drop policy if exists "anon_read_published_quizsets" on public.quiz_sets;
create policy "anon_read_published_quizsets" on public.quiz_sets
  for select to anon using (is_published);

-- quiz_questions: đọc được nếu quiz_set published
drop policy if exists "anon_read_quiz_questions" on public.quiz_questions;
create policy "anon_read_quiz_questions" on public.quiz_questions
  for select to anon using (
    exists (select 1 from public.quiz_sets qs where qs.id = quiz_set_id and qs.is_published)
  );

-- quiz_options: đọc được nếu câu hỏi thuộc quiz_set published
drop policy if exists "anon_read_quiz_options" on public.quiz_options;
create policy "anon_read_quiz_options" on public.quiz_options
  for select to anon using (
    exists (select 1 from public.quiz_questions qq
            join public.quiz_sets qs on qs.id = qq.quiz_set_id
            where qq.id = question_id and qs.is_published)
  );

-- tips: đọc được published
drop policy if exists "anon_read_published_tips" on public.tips;
create policy "anon_read_published_tips" on public.tips
  for select to anon using (is_published);

-- quests: đọc được active
drop policy if exists "anon_read_active_quests" on public.quests;
create policy "anon_read_active_quests" on public.quests
  for select to anon using (is_active);

-- level_challenges: đọc được active
drop policy if exists "anon_read_active_level_challenges" on public.level_challenges;
create policy "anon_read_active_level_challenges" on public.level_challenges
  for select to anon using (is_active);

-- rewards: đọc được active
drop policy if exists "anon_read_active_rewards" on public.rewards;
create policy "anon_read_active_rewards" on public.rewards
  for select to anon using (is_active);

-- courses: đọc được published
drop policy if exists "anon_read_published_courses" on public.courses;
create policy "anon_read_published_courses" on public.courses
  for select to anon using (is_published);

-- lessons: đọc được lessons của course published
drop policy if exists "anon_read_course_lessons" on public.lessons;
create policy "anon_read_course_lessons" on public.lessons
  for select to anon using (
    exists (select 1 from public.courses c where c.id = lessons.course_id and c.is_published)
  );

-- profiles: anon đọc được thông tin cơ bản
drop policy if exists "anon_read_profiles" on public.profiles;
create policy "anon_read_profiles" on public.profiles
  for select to anon using (true);
