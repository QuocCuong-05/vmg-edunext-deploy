-- ============================================================
-- VMG EduNext — Seed Data Import Script
-- Chạy 1 lần trên Supabase SQL Editor
-- ============================================================

-- Xoá dữ liệu cũ trước khi seed
TRUNCATE TABLE public.quiz_options CASCADE;
TRUNCATE TABLE public.quiz_questions CASCADE;
TRUNCATE TABLE public.quiz_sets CASCADE;
TRUNCATE TABLE public.classroom_phrases CASCADE;
TRUNCATE TABLE public.classroom_phrase_categories CASCADE;
TRUNCATE TABLE public.vocabulary_entries CASCADE;
TRUNCATE TABLE public.tips CASCADE;
TRUNCATE TABLE public.quests CASCADE;
TRUNCATE TABLE public.rewards CASCADE;

-- 1. CLASSROOM PHRASE CATEGORIES
INSERT INTO public.classroom_phrase_categories (id,slug,name_vi,sort_order,icon)
VALUES ('126d21c3-6ac1-614a-2d9d-188f6e68055e','settling','Ổn định lớp',1,'users');
INSERT INTO public.classroom_phrase_categories (id,slug,name_vi,sort_order,icon)
VALUES ('1f82e99d-b049-dcad-c2a5-2b44c9536ec5','warm-up','Khởi động',2,'activity');
INSERT INTO public.classroom_phrase_categories (id,slug,name_vi,sort_order,icon)
VALUES ('e26677f5-8b1c-8374-5cfd-3ccb631a5e57','instruction','Hướng dẫn bài tập',3,'book-open');
INSERT INTO public.classroom_phrase_categories (id,slug,name_vi,sort_order,icon)
VALUES ('2de60a6a-57c5-9a3b-8be6-ae2586d7103d','grouping','Chia nhóm',4,'grid');
INSERT INTO public.classroom_phrase_categories (id,slug,name_vi,sort_order,icon)
VALUES ('4c3f4858-5056-5776-88ac-004e9e99bd99','checking','Kiểm tra hiểu bài',5,'help-circle');
INSERT INTO public.classroom_phrase_categories (id,slug,name_vi,sort_order,icon)
VALUES ('3b2cc72a-f141-b51a-1dd3-be11f38701d4','feedback','Phản hồi và ghi nhận',6,'message-square');
INSERT INTO public.classroom_phrase_categories (id,slug,name_vi,sort_order,icon)
VALUES ('90d39ca7-0337-fe54-ed4b-4546f5c3b06a','transition','Chuyển tiếp và kết thúc',7,'arrow-right');

