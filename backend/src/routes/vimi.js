import { Router } from 'express';

const router = Router();

const SCENARIOS = {
  greeting: [
    { keywords: ['hello', 'hi', 'chào', 'hey'], response: 'Xin chào! Tôi là ViMi, trợ lý AI của VMG EduNext. Tôi có thể giúp bạn luyện tập Classroom English, giải thích khái niệm sư phạm, hoặc gợi ý hoạt động dạy học. Bạn cần hỗ trợ gì hôm nay?' }
  ],
  classroom_phrase: [
    { keywords: ['câu lệnh', 'classroom', 'phrase', 'nói gì', 'how to say'], response: 'Bạn muốn tìm câu lệnh cho tình huống nào? VMG có 104 câu chia theo 10 giai đoạn: ổn định lớp, khởi động, giao nhiệm vụ, chia nhóm, kiểm tra hiểu bài, theo dõi, phản hồi, chuyển tiếp, quản lý thời gian, CLIL/STEM và kết thúc.' }
  ],
  feedback: [
    { keywords: ['feedback', 'phản hồi', 'nhận xét'], response: 'Phản hồi hiệu quả cần hai bước: (1) Ghi nhận điều đã làm tốt, (2) Chỉ ra hành động tiếp theo cụ thể. Ví dụ: "Your main idea is clear. Add one example from the text."' },
    { keywords: ['actionable', 'cụ thể'], response: 'Phản hồi có tính hành động (actionable feedback) = điểm mạnh + bước tiếp theo. Tránh nói chung chung như "Good job" hay "Try harder".' }
  ],
  clil: [
    { keywords: ['clil', 'content', 'language objective', 'mục tiêu'], response: 'Trong CLIL, mỗi bài học cần một cặp mục tiêu kép:\n• Content objective: Học sinh sẽ học kiến thức gì?\n• Language objective: Học sinh sẽ dùng ngôn ngữ như thế nào?\n\nVí dụ:\n- Content: Explain the water cycle\n- Language: Use "because" and "therefore" to show cause and effect' }
  ],
  scaffold: [
    { keywords: ['scaffold', 'hỗ trợ', 'differentiate', 'phân hóa'], response: 'Scaffolding là hỗ trợ tạm thời và giảm dần. Các dạng scaffolding:\n1. Mẫu câu (sentence starters)\n2. Sơ đồ trực quan\n3. Chia nhỏ nhiệm vụ\n4. Làm mẫu (modeling)\n5. Từ khóa và word bank\n\nBạn muốn tìm hiểu dạng nào?' }
  ],
  assessment: [
    { keywords: ['assessment', 'đánh giá', 'exit ticket', 'rubric', 'formative'], response: 'Đánh giá định hình (formative assessment) diễn ra trong quá trình học. Một số công cụ:\n• Exit ticket: 1 câu hỏi gắn với mục tiêu bài học\n• Thang ngón tay: 1-5 ngón cho mức độ tự tin\n• Mini-whiteboard: Cả lớp viết đáp án và giơ lên\n• Rubric: Tiêu chí rõ ràng trước khi làm bài\nBạn muốn tôi gợi ý công cụ nào?' }
  ],
  vocabulary: [
    { keywords: ['từ vựng', 'vocabulary', 'word', 'nghĩa'], response: 'VMG có 82 từ vựng giáo dục thiết yếu (trình độ A2-C1). Mỗi từ có: định nghĩa, nghĩa tiếng Việt, ngữ cảnh giáo dục, ví dụ song ngữ và collocations. Bạn muốn tra từ nào?' }
  ],
  activity: [
    { keywords: ['activity', 'hoạt động', 'warm-up', 'trò chơi', 'game'], response: 'Gợi ý hoạt động cho lớp học song ngữ:\n\n1. Think-Pair-Share: Cá nhân → Cặp → Chia sẻ\n2. Word Hunt: Tìm từ vựng trong đoạn văn\n3. Role Play: Đóng vai tình huống lớp học\n4. Gallery Walk: Trưng bày sản phẩm nhóm\n5. One-Minute Paper: Viết nhanh trong 1 phút\n\nBạn muốn hoạt động cho kỹ năng nào?' }
  ]
};

function findBestResponse(input) {
  const lower = input.toLowerCase();

  for (const [category, scenarios] of Object.entries(SCENARIOS)) {
    for (const scenario of scenarios) {
      const matchCount = scenario.keywords.filter(kw => lower.includes(kw)).length;
      if (matchCount > 0) return { category, response: scenario.response };
    }
  }

  return {
    category: 'fallback',
    response: 'Cảm ơn bạn! ViMi đang tiếp tục học hỏi để trả lời tốt hơn. Bạn có thể hỏi tôi về:\n\n**Classroom English** — 104 câu lệnh lớp học\n**CLIL** — Thiết kế bài học song ngữ\n**Assessment** — Đánh giá và phản hồi\n**Vocabulary** — 82 từ vựng giáo dục\n**Activities** — Gợi ý hoạt động dạy học\n\nBạn muốn khám phá chủ đề nào?'
  };
}

router.post('/chat', (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const result = findBestResponse(message);
    res.json({
      reply: result.response,
      category: result.category,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
