-- ============================================================
-- VMG EduNext — LMS Seed Data
-- Run AFTER schema.sql
-- ============================================================

begin;

-- === COURSES ===
insert into public.courses (title, slug, description, level, category, duration_hours, lesson_count, instructor, is_published) values
('Classroom English Mastery', 'classroom-english-mastery',
 'Làm chủ 104 câu lệnh lớp học theo 10 giai đoạn. Dành cho giáo viên muốn sử dụng tiếng Anh tự tin trong lớp học.',
 'B1', 'classroom_english', 8.0, 6, 'VMG EduNext', true),

('CLIL Lesson Design', 'clil-lesson-design',
 'Thiết kế bài học CLIL với khung 4Cs: Content, Communication, Cognition, Culture. Kèm mục tiêu kép content + language.',
 'B2', 'clil_stem', 10.0, 8, 'Dr. Sarah Nguyen', true),

('Assessment & Feedback', 'assessment-feedback',
 'Đánh giá định hình, phản hồi hiệu quả, rubric và exit ticket. Cải thiện chất lượng đánh giá trong lớp học song ngữ.',
 'B2', 'assessment', 6.0, 5, 'VMG EduNext', true),

('Vocabulary Teaching Toolkit', 'vocabulary-teaching-toolkit',
 '82 từ vựng giáo dục thiết yếu kèm collocations, ngữ cảnh và chiến lược dạy từ vựng hiệu quả.',
 'B1', 'vocabulary', 5.0, 4, 'VMG EduNext', true),

('Learning Science for Teachers', 'learning-science-for-teachers',
 'Khoa học học tập: cognitive load, retrieval practice, metacognition. Ứng dụng vào thiết kế bài giảng.',
 'C1', 'learning_science', 7.0, 6, 'Prof. Michael Torres', true),

('STEM & Academic Language', 'stem-academic-language',
 'Ngôn ngữ học thuật cho STEM: mô tả dữ liệu, giải thích nguyên nhân-kết quả, lập luận bằng chứng.',
 'B2', 'clil_stem', 6.0, 5, 'VMG EduNext', true)
on conflict(slug) do nothing;

-- === LESSONS for "Classroom English Mastery" ===
with cid as (select id from public.courses where slug='classroom-english-mastery')
insert into public.lessons (course_id, title, slug, description, sort_order, content_type, video_url, video_duration_seconds, article_body, is_free) values
((select id from cid), '1. Settling the Class', 'settling-the-class',
 'Bắt đầu lớp, ổn định và thu hút sự chú ý.', 1,
 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 480,
 null, true),

((select id from cid), '2. Warm-Up & Engagement', 'warm-up',
 'Kích hoạt kiến thức nền, động não, tạo môi trường an toàn.', 2,
 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 540,
 null, false),

((select id from cid), '3. Assigning Tasks & Giving Instructions', 'assigning-tasks',
 'Hướng dẫn rõ ràng, ICQ, quản lý thời gian và phân hóa.', 3,
 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 600,
 null, false),

((select id from cid), '4. Grouping & Interaction', 'grouping',
 'Chia cặp/nhóm, giao vai trò, luân chuyển và kết nối ý tưởng.', 4,
 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 510,
 null, false),

((select id from cid), '5. Checking Understanding & Feedback', 'checking-understanding',
 'ICQ, CCQ, phản hồi hai bước và phát triển siêu nhận thức.', 5,
 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 720,
 null, false),

((select id from cid), '6. Transitions & Closing', 'transitions-closing',
 'Quản lý chuyển tiếp, time management, exit ticket và kết thúc bài.', 6,
 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 480,
 null, false);

-- === LESSONS for "CLIL Lesson Design" ===
with cid as (select id from public.courses where slug='clil-lesson-design')
insert into public.lessons (course_id, title, slug, description, sort_order, content_type, video_url, video_duration_seconds, article_body, is_free) values
((select id from cid), 'What is CLIL?', 'what-is-clil',
 'Giới thiệu phương pháp CLIL và lợi ích cho lớp học song ngữ.', 1,
 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 360,
 null, true),

