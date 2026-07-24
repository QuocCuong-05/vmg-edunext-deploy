export const MOCK_USER = {
  id: 'user-001',
  email: 'teacher@vmg-edunext.com',
  full_name: 'Nguyễn Văn Mười',
  role: 'learner',
  xp: 2450,
  streak_days: 7,
  avatar_url: null,
};

export const MOCK_COURSES = [
  {
    id: 'course-1', title: 'Classroom English Mastery',
    slug: 'classroom-english-mastery',
    description: 'Làm chủ 104 câu lệnh lớp học theo 10 giai đoạn. Dành cho giáo viên muốn sử dụng tiếng Anh tự tin trong lớp học.',
    level: 'B1', category: 'classroom_english', duration_hours: 8.0,
    lesson_count: 6, instructor: 'VMG EduNext', cover: 'red',
    lessons: [
      { id: 'lesson-1-1', title: '1. Settling the Class', slug: 'settling-the-class', description: 'Bắt đầu lớp, ổn định và thu hút sự chú ý.', sort_order: 1, content_type: 'video', video_url: 'https://www.youtube.com/embed/YAsDeXcYyTg', is_free: true, duration: 480 },
      { id: 'lesson-1-2', title: '2. Warm-Up & Engagement', slug: 'warm-up', description: 'Kích hoạt kiến thức nền, động não, tạo môi trường an toàn.', sort_order: 2, content_type: 'video', video_url: null, is_free: false, duration: 540 },
      { id: 'lesson-1-3', title: '3. Assigning Tasks & Giving Instructions', slug: 'assigning-tasks', description: 'Hướng dẫn rõ ràng, ICQ, quản lý thời gian và phân hóa.', sort_order: 3, content_type: 'video', video_url: null, is_free: false, duration: 600 },
      { id: 'lesson-1-4', title: '4. Grouping & Interaction', slug: 'grouping', description: 'Chia cặp/nhóm, giao vai trò, luân chuyển và kết nối ý tưởng.', sort_order: 4, content_type: 'video', video_url: null, is_free: false, duration: 510 },
      { id: 'lesson-1-5', title: '5. Checking Understanding & Feedback', slug: 'checking-understanding', description: 'ICQ, CCQ, phản hồi hai bước và phát triển siêu nhận thức.', sort_order: 5, content_type: 'video', video_url: null, is_free: false, duration: 720 },
      { id: 'lesson-1-6', title: '6. Transitions & Closing', slug: 'transitions-closing', description: 'Quản lý chuyển tiếp, time management, exit ticket và kết thúc bài.', sort_order: 6, content_type: 'video', video_url: null, is_free: false, duration: 480 },
    ]
  },
  {
    id: 'course-2', title: 'CLIL Lesson Design',
    slug: 'clil-lesson-design',
    description: 'Thiết kế bài học CLIL với khung 4Cs: Content, Communication, Cognition, Culture. Kèm mục tiêu kép content + language.',
    level: 'B2', category: 'clil_stem', duration_hours: 10.0,
    lesson_count: 8, instructor: 'Dr. Sarah Nguyen', cover: 'blue',
    lessons: [
      { id: 'lesson-2-1', title: 'What is CLIL?', slug: 'what-is-clil', description: 'Giới thiệu phương pháp CLIL và lợi ích cho lớp học song ngữ.', sort_order: 1, content_type: 'video', video_url: 'https://www.youtube.com/embed/n0rrgJ4MGdY', is_free: true, duration: 360 },
      { id: 'lesson-2-2', title: 'The 4Cs Framework', slug: 'the-4cs-framework', description: 'Content, Communication, Cognition, Culture — khung thiết kế bài CLIL.', sort_order: 2, content_type: 'video', video_url: null, is_free: false, duration: 600 },
      { id: 'lesson-2-3', title: 'Writing Dual Objectives', slug: 'writing-dual-objectives', description: 'Cách viết mục tiêu nội dung và mục tiêu ngôn ngữ đi kèm.', sort_order: 3, content_type: 'video', video_url: null, is_free: false, duration: 540 },
      { id: 'lesson-2-4', title: 'Scaffolding in CLIL', slug: 'scaffolding-in-clil', description: 'Chiến lược scaffolding: mẫu câu, sơ đồ, phân nhỏ nhiệm vụ.', sort_order: 4, content_type: 'video', video_url: null, is_free: false, duration: 720 },
      { id: 'lesson-2-5', title: 'Assessment in CLIL', slug: 'assessment-in-clil', description: 'Đánh giá nội dung và ngôn ngữ đồng thời.', sort_order: 5, content_type: 'article', video_url: null, is_free: false, duration: 0 },
      { id: 'lesson-2-6', title: 'Sample CLIL Lesson', slug: 'sample-clil-lesson', description: 'Phân tích một bài học CLIL mẫu từ Khoa học lớp 6.', sort_order: 6, content_type: 'video', video_url: null, is_free: false, duration: 900 },
      { id: 'lesson-2-7', title: 'CLIL across Subjects', slug: 'clil-across-subjects', description: 'Áp dụng CLIL cho Toán, Khoa học, Lịch sử và Địa lý.', sort_order: 7, content_type: 'article', video_url: null, is_free: false, duration: 0 },
      { id: 'lesson-2-8', title: 'CLIL Lesson Planning Workshop', slug: 'clil-planning-workshop', description: 'Thực hành thiết kế một bài CLIL hoàn chỉnh.', sort_order: 8, content_type: 'assignment', video_url: null, is_free: false, duration: 0 },
    ]
  },
  {
    id: 'course-3', title: 'Assessment & Feedback',
    slug: 'assessment-feedback',
    description: 'Đánh giá định hình, phản hồi hiệu quả, rubric và exit ticket. Cải thiện chất lượng đánh giá trong lớp học song ngữ.',
    level: 'B2', category: 'assessment', duration_hours: 6.0,
    lesson_count: 5, instructor: 'VMG EduNext', cover: 'gold',
    lessons: [
      { id: 'lesson-3-1', title: 'Formative vs Summative', slug: 'formative-vs-summative', description: 'Phân biệt đánh giá định hình và tổng kết.', sort_order: 1, content_type: 'video', video_url: 'https://www.youtube.com/embed/PC1UA04O-TQ', is_free: true, duration: 420 },
      { id: 'lesson-3-2', title: 'Exit Tickets & Quick Checks', slug: 'exit-tickets', description: 'Cách dùng exit ticket và các kiểm tra nhanh trong lớp.', sort_order: 2, content_type: 'video', video_url: null, is_free: false, duration: 480 },
      { id: 'lesson-3-3', title: 'Giving Actionable Feedback', slug: 'actionable-feedback', description: 'Phản hồi hai bước: ghi nhận + bước tiếp theo cụ thể.', sort_order: 3, content_type: 'video', video_url: null, is_free: false, duration: 600 },
      { id: 'lesson-3-4', title: 'Rubric Design', slug: 'rubric-design', description: 'Thiết kế rubric đơn giản với tiêu chí rõ ràng.', sort_order: 4, content_type: 'article', video_url: null, is_free: false, duration: 0 },
      { id: 'lesson-3-5', title: 'Peer Assessment', slug: 'peer-assessment', description: 'Hướng dẫn học sinh đánh giá đồng đẳng hiệu quả.', sort_order: 5, content_type: 'video', video_url: null, is_free: false, duration: 540 },
    ]
  },
  {
    id: 'course-4', title: 'Vocabulary Teaching Toolkit',
    slug: 'vocabulary-teaching-toolkit',
    description: '82 từ vựng giáo dục thiết yếu kèm collocations, ngữ cảnh và chiến lược dạy từ vựng hiệu quả.',
    level: 'B1', category: 'vocabulary', duration_hours: 5.0,
    lesson_count: 4, instructor: 'VMG EduNext', cover: 'green',
    lessons: [
      { id: 'lesson-4-1', title: 'Teaching Collocations', slug: 'teaching-collocations', description: 'Dạy từ vựng theo cụm thay vì từ đơn lẻ.', sort_order: 1, content_type: 'video', video_url: null, is_free: true, duration: 480 },
      { id: 'lesson-4-2', title: 'Contextualizing Vocabulary', slug: 'contextualizing-vocabulary', description: 'Đặt từ vựng vào ngữ cảnh lớp học và môn học.', sort_order: 2, content_type: 'video', video_url: null, is_free: false, duration: 540 },
      { id: 'lesson-4-3', title: 'Word Walls & Visuals', slug: 'word-walls-visuals', description: 'Sử dụng word wall và hình ảnh trực quan.', sort_order: 3, content_type: 'video', video_url: null, is_free: false, duration: 360 },
      { id: 'lesson-4-4', title: 'Vocabulary Games', slug: 'vocabulary-games', description: 'Trò chơi từ vựng tăng tương tác và ghi nhớ.', sort_order: 4, content_type: 'video', video_url: null, is_free: false, duration: 420 },
    ]
  },
  {
    id: 'course-5', title: 'Learning Science for Teachers',
    slug: 'learning-science-for-teachers',
    description: 'Khoa học học tập: cognitive load, retrieval practice, metacognition. Ứng dụng vào thiết kế bài giảng.',
    level: 'C1', category: 'learning_science', duration_hours: 7.0,
    lesson_count: 6, instructor: 'Prof. Michael Torres', cover: 'purple',
    lessons: [
      { id: 'lesson-5-1', title: 'Cognitive Load Theory', slug: 'cognitive-load-theory', description: 'Hiểu và quản lý tải nhận thức trong lớp học.', sort_order: 1, content_type: 'video', video_url: null, is_free: true, duration: 660 },
      { id: 'lesson-5-2', title: 'Retrieval Practice', slug: 'retrieval-practice', description: 'Kỹ thuật truy hồi giúp ghi nhớ dài hạn.', sort_order: 2, content_type: 'video', video_url: null, is_free: false, duration: 540 },
      { id: 'lesson-5-3', title: 'Spacing & Interleaving', slug: 'spacing-interleaving', description: 'Phân bổ và xen kẽ nội dung học tập.', sort_order: 3, content_type: 'video', video_url: null, is_free: false, duration: 480 },
      { id: 'lesson-5-4', title: 'Metacognition in the Classroom', slug: 'metacognition-classroom', description: 'Phát triển siêu nhận thức cho học sinh.', sort_order: 4, content_type: 'video', video_url: null, is_free: false, duration: 600 },
      { id: 'lesson-5-5', title: 'Motivation & Engagement', slug: 'motivation-engagement', description: 'Động lực bền vững và mức độ tham gia có mục đích.', sort_order: 5, content_type: 'video', video_url: null, is_free: false, duration: 540 },
      { id: 'lesson-5-6', title: 'Applying Science to Lesson Design', slug: 'applying-science-to-lessons', description: 'Tích hợp 5 nguyên lý vào thiết kế bài học.', sort_order: 6, content_type: 'article', video_url: null, is_free: false, duration: 0 },
    ]
  },
  {
    id: 'course-6', title: 'STEM & Academic Language',
    slug: 'stem-academic-language',
    description: 'Ngôn ngữ học thuật cho STEM: mô tả dữ liệu, giải thích nguyên nhân-kết quả, lập luận bằng chứng.',
    level: 'B2', category: 'clil_stem', duration_hours: 6.0,
    lesson_count: 5, instructor: 'VMG EduNext', cover: 'blue',
    lessons: [
      { id: 'lesson-6-1', title: 'Describing Data & Patterns', slug: 'describing-data-patterns', description: 'Ngôn ngữ mô tả dữ liệu và quy luật.', sort_order: 1, content_type: 'video', video_url: null, is_free: true, duration: 480 },
      { id: 'lesson-6-2', title: 'Cause & Effect Language', slug: 'cause-effect-language', description: 'Ngôn ngữ nguyên nhân-kết quả cho Khoa học.', sort_order: 2, content_type: 'video', video_url: null, is_free: false, duration: 540 },
      { id: 'lesson-6-3', title: 'Comparing & Classifying', slug: 'comparing-classifying', description: 'So sánh và phân loại trong Toán và Khoa học.', sort_order: 3, content_type: 'video', video_url: null, is_free: false, duration: 420 },
      { id: 'lesson-6-4', title: 'Arguing with Evidence', slug: 'arguing-with-evidence', description: 'Lập luận bằng bằng chứng — ngôn ngữ học thuật.', sort_order: 4, content_type: 'video', video_url: null, is_free: false, duration: 600 },
      { id: 'lesson-6-5', title: 'STEM Project Presentations', slug: 'stem-project-presentations', description: 'Hướng dẫn học sinh trình bày dự án STEM.', sort_order: 5, content_type: 'video', video_url: null, is_free: false, duration: 720 },
    ]
  },
];

