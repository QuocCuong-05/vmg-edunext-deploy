-- ============================================================
-- VMG EduNext — Seed Data: Level Challenges
-- Chạy sau khi đã import dữ liệu quiz_sets
-- ============================================================

-- Quiz set ID từ seed data (classroom-clil-mixed)
-- UUID: 2d69c4d5-7902-e046-34d6-2c3706dc35fc

INSERT INTO public.level_challenges (id, title, description, xp_reward, quiz_set_id, level_min, sort_order, is_active)
VALUES
  ('d4e11111-1111-1111-1111-111111111111', 'Classroom English Basics',
   'Hoàn thành bài quiz kiến thức cơ bản về Classroom English.', 150,
   '2d69c4d5-7902-e046-34d6-2c3706dc35fc', 1, 1, true),

  ('d4e22222-2222-2222-2222-222222222222', 'CLIL Lesson Design',
   'Hoàn thành bài quiz về thiết kế bài học CLIL.', 200, null, 1, 2, true),

  ('d4e33333-3333-3333-3333-333333333333', 'Assessment Strategies',
   'Hoàn thành bài quiz về chiến lược đánh giá.', 250, null, 2, 3, true),

  ('d4e44444-4444-4444-4444-444444444444', 'Learning Science',
   'Hoàn thành bài quiz về khoa học học tập.', 300, null, 3, 4, true),

  ('d4e55555-5555-5555-5555-555555555555', 'Differentiation Master',
   'Hoàn thành bài quiz về phân hóa giảng dạy.', 350, null, 4, 5, true),

  ('d4e66666-6666-6666-6666-666666666666', 'Classroom English Expert',
   'Bài kiểm tra tổng hợp toàn bộ kỹ năng Classroom English.', 500, null, 5, 6, true);