((select id from cid), 'The 4Cs Framework', 'the-4cs-framework',
 'Content, Communication, Cognition, Culture — khung thiết kế bài CLIL.', 2,
 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 600,
 null, false),

((select id from cid), 'Writing Dual Objectives', 'writing-dual-objectives',
 'Cách viết mục tiêu nội dung và mục tiêu ngôn ngữ đi kèm.', 3,
 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 540,
 null, false),

((select id from cid), 'Scaffolding in CLIL', 'scaffolding-in-clil',
 'Chiến lược scaffolding: mẫu câu, sơ đồ, phân nhỏ nhiệm vụ.', 4,
 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 720,
 null, false),

((select id from cid), 'Assessment in CLIL', 'assessment-in-clil',
 'Đánh giá nội dung và ngôn ngữ đồng thời.', 5,
 'article', null, 0,
 '<h4>Đánh giá trong CLIL</h4><p>Khi đánh giá trong CLIL, cần phân biệt rõ giữa mục tiêu nội dung và mục tiêu ngôn ngữ.</p><ul><li><b>Content assessment:</b> Kiểm tra kiến thức môn học</li><li><b>Language assessment:</b> Kiểm tra việc sử dụng ngôn ngữ</li><li><b>Integrated assessment:</b> Cả hai cùng lúc với tiêu chí riêng</li></ul><p>Gợi ý: Dùng rubric với hai thang điểm riêng cho content và language.</p>',
 false),

((select id from cid), 'Sample CLIL Lesson', 'sample-clil-lesson',
 'Phân tích một bài học CLIL mẫu từ Khoa học lớp 6.', 6,
 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 900,
 null, false),

((select id from cid), 'CLIL across Subjects', 'clil-across-subjects',
 'Áp dụng CLIL cho Toán, Khoa học, Lịch sử và Địa lý.', 7,
 'article', null, 0,
 '<h4>CLIL cho các môn học</h4><p>Mỗi môn học có discourse riêng. Dưới đây là một số gợi ý:</p><ul><li><b>Toán:</b> So sánh, phân loại, mô tả hình dạng</li><li><b>Khoa học:</b> Nguyên nhân-kết quả, mô tả quy trình</li><li><b>Lịch sử:</b> Trình tự thời gian, nguyên nhân và hậu quả</li></ul>',
 false),

((select id from cid), 'CLIL Lesson Planning Workshop', 'clil-planning-workshop',
 'Thực hành thiết kế một bài CLIL hoàn chỉnh.', 8,
 'assignment', null, 0,
 '<h4>Bài tập: Thiết kế bài CLIL</h4><p>Chọn một chủ đề môn học bạn đang dạy. Viết:</p><ol><li>Một mục tiêu nội dung</li><li>Một mục tiêu ngôn ngữ</li><li>Ba hoạt động theo trình tự</li><li>Một rubric đánh giá đơn giản</li></ol>',
 false);

-- === LESSONS for "Assessment & Feedback" ===
with cid as (select id from public.courses where slug='assessment-feedback')
insert into public.lessons (course_id, title, slug, description, sort_order, content_type, video_url, video_duration_seconds, article_body, is_free) values
((select id from cid), 'Formative vs Summative', 'formative-vs-summative',
 'Phân biệt đánh giá định hình và tổng kết.', 1,
 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 420,
 null, true),

((select id from cid), 'Exit Tickets & Quick Checks', 'exit-tickets',
 'Cách dùng exit ticket và các kiểm tra nhanh trong lớp.', 2,
 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 480,
 null, false),

((select id from cid), 'Giving Actionable Feedback', 'actionable-feedback',
 'Phản hồi hai bước: ghi nhận + bước tiếp theo cụ thể.', 3,
 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 600,
 null, false),