export const MOCK_ENROLLMENTS = {
  'course-1': { enrolled: true, progress_pct: 45, status: 'active', completed_lessons: ['lesson-1-1', 'lesson-1-2'] },
  'course-2': { enrolled: true, progress_pct: 20, status: 'active', completed_lessons: ['lesson-2-1'] },
  'course-3': { enrolled: false, progress_pct: 0, status: null, completed_lessons: [] },
  'course-4': { enrolled: false, progress_pct: 0, status: null, completed_lessons: [] },
  'course-5': { enrolled: false, progress_pct: 0, status: null, completed_lessons: [] },
  'course-6': { enrolled: false, progress_pct: 0, status: null, completed_lessons: [] },
};

export const MOCK_VOCABULARY = [
  { id: 'v1', word: 'accessible', part_of_speech: 'adjective', level: 'B2', meaning_vi: 'dễ tiếp cận', definition_en: 'easy for learners to understand or use', example_en: 'Make the instructions accessible by using a visual example.', example_vi: 'Hãy làm hướng dẫn dễ tiếp cận bằng một ví dụ trực quan.', collocation: 'inclusive design', topic: 'Accessibility' },
  { id: 'v2', word: 'accuracy', part_of_speech: 'noun', level: 'B1', meaning_vi: 'độ chính xác', definition_en: 'the quality of being correct', example_en: 'Accuracy matters, but fluency also needs regular practice.', example_vi: 'Độ chính xác quan trọng, nhưng sự trôi chảy cũng cần được luyện tập thường xuyên.', collocation: 'language accuracy', topic: 'Language Learning' },
  { id: 'v3', word: 'activate', part_of_speech: 'verb', level: 'B2', meaning_vi: 'kích hoạt', definition_en: 'to bring prior knowledge or skills into use', example_en: 'Use a quick image prompt to activate prior knowledge.', example_vi: 'Hãy dùng một hình ảnh gợi ý để kích hoạt kiến thức nền.', collocation: 'activate prior knowledge', topic: 'Learning Science' },
  { id: 'v4', word: 'scaffold', part_of_speech: 'verb', level: 'B2', meaning_vi: 'hỗ trợ theo từng bước', definition_en: 'to provide temporary support for a difficult task', example_en: 'Scaffold the explanation with a cause-and-effect frame.', example_vi: 'Hãy hỗ trợ phần giải thích bằng khung nguyên nhân–kết quả.', collocation: 'scaffold learning', topic: 'CLIL' },
  { id: 'v5', word: 'metacognition', part_of_speech: 'noun', level: 'C1', meaning_vi: 'siêu nhận thức', definition_en: "awareness and control of one's own thinking and learning", example_en: 'Use a reflection prompt to develop metacognition.', example_vi: 'Hãy dùng câu hỏi phản tư để phát triển siêu nhận thức.', collocation: 'metacognitive strategy', topic: 'Learning Science' },
  { id: 'v6', word: 'formative', part_of_speech: 'adjective', level: 'B2', meaning_vi: 'mang tính định hình', definition_en: 'used during learning to guide improvement', example_en: 'Use a quick poll as a formative check.', example_vi: 'Hãy dùng khảo sát nhanh như một bước kiểm tra định hình.', collocation: 'formative assessment', topic: 'Assessment' },
  { id: 'v7', word: 'elicit', part_of_speech: 'verb', level: 'C1', meaning_vi: 'gợi để học sinh tự đưa ra', definition_en: 'to draw out a response or idea', example_en: 'Elicit the key term from the diagram.', example_vi: 'Hãy gợi để học sinh tự đưa ra thuật ngữ chính từ sơ đồ.', collocation: 'elicit ideas', topic: 'Teacher Talk' },
  { id: 'v8', word: 'differentiate', part_of_speech: 'verb', level: 'B2', meaning_vi: 'phân hóa', definition_en: 'to adapt teaching for different learner needs', example_en: 'Differentiate the task with sentence starters and extension questions.', example_vi: 'Hãy phân hóa nhiệm vụ bằng mẫu mở đầu câu và câu hỏi mở rộng.', collocation: 'differentiate instruction', topic: 'Differentiation' },
  { id: 'v9', word: 'engagement', part_of_speech: 'noun', level: 'B2', meaning_vi: 'mức độ tham gia', definition_en: 'active attention and involvement', example_en: 'Track engagement by observing who speaks and who produces evidence.', example_vi: 'Hãy theo dõi mức độ tham gia qua việc ai nói và ai tạo ra bằng chứng.', collocation: 'student engagement', topic: 'Motivation' },
  { id: 'v10', word: 'translanguaging', part_of_speech: 'noun', level: 'C1', meaning_vi: 'vận dụng linh hoạt nhiều ngôn ngữ', definition_en: "the strategic use of a learner's full linguistic repertoire", example_en: 'Allow brief Vietnamese planning before the English presentation.', example_vi: 'Hãy cho phép chuẩn bị ngắn bằng tiếng Việt trước phần trình bày tiếng Anh.', collocation: 'strategic translanguaging', topic: 'Bilingual Education' },
  { id: 'v11', word: 'rubric', part_of_speech: 'noun', level: 'B2', meaning_vi: 'bảng tiêu chí', definition_en: 'a scoring guide with criteria and performance levels', example_en: 'Use the rubric before, during and after the task.', example_vi: 'Hãy dùng rubric trước, trong và sau nhiệm vụ.', collocation: 'analytic rubric', topic: 'Assessment' },
  { id: 'v12', word: 'cognitive', part_of_speech: 'adjective', level: 'C1', meaning_vi: 'thuộc nhận thức', definition_en: 'related to thinking and mental processing', example_en: 'Reduce unnecessary cognitive load with a simple diagram.', example_vi: 'Hãy giảm tải nhận thức không cần thiết bằng một sơ đồ đơn giản.', collocation: 'cognitive load', topic: 'Learning Science' },
  { id: 'v13', word: 'feedback', part_of_speech: 'noun', level: 'B1', meaning_vi: 'phản hồi', definition_en: 'information that helps improve future performance', example_en: 'Give feedback that identifies one strength and one next step.', example_vi: 'Hãy phản hồi bằng một điểm mạnh và một bước tiếp theo.', collocation: 'actionable feedback', topic: 'Assessment' },
  { id: 'v14', word: 'scaffolding', part_of_speech: 'noun', level: 'B2', meaning_vi: 'hỗ trợ tạm thời', definition_en: 'temporary support that is gradually removed', example_en: 'Scaffolding can include sentence frames, diagrams and task breakdown.', example_vi: 'Scaffolding có thể gồm mẫu câu, sơ đồ và phân nhỏ nhiệm vụ.', collocation: 'provide scaffolding', topic: 'CLIL' },
  { id: 'v15', word: 'wait time', part_of_speech: 'noun phrase', level: 'B2', meaning_vi: 'thời gian chờ', definition_en: 'a pause after asking a question before taking answers', example_en: 'Increase wait time to five seconds.', example_vi: 'Hãy tăng thời gian chờ lên năm giây.', collocation: 'extended wait time', topic: 'Questioning' },
];

