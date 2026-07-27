const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const NS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const d = n => {
  const h = crypto.createHash('md5').update(NS + n).digest('hex');
  return h.substring(0,8)+'-'+h.substring(8,12)+'-'+h.substring(12,16)+'-'+h.substring(16,20)+'-'+h.substring(20,32);
};

const esc = v => {
  const s = String(v);
  return "'" + s.replace(/'/g, "''") + "'";
};

const sql = [];

// --- classroom_phrase_categories ---
const CAT_SLUGS = ['settling','warm-up','instruction','grouping','checking','feedback','transition'];
const CAT_NAMES = ['Ổn định lớp','Khởi động','Hướng dẫn bài tập','Chia nhóm','Kiểm tra hiểu bài','Phản hồi và ghi nhận','Chuyển tiếp và kết thúc'];
const CAT_ICONS = ['users','activity','book-open','grid','help-circle','message-square','arrow-right'];
const CAT_MAP = {};
sql.push('-- ============================================================');
sql.push('-- VMG EduNext — Seed Data Import Script');
sql.push('-- Chạy 1 lần trên Supabase SQL Editor');
sql.push('-- ============================================================');
sql.push('');
sql.push('-- 1. CLASSROOM PHRASE CATEGORIES');
CAT_SLUGS.forEach((slug, i) => {
  const id = d('cat-'+slug);
  CAT_MAP[slug] = id;
  sql.push(`INSERT INTO public.classroom_phrase_categories (id,slug,name_vi,sort_order,icon)`);
  sql.push(`VALUES (${esc(id)},${esc(slug)},${esc(CAT_NAMES[i])},${i+1},${esc(CAT_ICONS[i])});`);
});

// --- classroom_phrases ---
const PHRASES = [
  ['Good morning, everyone. Please take your seats.','Chào buổi sáng cả lớp. Mời các em ngồi xuống.','Ổn định','settling','A2'],
  ['Let us settle down and get ready to learn.','Chúng ta hãy ổn định để sẵn sàng học tập.','Ổn định','settling','A2'],
  ['When I raise my hand, please finish your sentence and look this way.','Khi tôi giơ tay, các em hãy dừng lại và nhìn lên đây.','Thu hút sự chú ý','settling','B1'],
  ['I need your attention, please.','Tôi cần các em chú ý.','Thu hút sự chú ý','settling','A2'],
  ['Can I have your attention, please?','Các em chú ý giúp tôi.','Thu hút sự chú ý','settling','A2'],
  ['Are you ready to start the lesson?','Các em đã sẵn sàng bắt đầu bài học chưa?','Bắt đầu','settling','A2'],
  ['Let us begin today\'s lesson.','Chúng ta hãy bắt đầu bài học hôm nay.','Bắt đầu','settling','A2'],
  ['Please put away your phones and other distractions.','Vui lòng cất điện thoại và các vật gây sao nhãng.','Kỷ luật','settling','B1'],
  ['Eyes on the board, please.','Các em nhìn lên bảng.','Thu hút sự chú ý','settling','A2'],
  ['Listen carefully to the instructions.','Lắng nghe hướng dẫn một cách cẩn thận.','Thu hút sự chú ý','settling','A2'],
  ['Let us warm up with a quick question.','Chúng ta hãy khởi động với một câu hỏi nhanh.','Khởi động','warm-up','A2'],
  ['Think about this question for 30 seconds.','Suy nghĩ về câu hỏi này trong 30 giây.','Tư duy','warm-up','B1'],
  ['Turn to your partner and discuss.','Quay sang bạn bên cạnh và thảo luận.','Cặp đôi','warm-up','A2'],
  ['What do you already know about this topic?','Các em đã biết gì về chủ đề này?','Kích hoạt kiến thức','warm-up','B1'],
  ['Share one idea with the class.','Chia sẻ một ý tưởng với cả lớp.','Chia sẻ','warm-up','A2'],
  ['Let us brainstorm ideas together.','Chúng ta hãy cùng nhau động não.','Động não','warm-up','B1'],
  ['Here is a picture. What do you see?','Đây là một bức tranh. Các em thấy gì?','Quan sát','warm-up','A2'],
  ['Watch this short video clip.','Các em hãy xem đoạn video ngắn này.','Xem video','warm-up','A2'],
  ['What questions do you have after watching?','Các em có câu hỏi gì sau khi xem?','Phản hồi','warm-up','B1'],
  ['Open your book to page 25.','Mở sách trang 25.','Hướng dẫn','instruction','A2'],
  ['Read the passage silently.','Đọc thầm đoạn văn.','Đọc hiểu','instruction','A2'],
  ['Follow along as I read aloud.','Đọc theo khi tôi đọc to.','Đọc theo','instruction','A2'],
  ['Complete the worksheet on page 10.','Hoàn thành phiếu bài tập trang 10.','Bài tập','instruction','A2'],
  ['You have 15 minutes to finish this task.','Các em có 15 phút để hoàn thành nhiệm vụ này.','Quản lý thời gian','instruction','B1'],
  ['Work individually for the first 5 minutes.','Làm việc cá nhân trong 5 phút đầu.','Làm việc cá nhân','instruction','B1'],
  ['Underline the key words in the text.','Gạch chân các từ khóa trong văn bản.','Kỹ thuật đọc','instruction','B1'],
  ['Write your answers in complete sentences.','Viết câu trả lời thành câu hoàn chỉnh.','Viết','instruction','B1'],
  ['Check your answers with a partner.','Kiểm tra đáp án với bạn cùng bàn.','Kiểm tra chéo','instruction','A2'],
  ['Raise your hand if you need help.','Giơ tay nếu em cần giúp đỡ.','Hỗ trợ','instruction','A2'],
  ['Form groups of four.','Chia nhóm bốn người.','Chia nhóm','grouping','A2'],
  ['Find a partner for this activity.','Tìm một bạn cùng cặp cho hoạt động này.','Bắt cặp','grouping','A2'],
  ['Move quietly to your group area.','Di chuyển nhẹ nhàng đến khu vực nhóm của mình.','Di chuyển','grouping','B1'],
  ['Choose one person to be the spokesperson.','Chọn một người làm phát ngôn viên.','Vai trò','grouping','B1'],
  ['Everyone in the group must contribute.','Mọi thành viên trong nhóm đều phải đóng góp.','Hợp tác','grouping','B2'],
  ['Switch roles after 10 minutes.','Đổi vai sau 10 phút.','Luân chuyển','grouping','B1'],
  ['Share your group\'s findings with the class.','Chia sẻ kết quả của nhóm với cả lớp.','Trình bày','grouping','B1'],
  ['Listen to your classmates\' presentations.','Lắng nghe bài trình bày của các bạn.','Lắng nghe','grouping','A2'],
  ['Give a round of applause to group 3.','Hãy vỗ tay cho nhóm 3.','Khích lệ','grouping','A2'],
  ['Does everyone understand the task?','Mọi người có hiểu nhiệm vụ không?','Kiểm tra bài tập','checking','B1'],
  ['Do you have any questions so far?','Các em có câu hỏi gì không?','Kiểm tra hiểu bài','checking','A2'],
  ['Can you repeat that in your own words?','Em có thể nhắc lại bằng từ ngữ của mình không?','Hiểu bài','checking','B1'],
  ['Show me a thumbs up if you understand.','Giơ ngón cái nếu em hiểu bài.','Kiểm tra nhanh','checking','A2'],
  ['Give an example of what I just explained.','Cho tôi một ví dụ về điều tôi vừa giải thích.','Kiểm tra hiểu bài','checking','B2'],
  ['What is the main idea of the text?','Ý chính của bài đọc là gì?','Đọc hiểu','checking','B1'],
  ['Complete this sentence: \"The author argues that...\"','Hoàn thành câu sau: \"Tác giả lập luận rằng...\"','Kiểm tra hiểu bài','checking','B2'],
  ['True or false: Water boils at 100 degrees Celsius.','Đúng hay sai: Nước sôi ở 100 độ C.','Kiểm tra kiến thức','checking','A2'],
  ['You have 30 seconds to discuss with your partner.','Các em có 30 giây để thảo luận với bạn cùng cặp.','Thảo luận','checking','A2'],
  ['Great job! That is an excellent answer.','Làm tốt lắm! Đó là một câu trả lời xuất sắc.','Khen ngợi','feedback','A2'],
  ['Almost there — check your spelling.','Gần đúng rồi — hãy kiểm tra lỗi chính tả.','Sửa lỗi','feedback','A2'],
  ['Good effort! Try adding more detail next time.','Cố gắng tốt! Lần sau thử thêm chi tiết nhé.','Khích lệ','feedback','B1'],
  ['You are on the right track.','Em đang đi đúng hướng.','Khích lệ','feedback','A2'],
  ['That is an interesting point of view.','Đó là một quan điểm thú vị.','Ghi nhận','feedback','B1'],
  ['Can you explain your reasoning?','Em có thể giải thích lý do của mình không?','Khuyến khích tư duy','feedback','B1'],
  ['I like how you used evidence from the text.','Tôi thích cách em sử dụng bằng chứng từ văn bản.','Khen ngợi','feedback','B1'],
  ['Let us look at the first sentence together.','Chúng ta hãy cùng xem xét câu đầu tiên.','Hướng dẫn sửa','feedback','A2'],
  ['Try using a different word here.','Thử dùng một từ khác ở đây.','Gợi ý','feedback','B1'],
  ['Now, let us move on to the next activity.','Bây giờ chúng ta chuyển sang hoạt động tiếp theo.','Chuyển tiếp','transition','A2'],
  ['We have 5 minutes left for this task.','Chúng ta còn 5 phút cho nhiệm vụ này.','Cảnh báo thời gian','transition','A2'],
  ['Please wrap up your discussions.','Vui lòng kết thúc phần thảo luận.','Kết thúc','transition','B1'],
  ['Put away your materials and prepare for the next subject.','Cất đồ dùng và chuẩn bị cho môn học tiếp theo.','Chuẩn bị','transition','B1'],
  ['Take out your homework and pass it forward.','Lấy bài tập về nhà và chuyển lên trên.','Thu bài','transition','A2'],
  ['Let us review what we learned today.','Chúng ta hãy ôn lại những gì đã học hôm nay.','Ôn tập','transition','A2'],
  ['Write one thing you learned in your journal.','Viết một điều em học được vào nhật ký.','Phản tư','transition','B1'],
  ['Thank you for your hard work today.','Cảm ơn các em vì sự chăm chỉ hôm nay.','Kết thúc','transition','A2'],
];
sql.push('');
sql.push('-- 2. CLASSROOM PHRASES');
const sa = {};
PHRASES.forEach(p => {
  const catSlug = p[3];
  if (!sa[catSlug]) sa[catSlug] = 0;
  sa[catSlug]++;
  sql.push(`INSERT INTO public.classroom_phrases (category_id,phrase_en,phrase_vi,purpose,level,sort_order,is_published)`);
  sql.push(`VALUES (${esc(CAT_MAP[catSlug])},${esc(p[0])},${esc(p[1])},${esc(p[2])},${esc(p[4])},${sa[catSlug]},true);`);
});

// --- quiz_sets ---
const QSET_ID = d('quiz-classroom-clil-mixed');
sql.push('');
sql.push('-- 3. QUIZ SETS');
sql.push(`INSERT INTO public.quiz_sets (id,title,slug,description,passing_score,xp_reward,level,question_count,is_published)`);
sql.push(`VALUES (${esc(QSET_ID)},'Classroom English & CLIL','classroom-clil-mixed','Kiểm tra kiến thức tổng hợp về Classroom English, phương pháp CLIL, đánh giá và kỹ thuật giảng dạy.',80,50,'B2',5,true);`);

// --- quiz_questions ---
const QUESTIONS = [
  [1,'Which of the following is the best way to give instructions for a group task?','Cách tốt nhất để hướng dẫn bài tập nhóm là gì?','CLIL.Ins','B','Câu này nêu rõ số lượng thành viên, vai trò và sản phẩm cần tạo.'],
  [2,'What is the purpose of an ICQ (Instruction Checking Question)?','Mục đích của ICQ là gì?','CE.Ins','A','ICQ kiểm tra cách thực hiện chứ không hỏi cảm xúc hoặc câu hỏi chung chung.'],
  [3,'Which feedback follows the \"two-step\" model?','Phản hồi nào theo mô hình \"hai bước\"?','Assess.Fdb','D','Phản hồi nêu một điểm mạnh và một bước tiếp theo cụ thể.'],
  [4,'What is the role of scaffolding in CLIL?','Vai trò của scaffolding trong CLIL là gì?','CLIL.Scaf','C','Scaffolding hỗ trợ tiếp cận nhưng vẫn giữ yêu cầu tư duy và được giảm dần khi học sinh độc lập hơn.'],
  [5,'Why might a student understand the content but struggle to answer in English?','Tại sao học sinh hiểu nội dung nhưng khó trả lời bằng tiếng Anh?','CLIL.Lang','C','Học sinh có thể đang xử lý đồng thời ý tưởng và hình thức ngôn ngữ.'],
];
const Q_MAP = {};
sql.push('');
sql.push('-- 4. QUIZ QUESTIONS');
QUESTIONS.forEach(q => {
  const qid = d('q-'+q[0]);
  Q_MAP[q[0]] = qid;
  sql.push(`INSERT INTO public.quiz_questions (id,quiz_set_id,prompt,prompt_translation,correct_answer,explanation,explanation_vi,competency_code,level,sort_order)`);
  sql.push(`VALUES (${esc(qid)},${esc(QSET_ID)},${esc(q[1])},${esc(q[2])},${esc(q[4])},'',${esc(q[5])},${esc(q[3])},'B2',${q[0]});`);
});

// --- quiz_options ---
const OPTS = [
  [1,'\"Work in groups.\"',false],[1,'\"In groups of three, discuss the causes of deforestation. You have 8 minutes. Each person shares one idea.\"',true],[1,'\"Do the group task now.\"',false],[1,'\"Get into groups and talk.\"',false],
  [2,'To check if students understand what to do, not the content.',true],[2,'To check if students are happy with the task.',false],[2,'To review vocabulary from the lesson.',false],[2,'To assess the final product.',false],
  [3,'\"Good job. Next.\"',false],[3,'\"That is wrong. Try again.\"',false],[3,'\"You need to improve your grammar.\"',false],[3,'\"I like your use of evidence. Next time, add a concluding sentence.\"',true],
  [4,'To simplify the content so it is easy.',false],[4,'To replace the teacher\'s instruction.',false],[4,'To provide structured access to challenging content while maintaining cognitive demand.',true],[4,'To translate difficult words into the L1.',false],
  [5,'They are not paying attention.',false],[5,'They lack basic vocabulary.',false],[5,'They are processing both content and language simultaneously, which increases cognitive load.',true],[5,'They have low motivation.',false],
];
const pqc = {};
sql.push('');
sql.push('-- 5. QUIZ OPTIONS');
OPTS.forEach(([sq, t, c]) => {
  if (!pqc[sq]) pqc[sq] = 0;
  pqc[sq]++;
  sql.push(`INSERT INTO public.quiz_options (question_id,option_text,is_correct,feedback_correct,feedback_incorrect,sort_order)`);
  sql.push(`VALUES (${esc(Q_MAP[sq])},${esc(t)},${c},'','',${pqc[sq]});`);
});

// --- vocabulary_entries ---
const VOCAB = [
  ['assess','verb','B2','đánh giá','to evaluate or estimate the nature, ability, or quality of','Assess student understanding with an exit ticket.','Đánh giá mức độ hiểu bài của học sinh bằng phiếu exit ticket.','assess understanding','assessment'],
  ['scaffold','verb','B2','hỗ trợ theo từng bước','to provide temporary support for a difficult task','Scaffold the explanation with a cause-and-effect frame.','Hãy hỗ trợ phần giải thích bằng khung nguyên nhân–kết quả.','scaffold learning','CLIL'],
  ['differentiate','verb','C1','phân hóa','to adapt instruction to meet varied learner needs','Differentiate tasks by readiness and interest.','Phân hóa nhiệm vụ theo mức độ sẵn sàng và sở thích.','differentiate instruction','methodology'],
  ['rubric','noun','B2','tiêu chí đánh giá','a set of criteria used for assessing performance','Use a simple rubric for peer assessment.','Dùng rubric đơn giản cho đánh giá đồng đẳng.','design a rubric','assessment'],
  ['collocation','noun','C1','cụm từ kết hợp','a pair or group of words commonly used together','Teach collocations rather than isolated words.','Dạy các cụm từ kết hợp thay vì từ đơn lẻ.','common collocations','vocabulary'],
  ['curriculum','noun','B2','chương trình giảng dạy','the subjects and materials used in a course of study','Align your lesson with the curriculum standards.','Điều chỉnh bài học theo chuẩn chương trình.','curriculum design','methodology'],
  ['metacognition','noun','C1','siêu nhận thức','awareness of one\'s own learning processes','Prompt metacognition with a self-check question.','Khơi gợi siêu nhận thức bằng câu hỏi tự kiểm tra.','develop metacognition','learning_science'],
  ['engagement','noun','B2','sự tham gia tích cực','the level of student participation and interest','Increase engagement with think-pair-share.','Tăng sự tham gia với kỹ thuật think-pair-share.','student engagement','methodology'],
  ['formative','adjective','B2','định hình (đánh giá quá trình)','ongoing assessment used to improve learning','Use formative checks throughout the lesson.','Sử dụng kiểm tra định hình xuyên suốt bài học.','formative assessment','assessment'],
  ['scaffolding','noun','C1','sự hỗ trợ từng bước','instructional support gradually removed as learners gain independence','Scaffolding helps learners access challenging content.','Scaffolding giúp học sinh tiếp cận nội dung khó.','provide scaffolding','CLIL'],
  ['syllabus','noun','B2','đề cương môn học','an outline of topics and objectives for a course','The syllabus includes weekly topics and assessments.','Đề cương bao gồm chủ đề hàng tuần và bài đánh giá.','course syllabus','methodology'],
  ['fluency','noun','B2','sự trôi chảy','the ability to speak or write smoothly and easily','Focus on fluency during pair discussions.','Tập trung vào sự trôi chảy trong thảo luận cặp.','develop fluency','classroom_english'],
  ['peer','noun','B1','bạn cùng trang lứa','a person of the same age or ability level','Students give peer feedback after presentations.','Học sinh đưa ra phản hồi đồng đẳng sau bài thuyết trình.','peer assessment','assessment'],
  ['retrieval','noun','C1','sự truy hồi','the act of recalling information from memory','Start each lesson with a retrieval activity.','Bắt đầu mỗi bài học bằng hoạt động truy hồi.','retrieval practice','learning_science'],
  ['summative','adjective','B2','tổng kết','assessment that measures learning at the end of a unit','The final test is summative.','Bài kiểm tra cuối kỳ là đánh giá tổng kết.','summative assessment','assessment'],
  ['intervention','noun','C1','can thiệp','a strategy to help struggling learners','Provide timely intervention for students below level.','Can thiệp kịp thời cho học sinh dưới chuẩn.','early intervention','methodology'],
  ['reflection','noun','B2','sự suy ngẫm','serious thought about one\'s own learning or teaching','End with a one-minute reflection.','Kết thúc bằng một phút suy ngẫm.','self-reflection','methodology'],
  ['cognitive','adjective','C1','thuộc về nhận thức','related to mental processes of understanding','Reduce cognitive load with clear visuals.','Giảm tải nhận thức bằng hình ảnh trực quan.','cognitive load','learning_science'],
  ['differentiation','noun','C1','sự phân hóa','adapting instruction to meet individual needs','Differentiation includes content, process, and product.','Phân hóa bao gồm nội dung, quy trình và sản phẩm.','classroom differentiation','methodology'],
  ['implication','noun','C1','hệ quả, ý nghĩa','a possible consequence or effect','Discuss the implications of the research.','Thảo luận về ý nghĩa của nghiên cứu.','practical implications','methodology'],
];
sql.push('');
sql.push('-- 6. VOCABULARY ENTRIES');
VOCAB.forEach(v => {
  sql.push(`INSERT INTO public.vocabulary_entries (word,part_of_speech,level,meaning_vi,definition_en,example_en,example_vi,collocation,topic,is_published)`);
  sql.push(`VALUES (${esc(v[0])},${esc(v[1])},${esc(v[2])},${esc(v[3])},${esc(v[4])},${esc(v[5])},${esc(v[6])},${esc(v[7])},${esc(v[8])},true);`);
});

// --- tips ---
const TIPS = [
  ['Dùng ICQ sau mỗi hướng dẫn','Sau khi hướng dẫn bài tập, hãy hỏi một ICQ như "How many minutes do you have?" thay vì "Do you understand?"','Classroom English'],
  ['Think-Pair-Share để tăng tương tác','Kỹ thuật đơn giản: học sinh suy nghĩ cá nhân (30s), thảo luận cặp (1 phút), chia sẻ với lớp.','CLIL'],
  ['Phản hồi hai bước','Luôn bắt đầu bằng điểm mạnh, sau đó đưa ra một bước cải thiện cụ thể. Tránh phản hồi chung chung.','Assessment'],
  ['Exit Ticket 3-2-1','Cuối giờ, yêu cầu học sinh viết: 3 điều học được, 2 điều thấy thú vị, 1 câu hỏi còn thắc mắc.','Assessment'],
  ['Scaffolding từng bước','Cung cấp khung câu, mẫu câu, hoặc sơ đồ tư duy cho nhiệm vụ khó. Giảm dần hỗ trợ khi học sinh quen.','CLIL'],
  ['Tận dụng 5 phút đầu giờ','Dùng 5 phút đầu để retrieval practice: 2-3 câu hỏi ôn tập bài cũ giúp kích hoạt kiến thức nền.','Classroom English'],
];
sql.push('');
sql.push('-- 7. TIPS');
TIPS.forEach(t => {
  sql.push(`INSERT INTO public.tips (title,content,category,is_published)`);
  sql.push(`VALUES (${esc(t[0])},${esc(t[1])},${esc(t[2])},true);`);
});

// --- quests ---
const QUESTS = [
  ['daily-quiz','daily','Hoàn thành 1 bài quiz',50,'Làm một bài quiz bất kỳ để kiểm tra kiến thức'],
  ['daily-vimi','daily','Hỏi ViMi 1 câu hỏi',40,'Chat với ViMi về bất kỳ chủ đề nào bạn quan tâm'],
  ['daily-blog','daily','Đọc 1 bài viết Blog',30,'Đọc một bài blog trong thư viện VMG'],
  ['daily-vocab','daily','Ôn 5 từ vựng',30,'Ôn tập 5 từ vựng bất kỳ trong danh sách'],
  ['daily-phrases','daily','Luyện 5 câu Classroom Phrases',40,'Luyện nói 5 câu lệnh lớp học tiếng Anh'],
  ['daily-lesson','daily','Hoàn thành 1 bài học',60,'Học xong một bài trong khóa học bất kỳ'],
  ['daily-progress','daily','Xem tiến độ của bạn',20,'Kiểm tra tiến độ học tập trên Dashboard'],
  ['weekly-3daily','weekly','Hoàn thành 3 Daily Quest trong tuần',150,'Hoàn thành 3 nhiệm vụ hàng ngày trong tuần này'],
  ['weekly-quiz80','weekly','Đạt 80%+ trong 1 bài quiz',200,'Đạt điểm cao trong một bài quiz bất kỳ'],
  ['weekly-vocab15','weekly','Học 15 từ vựng mới',200,'Mở rộng vốn từ vựng của bạn với 15 từ mới'],
  ['weekly-2lessons','weekly','Hoàn thành 2 bài học',250,'Học xong 2 bài trong bất kỳ khóa học nào'],
  ['weekly-streak5','weekly','Duy trì streak 5 ngày',300,'Giữ chuỗi học tập 5 ngày liên tiếp'],
  ['weekly-vimi4','weekly','Luyện nói với ViMi 4 lần',300,'Thực hành nói với ViMi ở chế độ speaking 4 lần'],
];
sql.push('');
sql.push('-- 8. QUESTS');
QUESTS.forEach(q => {
  sql.push(`INSERT INTO public.quests (id,type,title,desc_text,xp,is_active)`);
  sql.push(`VALUES (${esc(q[0])},${esc(q[1])},${esc(q[2])},${esc(q[4])},${q[3]},true);`);
});

// --- rewards ---
const REWARDS = [
  ['Bộ từ vựng theo chủ đề','File PDF tổng hợp 20+ từ vựng theo chủ đề CLIL, Assessment, Classroom English.',150,'book','vocabulary'],
  ['Bảng câu hỏi ICQ/CCQ mẫu','30 câu hỏi kiểm tra hiểu bài theo từng giai đoạn của tiết học.',100,'file-text','prompts'],
  ['Mẫu giáo án CLIL 4Cs','Template giáo án CLIL tích hợp Content, Communication, Cognition, Culture.',200,'file-text','prompts'],
  ['Bộ thẻ từ vựng (Flashcards)','50 thẻ từ song ngữ dùng cho warm-up, word wall và trò chơi từ vựng.',120,'video','lessons'],
  ['Mẫu Rubric đánh giá','5 mẫu rubric cho thuyết trình, viết luận, dự án nhóm, phản biện và tự đánh giá.',100,'file-text','prompts'],
  ['Bộ câu hỏi warm-up theo chủ đề','40 câu hỏi khởi động dùng ngay cho lớp song ngữ. Theo chủ đề: Khoa học, CLIL, Kỹ năng.',80,'file-text','prompts'],
  ['Video hướng dẫn: ICQ & CCQ trong 5 phút','Video ngắn hướng dẫn kỹ thuật đặt câu hỏi kiểm tra hiểu bài hiệu quả.',300,'video','lessons'],
  ['Ebook: 10 kỹ thuật Scaffolding trong CLIL','Sách điện tử 45 trang kèm ví dụ thực tế, phân tích từng kỹ thuật và cách áp dụng trong lớp học.',400,'book','vocabulary'],
  ['Workshop Online: Phân hóa trong CLIL','Buổi workshop 90 phút với chuyên gia. Gồm tài liệu, bài tập thực hành và chứng nhận tham dự.',500,'monitor','webinar'],
  ['Template: Kế hoạch bài dạy theo tuần','Khung kế hoạch giảng dạy tuần dành cho giáo viên song ngữ. Tích hợp mục tiêu content + language.',150,'file-text','prompts'],
  ['Bộ câu hỏi phản tư cho giáo viên','20 câu hỏi phản tư sau giờ dạy, giúp giáo viên tự cải thiện phương pháp mỗi ngày.',100,'file-text','prompts'],
  ['Bài mẫu: CLIL Khoa học lớp 6','Bài học CLIL mẫu kèm video, bài tập, rubric và giáo án chi tiết cho chủ đề Khoa học.',250,'video','lessons'],
  ['Hướng dẫn dạy từ vựng qua Collocations','Bộ tài liệu gồm lý thuyết, bài tập và 10 collocations thiết yếu cho lớp học song ngữ.',200,'video','lessons'],
  ['Kỹ thuật Retrieval Practice trong 5 phút','Video + handout hướng dẫn 3 kỹ thuật truy hồi dùng ngay trong lớp học song ngữ.',200,'video','lessons'],
  ['Badge kỹ năng (hiển thị trên hồ sơ)','Badge hiển thị trên hồ sơ EduNext. Chọn từ danh mục: CLIL Practitioner, Classroom English Expert, Differentiated Instruction Specialist, Assessment Pro, Technology Integrator. Có thể chia sẻ lên LinkedIn.',0,'award','lessons'],
  ['1 tháng truy cập VIP Kho học liệu','Truy cập toàn bộ tài liệu cao cấp trong 30 ngày. Gồm: giáo án, rubric, bài tập, video hướng dẫn.',600,'video','lessons'],
  ['Đặt lịch Coaching 1:1 với Academic Expert','1 buổi coaching 45 phút với chuyên gia học thuật. Nhận phản hồi cá nhân hóa về phương pháp giảng dạy.',1000,'monitor','webinar'],
  ['Chứng nhận hoàn thành khóa học','Chứng nhận hoàn thành mỗi khóa học, có mã xác thực. Tự động mở khóa khi hoàn thành 100% khóa học.',0,'award','lessons'],
  ['Gói Mentor 1 tháng (4 buổi)','4 buổi mentoring 45 phút với chuyên gia. Thiết kế lộ trình phát triển chuyên môn cá nhân, quan sát lớp và phản hồi.',1500,'monitor','webinar'],
];
sql.push('');
sql.push('-- 9. REWARDS');
REWARDS.forEach(r => {
  sql.push(`INSERT INTO public.rewards (name,desc_text,price,icon_type,content_type,content_json,stock,is_active)`);
  sql.push(`VALUES (${esc(r[0])},${esc(r[1])},${r[2]},${esc(r[3])},${esc(r[4])},'{}',NULL,true);`);
});

sql.push('');
sql.push('-- ============================================================');
sql.push('-- END — All seed data inserted');
sql.push('-- ============================================================');

const outFile = path.join(__dirname, '..', 'backend', 'supabase', 'import_data.sql');
fs.writeFileSync(outFile, sql.join('\n'));
console.log('✓ import_data.sql —', sql.length, 'lines');
