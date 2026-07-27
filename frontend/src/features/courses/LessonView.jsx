import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_COURSES, MOCK_ENROLLMENTS } from '../../mock/data';
import { Icon } from '../../lib/icons';
import { updateStreak } from '../../lib/streak';
import { logActivity } from '../../lib/activity';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const LESSON_CONTENT = {
  'lesson-1-1': '<h4>Nội dung bài học: Settling the Class</h4><p>Trong bài học này, bạn sẽ học 8 câu lệnh để bắt đầu và ổn định lớp học bằng tiếng Anh.</p><ul><li><b>Good morning, everyone. Please take your seats.</b> — Chào buổi sáng cả lớp.</li><li><b>Let us settle down and get ready to learn.</b> — Ổn định và sẵn sàng học.</li><li><b>When I raise my hand, please finish your sentence and look this way.</b> — Tín hiệu lớp.</li></ul><p>💡 <b>Mẹo:</b> Nói rõ, ngắt theo cụm ý và nhấn từ mang nội dung. Dùng ngôn ngữ cơ thể để hỗ trợ.</p>',
  'lesson-1-2': '<h4>Nội dung bài học: Warm-Up & Engagement</h4><p>Các hoạt động khởi động giúp kích hoạt kiến thức nền và tạo không khí lớp học.</p><ul><li><b>Think-Pair-Share:</b> Học sinh nghĩ cá nhân, trao đổi cặp, chia sẻ với lớp.</li><li><b>Word Association:</b> Học sinh nêu từ liên quan đến chủ đề.</li><li><b>Quick Draw:</b> Vẽ nhanh hình ảnh đại diện cho khái niệm.</li></ul>',
  'lesson-2-1': '<h4>CLIL là gì?</h4><p>CLIL = Content and Language Integrated Learning. Đây là phương pháp dạy học tích hợp nội dung và ngôn ngữ.</p><p><b>Nguyên tắc cốt lõi:</b> Học sinh học kiến thức môn học THÔNG QUA tiếng Anh, chứ không chỉ học tiếng Anh.</p><p><b>Lợi ích:</b> Tiết kiệm thời gian, tăng thời lượng tiếp xúc ngôn ngữ, phát triển tư duy bậc cao.</p>',
  'lesson-3-1': '<h4>Formative vs Summative</h4><p><b>Formative assessment (đánh giá định hình)</b> diễn ra trong quá trình học. Mục đích: điều chỉnh giảng dạy và học tập.</p><p><b>Summative assessment (đánh giá tổng kết)</b> diễn ra cuối quá trình. Mục đích: đo lường kết quả.</p><p>💡 Trong lớp song ngữ, ưu tiên formative assessment để giảm áp lực và tăng cơ hội sử dụng ngôn ngữ.</p>',
};

const ARTICLE_BODIES = {
  'lesson-2-5': '<h4>Đánh giá trong CLIL</h4><p>Khi đánh giá trong CLIL, cần phân biệt rõ giữa mục tiêu nội dung và mục tiêu ngôn ngữ.</p><ul><li><b>Content assessment:</b> Kiểm tra kiến thức môn học</li><li><b>Language assessment:</b> Kiểm tra việc sử dụng ngôn ngữ</li><li><b>Integrated assessment:</b> Cả hai cùng lúc với tiêu chí riêng</li></ul><p>💡 Gợi ý: Dùng rubric với hai thang điểm riêng cho content và language.</p>',
  'lesson-2-7': '<h4>CLIL cho các môn học</h4><p>Mỗi môn học có discourse riêng. Dưới đây là một số gợi ý:</p><ul><li><b>Toán:</b> So sánh, phân loại, mô tả hình dạng</li><li><b>Khoa học:</b> Nguyên nhân-kết quả, mô tả quy trình</li><li><b>Lịch sử:</b> Trình tự thời gian, nguyên nhân và hậu quả</li></ul>',
  'lesson-3-4': '<h4>Thiết kế Rubric</h4><p>Một rubric tốt cần:</p><ul><li>3-5 tiêu chí chính</li><li>Mô tả cụ thể cho từng mức</li><li>Ngôn ngữ học sinh có thể hiểu</li></ul><p>Ví dụ rubric cho thuyết trình:</p><table border="1" cellpadding="8" style="width:100%;border-collapse:collapse;font-size:13px"><tr><th>Tiêu chí</th><th>Xuất sắc</th><th>Đạt</th><th>Cần cải thiện</th></tr><tr><td>Nội dung</td><td>Đầy đủ, chính xác</td><td>Cơ bản đúng</td><td>Thiếu chính xác</td></tr><tr><td>Ngôn ngữ</td><td>Từ vựng phong phú</td><td>Đúng từ khóa</td><td>Sai nhiều từ</td></tr></table>',
  'lesson-5-6': '<h4>Áp dụng Khoa học học tập vào Thiết kế Bài học</h4><p>5 nguyên lý bạn có thể áp dụng ngay:</p><ol><li><b>Retrieval Practice:</b> Bắt đầu giờ học bằng 3 câu hỏi truy hồi</li><li><b>Spacing:</b> Ôn tập nội dung sau 1 ngày, 1 tuần, 1 tháng</li><li><b>Interleaving:</b> Xen kẽ các dạng bài tập khác nhau</li><li><b>Cognitive Load:</b> Chia nhỏ thông tin, dùng sơ đồ trực quan</li><li><b>Metacognition:</b> Kết thúc bài bằng 1 phút phản tư</li></ol>',
};