export const MOCK_PHRASE_CATEGORIES = [
  { slug: 'settling-the-class', name_vi: 'Ổn định lớp', sort_order: 1 },
  { slug: 'warm-up', name_vi: 'Khởi động', sort_order: 2 },
  { slug: 'assigning-tasks', name_vi: 'Giao nhiệm vụ', sort_order: 3 },
  { slug: 'grouping', name_vi: 'Chia nhóm', sort_order: 4 },
  { slug: 'checking-understanding', name_vi: 'Kiểm tra hiểu bài', sort_order: 5 },
  { slug: 'monitoring', name_vi: 'Theo dõi', sort_order: 6 },
  { slug: 'feedback', name_vi: 'Phản hồi', sort_order: 7 },
  { slug: 'transitions', name_vi: 'Chuyển tiếp', sort_order: 8 },
  { slug: 'time-management', name_vi: 'Quản lý thời gian', sort_order: 9 },
  { slug: 'clil-stem-language', name_vi: 'CLIL/STEM', sort_order: 10 },
  { slug: 'closing', name_vi: 'Kết thúc', sort_order: 11 },
];

export const MOCK_PHRASES = [
  { phrase_en: 'Good morning, everyone. Please take your seats.', phrase_vi: 'Chào buổi sáng cả lớp. Các em ngồi vào chỗ nhé.', purpose: 'Bắt đầu lớp', category_slug: 'settling-the-class' },
  { phrase_en: 'Let us settle down and get ready to learn.', phrase_vi: 'Chúng ta ổn định và sẵn sàng học nhé.', purpose: 'Ổn định lớp', category_slug: 'settling-the-class' },
  { phrase_en: 'When I raise my hand, please finish your sentence and look this way.', phrase_vi: 'Khi cô/thầy giơ tay, hãy nói hết câu rồi nhìn lên đây.', purpose: 'Tín hiệu lớp', category_slug: 'settling-the-class' },
  { phrase_en: 'Think of one word connected to today\'s topic.', phrase_vi: 'Hãy nghĩ một từ liên quan đến chủ đề hôm nay.', purpose: 'Kích hoạt kiến thức', category_slug: 'warm-up' },
  { phrase_en: 'Turn to a partner and share your first idea.', phrase_vi: 'Quay sang một bạn và chia sẻ ý tưởng đầu tiên.', purpose: 'Trao đổi cặp', category_slug: 'warm-up' },
  { phrase_en: 'First, read the instructions silently.', phrase_vi: 'Đầu tiên, hãy đọc hướng dẫn trong im lặng.', purpose: 'Hướng dẫn bước 1', category_slug: 'assigning-tasks' },
  { phrase_en: 'Work with the person sitting next to you.', phrase_vi: 'Hãy làm việc với bạn ngồi bên cạnh.', purpose: 'Chia cặp', category_slug: 'grouping' },
  { phrase_en: 'What is the first thing you need to do?', phrase_vi: 'Việc đầu tiên các em cần làm là gì?', purpose: 'ICQ', category_slug: 'checking-understanding' },
  { phrase_en: 'Keep going. I am listening for your reasons.', phrase_vi: 'Tiếp tục nhé. Cô/thầy đang lắng nghe phần lý do của các em.', purpose: 'Theo dõi', category_slug: 'monitoring' },
  { phrase_en: 'That is a clear explanation.', phrase_vi: 'Đó là một phần giải thích rõ ràng.', purpose: 'Ghi nhận', category_slug: 'feedback' },
  { phrase_en: 'You have five minutes remaining.', phrase_vi: 'Các em còn năm phút.', purpose: 'Nhắc thời gian', category_slug: 'time-management' },
  { phrase_en: 'What is one thing you understand better now?', phrase_vi: 'Một điều em hiểu rõ hơn bây giờ là gì?', purpose: 'Phản tư', category_slug: 'closing' },
  { phrase_en: 'Describe the pattern in the data.', phrase_vi: 'Hãy mô tả quy luật trong dữ liệu.', purpose: 'Mô tả dữ liệu', category_slug: 'clil-stem-language' },
  { phrase_en: 'Predict what will happen if we change this variable.', phrase_vi: 'Hãy dự đoán điều gì xảy ra nếu chúng ta thay đổi biến này.', purpose: 'Dự đoán', category_slug: 'clil-stem-language' },
  { phrase_en: 'I will wait until everyone is ready.', phrase_vi: 'Cô/thầy sẽ chờ đến khi tất cả sẵn sàng.', purpose: 'Thiết lập kỳ vọng', category_slug: 'settling-the-class' },
];

