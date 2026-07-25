
const CATEGORIES = {
  hoc_lieu: { label: 'Học liệu dùng ngay', color: 'var(--blue)' },
  phat_trien: { label: 'Phát triển chuyên môn', color: 'var(--green)' },
  cong_nhan: { label: 'Công nhận & Cơ hội', color: 'var(--gold)' },
};

const ITEMS = [
  // ---- Học liệu dùng ngay ----
  {
    id: 'r1', category: 'hoc_lieu',
    name: 'Bộ prompt AI dành cho giáo viên',
    desc: 'Prompt hỗ trợ thiết kế bài giảng, hoạt động và phản hồi học viên',
    price: 200, iconType: 'Sparkles',
    content: { type: 'info', text: 'Bộ 25+ prompt tiếng Anh / Việt dùng với ChatGPT, Gemini, Claude. Bao gồm prompt soạn giáo án CLIL, tạo hoạt động tương tác, viết phản hồi học viên, thiết kế bài kiểm tra nhanh.' },
  },
  {
    id: 'r2', category: 'hoc_lieu',
    name: 'Bộ worksheet và trò chơi tương tác',
    desc: 'Hoạt động theo độ tuổi và trình độ',
    price: 300, iconType: 'Vocab',
    content: { type: 'info', text: '30+ worksheet và trò chơi tương tác cho lớp học song ngữ từ mầm non đến THPT. Bao gồm: Bingo, Word Search, Crossword, Matching, Gap-fill, Role-play cards. Phân loại theo độ tuổi (6-18) và trình độ (A1-B2).' },
  },
  {
    id: 'r3', category: 'hoc_lieu',
    name: 'Bộ rubric Speaking/Writing',
    desc: 'Tiêu chí đánh giá và mẫu phản hồi',
    price: 400, iconType: 'Stats',
    content: { type: 'info', text: '10 rubric đánh giá kỹ năng Speaking và Writing cho các cấp độ A1-B2. Mỗi rubric có thang điểm 4 mức (Beginning → Developing → Proficient → Advanced) kèm mô tả chi tiết và mẫu phản hồi cho học viên.' },
  },
  {
    id: 'r4', category: 'hoc_lieu',
    name: 'Bộ 10 giáo án song ngữ',
    desc: 'Giáo án có thể chỉnh sửa, phân loại theo môn và cấp độ',
    price: 500, iconType: 'BookOpen',
    content: { type: 'info', text: '10 giáo án CLIL song ngữ Anh-Việt cho các môn Khoa học, Toán, Địa lý, Sinh học. Mỗi giáo án có khung 4Cs, hoạt động chi tiết, ICQ/CCQ, phân hóa theo trình độ. Định dạng Word và Google Docs — có thể chỉnh sửa trực tiếp.' },
  },
  {
    id: 'r5', category: 'hoc_lieu',
    name: 'Bộ đề kiểm tra Cambridge',
    desc: 'Đề, đáp án và hướng dẫn chấm',
    price: 600, iconType: 'Book',
    content: { type: 'info', text: '5 bộ đề thi thử Cambridge cho Starters, Movers, Flyers, KET, PET. Mỗi bộ gồm: đề thi (Listening, Reading & Writing, Speaking), file audio, đáp án, hướng dẫn chấm chi tiết và bảng quy đổi điểm. Định dạng PDF in được ngay.' },
  },
  {
    id: 'r6', category: 'hoc_lieu',
    name: 'Teaching Toolkit theo kỹ năng',
    desc: 'Tài nguyên dạy Listening, Speaking, Reading hoặc Writing',
    price: 700, iconType: 'Flask',
    content: { type: 'info', text: 'Toolkit chuyên sâu theo từng kỹ năng: Listening (10 bài nghe + transcript + bài tập), Speaking (20 tình huống hội thoại + phrase bank), Reading (15 đoạn văn + câu hỏi đọc hiểu), Writing (10 đề + rubric + bài mẫu). Chọn một kỹ năng khi đổi.' },
  },
  {
    id: 'r7', category: 'hoc_lieu',
    name: 'Bộ slide bài giảng hoàn chỉnh',
    desc: 'Slide có thể chỉnh sửa và sử dụng trực tiếp',
    price: 800, iconType: 'Pen',
    content: { type: 'info', text: '20 bộ slide bài giảng PowerPoint / Google Slides cho các chủ đề song ngữ phổ biến. Mỗi bộ 15-25 slide gồm: warm-up, giới thiệu từ vựng, thực hành có hướng dẫn, luyện tập nhóm, củng cố. Thiết kế chuyên nghiệp, dễ chỉnh sửa.' },
  },

  // ---- Phát triển chuyên môn ----
  {
    id: 'r8', category: 'phat_trien',
    name: 'Vé tham gia workshop nội bộ',
    desc: 'Một workshop chuyên môn tự chọn',
    price: 500, iconType: 'Calendar',
    content: { type: 'info', text: 'Vé tham gia 1 workshop chuyên môn do VMG tổ chức. Chủ đề đa dạng: CLIL lesson design, Classroom management, Assessment for learning, Technology integration. Workshop 90 phút, có tương tác trực tiếp, nhận tài liệu sau workshop.' },
  },
  {
    id: 'r9', category: 'phat_trien',
    name: 'Khóa microlearning có chứng nhận',
    desc: 'Khóa học ngắn trên EduNext kèm chứng nhận hoàn thành',
    price: 800, iconType: 'Play',
    content: { type: 'info', text: 'Khóa học microlearning (2-4 giờ) trên nền tảng EduNext. Chọn từ danh mục: Classroom English, CLIL Foundations, Differentiated Instruction, Formative Assessment. Hoàn thành khóa học và bài kiểm tra để nhận chứng nhận điện tử.' },
  },
  {
    id: 'r10', category: 'phat_trien',
    name: 'Webinar độc quyền cùng chuyên gia',
    desc: 'Chuyên đề chuyên sâu và phần hỏi đáp',
    price: 1000, iconType: 'Classroom',
    content: { type: 'info', text: 'Webinar 90 phút với chuyên gia trong nước và quốc tế. Chủ đề chuyên sâu: Translanguaging in bilingual classrooms, Teaching thinking skills, Project-based learning. Bao gồm tài liệu, recording và chứng nhận tham dự.' },
  },
  {
    id: 'r11', category: 'phat_trien',
    name: 'Coaching 1:1 với Academic Expert',
    desc: 'Tư vấn chuyên môn hoặc xử lý vấn đề giảng dạy cụ thể',
    price: 1500, iconType: 'User',
    content: { type: 'info', text: '02 buổi coaching 1:1 (45 phút/buổi) với chuyên gia học thuật của VMG. Giải quyết vấn đề cụ thể: thiết kế bài học, quản lý lớp học song ngữ, chiến lược phân hóa, lộ trình phát triển chuyên môn cá nhân.' },
  },
  {
    id: 'r12', category: 'phat_trien',
    name: 'Masterclass hoặc dự giờ lớp mẫu',
    desc: 'Quan sát thực tế và nhận tài liệu tổng kết',
    price: 2000, iconType: 'BookOpen',
    content: { type: 'info', text: 'Tham gia masterclass 3 giờ hoặc dự giờ lớp mẫu song ngữ thực tế. Quan sát giáo viên giàu kinh nghiệm giảng dạy, nhận tài liệu dự giờ, phân tích bài học và đề xuất cải tiến. Phù hợp với giáo viên muốn học hỏi thực tiễn.' },
  },
  {
    id: 'r13', category: 'phat_trien',
    name: 'Khóa đào tạo chuyên sâu',
    desc: 'Tham gia chương trình đào tạo nâng cao được lựa chọn',
    price: 3000, iconType: 'Brain',
    content: { type: 'info', text: 'Khóa đào tạo chuyên sâu 2-3 ngày (12-18 giờ) do VMG tổ chức. Chứng nhận hoàn thành khóa học. Chủ đề: Chương trình song ngữ toàn diện, Lãnh đạo học thuật, Đánh giá năng lực học viên. Ưu tiên đăng ký sớm.' },
  },

  // ---- Công nhận & Cơ hội ----
  {
    id: 'r14', category: 'cong_nhan',
    name: 'Badge chuyên môn trên hồ sơ',
    desc: 'Huy hiệu năng lực hiển thị trên EduNext',
    price: 700, iconType: 'Target',
    content: { type: 'info', text: 'Badge kỹ năng hiển thị trên hồ sơ EduNext. Chọn từ danh mục: CLIL Practitioner, Classroom English Expert, Differentiated Instruction Specialist, Assessment Pro, Technology Integrator. Badge có thể chia sẻ lên LinkedIn.' },
  },
  {
    id: 'r15', category: 'cong_nhan',
    name: 'Chứng nhận EduNext Active Educator',
    desc: 'Ghi nhận mức độ tham gia và phát triển chuyên môn',
    price: 1000, iconType: 'Check',
    content: { type: 'info', text: 'Chứng nhận "EduNext Active Educator" được cấp bởi VMG EduNext. Ghi nhận sự tham gia tích cực, hoàn thành các khóa học và đóng góp cho cộng đồng. Chứng nhận điện tử có mã QR xác thực, chia sẻ được.' },
  },
  {
    id: 'r16', category: 'cong_nhan',
    name: 'Hồ sơ giáo viên nổi bật',
    desc: 'Giới thiệu giáo viên trên EduNext hoặc kênh nội bộ VMG',
    price: 1500, iconType: 'Globe',
    content: { type: 'info', text: 'Hồ sơ của bạn được giới thiệu trên trang Community của EduNext và kênh nội bộ VMG. Bao gồm: phỏng vấn ngắn, chia sẻ kinh nghiệm giảng dạy, hình ảnh lớp học. Cơ hội kết nối với giáo viên trên toàn quốc.' },
  },
  {
    id: 'r17', category: 'cong_nhan',
    name: 'Quyền ưu tiên đăng ký chương trình',
    desc: 'Ưu tiên workshop, chương trình pilot hoặc lớp chuyên đề',
    price: 2000, iconType: 'ArrowRight',
    content: { type: 'info', text: 'Quyền ưu tiên đăng ký các chương trình đặc biệt của VMG: workshop giới hạn chỗ, chương trình pilot học liệu mới, lớp chuyên đề với chuyên gia quốc tế. Nhận thông báo sớm và đăng ký trước cộng đồng 7 ngày.' },
  },
  {
    id: 'r18', category: 'cong_nhan',
    name: 'Cơ hội trở thành Content Contributor',
    desc: 'Tham gia phát triển học liệu và chia sẻ chuyên môn',
    price: 3000, iconType: 'Pen',
    content: { type: 'info', text: 'Trở thành cộng tác viên phát triển nội dung cho VMG EduNext. Đóng góp giáo án, worksheet, bài kiểm tra, video hướng dẫn. Được hướng dẫn quy trình biên soạn, nhận thù lao và ghi nhận tác giả trên học liệu chính thức.' },
  },
  {
    id: 'r19', category: 'cong_nhan',
    name: 'Đề cử EduNext Educator of the Quarter',
    desc: 'Xét duyệt danh hiệu giáo viên nổi bật theo quý',
    price: 5000, iconType: 'Sparkles',
    content: { type: 'info', text: 'Đề cử danh hiệu "EduNext Educator of the Quarter" — danh hiệu cao quý nhất dành cho giáo viên xuất sắc. Hội đồng chuyên môn xét duyệt hồ sơ, phỏng vấn và trao giải. Giải thưởng gồm: chứng nhận, quà tặng, bài viết giới thiệu trên mọi kênh của VMG.' },
  },
];

export default ITEMS;
export { CATEGORIES };