export default function LessonView() {
  const { slug, lessonId } = useParams();
  const navigate = useNavigate();
  const course = MOCK_COURSES.find(c => c.slug === slug);

  if (!course) {
    return <div className="empty"><h3>Không tìm thấy bài học</h3></div>;
  }

  const lesson = (course.lessons || []).find(l => l.id === lessonId);
  if (!lesson) {
    return <div className="empty"><h3>Không tìm thấy bài học</h3></div>;
  }

  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setCompleted(false);
  }, [slug, lessonId]);
  const courseLessons = course.lessons || [];
  const currentIdx = courseLessons.findIndex(l => l.id === lessonId);
  const prevLesson = currentIdx > 0 ? courseLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < courseLessons.length - 1 ? courseLessons[currentIdx + 1] : null;

  const enroll = MOCK_ENROLLMENTS[course.id];
  const isFree = lesson.is_free;
  const isEnrolled = enroll?.enrolled;

  if (!isFree && !isEnrolled) {
    return (
      <div>
        <div className="back-btn" onClick={() => navigate(`/courses/${slug}`)}><Icon.ArrowLeft size={14} /> Quay lại khóa học</div>
        <div className="empty">
          <h3>Bài học này yêu cầu đăng ký khóa học</h3>
          <Button size="sm" variant="primary" label="Đăng ký khóa học" onClick={() => navigate(`/courses/${slug}`)} style={{ marginTop: 12 }} />
        </div>
      </div>
    );
  }

  const handleComplete = () => {
    setCompleted(true);
    updateStreak();
    logActivity('lesson', 'Đã học bài: ' + lesson.title, course.title);
    if (MOCK_ENROLLMENTS[course.id]) {
      const arr = MOCK_ENROLLMENTS[course.id].completed_lessons || [];
      if (!arr.includes(lessonId)) {
        arr.push(lessonId);
      }
      const total = courseLessons.length;
      MOCK_ENROLLMENTS[course.id].progress_pct = Math.round((arr.length / total) * 100);
    }
  };

  const content = lesson.content_type === 'article'
    ? ARTICLE_BODIES[lessonId] || '<p>Nội dung bài học đang được cập nhật...</p>'
    : LESSON_CONTENT[lessonId] || '<p>Nội dung bài học đang được cập nhật...</p>';

  return (
    <div className="lesson-content page-enter">
      <div className="back-btn" onClick={() => navigate(`/courses/${slug}`)}><Icon.ArrowLeft size={14} /> {course.title}</div>

      <h1 style={{ fontSize: 22, marginBottom: 8 }}>{lesson.title}</h1>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>{lesson.description}</p>

      {lesson.content_type === 'video' && (
        <div className="video-player">
          {lesson.video_url ? (
            <iframe src={lesson.video_url} allowFullScreen title={lesson.title} />
          ) : (
            <div className="placeholder">
              <div style={{ marginBottom: 12 }}><Icon.Play size={48} /></div>
              <p>Video demo — Bài học "{lesson.title}"</p>
              <p style={{ fontSize: 12, marginTop: 8, opacity: .5 }}>
                Thời lượng: {Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, '0')}
              </p>
            </div>
          )}
        </div>
      )}

      <Card style={{ marginBottom: 20, padding: 20 }}>
        <div dangerouslySetInnerHTML={{ __html: content }} style={{ fontSize: 14, lineHeight: 1.8 }} />
      </Card>

      {lesson.content_type === 'assignment' && (
        <Card style={{ background: 'var(--gold-bg)', borderColor: 'var(--gold)', marginBottom: 20, padding: 20 }}>
          <h4 style={{ fontSize: 15, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><Icon.Pen size={16} /> Bài tập</h4>
          <div dangerouslySetInnerHTML={{ __html: content }} style={{ fontSize: 13, lineHeight: 1.7 }} />
          <div style={{ marginTop: 16 }}>
            <textarea
              placeholder="Nhập câu trả lời của bạn..."
              style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 12, padding: 12, fontSize: 13, minHeight: 120, resize: 'vertical' }}
            />
          </div>
        </Card>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <Button variant="primary" onClick={handleComplete} isDisabled={completed}>
          {completed ? <><Icon.Check size={16} /> Đã hoàn thành</> : 'Đánh dấu hoàn thành'}
        </Button>
      </div>

      <div className="lesson-nav">
        {prevLesson ? (
          <Button variant="ghost" onClick={() => navigate(`/courses/${slug}/lessons/${prevLesson.id}`)}>
            <Icon.ArrowLeft size={16} /> {prevLesson.title}
          </Button>
        ) : <div />}
        {nextLesson ? (
          <Button variant="primary" onClick={() => navigate(`/courses/${slug}/lessons/${nextLesson.id}`)}>
            {nextLesson.title} <Icon.ArrowRight size={16} />
          </Button>
        ) : <div />}
      </div>
    </div>
  );
}