export const MOCK_QUIZZES = [
  {
    id: 'quiz-1',
    title: 'Ngân hàng luyện tập toàn diện VMG EduNext',
    slug: 'vmg-edunext-master-practice',
    description: 'Ngân hàng câu hỏi về Classroom English, CLIL, đánh giá, khoa học học tập và từ vựng giáo dục.',
    question_count: 20,
    passing_score: 70,
    xp_reward: 50,
    level: 'B1',
  },
];

export const MOCK_QUIZ_QUESTIONS = [
  {
    id: 'qq-1', prompt: 'Which instruction is clearest for a group task?',
    prompt_translation: 'Hướng dẫn nào rõ nhất cho nhiệm vụ nhóm?',
    correct_answer: 'Work in groups of four. Choose a reporter and write one shared answer.',
    explanation: 'It specifies group size, roles and the expected product.',
    explanation_vi: 'Câu này nêu rõ số lượng thành viên, vai trò và sản phẩm cần tạo.',
    competency_code: 'classroom_english', level: 'B1',
    options: [
      { option_text: 'Work in groups of four. Choose a reporter and write one shared answer.', is_correct: true, feedback_correct: 'ViMi likes it!', feedback_incorrect: null },
      { option_text: 'Do the activity together.', is_correct: false, feedback_correct: null, feedback_incorrect: 'Chưa phù hợp với mục tiêu câu hỏi.' },
      { option_text: 'Make groups and discuss.', is_correct: false, feedback_correct: null, feedback_incorrect: 'Chưa tạo đủ bằng chứng học tập.' },
      { option_text: 'Work quickly with your friends.', is_correct: false, feedback_correct: null, feedback_incorrect: 'Chưa rõ hoặc chưa phù hợp ngữ cảnh.' },
    ]
  },
  {
    id: 'qq-2', prompt: 'What is the best ICQ after giving a three-step task?',
    prompt_translation: 'ICQ nào phù hợp nhất sau khi giao nhiệm vụ ba bước?',
    correct_answer: 'What do you need to do first?',
    explanation: 'An ICQ checks the procedure, not feelings or general understanding.',
    explanation_vi: 'ICQ kiểm tra cách thực hiện chứ không hỏi cảm xúc hoặc câu hỏi chung chung.',
    competency_code: 'classroom_english', level: 'B1',
    options: [
      { option_text: 'What do you need to do first?', is_correct: true, feedback_correct: 'ViMi likes it!', feedback_incorrect: null },
      { option_text: 'Do you understand?', is_correct: false, feedback_correct: null, feedback_incorrect: 'Chưa phù hợp với mục tiêu câu hỏi.' },
      { option_text: 'Is the task easy?', is_correct: false, feedback_correct: null, feedback_incorrect: 'Chưa tạo đủ bằng chứng học tập.' },
      { option_text: 'Do you like this activity?', is_correct: false, feedback_correct: null, feedback_incorrect: 'Chưa rõ hoặc chưa phù hợp ngữ cảnh.' },
    ]
  },
  {
    id: 'qq-3', prompt: 'Which feedback is most actionable?',
    prompt_translation: 'Phản hồi nào có tính hành động rõ nhất?',
    correct_answer: 'Your main idea is clear. Add one example from the text.',
    explanation: 'It identifies a strength and gives a concrete next step.',
    explanation_vi: 'Phản hồi nêu một điểm mạnh và một bước tiếp theo cụ thể.',
    competency_code: 'feedback', level: 'B1+',
    options: [
      { option_text: 'Your main idea is clear. Add one example from the text.', is_correct: true, feedback_correct: 'ViMi likes it!', feedback_incorrect: null },
      { option_text: 'Good job.', is_correct: false, feedback_correct: null, feedback_incorrect: 'Chưa phù hợp với mục tiêu câu hỏi.' },
      { option_text: 'Wrong answer.', is_correct: false, feedback_correct: null, feedback_incorrect: 'Chưa tạo đủ bằng chứng học tập.' },
      { option_text: 'Try harder next time.', is_correct: false, feedback_correct: null, feedback_incorrect: 'Chưa rõ hoặc chưa phù hợp ngữ cảnh.' },
    ]
  },
  {
    id: 'qq-4', prompt: 'What does "scaffolding" mean in teaching?',
    prompt_translation: 'Scaffolding trong dạy học nghĩa là gì?',
    correct_answer: 'Providing temporary support that is gradually reduced.',
    explanation: 'Scaffolding supports access while preserving thinking and is removed as independence grows.',
    explanation_vi: 'Scaffolding hỗ trợ tiếp cận nhưng vẫn giữ yêu cầu tư duy và được giảm dần khi học sinh độc lập hơn.',
    competency_code: 'pedagogy', level: 'B2',
    options: [
      { option_text: 'Providing temporary support that is gradually reduced.', is_correct: true, feedback_correct: 'ViMi likes it!', feedback_incorrect: null },
      { option_text: 'Making every task easier.', is_correct: false, feedback_correct: null, feedback_incorrect: 'Chưa phù hợp với mục tiêu câu hỏi.' },
      { option_text: 'Giving students the final answer.', is_correct: false, feedback_correct: null, feedback_incorrect: 'Chưa tạo đủ bằng chứng học tập.' },
      { option_text: 'Repeating the same explanation louder.', is_correct: false, feedback_correct: null, feedback_incorrect: 'Chưa rõ hoặc chưa phù hợp ngữ cảnh.' },
    ]
  },
  {
    id: 'qq-5', prompt: 'Why is wait time useful in a bilingual classroom?',
    prompt_translation: 'Vì sao thời gian chờ hữu ích trong lớp song ngữ?',
    correct_answer: 'Learners need time to process content and formulate language.',
    explanation: 'Learners may be processing both ideas and language forms.',
    explanation_vi: 'Học sinh có thể đang xử lý đồng thời ý tưởng và hình thức ngôn ngữ.',
    competency_code: 'questioning', level: 'B2',
    options: [
      { option_text: 'Learners need time to process content and formulate language.', is_correct: true, feedback_correct: 'ViMi likes it!', feedback_incorrect: null },
      { option_text: 'It allows the teacher to check messages.', is_correct: false, feedback_correct: null, feedback_incorrect: 'Chưa phù hợp với mục tiêu câu hỏi.' },
      { option_text: 'It makes the lesson appear longer.', is_correct: false, feedback_correct: null, feedback_incorrect: 'Chưa tạo đủ bằng chứng học tập.' },
      { option_text: 'It prevents students from asking questions.', is_correct: false, feedback_correct: null, feedback_incorrect: 'Chưa rõ hoặc chưa phù hợp ngữ cảnh.' },
    ]
  },
];

