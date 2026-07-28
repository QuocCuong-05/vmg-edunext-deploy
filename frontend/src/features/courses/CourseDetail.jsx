import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Icon } from '../../lib/icons';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

function loadEnroll(slug) {
  try {
    const e = localStorage.getItem('vmg_enroll_' + slug);
    return e ? JSON.parse(e) : null;
  } catch { return null; }
}
function saveEnroll(slug, data) {
  localStorage.setItem('vmg_enroll_' + slug, JSON.stringify(data));
}

const COVER_MAP = {
  classroom_english: { color: 'red', icon: Icon.Courses },
  clil_stem: { color: 'blue', icon: Icon.Brain },
  assessment: { color: 'gold', icon: Icon.Pen },
  vocabulary: { color: 'green', icon: Icon.BookOpen },
  learning_science: { color: 'purple', icon: Icon.Microscope },
};

export default function CourseDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api.courses.get(slug).then(data => {
      setCourse(data);
      const e = loadEnroll(slug);
      setEnrolled(e?.enrolled || false);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <p style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Đang tải...</p>;
  }

  if (!course) {
    return (
      <div className="empty">
        <h3>Không tìm thấy khóa học</h3>
        <Button size="sm" variant="primary" label="Quay lại danh sách" onClick={() => navigate('/courses')} style={{ marginTop: 12 }} />
      </div>
    );
  }

  const enroll = loadEnroll(slug) || { progress_pct: 0, completed_lessons: [] };
  const completedIds = enroll.completed_lessons || [];

  const handleEnroll = () => {
    saveEnroll(slug, { enrolled: true, progress_pct: 0, status: 'active', completed_lessons: [] });
    setEnrolled(true);
  };

  const cover = COVER_MAP[course.category] || { color: 'red', icon: Icon.Courses };
  const C = cover.icon;

  return (
    <div className="page-enter">
      <div className="back-btn" onClick={() => navigate('/courses')}><Icon.ArrowLeft size={14} /> Quay lại khóa học</div>

      <Card style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div className={`course-cover ${cover.color}`} style={{ width: 120, height: 120, fontSize: 40 }}>
            <C size={36} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 24, marginBottom: 8 }}>{course.title}</h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 12 }}>{course.description}</p>
            <div className="course-meta" style={{ marginBottom: 16 }}>
              <span className="pill">{course.level}</span>
              <span className="pill">{course.lesson_count} bài học</span>
              <span className="pill">{course.duration_hours} giờ</span>
              <span className="pill">{course.instructor}</span>
            </div>
          </div>
        </div>

        {!enrolled ? (
          <div className="enroll-bar">
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Bắt đầu khóa học này</p>
              <p>Truy cập tất cả {course.lesson_count} bài học và theo dõi tiến độ của bạn.</p>
            </div>
            <Button style={{ background: 'var(--card)', color: 'var(--red)', fontWeight: 800, padding: '12px 28px' }}
              onClick={handleEnroll}>
              Đăng ký miễn phí <Icon.ArrowRight size={16} />
            </Button>
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Tiến độ: {enroll.progress_pct}%</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{completedIds.length}/{course.lesson_count} bài</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${enroll.progress_pct}%` }} />
            </div>
          </div>
        )}
      </Card>

      <h3 style={{ fontSize: 17, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Icon.BookOpen size={18} /> Danh sách bài học</h3>
      {(course.lessons || []).map((lesson, idx) => {
        const isCompleted = completedIds.includes(lesson.id);
        return (
          <div
            key={lesson.id}
            className={`lesson-item ${isCompleted ? 'completed' : ''} ${!enrolled && !lesson.is_free ? 'locked' : ''}`}
            onClick={() => {
              if (enrolled || lesson.is_free) {
                navigate(`/courses/${course.slug}/lessons/${lesson.id}`);
              }
            }}
          >
            <div className="lesson-number">{isCompleted ? '✓' : idx + 1}</div>
            <div className="lesson-info">
              <h4>{lesson.title}</h4>
              <p>{lesson.description}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {lesson.content_type !== 'video' && (
                <span className="pill" style={{ fontSize: 9, padding: '3px 8px' }}>
                  {lesson.content_type === 'article' ? '📄' : '📝'}
                </span>
              )}
              {(lesson.video_duration_seconds || lesson.duration) > 0 && (
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {Math.floor((lesson.video_duration_seconds || lesson.duration) / 60)}:{String((lesson.video_duration_seconds || lesson.duration) % 60).padStart(2, '0')}
                </span>
              )}
              <span className={`lesson-badge ${lesson.is_free ? 'free' : 'pro'}`}>
                {lesson.is_free ? 'Miễn phí' : 'Pro'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