((select id from cid), 'Rubric Design', 'rubric-design',
 'Thiết kế rubric đơn giản với tiêu chí rõ ràng.', 4,
 'article', null, 0,
 '<h4>Thiết kế Rubric</h4><p>Một rubric tốt cần:</p><ul><li>3-5 tiêu chí chính</li><li>Mô tả cụ thể cho từng mức</li><li>Ngôn ngữ học sinh có thể hiểu</li></ul><p>Ví dụ rubric cho thuyết trình:</p><table border="1" cellpadding="5"><tr><th>Tiêu chí</th><th>Xuất sắc</th><th>Đạt</th><th>Cần cải thiện</th></tr><tr><td>Nội dung</td><td>Đầy đủ, chính xác</td><td>Cơ bản đúng</td><td>Thiếu chính xác</td></tr><tr><td>Ngôn ngữ</td><td>Từ vựng phong phú</td><td>Đúng từ khóa</td><td>Sai nhiều từ</td></tr></table>',
 false),

((select id from cid), 'Peer Assessment', 'peer-assessment',
 'Hướng dẫn học sinh đánh giá đồng đẳng hiệu quả.', 5,
 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 540,
 null, false);

-- === LESSONS for "Vocabulary Teaching Toolkit" ===
with cid as (select id from public.courses where slug='vocabulary-teaching-toolkit')
insert into public.lessons (course_id, title, slug, description, sort_order, content_type, video_url, video_duration_seconds, is_free) values
((select id from cid), 'Teaching Collocations', 'teaching-collocations', 'Dạy từ vựng theo cụm thay vì từ đơn lẻ.', 1, 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 480, true),
((select id from cid), 'Contextualizing Vocabulary', 'contextualizing-vocabulary', 'Đặt từ vựng vào ngữ cảnh lớp học và môn học.', 2, 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 540, false),
((select id from cid), 'Word Walls & Visuals', 'word-walls-visuals', 'Sử dụng word wall và hình ảnh trực quan.', 3, 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 360, false),
((select id from cid), 'Vocabulary Games', 'vocabulary-games', 'Trò chơi từ vựng tăng tương tác và ghi nhớ.', 4, 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 420, false);

-- === LESSONS for "Learning Science for Teachers" ===
with cid as (select id from public.courses where slug='learning-science-for-teachers')
insert into public.lessons (course_id, title, slug, description, sort_order, content_type, video_url, video_duration_seconds, is_free) values
((select id from cid), 'Cognitive Load Theory', 'cognitive-load-theory', 'Hiểu và quản lý tải nhận thức trong lớp học.', 1, 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 660, true),
((select id from cid), 'Retrieval Practice', 'retrieval-practice', 'Kỹ thuật truy hồi giúp ghi nhớ dài hạn.', 2, 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 540, false),
((select id from cid), 'Spacing & Interleaving', 'spacing-interleaving', 'Phân bổ và xen kẽ nội dung học tập.', 3, 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 480, false),
((select id from cid), 'Metacognition in the Classroom', 'metacognition-classroom', 'Phát triển siêu nhận thức cho học sinh.', 4, 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 600, false),
((select id from cid), 'Motivation & Engagement', 'motivation-engagement', 'Động lực bền vững và mức độ tham gia có mục đích.', 5, 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 540, false),
((select id from cid), 'Applying Science to Lesson Design', 'applying-science-to-lessons', 'Tích hợp 5 nguyên lý vào thiết kế bài học.', 6, 'article', null, 0, false);

-- === LESSONS for "STEM & Academic Language" ===
with cid as (select id from public.courses where slug='stem-academic-language')
insert into public.lessons (course_id, title, slug, description, sort_order, content_type, video_url, video_duration_seconds, is_free) values
((select id from cid), 'Describing Data & Patterns', 'describing-data-patterns', 'Ngôn ngữ mô tả dữ liệu và quy luật.', 1, 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 480, true),
((select id from cid), 'Cause & Effect Language', 'cause-effect-language', 'Ngôn ngữ nguyên nhân-kết quả cho Khoa học.', 2, 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 540, false),
((select id from cid), 'Comparing & Classifying', 'comparing-classifying', 'So sánh và phân loại trong Toán và Khoa học.', 3, 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 420, false),
((select id from cid), 'Arguing with Evidence', 'arguing-with-evidence', 'Lập luận bằng bằng chứng — ngôn ngữ học thuật.', 4, 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 600, false),
((select id from cid), 'STEM Project Presentations', 'stem-project-presentations', 'Hướng dẫn học sinh trình bày dự án STEM.', 5, 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 720, false);

commit;