export const MOCK_TIPS = [
  { title: 'Mục tiêu kép trong CLIL', content: 'Viết một mục tiêu nội dung và một mục tiêu ngôn ngữ. Mục tiêu ngôn ngữ nên nêu chức năng như mô tả, so sánh, giải thích hoặc lập luận, kèm dạng ngôn ngữ học sinh cần dùng.', category: 'CLIL' },
  { title: 'Phản hồi hai bước', content: 'Bước 1 ghi nhận điều đã làm được. Bước 2 chỉ ra hành động tiếp theo cụ thể.', category: 'Feedback' },
  { title: 'Thời gian chờ 5 giây', content: 'Sau khi hỏi, đếm thầm đến năm. Trong lớp học bằng ngôn ngữ thứ hai, học sinh cần xử lý cả ý tưởng và cách diễn đạt.', category: 'Questioning' },
  { title: 'Truy hồi trước khi xem lại', content: 'Đầu giờ, cho học sinh viết ba điều nhớ được từ tiết trước rồi mới mở ghi chú.', category: 'Learning Science' },
  { title: 'Phân hóa bằng mức hỗ trợ', content: 'Giữ cùng mục tiêu nhưng cung cấp mẫu câu cho nhóm cần hỗ trợ và câu hỏi mở rộng cho nhóm sẵn sàng.', category: 'Differentiation' },
  { title: 'Exit ticket một câu', content: 'Yêu cầu học sinh trả lời đúng một câu gắn trực tiếp với mục tiêu.', category: 'Assessment' },
  { title: 'Dịch có chiến lược', content: 'Cho phép học sinh thảo luận ý tưởng khó bằng tiếng Việt trong thời gian ngắn, sau đó tạo sản phẩm bằng tiếng Anh.', category: 'Translanguaging' },
  { title: 'AI tạo bản nháp, giáo viên quyết định', content: 'Kiểm tra độ chính xác, mức phù hợp, khả năng thực thi và dữ liệu nhạy cảm trước khi dùng đầu ra AI.', category: 'AI in Education' },
];
