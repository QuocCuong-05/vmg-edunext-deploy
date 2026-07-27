const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CSV_DIR = path.join(__dirname, '..', 'backend', 'supabase', 'csv');
if (!fs.existsSync(CSV_DIR)) fs.mkdirSync(CSV_DIR, { recursive: true });

const UUID_NS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

function detUuid(name) {
  const hash = crypto.createHash('md5').update(UUID_NS + name).digest('hex');
  return hash.substring(0, 8) + '-' + hash.substring(8, 12) + '-' + hash.substring(12, 16) + '-' + hash.substring(16, 20) + '-' + hash.substring(20, 32);
}

function esc(val) {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function toCsv(rows, columns) {
  const header = columns.join(',');
  const lines = rows.map(row =>
    columns.map(col => esc(row[col])).join(',')
  );
  return [header, ...lines].join('\n');
}

// --- 1. VOCABULARY ENTRIES ---
const vocabData = [
  { word: 'assess', part_of_speech: 'verb', level: 'B2', meaning_vi: 'đánh giá', definition_en: 'to evaluate or estimate the nature, ability, or quality of', example_en: 'Assess student understanding with an exit ticket.', example_vi: 'Đánh giá mức độ hiểu bài của học sinh bằng phiếu exit ticket.', collocation: 'assess understanding', topic: 'assessment' },
  { word: 'scaffold', part_of_speech: 'verb', level: 'B2', meaning_vi: 'hỗ trợ theo từng bước', definition_en: 'to provide temporary support for a difficult task', example_en: 'Scaffold the explanation with a cause-and-effect frame.', example_vi: 'Hãy hỗ trợ phần giải thích bằng khung nguyên nhân–kết quả.', collocation: 'scaffold learning', topic: 'CLIL' },
  { word: 'differentiate', part_of_speech: 'verb', level: 'C1', meaning_vi: 'phân hóa', definition_en: 'to adapt instruction to meet varied learner needs', example_en: 'Differentiate tasks by readiness and interest.', example_vi: 'Phân hóa nhiệm vụ theo mức độ sẵn sàng và sở thích.', collocation: 'differentiate instruction', topic: 'methodology' },
  { word: 'rubric', part_of_speech: 'noun', level: 'B2', meaning_vi: 'tiêu chí đánh giá', definition_en: 'a set of criteria used for assessing performance', example_en: 'Use a simple rubric for peer assessment.', example_vi: 'Dùng rubric đơn giản cho đánh giá đồng đẳng.', collocation: 'design a rubric', topic: 'assessment' },
  { word: 'collocation', part_of_speech: 'noun', level: 'C1', meaning_vi: 'cụm từ kết hợp', definition_en: 'a pair or group of words commonly used together', example_en: 'Teach collocations rather than isolated words.', example_vi: 'Dạy các cụm từ kết hợp thay vì từ đơn lẻ.', collocation: 'common collocations', topic: 'vocabulary' },
  { word: 'curriculum', part_of_speech: 'noun', level: 'B2', meaning_vi: 'chương trình giảng dạy', definition_en: 'the subjects and materials used in a course of study', example_en: 'Align your lesson with the curriculum standards.', example_vi: 'Điều chỉnh bài học theo chuẩn chương trình.', collocation: 'curriculum design', topic: 'methodology' },
  { word: 'metacognition', part_of_speech: 'noun', level: 'C1', meaning_vi: 'siêu nhận thức', definition_en: 'awareness of one\'s own learning processes', example_en: 'Prompt metacognition with a self-check question.', example_vi: 'Khơi gợi siêu nhận thức bằng câu hỏi tự kiểm tra.', collocation: 'develop metacognition', topic: 'learning_science' },
  { word: 'engagement', part_of_speech: 'noun', level: 'B2', meaning_vi: 'sự tham gia tích cực', definition_en: 'the level of student participation and interest', example_en: 'Increase engagement with think-pair-share.', example_vi: 'Tăng sự tham gia với kỹ thuật think-pair-share.', collocation: 'student engagement', topic: 'methodology' },
  { word: 'formative', part_of_speech: 'adjective', level: 'B2', meaning_vi: 'định hình (đánh giá quá trình)', definition_en: 'ongoing assessment used to improve learning', example_en: 'Use formative checks throughout the lesson.', example_vi: 'Sử dụng kiểm tra định hình xuyên suốt bài học.', collocation: 'formative assessment', topic: 'assessment' },
  { word: 'scaffolding', part_of_speech: 'noun', level: 'C1', meaning_vi: 'sự hỗ trợ từng bước', definition_en: 'instructional support gradually removed as learners gain independence', example_en: 'Scaffolding helps learners access challenging content.', example_vi: 'Scaffolding giúp học sinh tiếp cận nội dung khó.', collocation: 'provide scaffolding', topic: 'CLIL' },
  { word: 'syllabus', part_of_speech: 'noun', level: 'B2', meaning_vi: 'đề cương môn học', definition_en: 'an outline of topics and objectives for a course', example_en: 'The syllabus includes weekly topics and assessments.', example_vi: 'Đề cương bao gồm chủ đề hàng tuần và bài đánh giá.', collocation: 'course syllabus', topic: 'methodology' },
  { word: 'fluency', part_of_speech: 'noun', level: 'B2', meaning_vi: 'sự trôi chảy', definition_en: 'the ability to speak or write smoothly and easily', example_en: 'Focus on fluency during pair discussions.', example_vi: 'Tập trung vào sự trôi chảy trong thảo luận cặp.', collocation: 'develop fluency', topic: 'classroom_english' },
  { word: 'peer', part_of_speech: 'noun', level: 'B1', meaning_vi: 'bạn cùng trang lứa', definition_en: 'a person of the same age or ability level', example_en: 'Students give peer feedback after presentations.', example_vi: 'Học sinh đưa ra phản hồi đồng đẳng sau bài thuyết trình.', collocation: 'peer assessment', topic: 'assessment' },
  { word: 'retrieval', part_of_speech: 'noun', level: 'C1', meaning_vi: 'sự truy hồi', definition_en: 'the act of recalling information from memory', example_en: 'Start each lesson with a retrieval activity.', example_vi: 'Bắt đầu mỗi bài học bằng hoạt động truy hồi.', collocation: 'retrieval practice', topic: 'learning_science' },
  { word: 'summative', part_of_speech: 'adjective', level: 'B2', meaning_vi: 'tổng kết', definition_en: 'assessment that measures learning at the end of a unit', example_en: 'The final test is summative.', example_vi: 'Bài kiểm tra cuối kỳ là đánh giá tổng kết.', collocation: 'summative assessment', topic: 'assessment' },
  { word: 'intervention', part_of_speech: 'noun', level: 'C1', meaning_vi: 'can thiệp', definition_en: 'a strategy to help struggling learners', example_en: 'Provide timely intervention for students below level.', example_vi: 'Can thiệp kịp thời cho học sinh dưới chuẩn.', collocation: 'early intervention', topic: 'methodology' },
  { word: 'reflection', part_of_speech: 'noun', level: 'B2', meaning_vi: 'sự suy ngẫm', definition_en: 'serious thought about one\'s own learning or teaching', example_en: 'End with a one-minute reflection.', example_vi: 'Kết thúc bằng một phút suy ngẫm.', collocation: 'self-reflection', topic: 'methodology' },
  { word: 'cognitive', part_of_speech: 'adjective', level: 'C1', meaning_vi: 'thuộc về nhận thức', definition_en: 'related to mental processes of understanding', example_en: 'Reduce cognitive load with clear visuals.', example_vi: 'Giảm tải nhận thức bằng hình ảnh trực quan.', collocation: 'cognitive load', topic: 'learning_science' },
  { word: 'differentiation', part_of_speech: 'noun', level: 'C1', meaning_vi: 'sự phân hóa', definition_en: 'adapting instruction to meet individual needs', example_en: 'Differentiation includes content, process, and product.', example_vi: 'Phân hóa bao gồm nội dung, quy trình và sản phẩm.', collocation: 'classroom differentiation', topic: 'methodology' },
  { word: 'implication', part_of_speech: 'noun', level: 'C1', meaning_vi: 'hệ quả, ý nghĩa', definition_en: 'a possible consequence or effect', example_en: 'Discuss the implications of the research.', example_vi: 'Thảo luận về ý nghĩa của nghiên cứu.', collocation: 'practical implications', topic: 'methodology' },
];

const vocabColumns = ['word', 'part_of_speech', 'level', 'meaning_vi', 'definition_en', 'example_en', 'example_vi', 'collocation', 'topic', 'is_published'];
fs.writeFileSync(path.join(CSV_DIR, 'vocabulary_entries.csv'), toCsv(vocabData, vocabColumns));
console.log('✓ vocabulary_entries.csv  —', vocabData.length, 'rows');

// --- 2. CLASSROOM PHRASE CATEGORIES ---
const catData = [
  { id: detUuid('cat-settling'), slug: 'settling', name_vi: 'Ổn định lớp', sort_order: 1, icon: 'users' },
  { id: detUuid('cat-warm-up'), slug: 'warm-up', name_vi: 'Khởi động', sort_order: 2, icon: 'activity' },
  { id: detUuid('cat-instruction'), slug: 'instruction', name_vi: 'Hướng dẫn bài tập', sort_order: 3, icon: 'book-open' },
  { id: detUuid('cat-grouping'), slug: 'grouping', name_vi: 'Chia nhóm', sort_order: 4, icon: 'grid' },
  { id: detUuid('cat-checking'), slug: 'checking', name_vi: 'Kiểm tra hiểu bài', sort_order: 5, icon: 'help-circle' },
  { id: detUuid('cat-feedback'), slug: 'feedback', name_vi: 'Phản hồi và ghi nhận', sort_order: 6, icon: 'message-square' },
  { id: detUuid('cat-transition'), slug: 'transition', name_vi: 'Chuyển tiếp và kết thúc', sort_order: 7, icon: 'arrow-right' },
];
const catColumns = ['id', 'slug', 'name_vi', 'sort_order', 'icon'];
fs.writeFileSync(path.join(CSV_DIR, 'classroom_phrase_categories.csv'), toCsv(catData, catColumns));
console.log('✓ classroom_phrase_categories.csv  —', catData.length, 'rows');

// --- 3. CLASSROOM PHRASES ---
const CAT_MAP = Object.fromEntries(catData.map(c => [c.slug, c.id]));

let sortAcc = {};
const phraseDataRaw = [
  { phrase_en: 'Good morning, everyone. Please take your seats.', phrase_vi: 'Chào buổi sáng cả lớp. Mời các em ngồi xuống.', purpose: 'Ổn định', category_slug: 'settling', level: 'A2' },
  { phrase_en: 'Let us settle down and get ready to learn.', phrase_vi: 'Chúng ta hãy ổn định để sẵn sàng học tập.', purpose: 'Ổn định', category_slug: 'settling', level: 'A2' },
  { phrase_en: 'When I raise my hand, please finish your sentence and look this way.', phrase_vi: 'Khi tôi giơ tay, các em hãy dừng lại và nhìn lên đây.', purpose: 'Thu hút sự chú ý', category_slug: 'settling', level: 'B1' },
  { phrase_en: 'I need your attention, please.', phrase_vi: 'Tôi cần các em chú ý.', purpose: 'Thu hút sự chú ý', category_slug: 'settling', level: 'A2' },
  { phrase_en: 'Can I have your attention, please?', phrase_vi: 'Các em chú ý giúp tôi.', purpose: 'Thu hút sự chú ý', category_slug: 'settling', level: 'A2' },
  { phrase_en: 'Are you ready to start the lesson?', phrase_vi: 'Các em đã sẵn sàng bắt đầu bài học chưa?', purpose: 'Bắt đầu', category_slug: 'settling', level: 'A2' },
  { phrase_en: 'Let us begin today\'s lesson.', phrase_vi: 'Chúng ta hãy bắt đầu bài học hôm nay.', purpose: 'Bắt đầu', category_slug: 'settling', level: 'A2' },
  { phrase_en: 'Please put away your phones and other distractions.', phrase_vi: 'Vui lòng cất điện thoại và các vật gây sao nhãng.', purpose: 'Kỷ luật', category_slug: 'settling', level: 'B1' },
  { phrase_en: 'Eyes on the board, please.', phrase_vi: 'Các em nhìn lên bảng.', purpose: 'Thu hút sự chú ý', category_slug: 'settling', level: 'A2' },
  { phrase_en: 'Listen carefully to the instructions.', phrase_vi: 'Lắng nghe hướng dẫn một cách cẩn thận.', purpose: 'Thu hút sự chú ý', category_slug: 'settling', level: 'A2' },
  { phrase_en: 'Let us warm up with a quick question.', phrase_vi: 'Chúng ta hãy khởi động với một câu hỏi nhanh.', purpose: 'Khởi động', category_slug: 'warm-up', level: 'A2' },
  { phrase_en: 'Think about this question for 30 seconds.', phrase_vi: 'Suy nghĩ về câu hỏi này trong 30 giây.', purpose: 'Tư duy', category_slug: 'warm-up', level: 'B1' },
  { phrase_en: 'Turn to your partner and discuss.', phrase_vi: 'Quay sang bạn bên cạnh và thảo luận.', purpose: 'Cặp đôi', category_slug: 'warm-up', level: 'A2' },
  { phrase_en: 'What do you already know about this topic?', phrase_vi: 'Các em đã biết gì về chủ đề này?', purpose: 'Kích hoạt kiến thức', category_slug: 'warm-up', level: 'B1' },
  { phrase_en: 'Share one idea with the class.', phrase_vi: 'Chia sẻ một ý tưởng với cả lớp.', purpose: 'Chia sẻ', category_slug: 'warm-up', level: 'A2' },
  { phrase_en: 'Let us brainstorm ideas together.', phrase_vi: 'Chúng ta hãy cùng nhau động não.', purpose: 'Động não', category_slug: 'warm-up', level: 'B1' },
  { phrase_en: 'Here is a picture. What do you see?', phrase_vi: 'Đây là một bức tranh. Các em thấy gì?', purpose: 'Quan sát', category_slug: 'warm-up', level: 'A2' },
  { phrase_en: 'Watch this short video clip.', phrase_vi: 'Các em hãy xem đoạn video ngắn này.', purpose: 'Xem video', category_slug: 'warm-up', level: 'A2' },
  { phrase_en: 'What questions do you have after watching?', phrase_vi: 'Các em có câu hỏi gì sau khi xem?', purpose: 'Phản hồi', category_slug: 'warm-up', level: 'B1' },
  { phrase_en: 'Open your book to page 25.', phrase_vi: 'Mở sách trang 25.', purpose: 'Hướng dẫn', category_slug: 'instruction', level: 'A2' },
  { phrase_en: 'Read the passage silently.', phrase_vi: 'Đọc thầm đoạn văn.', purpose: 'Đọc hiểu', category_slug: 'instruction', level: 'A2' },
  { phrase_en: 'Follow along as I read aloud.', phrase_vi: 'Đọc theo khi tôi đọc to.', purpose: 'Đọc theo', category_slug: 'instruction', level: 'A2' },
  { phrase_en: 'Complete the worksheet on page 10.', phrase_vi: 'Hoàn thành phiếu bài tập trang 10.', purpose: 'Bài tập', category_slug: 'instruction', level: 'A2' },
  { phrase_en: 'You have 15 minutes to finish this task.', phrase_vi: 'Các em có 15 phút để hoàn thành nhiệm vụ này.', purpose: 'Quản lý thời gian', category_slug: 'instruction', level: 'B1' },
  { phrase_en: 'Work individually for the first 5 minutes.', phrase_vi: 'Làm việc cá nhân trong 5 phút đầu.', purpose: 'Làm việc cá nhân', category_slug: 'instruction', level: 'B1' },
  { phrase_en: 'Underline the key words in the text.', phrase_vi: 'Gạch chân các từ khóa trong văn bản.', purpose: 'Kỹ thuật đọc', category_slug: 'instruction', level: 'B1' },
  { phrase_en: 'Write your answers in complete sentences.', phrase_vi: 'Viết câu trả lời thành câu hoàn chỉnh.', purpose: 'Viết', category_slug: 'instruction', level: 'B1' },
  { phrase_en: 'Check your answers with a partner.', phrase_vi: 'Kiểm tra đáp án với bạn cùng bàn.', purpose: 'Kiểm tra chéo', category_slug: 'instruction', level: 'A2' },
  { phrase_en: 'Raise your hand if you need help.', phrase_vi: 'Giơ tay nếu em cần giúp đỡ.', purpose: 'Hỗ trợ', category_slug: 'instruction', level: 'A2' },
  { phrase_en: 'Form groups of four.', phrase_vi: 'Chia nhóm bốn người.', purpose: 'Chia nhóm', category_slug: 'grouping', level: 'A2' },
  { phrase_en: 'Find a partner for this activity.', phrase_vi: 'Tìm một bạn cùng cặp cho hoạt động này.', purpose: 'Bắt cặp', category_slug: 'grouping', level: 'A2' },
  { phrase_en: 'Move quietly to your group area.', phrase_vi: 'Di chuyển nhẹ nhàng đến khu vực nhóm của mình.', purpose: 'Di chuyển', category_slug: 'grouping', level: 'B1' },
  { phrase_en: 'Choose one person to be the spokesperson.', phrase_vi: 'Chọn một người làm phát ngôn viên.', purpose: 'Vai trò', category_slug: 'grouping', level: 'B1' },
  { phrase_en: 'Everyone in the group must contribute.', phrase_vi: 'Mọi thành viên trong nhóm đều phải đóng góp.', purpose: 'Hợp tác', category_slug: 'grouping', level: 'B2' },
  { phrase_en: 'Switch roles after 10 minutes.', phrase_vi: 'Đổi vai sau 10 phút.', purpose: 'Luân chuyển', category_slug: 'grouping', level: 'B1' },
  { phrase_en: 'Share your group\'s findings with the class.', phrase_vi: 'Chia sẻ kết quả của nhóm với cả lớp.', purpose: 'Trình bày', category_slug: 'grouping', level: 'B1' },
  { phrase_en: 'Listen to your classmates\' presentations.', phrase_vi: 'Lắng nghe bài trình bày của các bạn.', purpose: 'Lắng nghe', category_slug: 'grouping', level: 'A2' },
  { phrase_en: 'Give a round of applause to group 3.', phrase_vi: 'Hãy vỗ tay cho nhóm 3.', purpose: 'Khích lệ', category_slug: 'grouping', level: 'A2' },
  { phrase_en: 'Does everyone understand the task?', phrase_vi: 'Mọi người có hiểu nhiệm vụ không?', purpose: 'Kiểm tra bài tập', category_slug: 'checking', level: 'B1' },
  { phrase_en: 'Do you have any questions so far?', phrase_vi: 'Các em có câu hỏi gì không?', purpose: 'Kiểm tra hiểu bài', category_slug: 'checking', level: 'A2' },
  { phrase_en: 'Can you repeat that in your own words?', phrase_vi: 'Em có thể nhắc lại bằng từ ngữ của mình không?', purpose: 'Hiểu bài', category_slug: 'checking', level: 'B1' },
  { phrase_en: 'Show me a thumbs up if you understand.', phrase_vi: 'Giơ ngón cái nếu em hiểu bài.', purpose: 'Kiểm tra nhanh', category_slug: 'checking', level: 'A2' },
  { phrase_en: 'Give an example of what I just explained.', phrase_vi: 'Cho tôi một ví dụ về điều tôi vừa giải thích.', purpose: 'Kiểm tra hiểu bài', category_slug: 'checking', level: 'B2' },
  { phrase_en: 'What is the main idea of the text?', phrase_vi: 'Ý chính của bài đọc là gì?', purpose: 'Đọc hiểu', category_slug: 'checking', level: 'B1' },
  { phrase_en: 'Complete this sentence: "The author argues that..."', phrase_vi: 'Hoàn thành câu sau: "Tác giả lập luận rằng..."', purpose: 'Kiểm tra hiểu bài', category_slug: 'checking', level: 'B2' },
  { phrase_en: 'True or false: Water boils at 100 degrees Celsius.', phrase_vi: 'Đúng hay sai: Nước sôi ở 100 độ C.', purpose: 'Kiểm tra kiến thức', category_slug: 'checking', level: 'A2' },
  { phrase_en: 'You have 30 seconds to discuss with your partner.', phrase_vi: 'Các em có 30 giây để thảo luận với bạn cùng cặp.', purpose: 'Thảo luận', category_slug: 'checking', level: 'A2' },
  { phrase_en: 'Great job! That is an excellent answer.', phrase_vi: 'Làm tốt lắm! Đó là một câu trả lời xuất sắc.', purpose: 'Khen ngợi', category_slug: 'feedback', level: 'A2' },
  { phrase_en: 'Almost there — check your spelling.', phrase_vi: 'Gần đúng rồi — hãy kiểm tra lỗi chính tả.', purpose: 'Sửa lỗi', category_slug: 'feedback', level: 'A2' },
  { phrase_en: 'Good effort! Try adding more detail next time.', phrase_vi: 'Cố gắng tốt! Lần sau thử thêm chi tiết nhé.', purpose: 'Khích lệ', category_slug: 'feedback', level: 'B1' },
  { phrase_en: 'You are on the right track.', phrase_vi: 'Em đang đi đúng hướng.', purpose: 'Khích lệ', category_slug: 'feedback', level: 'A2' },
  { phrase_en: 'That is an interesting point of view.', phrase_vi: 'Đó là một quan điểm thú vị.', purpose: 'Ghi nhận', category_slug: 'feedback', level: 'B1' },
  { phrase_en: 'Can you explain your reasoning?', phrase_vi: 'Em có thể giải thích lý do của mình không?', purpose: 'Khuyến khích tư duy', category_slug: 'feedback', level: 'B1' },
  { phrase_en: 'I like how you used evidence from the text.', phrase_vi: 'Tôi thích cách em sử dụng bằng chứng từ văn bản.', purpose: 'Khen ngợi', category_slug: 'feedback', level: 'B1' },
  { phrase_en: 'Let us look at the first sentence together.', phrase_vi: 'Chúng ta hãy cùng xem xét câu đầu tiên.', purpose: 'Hướng dẫn sửa', category_slug: 'feedback', level: 'A2' },
  { phrase_en: 'Try using a different word here.', phrase_vi: 'Thử dùng một từ khác ở đây.', purpose: 'Gợi ý', category_slug: 'feedback', level: 'B1' },
  { phrase_en: 'Now, let us move on to the next activity.', phrase_vi: 'Bây giờ chúng ta chuyển sang hoạt động tiếp theo.', purpose: 'Chuyển tiếp', category_slug: 'transition', level: 'A2' },
  { phrase_en: 'We have 5 minutes left for this task.', phrase_vi: 'Chúng ta còn 5 phút cho nhiệm vụ này.', purpose: 'Cảnh báo thời gian', category_slug: 'transition', level: 'A2' },
  { phrase_en: 'Please wrap up your discussions.', phrase_vi: 'Vui lòng kết thúc phần thảo luận.', purpose: 'Kết thúc', category_slug: 'transition', level: 'B1' },
  { phrase_en: 'Put away your materials and prepare for the next subject.', phrase_vi: 'Cất đồ dùng và chuẩn bị cho môn học tiếp theo.', purpose: 'Chuẩn bị', category_slug: 'transition', level: 'B1' },
  { phrase_en: 'Take out your homework and pass it forward.', phrase_vi: 'Lấy bài tập về nhà và chuyển lên trên.', purpose: 'Thu bài', category_slug: 'transition', level: 'A2' },
  { phrase_en: 'Let us review what we learned today.', phrase_vi: 'Chúng ta hãy ôn lại những gì đã học hôm nay.', purpose: 'Ôn tập', category_slug: 'transition', level: 'A2' },
  { phrase_en: 'Write one thing you learned in your journal.', phrase_vi: 'Viết một điều em học được vào nhật ký.', purpose: 'Phản tư', category_slug: 'transition', level: 'B1' },
  { phrase_en: 'Thank you for your hard work today.', phrase_vi: 'Cảm ơn các em vì sự chăm chỉ hôm nay.', purpose: 'Kết thúc', category_slug: 'transition', level: 'A2' },
];
const phraseData = phraseDataRaw.map(r => {
  const slug = r.category_slug;
  if (!sortAcc[slug]) sortAcc[slug] = 0;
  sortAcc[slug]++;
  return {
    category_id: CAT_MAP[slug],
    phrase_en: r.phrase_en,
    phrase_vi: r.phrase_vi,
    purpose: r.purpose,
    level: r.level,
    sort_order: sortAcc[slug],
    is_published: true,
  };
});
const phraseColumns = ['category_id', 'phrase_en', 'phrase_vi', 'purpose', 'level', 'sort_order', 'is_published'];
fs.writeFileSync(path.join(CSV_DIR, 'classroom_phrases.csv'), toCsv(phraseData, phraseColumns));
console.log('✓ classroom_phrases.csv  —', phraseData.length, 'rows');

// --- 4. QUIZ SETS ---
const QUIZ_SET_ID = detUuid('quiz-classroom-clil-mixed');
const quizSetData = [
  {
    id: QUIZ_SET_ID,
    title: 'Classroom English & CLIL',
    slug: 'classroom-clil-mixed',
    description: 'Kiểm tra kiến thức tổng hợp về Classroom English, phương pháp CLIL, đánh giá và kỹ thuật giảng dạy.',
    passing_score: 80,
    xp_reward: 50,
    level: 'B2',
    question_count: 5,
    is_published: true,
  },
];
const quizSetColumns = ['id', 'title', 'slug', 'description', 'passing_score', 'xp_reward', 'level', 'question_count', 'is_published'];
fs.writeFileSync(path.join(CSV_DIR, 'quiz_sets.csv'), toCsv(quizSetData, quizSetColumns));
console.log('✓ quiz_sets.csv  —', quizSetData.length, 'rows');

// --- 5. QUIZ QUESTIONS ---
const questionDataRaw = [
  { sort_order: 1, prompt: 'Which of the following is the best way to give instructions for a group task?', prompt_translation: 'Cách tốt nhất để hướng dẫn bài tập nhóm là gì?', competency_code: 'CLIL.Ins', correct_answer: 'B', explanation_vi: 'Câu này nêu rõ số lượng thành viên, vai trò và sản phẩm cần tạo.' },
  { sort_order: 2, prompt: 'What is the purpose of an ICQ (Instruction Checking Question)?', prompt_translation: 'Mục đích của ICQ là gì?', competency_code: 'CE.Ins', correct_answer: 'A', explanation_vi: 'ICQ kiểm tra cách thực hiện chứ không hỏi cảm xúc hoặc câu hỏi chung chung.' },
  { sort_order: 3, prompt: 'Which feedback follows the "two-step" model?', prompt_translation: 'Phản hồi nào theo mô hình "hai bước"?', competency_code: 'Assess.Fdb', correct_answer: 'D', explanation_vi: 'Phản hồi nêu một điểm mạnh và một bước tiếp theo cụ thể.' },
  { sort_order: 4, prompt: 'What is the role of scaffolding in CLIL?', prompt_translation: 'Vai trò của scaffolding trong CLIL là gì?', competency_code: 'CLIL.Scaf', correct_answer: 'C', explanation_vi: 'Scaffolding hỗ trợ tiếp cận nhưng vẫn giữ yêu cầu tư duy và được giảm dần khi học sinh độc lập hơn.' },
  { sort_order: 5, prompt: 'Why might a student understand the content but struggle to answer in English?', prompt_translation: 'Tại sao học sinh hiểu nội dung nhưng khó trả lời bằng tiếng Anh?', competency_code: 'CLIL.Lang', correct_answer: 'C', explanation_vi: 'Học sinh có thể đang xử lý đồng thời ý tưởng và hình thức ngôn ngữ.' },
];
const questionData = questionDataRaw.map(r => ({
  id: detUuid('q-' + r.sort_order),
  quiz_set_id: QUIZ_SET_ID,
  prompt: r.prompt,
  prompt_translation: r.prompt_translation,
  correct_answer: r.correct_answer,
  explanation: '',
  explanation_vi: r.explanation_vi,
  competency_code: r.competency_code,
  level: 'B2',
  sort_order: r.sort_order,
}));
const questionColumns = ['id', 'quiz_set_id', 'prompt', 'prompt_translation', 'correct_answer', 'explanation', 'explanation_vi', 'competency_code', 'level', 'sort_order'];
fs.writeFileSync(path.join(CSV_DIR, 'quiz_questions.csv'), toCsv(questionData, questionColumns));
console.log('✓ quiz_questions.csv  —', questionData.length, 'rows');

// --- 6. QUIZ OPTIONS ---
const Q_MAP = Object.fromEntries(questionData.map(q => [q.sort_order, q.id]));

const optionsDataRaw = [
  { sq: 1, text: '"Work in groups."', correct: false },
  { sq: 1, text: '"In groups of three, discuss the causes of deforestation. You have 8 minutes. Each person shares one idea."', correct: true },
  { sq: 1, text: '"Do the group task now."', correct: false },
  { sq: 1, text: '"Get into groups and talk."', correct: false },
  { sq: 2, text: 'To check if students understand what to do, not the content.', correct: true },
  { sq: 2, text: 'To check if students are happy with the task.', correct: false },
  { sq: 2, text: 'To review vocabulary from the lesson.', correct: false },
  { sq: 2, text: 'To assess the final product.', correct: false },
  { sq: 3, text: '"Good job. Next."', correct: false },
  { sq: 3, text: '"That is wrong. Try again."', correct: false },
  { sq: 3, text: '"You need to improve your grammar."', correct: false },
  { sq: 3, text: '"I like your use of evidence. Next time, add a concluding sentence."', correct: true },
  { sq: 4, text: 'To simplify the content so it is easy.', correct: false },
  { sq: 4, text: 'To replace the teacher\'s instruction.', correct: false },
  { sq: 4, text: 'To provide structured access to challenging content while maintaining cognitive demand.', correct: true },
  { sq: 4, text: 'To translate difficult words into the L1.', correct: false },
  { sq: 5, text: 'They are not paying attention.', correct: false },
  { sq: 5, text: 'They lack basic vocabulary.', correct: false },
  { sq: 5, text: 'They are processing both content and language simultaneously, which increases cognitive load.', correct: true },
  { sq: 5, text: 'They have low motivation.', correct: false },
];
const perQCount = {};
const optionsData = optionsDataRaw.map(r => {
  perQCount[r.sq] = (perQCount[r.sq] || 0) + 1;
  return {
    question_id: Q_MAP[r.sq],
    option_text: r.text,
    is_correct: r.correct,
    feedback_correct: '',
    feedback_incorrect: '',
    sort_order: perQCount[r.sq],
  };
});
const optionColumns = ['question_id', 'option_text', 'is_correct', 'feedback_correct', 'feedback_incorrect', 'sort_order'];
fs.writeFileSync(path.join(CSV_DIR, 'quiz_options.csv'), toCsv(optionsData, optionColumns));
console.log('✓ quiz_options.csv  —', optionsData.length, 'rows');

// --- 7. TIPS ---
const tipData = [
  { title: 'Dùng ICQ sau mỗi hướng dẫn', content: 'Sau khi hướng dẫn bài tập, hãy hỏi một ICQ như "How many minutes do you have?" thay vì "Do you understand?"', category: 'Classroom English', is_published: true },
  { title: 'Think-Pair-Share để tăng tương tác', content: 'Kỹ thuật đơn giản: học sinh suy nghĩ cá nhân (30s), thảo luận cặp (1 phút), chia sẻ với lớp.', category: 'CLIL', is_published: true },
  { title: 'Phản hồi hai bước', content: 'Luôn bắt đầu bằng điểm mạnh, sau đó đưa ra một bước cải thiện cụ thể. Tránh phản hồi chung chung.', category: 'Assessment', is_published: true },
  { title: 'Exit Ticket 3-2-1', content: 'Cuối giờ, yêu cầu học sinh viết: 3 điều học được, 2 điều thấy thú vị, 1 câu hỏi còn thắc mắc.', category: 'Assessment', is_published: true },
  { title: 'Scaffolding từng bước', content: 'Cung cấp khung câu, mẫu câu, hoặc sơ đồ tư duy cho nhiệm vụ khó. Giảm dần hỗ trợ khi học sinh quen.', category: 'CLIL', is_published: true },
  { title: 'Tận dụng 5 phút đầu giờ', content: 'Dùng 5 phút đầu để retrieval practice: 2-3 câu hỏi ôn tập bài cũ giúp kích hoạt kiến thức nền.', category: 'Classroom English', is_published: true },
];
const tipColumns = ['title', 'content', 'category', 'is_published'];
fs.writeFileSync(path.join(CSV_DIR, 'tips.csv'), toCsv(tipData, tipColumns));
console.log('✓ tips.csv  —', tipData.length, 'rows');

// --- 8. QUESTS ---
const questData = [
  { id: 'daily-quiz', type: 'daily', title: 'Hoàn thành 1 bài quiz', xp: 50, desc_text: 'Làm một bài quiz bất kỳ để kiểm tra kiến thức', is_active: true },
  { id: 'daily-vimi', type: 'daily', title: 'Hỏi ViMi 1 câu hỏi', xp: 40, desc_text: 'Chat với ViMi về bất kỳ chủ đề nào bạn quan tâm', is_active: true },
  { id: 'daily-blog', type: 'daily', title: 'Đọc 1 bài viết Blog', xp: 30, desc_text: 'Đọc một bài blog trong thư viện VMG', is_active: true },
  { id: 'daily-vocab', type: 'daily', title: 'Ôn 5 từ vựng', xp: 30, desc_text: 'Ôn tập 5 từ vựng bất kỳ trong danh sách', is_active: true },
  { id: 'daily-phrases', type: 'daily', title: 'Luyện 5 câu Classroom Phrases', xp: 40, desc_text: 'Luyện nói 5 câu lệnh lớp học tiếng Anh', is_active: true },
  { id: 'daily-lesson', type: 'daily', title: 'Hoàn thành 1 bài học', xp: 60, desc_text: 'Học xong một bài trong khóa học bất kỳ', is_active: true },
  { id: 'daily-progress', type: 'daily', title: 'Xem tiến độ của bạn', xp: 20, desc_text: 'Kiểm tra tiến độ học tập trên Dashboard', is_active: true },
  { id: 'weekly-3daily', type: 'weekly', title: 'Hoàn thành 3 Daily Quest trong tuần', xp: 150, desc_text: 'Hoàn thành 3 nhiệm vụ hàng ngày trong tuần này', is_active: true },
  { id: 'weekly-quiz80', type: 'weekly', title: 'Đạt 80%+ trong 1 bài quiz', xp: 200, desc_text: 'Đạt điểm cao trong một bài quiz bất kỳ', is_active: true },
  { id: 'weekly-vocab15', type: 'weekly', title: 'Học 15 từ vựng mới', xp: 200, desc_text: 'Mở rộng vốn từ vựng của bạn với 15 từ mới', is_active: true },
  { id: 'weekly-2lessons', type: 'weekly', title: 'Hoàn thành 2 bài học', xp: 250, desc_text: 'Học xong 2 bài trong bất kỳ khóa học nào', is_active: true },
  { id: 'weekly-streak5', type: 'weekly', title: 'Duy trì streak 5 ngày', xp: 300, desc_text: 'Giữ chuỗi học tập 5 ngày liên tiếp', is_active: true },
  { id: 'weekly-vimi4', type: 'weekly', title: 'Luyện nói với ViMi 4 lần', xp: 300, desc_text: 'Thực hành nói với ViMi ở chế độ speaking 4 lần', is_active: true },
];
const questColumns = ['id', 'type', 'title', 'desc_text', 'xp', 'is_active'];
fs.writeFileSync(path.join(CSV_DIR, 'quests.csv'), toCsv(questData, questColumns));
console.log('✓ quests.csv  —', questData.length, 'rows');

// --- 9. REWARDS ---
const ICON_MAP = { vocabulary: 'book', prompts: 'file-text', lessons: 'video', webinar: 'monitor', info: 'award' };
const rewardData = [
  { name: 'Bộ từ vựng theo chủ đề', desc_text: 'File PDF tổng hợp 20+ từ vựng theo chủ đề CLIL, Assessment, Classroom English.', price: 150, icon_type: 'book', content_type: 'vocabulary', content_json: '{}', stock: null, is_active: true },
  { name: 'Bảng câu hỏi ICQ/CCQ mẫu', desc_text: '30 câu hỏi kiểm tra hiểu bài theo từng giai đoạn của tiết học.', price: 100, icon_type: 'file-text', content_type: 'prompts', content_json: '{}', stock: null, is_active: true },
  { name: 'Mẫu giáo án CLIL 4Cs', desc_text: 'Template giáo án CLIL tích hợp Content, Communication, Cognition, Culture.', price: 200, icon_type: 'file-text', content_type: 'prompts', content_json: '{}', stock: null, is_active: true },
  { name: 'Bộ thẻ từ vựng (Flashcards)', desc_text: '50 thẻ từ song ngữ dùng cho warm-up, word wall và trò chơi từ vựng.', price: 120, icon_type: 'video', content_type: 'lessons', content_json: '{}', stock: null, is_active: true },
  { name: 'Mẫu Rubric đánh giá', desc_text: '5 mẫu rubric cho thuyết trình, viết luận, dự án nhóm, phản biện và tự đánh giá.', price: 100, icon_type: 'file-text', content_type: 'prompts', content_json: '{}', stock: null, is_active: true },
  { name: 'Bộ câu hỏi warm-up theo chủ đề', desc_text: '40 câu hỏi khởi động dùng ngay cho lớp song ngữ. Theo chủ đề: Khoa học, CLIL, Kỹ năng.', price: 80, icon_type: 'file-text', content_type: 'prompts', content_json: '{}', stock: null, is_active: true },
  { name: 'Video hướng dẫn: ICQ & CCQ trong 5 phút', desc_text: 'Video ngắn hướng dẫn kỹ thuật đặt câu hỏi kiểm tra hiểu bài hiệu quả.', price: 300, icon_type: 'video', content_type: 'lessons', content_json: '{}', stock: null, is_active: true },
  { name: 'Ebook: 10 kỹ thuật Scaffolding trong CLIL', desc_text: 'Sách điện tử 45 trang kèm ví dụ thực tế, phân tích từng kỹ thuật và cách áp dụng trong lớp học.', price: 400, icon_type: 'book', content_type: 'vocabulary', content_json: '{}', stock: null, is_active: true },
  { name: 'Workshop Online: Phân hóa trong CLIL', desc_text: 'Buổi workshop 90 phút với chuyên gia. Gồm tài liệu, bài tập thực hành và chứng nhận tham dự.', price: 500, icon_type: 'monitor', content_type: 'webinar', content_json: '{}', stock: null, is_active: true },
  { name: 'Template: Kế hoạch bài dạy theo tuần', desc_text: 'Khung kế hoạch giảng dạy tuần dành cho giáo viên song ngữ. Tích hợp mục tiêu content + language.', price: 150, icon_type: 'file-text', content_type: 'prompts', content_json: '{}', stock: null, is_active: true },
  { name: 'Bộ câu hỏi phản tư cho giáo viên', desc_text: '20 câu hỏi phản tư sau giờ dạy, giúp giáo viên tự cải thiện phương pháp mỗi ngày.', price: 100, icon_type: 'file-text', content_type: 'prompts', content_json: '{}', stock: null, is_active: true },
  { name: 'Bài mẫu: CLIL Khoa học lớp 6', desc_text: 'Bài học CLIL mẫu kèm video, bài tập, rubric và giáo án chi tiết cho chủ đề Khoa học.', price: 250, icon_type: 'video', content_type: 'lessons', content_json: '{}', stock: null, is_active: true },
  { name: 'Hướng dẫn dạy từ vựng qua Collocations', desc_text: 'Bộ tài liệu gồm lý thuyết, bài tập và 10 collocations thiết yếu cho lớp học song ngữ.', price: 200, icon_type: 'video', content_type: 'lessons', content_json: '{}', stock: null, is_active: true },
  { name: 'Kỹ thuật Retrieval Practice trong 5 phút', desc_text: 'Video + handout hướng dẫn 3 kỹ thuật truy hồi dùng ngay trong lớp học song ngữ.', price: 200, icon_type: 'video', content_type: 'lessons', content_json: '{}', stock: null, is_active: true },
  { name: 'Badge kỹ năng (hiển thị trên hồ sơ)', desc_text: 'Badge hiển thị trên hồ sơ EduNext. Chọn từ danh mục: CLIL Practitioner, Classroom English Expert, Differentiated Instruction Specialist, Assessment Pro, Technology Integrator. Có thể chia sẻ lên LinkedIn.', price: 0, icon_type: 'award', content_type: 'lessons', content_json: '{}', stock: null, is_active: true },
  { name: '1 tháng truy cập VIP Kho học liệu', desc_text: 'Truy cập toàn bộ tài liệu cao cấp trong 30 ngày. Gồm: giáo án, rubric, bài tập, video hướng dẫn.', price: 600, icon_type: 'video', content_type: 'lessons', content_json: '{}', stock: null, is_active: true },
  { name: 'Đặt lịch Coaching 1:1 với Academic Expert', desc_text: '1 buổi coaching 45 phút với chuyên gia học thuật. Nhận phản hồi cá nhân hóa về phương pháp giảng dạy.', price: 1000, icon_type: 'monitor', content_type: 'webinar', content_json: '{}', stock: null, is_active: true },
  { name: 'Chứng nhận hoàn thành khóa học', desc_text: 'Chứng nhận hoàn thành mỗi khóa học, có mã xác thực. Tự động mở khóa khi hoàn thành 100% khóa học.', price: 0, icon_type: 'award', content_type: 'lessons', content_json: '{}', stock: null, is_active: true },
  { name: 'Gói Mentor 1 tháng (4 buổi)', desc_text: '4 buổi mentoring 45 phút với chuyên gia. Thiết kế lộ trình phát triển chuyên môn cá nhân, quan sát lớp và phản hồi.', price: 1500, icon_type: 'monitor', content_type: 'webinar', content_json: '{}', stock: null, is_active: true },
];
const rewardColumns = ['name', 'desc_text', 'price', 'icon_type', 'content_type', 'content_json', 'stock', 'is_active'];
fs.writeFileSync(path.join(CSV_DIR, 'rewards.csv'), toCsv(rewardData, rewardColumns));
console.log('✓ rewards.csv  —', rewardData.length, 'rows');

// --- SUMMARY ---
console.log('\n--- All CSVs generated in backend/supabase/csv/ ---');
const files = fs.readdirSync(CSV_DIR);
files.forEach(f => {
  const content = fs.readFileSync(path.join(CSV_DIR, f), 'utf-8');
  const lines = content.trim().split('\n');
  console.log(f.padEnd(40), lines.length, 'lines');
});
