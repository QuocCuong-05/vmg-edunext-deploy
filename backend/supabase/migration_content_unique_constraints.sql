-- ============================================================
-- VMG EduNext — Migration: unique constraints for append-safe import
-- BƯỚC 1: chạy phần check duplicates TRƯỚC. Nếu có dup -> xóa thủ công.
-- BƯỚC 2: chạy phần add constraints.
-- Cần chạy trên cả staging + production Supabase SQL Editor.
-- ============================================================

-- #####################################
-- BƯỚC 1: CHECK DUPLICATES (chạy trước, chỉ đọc)
-- #####################################

-- Nếu dòng nào xuất hiện -> có duplicate -> cần xóa thủ công trước khi thêm unique
select word, part_of_speech, count(*) from public.vocabulary_entries group by word, part_of_speech having count(*) > 1;
select title, count(*) from public.tips group by title having count(*) > 1;
select phrase_en, count(*) from public.classroom_phrases group by phrase_en having count(*) > 1;
select quiz_set_id, prompt, count(*) from public.quiz_questions group by quiz_set_id, prompt having count(*) > 1;
select question_id, option_text, count(*) from public.quiz_options group by question_id, option_text having count(*) > 1;
select name, count(*) from public.rewards group by name having count(*) > 1;
select title, count(*) from public.level_challenges group by title having count(*) > 1;

-- #####################################
-- BƯỚC 2: ADD UNIQUE CONSTRAINTS
-- Chạy sau khi các query trên trả về 0 dòng
-- #####################################

-- vocabulary_entries: có thể cùng từ nhưng khác POS
alter table public.vocabulary_entries add constraint uq_vocab_word_pos unique (word, part_of_speech);

-- tips
alter table public.tips add constraint uq_tips_title unique (title);

-- classroom_phrases
alter table public.classroom_phrases add constraint uq_phrases_en unique (phrase_en);

-- quiz_questions
alter table public.quiz_questions add constraint uq_quiz_q_set_prompt unique (quiz_set_id, prompt);

-- quiz_options
alter table public.quiz_options add constraint uq_quiz_opt_q_text unique (question_id, option_text);

-- rewards
alter table public.rewards add constraint uq_rewards_name unique (name);

-- level_challenges
alter table public.level_challenges add constraint uq_level_ch_title unique (title);