-- 2. CLASSROOM PHRASES
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('126d21c3-6ac1-614a-2d9d-188f6e68055e','Good morning, everyone. Please take your seats.','Chào buổi sáng cả lớp. Mời các em ngồi xuống.','Ổn định','A2',1,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('126d21c3-6ac1-614a-2d9d-188f6e68055e','Let us settle down and get ready to learn.','Chúng ta hãy ổn định để sẵn sàng học tập.','Ổn định','A2',2,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('126d21c3-6ac1-614a-2d9d-188f6e68055e','When I raise my hand, please finish your sentence and look this way.','Khi tôi giơ tay, các em hãy dừng lại và nhìn lên đây.','Thu hút sự chú ý','B1',3,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('126d21c3-6ac1-614a-2d9d-188f6e68055e','I need your attention, please.','Tôi cần các em chú ý.','Thu hút sự chú ý','A2',4,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('126d21c3-6ac1-614a-2d9d-188f6e68055e','Can I have your attention, please?','Các em chú ý giúp tôi.','Thu hút sự chú ý','A2',5,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('126d21c3-6ac1-614a-2d9d-188f6e68055e','Are you ready to start the lesson?','Các em đã sẵn sàng bắt đầu bài học chưa?','Bắt đầu','A2',6,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('126d21c3-6ac1-614a-2d9d-188f6e68055e','Let us begin today''s lesson.','Chúng ta hãy bắt đầu bài học hôm nay.','Bắt đầu','A2',7,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('126d21c3-6ac1-614a-2d9d-188f6e68055e','Please put away your phones and other distractions.','Vui lòng cất điện thoại và các vật gây sao nhãng.','Kỷ luật','B1',8,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('126d21c3-6ac1-614a-2d9d-188f6e68055e','Eyes on the board, please.','Các em nhìn lên bảng.','Thu hút sự chú ý','A2',9,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('126d21c3-6ac1-614a-2d9d-188f6e68055e','Listen carefully to the instructions.','Lắng nghe hướng dẫn một cách cẩn thận.','Thu hút sự chú ý','A2',10,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('1f82e99d-b049-dcad-c2a5-2b44c9536ec5','Let us warm up with a quick question.','Chúng ta hãy khởi động với một câu hỏi nhanh.','Khởi động','A2',1,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('1f82e99d-b049-dcad-c2a5-2b44c9536ec5','Think about this question for 30 seconds.','Suy nghĩ về câu hỏi này trong 30 giây.','Tư duy','B1',2,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('1f82e99d-b049-dcad-c2a5-2b44c9536ec5','Turn to your partner and discuss.','Quay sang bạn bên cạnh và thảo luận.','Cặp đôi','A2',3,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('1f82e99d-b049-dcad-c2a5-2b44c9536ec5','What do you already know about this topic?','Các em đã biết gì về chủ đề này?','Kích hoạt kiến thức','B1',4,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('1f82e99d-b049-dcad-c2a5-2b44c9536ec5','Share one idea with the class.','Chia sẻ một ý tưởng với cả lớp.','Chia sẻ','A2',5,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('1f82e99d-b049-dcad-c2a5-2b44c9536ec5','Let us brainstorm ideas together.','Chúng ta hãy cùng nhau động não.','Động não','B1',6,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('1f82e99d-b049-dcad-c2a5-2b44c9536ec5','Here is a picture. What do you see?','Đây là một bức tranh. Các em thấy gì?','Quan sát','A2',7,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('1f82e99d-b049-dcad-c2a5-2b44c9536ec5','Watch this short video clip.','Các em hãy xem đoạn video ngắn này.','Xem video','A2',8,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('1f82e99d-b049-dcad-c2a5-2b44c9536ec5','What questions do you have after watching?','Các em có câu hỏi gì sau khi xem?','Phản hồi','B1',9,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('e26677f5-8b1c-8374-5cfd-3ccb631a5e57','Open your book to page 25.','Mở sách trang 25.','Hướng dẫn','A2',1,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('e26677f5-8b1c-8374-5cfd-3ccb631a5e57','Read the passage silently.','Đọc thầm đoạn văn.','Đọc hiểu','A2',2,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('e26677f5-8b1c-8374-5cfd-3ccb631a5e57','Follow along as I read aloud.','Đọc theo khi tôi đọc to.','Đọc theo','A2',3,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('e26677f5-8b1c-8374-5cfd-3ccb631a5e57','Complete the worksheet on page 10.','Hoàn thành phiếu bài tập trang 10.','Bài tập','A2',4,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('e26677f5-8b1c-8374-5cfd-3ccb631a5e57','You have 15 minutes to finish this task.','Các em có 15 phút để hoàn thành nhiệm vụ này.','Quản lý thời gian','B1',5,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('e26677f5-8b1c-8374-5cfd-3ccb631a5e57','Work individually for the first 5 minutes.','Làm việc cá nhân trong 5 phút đầu.','Làm việc cá nhân','B1',6,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('e26677f5-8b1c-8374-5cfd-3ccb631a5e57','Underline the key words in the text.','Gạch chân các từ khóa trong văn bản.','Kỹ thuật đọc','B1',7,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('e26677f5-8b1c-8374-5cfd-3ccb631a5e57','Write your answers in complete sentences.','Viết câu trả lời thành câu hoàn chỉnh.','Viết','B1',8,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('e26677f5-8b1c-8374-5cfd-3ccb631a5e57','Check your answers with a partner.','Kiểm tra đáp án với bạn cùng bàn.','Kiểm tra chéo','A2',9,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('e26677f5-8b1c-8374-5cfd-3ccb631a5e57','Raise your hand if you need help.','Giơ tay nếu em cần giúp đỡ.','Hỗ trợ','A2',10,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('2de60a6a-57c5-9a3b-8be6-ae2586d7103d','Form groups of four.','Chia nhóm bốn người.','Chia nhóm','A2',1,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('2de60a6a-57c5-9a3b-8be6-ae2586d7103d','Find a partner for this activity.','Tìm một bạn cùng cặp cho hoạt động này.','Bắt cặp','A2',2,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('2de60a6a-57c5-9a3b-8be6-ae2586d7103d','Move quietly to your group area.','Di chuyển nhẹ nhàng đến khu vực nhóm của mình.','Di chuyển','B1',3,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('2de60a6a-57c5-9a3b-8be6-ae2586d7103d','Choose one person to be the spokesperson.','Chọn một người làm phát ngôn viên.','Vai trò','B1',4,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('2de60a6a-57c5-9a3b-8be6-ae2586d7103d','Everyone in the group must contribute.','Mọi thành viên trong nhóm đều phải đóng góp.','Hợp tác','B2',5,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('2de60a6a-57c5-9a3b-8be6-ae2586d7103d','Switch roles after 10 minutes.','Đổi vai sau 10 phút.','Luân chuyển','B1',6,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('2de60a6a-57c5-9a3b-8be6-ae2586d7103d','Share your group''s findings with the class.','Chia sẻ kết quả của nhóm với cả lớp.','Trình bày','B1',7,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('2de60a6a-57c5-9a3b-8be6-ae2586d7103d','Listen to your classmates'' presentations.','Lắng nghe bài trình bày của các bạn.','Lắng nghe','A2',8,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('2de60a6a-57c5-9a3b-8be6-ae2586d7103d','Give a round of applause to group 3.','Hãy vỗ tay cho nhóm 3.','Khích lệ','A2',9,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('4c3f4858-5056-5776-88ac-004e9e99bd99','Does everyone understand the task?','Mọi người có hiểu nhiệm vụ không?','Kiểm tra bài tập','B1',1,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('4c3f4858-5056-5776-88ac-004e9e99bd99','Do you have any questions so far?','Các em có câu hỏi gì không?','Kiểm tra hiểu bài','A2',2,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('4c3f4858-5056-5776-88ac-004e9e99bd99','Can you repeat that in your own words?','Em có thể nhắc lại bằng từ ngữ của mình không?','Hiểu bài','B1',3,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('4c3f4858-5056-5776-88ac-004e9e99bd99','Show me a thumbs up if you understand.','Giơ ngón cái nếu em hiểu bài.','Kiểm tra nhanh','A2',4,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('4c3f4858-5056-5776-88ac-004e9e99bd99','Give an example of what I just explained.','Cho tôi một ví dụ về điều tôi vừa giải thích.','Kiểm tra hiểu bài','B2',5,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('4c3f4858-5056-5776-88ac-004e9e99bd99','What is the main idea of the text?','Ý chính của bài đọc là gì?','Đọc hiểu','B1',6,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('4c3f4858-5056-5776-88ac-004e9e99bd99','Complete this sentence: "The author argues that..."','Hoàn thành câu sau: "Tác giả lập luận rằng..."','Kiểm tra hiểu bài','B2',7,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('4c3f4858-5056-5776-88ac-004e9e99bd99','True or false: Water boils at 100 degrees Celsius.','Đúng hay sai: Nước sôi ở 100 độ C.','Kiểm tra kiến thức','A2',8,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('4c3f4858-5056-5776-88ac-004e9e99bd99','You have 30 seconds to discuss with your partner.','Các em có 30 giây để thảo luận với bạn cùng cặp.','Thảo luận','A2',9,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('3b2cc72a-f141-b51a-1dd3-be11f38701d4','Great job! That is an excellent answer.','Làm tốt lắm! Đó là một câu trả lời xuất sắc.','Khen ngợi','A2',1,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('3b2cc72a-f141-b51a-1dd3-be11f38701d4','Almost there — check your spelling.','Gần đúng rồi — hãy kiểm tra lỗi chính tả.','Sửa lỗi','A2',2,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('3b2cc72a-f141-b51a-1dd3-be11f38701d4','Good effort! Try adding more detail next time.','Cố gắng tốt! Lần sau thử thêm chi tiết nhé.','Khích lệ','B1',3,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('3b2cc72a-f141-b51a-1dd3-be11f38701d4','You are on the right track.','Em đang đi đúng hướng.','Khích lệ','A2',4,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('3b2cc72a-f141-b51a-1dd3-be11f38701d4','That is an interesting point of view.','Đó là một quan điểm thú vị.','Ghi nhận','B1',5,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('3b2cc72a-f141-b51a-1dd3-be11f38701d4','Can you explain your reasoning?','Em có thể giải thích lý do của mình không?','Khuyến khích tư duy','B1',6,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('3b2cc72a-f141-b51a-1dd3-be11f38701d4','I like how you used evidence from the text.','Tôi thích cách em sử dụng bằng chứng từ văn bản.','Khen ngợi','B1',7,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('3b2cc72a-f141-b51a-1dd3-be11f38701d4','Let us look at the first sentence together.','Chúng ta hãy cùng xem xét câu đầu tiên.','Hướng dẫn sửa','A2',8,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('3b2cc72a-f141-b51a-1dd3-be11f38701d4','Try using a different word here.','Thử dùng một từ khác ở đây.','Gợi ý','B1',9,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('90d39ca7-0337-fe54-ed4b-4546f5c3b06a','Now, let us move on to the next activity.','Bây giờ chúng ta chuyển sang hoạt động tiếp theo.','Chuyển tiếp','A2',1,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('90d39ca7-0337-fe54-ed4b-4546f5c3b06a','We have 5 minutes left for this task.','Chúng ta còn 5 phút cho nhiệm vụ này.','Cảnh báo thời gian','A2',2,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('90d39ca7-0337-fe54-ed4b-4546f5c3b06a','Please wrap up your discussions.','Vui lòng kết thúc phần thảo luận.','Kết thúc','B1',3,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('90d39ca7-0337-fe54-ed4b-4546f5c3b06a','Put away your materials and prepare for the next subject.','Cất đồ dùng và chuẩn bị cho môn học tiếp theo.','Chuẩn bị','B1',4,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('90d39ca7-0337-fe54-ed4b-4546f5c3b06a','Take out your homework and pass it forward.','Lấy bài tập về nhà và chuyển lên trên.','Thu bài','A2',5,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('90d39ca7-0337-fe54-ed4b-4546f5c3b06a','Let us review what we learned today.','Chúng ta hãy ôn lại những gì đã học hôm nay.','Ôn tập','A2',6,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('90d39ca7-0337-fe54-ed4b-4546f5c3b06a','Write one thing you learned in your journal.','Viết một điều em học được vào nhật ký.','Phản tư','B1',7,true);
INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)
VALUES ('90d39ca7-0337-fe54-ed4b-4546f5c3b06a','Thank you for your hard work today.','Cảm ơn các em vì sự chăm chỉ hôm nay.','Kết thúc','A2',8,true);

-- 3. QUIZ SETS
INSERT INTO public.quiz_sets (id,title,slug,description,passing_score,xp_reward,level,question_count,is_published)
VALUES ('2d69c4d5-7902-e046-34d6-2c3706dc35fc','Classroom English & CLIL','classroom-clil-mixed','Kiểm tra kiến thức tổng hợp về Classroom English, phương pháp CLIL, đánh giá và kỹ thuật giảng dạy.',80,50,'B2',5,true);

-- 4. QUIZ QUESTIONS
INSERT INTO public.quiz_questions (id,quiz_set_id,prompt,prompt_translation,correct_answer,explanation,explanation_vi,competency_code,level,sort_order)
VALUES ('9f356a97-77c3-46d7-be0e-765cd13bf1b5','2d69c4d5-7902-e046-34d6-2c3706dc35fc','Which of the following is the best way to give instructions for a group task?','Cách tốt nhất để hướng dẫn bài tập nhóm là gì?','B','','Câu này nêu rõ số lượng thành viên, vai trò và sản phẩm cần tạo.','CLIL.Ins','B2',1);
INSERT INTO public.quiz_questions (id,quiz_set_id,prompt,prompt_translation,correct_answer,explanation,explanation_vi,competency_code,level,sort_order)
VALUES ('933208ef-18b2-7a44-03b4-c00f8d454fa2','2d69c4d5-7902-e046-34d6-2c3706dc35fc','What is the purpose of an ICQ (Instruction Checking Question)?','Mục đích của ICQ là gì?','A','','ICQ kiểm tra cách thực hiện chứ không hỏi cảm xúc hoặc câu hỏi chung chung.','CE.Ins','B2',2);
INSERT INTO public.quiz_questions (id,quiz_set_id,prompt,prompt_translation,correct_answer,explanation,explanation_vi,competency_code,level,sort_order)
VALUES ('a6a5c627-3daf-c5b1-49e3-966059c2e850','2d69c4d5-7902-e046-34d6-2c3706dc35fc','Which feedback follows the "two-step" model?','Phản hồi nào theo mô hình "hai bước"?','D','','Phản hồi nêu một điểm mạnh và một bước tiếp theo cụ thể.','Assess.Fdb','B2',3);
INSERT INTO public.quiz_questions (id,quiz_set_id,prompt,prompt_translation,correct_answer,explanation,explanation_vi,competency_code,level,sort_order)
VALUES ('6ea48ed7-2f84-c758-4ce0-b8a1df14f56c','2d69c4d5-7902-e046-34d6-2c3706dc35fc','What is the role of scaffolding in CLIL?','Vai trò của scaffolding trong CLIL là gì?','C','','Scaffolding hỗ trợ tiếp cận nhưng vẫn giữ yêu cầu tư duy và được giảm dần khi học sinh độc lập hơn.','CLIL.Scaf','B2',4);
INSERT INTO public.quiz_questions (id,quiz_set_id,prompt,prompt_translation,correct_answer,explanation,explanation_vi,competency_code,level,sort_order)
VALUES ('966f09e3-2a4e-c931-bfe9-b9943a6b55ee','2d69c4d5-7902-e046-34d6-2c3706dc35fc','Why might a student understand the content but struggle to answer in English?','Tại sao học sinh hiểu nội dung nhưng khó trả lời bằng tiếng Anh?','C','','Học sinh có thể đang xử lý đồng thời ý tưởng và hình thức ngôn ngữ.','CLIL.Lang','B2',5);

-- 5. QUIZ OPTIONS
INSERT INTO public.quiz_options (question_id,option_text,is_correct,feedback_correct,feedback_incorrect,sort_order)
VALUES ('9f356a97-77c3-46d7-be0e-765cd13bf1b5','"Work in groups."',false,'','',1);
INSERT INTO public.quiz_options (question_id,option_text,is_correct,feedback_correct,feedback_incorrect,sort_order)
VALUES ('9f356a97-77c3-46d7-be0e-765cd13bf1b5','"In groups of three, discuss the causes of deforestation. You have 8 minutes. Each person shares one idea."',true,'','',2);
INSERT INTO public.quiz_options (question_id,option_text,is_correct,feedback_correct,feedback_incorrect,sort_order)
VALUES ('9f356a97-77c3-46d7-be0e-765cd13bf1b5','"Do the group task now."',false,'','',3);
INSERT INTO public.quiz_options (question_id,option_text,is_correct,feedback_correct,feedback_incorrect,sort_order)
VALUES ('9f356a97-77c3-46d7-be0e-765cd13bf1b5','"Get into groups and talk."',false,'','',4);
INSERT INTO public.quiz_options (question_id,option_text,is_correct,feedback_correct,feedback_incorrect,sort_order)
VALUES ('933208ef-18b2-7a44-03b4-c00f8d454fa2','To check if students understand what to do, not the content.',true,'','',1);
INSERT INTO public.quiz_options (question_id,option_text,is_correct,feedback_correct,feedback_incorrect,sort_order)
VALUES ('933208ef-18b2-7a44-03b4-c00f8d454fa2','To check if students are happy with the task.',false,'','',2);
INSERT INTO public.quiz_options (question_id,option_text,is_correct,feedback_correct,feedback_incorrect,sort_order)
VALUES ('933208ef-18b2-7a44-03b4-c00f8d454fa2','To review vocabulary from the lesson.',false,'','',3);
INSERT INTO public.quiz_options (question_id,option_text,is_correct,feedback_correct,feedback_incorrect,sort_order)
VALUES ('933208ef-18b2-7a44-03b4-c00f8d454fa2','To assess the final product.',false,'','',4);
INSERT INTO public.quiz_options (question_id,option_text,is_correct,feedback_correct,feedback_incorrect,sort_order)
VALUES ('a6a5c627-3daf-c5b1-49e3-966059c2e850','"Good job. Next."',false,'','',1);
INSERT INTO public.quiz_options (question_id,option_text,is_correct,feedback_correct,feedback_incorrect,sort_order)
VALUES ('a6a5c627-3daf-c5b1-49e3-966059c2e850','"That is wrong. Try again."',false,'','',2);
INSERT INTO public.quiz_options (question_id,option_text,is_correct,feedback_correct,feedback_incorrect,sort_order)
VALUES ('a6a5c627-3daf-c5b1-49e3-966059c2e850','"You need to improve your grammar."',false,'','',3);
INSERT INTO public.quiz_options (question_id,option_text,is_correct,feedback_correct,feedback_incorrect,sort_order)
VALUES ('a6a5c627-3daf-c5b1-49e3-966059c2e850','"I like your use of evidence. Next time, add a concluding sentence."',true,'','',4);
INSERT INTO public.quiz_options (question_id,option_text,is_correct,feedback_correct,feedback_incorrect,sort_order)
VALUES ('6ea48ed7-2f84-c758-4ce0-b8a1df14f56c','To simplify the content so it is easy.',false,'','',1);
INSERT INTO public.quiz_options (question_id,option_text,is_correct,feedback_correct,feedback_incorrect,sort_order)
VALUES ('6ea48ed7-2f84-c758-4ce0-b8a1df14f56c','To replace the teacher''s instruction.',false,'','',2);
INSERT INTO public.quiz_options (question_id,option_text,is_correct,feedback_correct,feedback_incorrect,sort_order)
VALUES ('6ea48ed7-2f84-c758-4ce0-b8a1df14f56c','To provide structured access to challenging content while maintaining cognitive demand.',true,'','',3);
INSERT INTO public.quiz_options (question_id,option_text,is_correct,feedback_correct,feedback_incorrect,sort_order)
VALUES ('6ea48ed7-2f84-c758-4ce0-b8a1df14f56c','To translate difficult words into the L1.',false,'','',4);
INSERT INTO public.quiz_options (question_id,option_text,is_correct,feedback_correct,feedback_incorrect,sort_order)
VALUES ('966f09e3-2a4e-c931-bfe9-b9943a6b55ee','They are not paying attention.',false,'','',1);
INSERT INTO public.quiz_options (question_id,option_text,is_correct,feedback_correct,feedback_incorrect,sort_order)
VALUES ('966f09e3-2a4e-c931-bfe9-b9943a6b55ee','They lack basic vocabulary.',false,'','',2);
INSERT INTO public.quiz_options (question_id,option_text,is_correct,feedback_correct,feedback_incorrect,sort_order)
VALUES ('966f09e3-2a4e-c931-bfe9-b9943a6b55ee','They are processing both content and language simultaneously, which increases cognitive load.',true,'','',3);
INSERT INTO public.quiz_options (question_id,option_text,is_correct,feedback_correct,feedback_incorrect,sort_order)
VALUES ('966f09e3-2a4e-c931-bfe9-b9943a6b55ee','They have low motivation.',false,'','',4);

-- 6. VOCABULARY ENTRIES
INSERT INTO public.vocabulary_entries (word,part_of_speech,level,meaning_vi,definition_en,example_en,example_vi,collocation,topic,is_published)
VALUES ('assess','verb','B2','đánh giá','to evaluate or estimate the nature, ability, or quality of','Assess student understanding with an exit ticket.','Đánh giá mức độ hiểu bài của học sinh bằng phiếu exit ticket.','assess understanding','assessment',true);
INSERT INTO public.vocabulary_entries (word,part_of_speech,level,meaning_vi,definition_en,example_en,example_vi,collocation,topic,is_published)
VALUES ('scaffold','verb','B2','hỗ trợ theo từng bước','to provide temporary support for a difficult task','Scaffold the explanation with a cause-and-effect frame.','Hãy hỗ trợ phần giải thích bằng khung nguyên nhân–kết quả.','scaffold learning','CLIL',true);
INSERT INTO public.vocabulary_entries (word,part_of_speech,level,meaning_vi,definition_en,example_en,example_vi,collocation,topic,is_published)
VALUES ('differentiate','verb','C1','phân hóa','to adapt instruction to meet varied learner needs','Differentiate tasks by readiness and interest.','Phân hóa nhiệm vụ theo mức độ sẵn sàng và sở thích.','differentiate instruction','methodology',true);
INSERT INTO public.vocabulary_entries (word,part_of_speech,level,meaning_vi,definition_en,example_en,example_vi,collocation,topic,is_published)
VALUES ('rubric','noun','B2','tiêu chí đánh giá','a set of criteria used for assessing performance','Use a simple rubric for peer assessment.','Dùng rubric đơn giản cho đánh giá đồng đẳng.','design a rubric','assessment',true);
INSERT INTO public.vocabulary_entries (word,part_of_speech,level,meaning_vi,definition_en,example_en,example_vi,collocation,topic,is_published)
VALUES ('collocation','noun','C1','cụm từ kết hợp','a pair or group of words commonly used together','Teach collocations rather than isolated words.','Dạy các cụm từ kết hợp thay vì từ đơn lẻ.','common collocations','vocabulary',true);
INSERT INTO public.vocabulary_entries (word,part_of_speech,level,meaning_vi,definition_en,example_en,example_vi,collocation,topic,is_published)
VALUES ('curriculum','noun','B2','chương trình giảng dạy','the subjects and materials used in a course of study','Align your lesson with the curriculum standards.','Điều chỉnh bài học theo chuẩn chương trình.','curriculum design','methodology',true);
INSERT INTO public.vocabulary_entries (word,part_of_speech,level,meaning_vi,definition_en,example_en,example_vi,collocation,topic,is_published)
VALUES ('metacognition','noun','C1','siêu nhận thức','awareness of one''s own learning processes','Prompt metacognition with a self-check question.','Khơi gợi siêu nhận thức bằng câu hỏi tự kiểm tra.','develop metacognition','learning_science',true);
INSERT INTO public.vocabulary_entries (word,part_of_speech,level,meaning_vi,definition_en,example_en,example_vi,collocation,topic,is_published)
VALUES ('engagement','noun','B2','sự tham gia tích cực','the level of student participation and interest','Increase engagement with think-pair-share.','Tăng sự tham gia với kỹ thuật think-pair-share.','student engagement','methodology',true);
INSERT INTO public.vocabulary_entries (word,part_of_speech,level,meaning_vi,definition_en,example_en,example_vi,collocation,topic,is_published)
VALUES ('formative','adjective','B2','định hình (đánh giá quá trình)','ongoing assessment used to improve learning','Use formative checks throughout the lesson.','Sử dụng kiểm tra định hình xuyên suốt bài học.','formative assessment','assessment',true);
INSERT INTO public.vocabulary_entries (word,part_of_speech,level,meaning_vi,definition_en,example_en,example_vi,collocation,topic,is_published)
VALUES ('scaffolding','noun','C1','sự hỗ trợ từng bước','instructional support gradually removed as learners gain independence','Scaffolding helps learners access challenging content.','Scaffolding giúp học sinh tiếp cận nội dung khó.','provide scaffolding','CLIL',true);
INSERT INTO public.vocabulary_entries (word,part_of_speech,level,meaning_vi,definition_en,example_en,example_vi,collocation,topic,is_published)
VALUES ('syllabus','noun','B2','đề cương môn học','an outline of topics and objectives for a course','The syllabus includes weekly topics and assessments.','Đề cương bao gồm chủ đề hàng tuần và bài đánh giá.','course syllabus','methodology',true);
INSERT INTO public.vocabulary_entries (word,part_of_speech,level,meaning_vi,definition_en,example_en,example_vi,collocation,topic,is_published)
VALUES ('fluency','noun','B2','sự trôi chảy','the ability to speak or write smoothly and easily','Focus on fluency during pair discussions.','Tập trung vào sự trôi chảy trong thảo luận cặp.','develop fluency','classroom_english',true);
INSERT INTO public.vocabulary_entries (word,part_of_speech,level,meaning_vi,definition_en,example_en,example_vi,collocation,topic,is_published)
VALUES ('peer','noun','B1','bạn cùng trang lứa','a person of the same age or ability level','Students give peer feedback after presentations.','Học sinh đưa ra phản hồi đồng đẳng sau bài thuyết trình.','peer assessment','assessment',true);
INSERT INTO public.vocabulary_entries (word,part_of_speech,level,meaning_vi,definition_en,example_en,example_vi,collocation,topic,is_published)
VALUES ('retrieval','noun','C1','sự truy hồi','the act of recalling information from memory','Start each lesson with a retrieval activity.','Bắt đầu mỗi bài học bằng hoạt động truy hồi.','retrieval practice','learning_science',true);
INSERT INTO public.vocabulary_entries (word,part_of_speech,level,meaning_vi,definition_en,example_en,example_vi,collocation,topic,is_published)
VALUES ('summative','adjective','B2','tổng kết','assessment that measures learning at the end of a unit','The final test is summative.','Bài kiểm tra cuối kỳ là đánh giá tổng kết.','summative assessment','assessment',true);
INSERT INTO public.vocabulary_entries (word,part_of_speech,level,meaning_vi,definition_en,example_en,example_vi,collocation,topic,is_published)
VALUES ('intervention','noun','C1','can thiệp','a strategy to help struggling learners','Provide timely intervention for students below level.','Can thiệp kịp thời cho học sinh dưới chuẩn.','early intervention','methodology',true);
INSERT INTO public.vocabulary_entries (word,part_of_speech,level,meaning_vi,definition_en,example_en,example_vi,collocation,topic,is_published)
VALUES ('reflection','noun','B2','sự suy ngẫm','serious thought about one''s own learning or teaching','End with a one-minute reflection.','Kết thúc bằng một phút suy ngẫm.','self-reflection','methodology',true);
INSERT INTO public.vocabulary_entries (word,part_of_speech,level,meaning_vi,definition_en,example_en,example_vi,collocation,topic,is_published)
VALUES ('cognitive','adjective','C1','thuộc về nhận thức','related to mental processes of understanding','Reduce cognitive load with clear visuals.','Giảm tải nhận thức bằng hình ảnh trực quan.','cognitive load','learning_science',true);
INSERT INTO public.vocabulary_entries (word,part_of_speech,level,meaning_vi,definition_en,example_en,example_vi,collocation,topic,is_published)
VALUES ('differentiation','noun','C1','sự phân hóa','adapting instruction to meet individual needs','Differentiation includes content, process, and product.','Phân hóa bao gồm nội dung, quy trình và sản phẩm.','classroom differentiation','methodology',true);
INSERT INTO public.vocabulary_entries (word,part_of_speech,level,meaning_vi,definition_en,example_en,example_vi,collocation,topic,is_published)
VALUES ('implication','noun','C1','hệ quả, ý nghĩa','a possible consequence or effect','Discuss the implications of the research.','Thảo luận về ý nghĩa của nghiên cứu.','practical implications','methodology',true);

-- 7. TIPS
INSERT INTO public.tips (title,content,category,is_published)
VALUES ('Dùng ICQ sau mỗi hướng dẫn','Sau khi hướng dẫn bài tập, hãy hỏi một ICQ như "How many minutes do you have?" thay vì "Do you understand?"','Classroom English',true);
INSERT INTO public.tips (title,content,category,is_published)
VALUES ('Think-Pair-Share để tăng tương tác','Kỹ thuật đơn giản: học sinh suy nghĩ cá nhân (30s), thảo luận cặp (1 phút), chia sẻ với lớp.','CLIL',true);
INSERT INTO public.tips (title,content,category,is_published)
VALUES ('Phản hồi hai bước','Luôn bắt đầu bằng điểm mạnh, sau đó đưa ra một bước cải thiện cụ thể. Tránh phản hồi chung chung.','Assessment',true);
INSERT INTO public.tips (title,content,category,is_published)
VALUES ('Exit Ticket 3-2-1','Cuối giờ, yêu cầu học sinh viết: 3 điều học được, 2 điều thấy thú vị, 1 câu hỏi còn thắc mắc.','Assessment',true);
INSERT INTO public.tips (title,content,category,is_published)
VALUES ('Scaffolding từng bước','Cung cấp khung câu, mẫu câu, hoặc sơ đồ tư duy cho nhiệm vụ khó. Giảm dần hỗ trợ khi học sinh quen.','CLIL',true);
INSERT INTO public.tips (title,content,category,is_published)
VALUES ('Tận dụng 5 phút đầu giờ','Dùng 5 phút đầu để retrieval practice: 2-3 câu hỏi ôn tập bài cũ giúp kích hoạt kiến thức nền.','Classroom English',true);

-- 8. QUESTS
INSERT INTO public.quests (id,type,title,desc_text,xp,is_active)
VALUES ('daily-quiz','daily','Hoàn thành 1 bài quiz','Làm một bài quiz bất kỳ để kiểm tra kiến thức',50,true);
INSERT INTO public.quests (id,type,title,desc_text,xp,is_active)
VALUES ('daily-vimi','daily','Hỏi ViMi 1 câu hỏi','Chat với ViMi về bất kỳ chủ đề nào bạn quan tâm',40,true);
INSERT INTO public.quests (id,type,title,desc_text,xp,is_active)
VALUES ('daily-blog','daily','Đọc 1 bài viết Blog','Đọc một bài blog trong thư viện VMG',30,true);
INSERT INTO public.quests (id,type,title,desc_text,xp,is_active)
VALUES ('daily-vocab','daily','Ôn 5 từ vựng','Ôn tập 5 từ vựng bất kỳ trong danh sách',30,true);
INSERT INTO public.quests (id,type,title,desc_text,xp,is_active)
VALUES ('daily-phrases','daily','Luyện 5 câu Classroom Phrases','Luyện nói 5 câu lệnh lớp học tiếng Anh',40,true);
INSERT INTO public.quests (id,type,title,desc_text,xp,is_active)
VALUES ('daily-lesson','daily','Hoàn thành 1 bài học','Học xong một bài trong khóa học bất kỳ',60,true);
INSERT INTO public.quests (id,type,title,desc_text,xp,is_active)
VALUES ('daily-progress','daily','Xem tiến độ của bạn','Kiểm tra tiến độ học tập trên Dashboard',20,true);
INSERT INTO public.quests (id,type,title,desc_text,xp,is_active)
VALUES ('weekly-3daily','weekly','Hoàn thành 3 Daily Quest trong tuần','Hoàn thành 3 nhiệm vụ hàng ngày trong tuần này',150,true);
INSERT INTO public.quests (id,type,title,desc_text,xp,is_active)
VALUES ('weekly-quiz80','weekly','Đạt 80%+ trong 1 bài quiz','Đạt điểm cao trong một bài quiz bất kỳ',200,true);
INSERT INTO public.quests (id,type,title,desc_text,xp,is_active)
VALUES ('weekly-vocab15','weekly','Học 15 từ vựng mới','Mở rộng vốn từ vựng của bạn với 15 từ mới',200,true);
INSERT INTO public.quests (id,type,title,desc_text,xp,is_active)
VALUES ('weekly-2lessons','weekly','Hoàn thành 2 bài học','Học xong 2 bài trong bất kỳ khóa học nào',250,true);
INSERT INTO public.quests (id,type,title,desc_text,xp,is_active)
VALUES ('weekly-streak5','weekly','Duy trì streak 5 ngày','Giữ chuỗi học tập 5 ngày liên tiếp',300,true);
INSERT INTO public.quests (id,type,title,desc_text,xp,is_active)
VALUES ('weekly-vimi4','weekly','Luyện nói với ViMi 4 lần','Thực hành nói với ViMi ở chế độ speaking 4 lần',300,true);

-- 9. REWARDS
INSERT INTO public.rewards (name,desc_text,price,icon_type,content_type,content_json,stock,is_active)
VALUES ('Bộ từ vựng theo chủ đề','File PDF tổng hợp 20+ từ vựng theo chủ đề CLIL, Assessment, Classroom English.',150,'book','vocabulary','{}',NULL,true);
INSERT INTO public.rewards (name,desc_text,price,icon_type,content_type,content_json,stock,is_active)
VALUES ('Bảng câu hỏi ICQ/CCQ mẫu','30 câu hỏi kiểm tra hiểu bài theo từng giai đoạn của tiết học.',100,'file-text','prompts','{}',NULL,true);
INSERT INTO public.rewards (name,desc_text,price,icon_type,content_type,content_json,stock,is_active)
VALUES ('Mẫu giáo án CLIL 4Cs','Template giáo án CLIL tích hợp Content, Communication, Cognition, Culture.',200,'file-text','prompts','{}',NULL,true);
INSERT INTO public.rewards (name,desc_text,price,icon_type,content_type,content_json,stock,is_active)
VALUES ('Bộ thẻ từ vựng (Flashcards)','50 thẻ từ song ngữ dùng cho warm-up, word wall và trò chơi từ vựng.',120,'video','lessons','{}',NULL,true);
INSERT INTO public.rewards (name,desc_text,price,icon_type,content_type,content_json,stock,is_active)
VALUES ('Mẫu Rubric đánh giá','5 mẫu rubric cho thuyết trình, viết luận, dự án nhóm, phản biện và tự đánh giá.',100,'file-text','prompts','{}',NULL,true);
INSERT INTO public.rewards (name,desc_text,price,icon_type,content_type,content_json,stock,is_active)
VALUES ('Bộ câu hỏi warm-up theo chủ đề','40 câu hỏi khởi động dùng ngay cho lớp song ngữ. Theo chủ đề: Khoa học, CLIL, Kỹ năng.',80,'file-text','prompts','{}',NULL,true);
INSERT INTO public.rewards (name,desc_text,price,icon_type,content_type,content_json,stock,is_active)
VALUES ('Video hướng dẫn: ICQ & CCQ trong 5 phút','Video ngắn hướng dẫn kỹ thuật đặt câu hỏi kiểm tra hiểu bài hiệu quả.',300,'video','lessons','{}',NULL,true);
INSERT INTO public.rewards (name,desc_text,price,icon_type,content_type,content_json,stock,is_active)
VALUES ('Ebook: 10 kỹ thuật Scaffolding trong CLIL','Sách điện tử 45 trang kèm ví dụ thực tế, phân tích từng kỹ thuật và cách áp dụng trong lớp học.',400,'book','vocabulary','{}',NULL,true);
INSERT INTO public.rewards (name,desc_text,price,icon_type,content_type,content_json,stock,is_active)
VALUES ('Workshop Online: Phân hóa trong CLIL','Buổi workshop 90 phút với chuyên gia. Gồm tài liệu, bài tập thực hành và chứng nhận tham dự.',500,'monitor','webinar','{}',NULL,true);
INSERT INTO public.rewards (name,desc_text,price,icon_type,content_type,content_json,stock,is_active)
VALUES ('Template: Kế hoạch bài dạy theo tuần','Khung kế hoạch giảng dạy tuần dành cho giáo viên song ngữ. Tích hợp mục tiêu content + language.',150,'file-text','prompts','{}',NULL,true);
INSERT INTO public.rewards (name,desc_text,price,icon_type,content_type,content_json,stock,is_active)
VALUES ('Bộ câu hỏi phản tư cho giáo viên','20 câu hỏi phản tư sau giờ dạy, giúp giáo viên tự cải thiện phương pháp mỗi ngày.',100,'file-text','prompts','{}',NULL,true);
INSERT INTO public.rewards (name,desc_text,price,icon_type,content_type,content_json,stock,is_active)
VALUES ('Bài mẫu: CLIL Khoa học lớp 6','Bài học CLIL mẫu kèm video, bài tập, rubric và giáo án chi tiết cho chủ đề Khoa học.',250,'video','lessons','{}',NULL,true);
INSERT INTO public.rewards (name,desc_text,price,icon_type,content_type,content_json,stock,is_active)
VALUES ('Hướng dẫn dạy từ vựng qua Collocations','Bộ tài liệu gồm lý thuyết, bài tập và 10 collocations thiết yếu cho lớp học song ngữ.',200,'video','lessons','{}',NULL,true);
INSERT INTO public.rewards (name,desc_text,price,icon_type,content_type,content_json,stock,is_active)
VALUES ('Kỹ thuật Retrieval Practice trong 5 phút','Video + handout hướng dẫn 3 kỹ thuật truy hồi dùng ngay trong lớp học song ngữ.',200,'video','lessons','{}',NULL,true);
INSERT INTO public.rewards (name,desc_text,price,icon_type,content_type,content_json,stock,is_active)
VALUES ('Badge kỹ năng (hiển thị trên hồ sơ)','Badge hiển thị trên hồ sơ EduNext. Chọn từ danh mục: CLIL Practitioner, Classroom English Expert, Differentiated Instruction Specialist, Assessment Pro, Technology Integrator. Có thể chia sẻ lên LinkedIn.',0,'award','lessons','{}',NULL,true);
INSERT INTO public.rewards (name,desc_text,price,icon_type,content_type,content_json,stock,is_active)
VALUES ('1 tháng truy cập VIP Kho học liệu','Truy cập toàn bộ tài liệu cao cấp trong 30 ngày. Gồm: giáo án, rubric, bài tập, video hướng dẫn.',600,'video','lessons','{}',NULL,true);
INSERT INTO public.rewards (name,desc_text,price,icon_type,content_type,content_json,stock,is_active)
VALUES ('Đặt lịch Coaching 1:1 với Academic Expert','1 buổi coaching 45 phút với chuyên gia học thuật. Nhận phản hồi cá nhân hóa về phương pháp giảng dạy.',1000,'monitor','webinar','{}',NULL,true);
INSERT INTO public.rewards (name,desc_text,price,icon_type,content_type,content_json,stock,is_active)
VALUES ('Chứng nhận hoàn thành khóa học','Chứng nhận hoàn thành mỗi khóa học, có mã xác thực. Tự động mở khóa khi hoàn thành 100% khóa học.',0,'award','lessons','{}',NULL,true);
INSERT INTO public.rewards (name,desc_text,price,icon_type,content_type,content_json,stock,is_active)
VALUES ('Gói Mentor 1 tháng (4 buổi)','4 buổi mentoring 45 phút với chuyên gia. Thiết kế lộ trình phát triển chuyên môn cá nhân, quan sát lớp và phản hồi.',1500,'monitor','webinar','{}',NULL,true);

-- ============================================================
-- END — All seed data inserted
-- ============================================================