import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Icon } from '../../lib/icons';
import { updateStreak } from '../../lib/streak';
import { logActivity } from '../../lib/activity';
import { addXp } from '../../lib/xp';
import { dispatchAction } from '../../lib/quest-engine';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useAuth } from '../auth/AuthContext';

function loadEnroll(slug) {
  try {
    const e = localStorage.getItem('vmg_enroll_' + slug);
    return e ? JSON.parse(e) : null;
  } catch { return null; }
}
function saveEnroll(slug, data) {
  localStorage.setItem('vmg_enroll_' + slug, JSON.stringify(data));
}

export default function LessonView() {
  const { slug, lessonId } = useParams();
  const navigate = useNavigate();
  const { user, isPlus } = useAuth();
  const showToast = useToast();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [previewSeconds, setPreviewSeconds] = useState(120);
  const [videoInfo, setVideoInfo] = useState(null);
  const [videoError, setVideoError] = useState('');
  const [teaserEnded, setTeaserEnded] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!slug) return;
    api.courses.get(slug).then(data => {
      setCourse(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if ((course?.access_type === 'premium' || course?.access_type === 'paid') && user?.id) {
      api.unlock.courseIds(user.id).then(ids => setUnlocked(ids.has(course.id))).catch(() => {});
    }
  }, [course, user?.id]);

  useEffect(() => {
    setCompleted(false);
  }, [lessonId]);

  useEffect(() => {
    if (course?.access_type === 'premium' || course?.access_type === 'paid') {
      api.orders.publicSettings()
        .then(s => setPreviewSeconds(Number(s?.preview_seconds) || 120))
        .catch(() => {});
    }
  }, [course]);

  if (loading) {
    return <p style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Đang tải...</p>;
  }

  if (!course) {
    return <div className="empty"><h3>Không tìm thấy khóa học</h3></div>;
  }

  const courseLessons = course.lessons || [];
  const lesson = courseLessons.find(l => l.id === lessonId);
  if (!lesson) {
    return <div className="empty"><h3>Không tìm thấy bài học</h3></div>;
  }

  const currentIdx = courseLessons.findIndex(l => l.id === lessonId);
  const prevLesson = currentIdx > 0 ? courseLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < courseLessons.length - 1 ? courseLessons[currentIdx + 1] : null;

  const enroll = loadEnroll(slug);
  const isFree = lesson.is_free;
  const isEnrolled = enroll?.enrolled;
  const isPremium = course.access_type === 'premium' || course.access_type === 'paid';
  const canAccessFull = isFree || isPlus || unlocked;
  const isPreviewLesson = !canAccessFull && !!lesson.preview_text;
  const isLocked = !isFree && !canAccessFull && !isPreviewLesson;
  const isLessonCompleted = enroll?.completed_lessons?.includes(lessonId) || false;

  // Lấy video: legacy URL (YouTube) dùng thẳng; storage path → signed token
  useEffect(() => {
    setVideoInfo(null);
    setVideoError('');
    setTeaserEnded(false);
    if (isLocked || !lesson.video_url) return;
    if (lesson.video_url.startsWith('http')) {
      setVideoInfo({ legacy: true, url: lesson.video_url });
      return;
    }
    let cancelled = false;
    api.videos.token(lesson.id)
      .then(info => { if (!cancelled) setVideoInfo(info); })
      .catch(err => { if (!cancelled) setVideoError(err.message); });
    return () => { cancelled = true; };
  }, [lesson?.id, lesson?.video_url, isLocked]);

  const teaserLimit = videoInfo?.previewSeconds ?? previewSeconds;

  const handleTimeUpdate = useCallback(() => {
    if (isPreviewLesson && videoRef.current && teaserLimit > 0) {
      if (videoRef.current.currentTime >= teaserLimit) {
        videoRef.current.pause();
        setTeaserEnded(true);
      }
    }
  }, [isPreviewLesson, teaserLimit]);

  if (isLocked) {
    return (
      <div>
        <div className="back-btn" onClick={() => navigate(`/courses/${slug}`)}><Icon.ArrowLeft size={14} /> Quay lại khóa học</div>
        <div className="empty">
          <h3>Bài học này thuộc khóa học Premium</h3>
          {lesson.preview_text && (
            <p style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 520, margin: '8px auto 0', lineHeight: 1.7 }}>
              {lesson.preview_text}
            </p>
          )}
          <Button size="sm" variant="primary" label="Nâng cấp Plus để xem" onClick={() => navigate('/plus')} style={{ marginTop: 12 }} />
        </div>
      </div>
    );
  }

  const handleComplete = () => {
    setCompleted(true);
    updateStreak();
    addXp(60);
    showToast('+60 XP', 'success');
    logActivity('lesson', 'Đã học bài: ' + lesson.title, course.title);
    dispatchAction('lesson_complete');
    const e = loadEnroll(slug) || { enrolled: true, progress_pct: 0, completed_lessons: [] };
    const arr = e.completed_lessons || [];
    if (!arr.includes(lessonId)) {
      arr.push(lessonId);
    }
    const total = courseLessons.length;
    e.progress_pct = Math.round((arr.length / total) * 100);
    e.enrolled = true;
    saveEnroll(slug, e);
  };

  const dur = lesson.video_duration_seconds || lesson.duration || 0;
  const content = lesson.article_body || '<p>Nội dung bài học đang được cập nhật...</p>';

  return (
    <div className="lesson-content page-enter">
      <div className="back-btn" onClick={() => navigate(`/courses/${slug}`)}><Icon.ArrowLeft size={14} /> {course.title}</div>

      <h1 style={{ fontSize: 22, marginBottom: 8 }}>
        {lesson.title}{' '}
        {isPreviewLesson && (
          <span className="pill" style={{ background: 'var(--gold-bg)', color: 'var(--gold)', fontSize: 10, verticalAlign: 'middle' }}>
            Xem trước {Math.round(teaserLimit / 60)} phút đầu
          </span>
        )}
      </h1>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>{lesson.description}</p>

      {lesson.content_type === 'video' && (
        <div className="video-player">
          {videoInfo?.legacy ? (
            <iframe src={videoInfo.url} allowFullScreen title={lesson.title} />
          ) : videoInfo ? (
            <video
              ref={videoRef}
              src={videoInfo.url}
              controls
              playsInline
              onTimeUpdate={handleTimeUpdate}
              style={{ width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: 12 }}
            />
          ) : videoError ? (
            <div className="placeholder">
              <div style={{ marginBottom: 12 }}><Icon.X size={40} /></div>
              <p>Không thể phát video: {videoError}</p>
            </div>
          ) : (
            <div className="placeholder">
              <div style={{ marginBottom: 12 }}><Icon.Play size={48} /></div>
              <p>Video sẽ được cập nhật sau</p>
              <p style={{ fontSize: 12, marginTop: 8, opacity: .5 }}>
                Thời lượng: {Math.floor(dur / 60)}:{String(dur % 60).padStart(2, '0')}
              </p>
            </div>
          )}
        </div>
      )}

      {(isPreviewLesson || teaserEnded) && (
        <div style={{
          marginBottom: 20, padding: '14px 18px',
          background: 'var(--red-bg)', border: '1px solid var(--red)', borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        }}>
          <div>
            <b style={{ fontSize: 14 }}>{teaserEnded ? 'Bạn đã xem hết phần xem trước' : `Bạn đang xem ${Math.round(teaserLimit / 60)} phút đầu của bài học`}</b>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              Nâng cấp Plus để xem toàn bộ.
            </p>
          </div>
          <Button size="sm" variant="primary" onClick={() => navigate('/plus')}>
            Nâng cấp Plus
          </Button>
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
        <Button variant="primary" onClick={handleComplete} isDisabled={completed || isLessonCompleted}>
          {completed || isLessonCompleted ? <><Icon.Check size={16} /> Đã hoàn thành</> : 'Đánh dấu hoàn thành'}
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
