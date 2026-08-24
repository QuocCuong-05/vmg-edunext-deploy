import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Icon } from '../../lib/icons';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useAuth } from '../auth/AuthContext';

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
  const { user, isPlus } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [progress, setProgress] = useState({ progress_pct: 0, completed_lessons: [] });

  const isPremium = course?.access_type === 'premium' || course?.access_type === 'paid';
  const canAccess = isPremium ? (isPlus || unlocked) : enrolled;

  useEffect(() => {
    if (!slug) return;
    api.courses.get(slug).then(async data => {
      setCourse(data);
      try {
        const p = await api.courses.progress(data.id);
        setProgress(p || { progress_pct: 0, completed_lessons: [] });
        setEnrolled(p?.enrolled || false);
      } catch {}
      if ((data.access_type === 'premium' || data.access_type === 'paid') && user?.id) {
        try {
          const ids = await api.unlock.courseIds(user.id);
          setUnlocked(ids.has(data.id));
        } catch {}
      }
      setLoading(false);
    }).catch(err => {
      const msg = (err?.message || '') + ' ' + (err?.status || '');
      if (/authorization|expired|Invalid token|401/i.test(msg)) {
        navigate('/login');
        return;
      }
      if (slug === 'pronunciation-all-in-one') {
        navigate('/courses/pronunciation-vowels', { replace: true });
        return;
      }
      setLoading(false);
    });
  }, [slug, user?.id, navigate]);

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

  const enroll = progress;
  const completedIds = progress.completed_lessons || [];

  const handleEnroll = async () => {
    try {
      await api.courses.enroll(course.id);
      const p = await api.courses.progress(course.id);
      setProgress(p || { progress_pct: 0, completed_lessons: [] });
      setEnrolled(true);
    } catch (err) {
      // enroll thất bại: KHÔNG đánh dấu đã enroll
    }
  };

  const cover = COVER_MAP[course.category] || { color: 'red', icon: Icon.Courses };
  const C = cover.icon;

  return (
    <div className="page-enter">
      <div className="back-btn" onClick={() => navigate('/courses')}><Icon.ArrowLeft size={14} /> Quay lại khóa học</div>

      <Card style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div className={`course-cover ${cover.color}`} style={{ width: 'min(120px, 22vw)', height: 'min(120px, 22vw)', fontSize: 40 }}>
            <C size={36} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 24, marginBottom: 8 }}>
              {course.title}{' '}
              {isPremium && (
                <span className="pill" style={{ background: 'var(--red)', color: '#fff', fontSize: 10, verticalAlign: 'middle' }}>
                  <Icon.Gem size={9} style={{ verticalAlign: 'middle', marginRight: 8, transform: 'translateY(-0.5px)' }} />&nbsp; Gói Plus
                </span>
              )}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 12 }}>{course.description}</p>
            <div className="course-meta" style={{ marginBottom: 16 }}>
              <span className="pill">{course.level}</span>
              <span className="pill">{course.lesson_count} bài học</span>
              <span className="pill">{course.duration_hours} giờ</span>
              <span className="pill">{course.instructor}</span>
              {isPremium && (
                <span className="pill" style={{ background: 'var(--gold-bg)', color: 'var(--gold)', fontWeight: 800 }}>
                  Mở toàn bộ khi có Plus
                </span>
              )}
            </div>
          </div>
        </div>

        {!canAccess ? (
          <div className="enroll-bar">
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                {isPremium ? 'Khóa học dành cho tài khoản Plus' : 'Bắt đầu khóa học này'}
              </p>
              <p>
                {isPremium
                  ? `Nâng cấp Plus để truy cập toàn bộ ${course.lesson_count} bài học và mọi khóa học premium.`
                  : `Truy cập tất cả ${course.lesson_count} bài học và theo dõi tiến độ của bạn.`}
              </p>
            </div>
            {isPremium ? (
              <Button style={{ background: 'var(--card)', color: 'var(--red)', fontWeight: 800, padding: '12px 28px' }}
                onClick={() => navigate('/plus')}>
                Nâng cấp Plus <Icon.ArrowRight size={16} />
              </Button>
            ) : (
              <Button style={{ background: 'var(--card)', color: 'var(--red)', fontWeight: 800, padding: '12px 28px' }}
                onClick={handleEnroll}>
                Đăng ký miễn phí <Icon.ArrowRight size={16} />
              </Button>
            )}
          </div>
        ) : (
          <div style={{ marginTop: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {isPremium ? 'Đã mở khóa' : `Tiến độ: ${enroll.progress_pct}%`}
              </span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{completedIds.length}/{course.lesson_count} bài</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${enroll.progress_pct}%` }} />
            </div>
            {enroll.points_total > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)' }}>🏆 Điểm: {enroll.points_earned}/{enroll.points_total}</span>
              </div>
            )}
          </div>
        )}
      </Card>

      <h3 style={{ fontSize: 17, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Icon.BookOpen size={18} /> Nội dung khóa học</h3>
      {(() => {
        const modules = (course.modules || []).length
          ? course.modules
          : [{ id: null, title: 'Bài học', items: course.lessons || [] }];
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {modules.map(group => {
              const items = group.items || [];
              const done = items.filter(it => completedIds.includes(it.id)).length;
              const pct = items.length ? Math.round((done / items.length) * 100) : 0;
              return (
                <div
                  key={group.id || group.title}
                  className="lesson-item"
                  style={{ cursor: 'pointer', padding: '16px 18px' }}
                  onClick={() => navigate(`/courses/${course.slug}/module/${group.id || 'loose'}`)}
                >
                  <div className="lesson-number" style={{ background: pct === 100 ? 'var(--green)' : 'var(--red-bg)', color: pct === 100 ? '#fff' : 'var(--red)' }}>
                    {pct === 100 ? '✓' : pct > 0 ? pct + '%' : '▶'}
                  </div>
                  <div className="lesson-info">
                    <h4>{group.title}</h4>
                    <p>{items.length} bài · {done}/{items.length} đã hoàn thành</p>
                  </div>
                  <Icon.ArrowRight size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
