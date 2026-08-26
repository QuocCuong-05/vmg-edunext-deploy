import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Icon } from '../../lib/icons';
import { updateStreak } from '../../lib/streak';
import { logActivity } from '../../lib/activity';
import { addXp } from '../../lib/xp';
import { dispatchAction } from '../../lib/quest-engine';
import { trackEvent } from '../../lib/ga';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import SpeakPractice from '../../components/ui/SpeakPractice';
import { ListenChoose, ListenFill, ListenMark, VoiceRecorder } from '../../components/ui/PracticeExercises';
import { soundContext } from '../../lib/courseStructure';
import { useAuth } from '../auth/AuthContext';

function safeResumeTarget(watched, duration) {
  if (!watched || watched <= 0) return 0;
  if (duration && watched >= duration - 3) return 0;
  return Math.max(0, watched - 2);
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
  const [completedIds, setCompletedIds] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [previewSeconds, setPreviewSeconds] = useState(120);
  const [videoInfo, setVideoInfo] = useState(null);
  const [videoError, setVideoError] = useState('');
  const [teaserEnded, setTeaserEnded] = useState(false);
  const [maxWatched, setMaxWatched] = useState(0);
  const [videoComplete, setVideoComplete] = useState(false);
  const [lessonDetail, setLessonDetail] = useState(null);
  const videoRef = useRef(null);
  const maxWatchedRef = useRef(0);
  const restoredRef = useRef(false);
  const completedIdsRef = useRef(completedIds);
  completedIdsRef.current = completedIds;
  const saveProgressRef = useRef(() => {});

  useEffect(() => {
    if (!slug) return;
    api.courses.get(slug).then(data => {
      setCourse(data);
      setLoading(false);
      const l = (data?.lessons || []).find(x => x.id === lessonId);
      if (l) trackEvent('Course', 'lesson_view', l.title);
    }).catch(err => {
      const msg = (err?.message || '') + ' ' + (err?.status || '');
      if (/authorization|expired|Invalid token|401/i.test(msg)) {
        navigate('/login');
        return;
      }
      setLoading(false);
    });
  }, [slug, navigate]);

  useEffect(() => {
    if ((course?.access_type === 'premium' || course?.access_type === 'paid') && user?.id) {
      api.unlock.courseIds(user.id).then(ids => setUnlocked(ids.has(course.id))).catch(() => {});
    }
  }, [course, user?.id]);

  useEffect(() => {
    setCompleted(false);
    setMaxWatched(0);
    maxWatchedRef.current = 0;
    setVideoComplete(false);
    restoredRef.current = false;
    setLessonDetail(null);
    if (lessonId) {
      api.lessons.get(lessonId)
        .then(d => setLessonDetail(d || null))
        .catch(() => setLessonDetail(null));
    }
  }, [lessonId]);

  useEffect(() => {
    if (course?.access_type === 'premium' || course?.access_type === 'paid') {
      api.orders.publicSettings()
        .then(s => setPreviewSeconds(Number(s?.preview_seconds) || 120))
        .catch(() => {});
    }
  }, [course]);

  // Lấy video: legacy URL (YouTube) dùng thẳng; storage path → signed token
  useEffect(() => {
    setVideoInfo(null);
    setVideoError('');
    setTeaserEnded(false);
    const l = course?.lessons?.find(x => x.id === lessonId);
    if (!l) return;
    const locked = !l.is_free && !isPlus && !unlocked && !l.preview_text;
    if (locked) return;
    if (l.video_url && l.video_url.startsWith('http')) {
      setVideoInfo({ legacy: true, url: l.video_url });
      return;
    }
    if (!l.video_url && !l.preview_text) return;
    let cancelled = false;
    api.videos.token(lessonId)
      .then(info => { if (!cancelled) setVideoInfo(info); })
      .catch(err => { if (!cancelled) setVideoError(err.message); });
    return () => { cancelled = true; };
  }, [lessonId, course, isPlus, unlocked]);

  // Hàm lưu vị trí hiện tại lên server (dùng cho ping 10s, pause, beforeunload)
  useEffect(() => {
    saveProgressRef.current = () => {
      const v = videoRef.current;
      const t = v ? Math.floor(v.currentTime || 0) : 0;
      if (t > 0) {
        api.lessons.progress(lessonId, { watched_seconds: t, completed: completedIdsRef.current.includes(lessonId) })
          .catch(err => console.error('[progress]', err.message));
      }
    };
  }, [lessonId]);

  // Ping tiến độ lên server mỗi 10s (chống mất tiến độ khi reload + dữ liệu KPI)
  useEffect(() => {
    if (!lessonId || !videoInfo || videoComplete) return;
    const timer = setInterval(() => {
      const w = Math.round(maxWatchedRef.current);
      if (w > 0) {
        api.lessons.progress(lessonId, { watched_seconds: w, completed: completedIdsRef.current.includes(lessonId) })
          .catch(err => console.error('[progress]', err.message));
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [lessonId, videoInfo, videoComplete]);

  // Lưu vị trí khi rời trang (reload/đóng tab) để không mất tiến độ
  useEffect(() => {
    const handler = () => saveProgressRef.current();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // Khôi phục tiến độ từ server khi mở bài (reload không mất)
  useEffect(() => {
    if (!course?.id || !lessonId || !user?.id) return;
    let cancelled = false;
    api.courses.progress(course.id)
      .then(data => {
        if (cancelled) return;
        const row = (data?.details || []).find(p => p.lesson_id === lessonId);
        if (row?.watched_seconds > 0) {
          maxWatchedRef.current = row.watched_seconds;
          setMaxWatched(row.watched_seconds);
          if (videoRef.current?.readyState >= 1 && !restoredRef.current) {
            const dur = videoRef.current.duration || 0;
            const target = safeResumeTarget(row.watched_seconds, dur);
            if (target > 0) videoRef.current.currentTime = target;
            restoredRef.current = true;
          }
          const l = course?.lessons?.find(x => x.id === lessonId);
          const teaserLesson = l && !l.is_free && !isPlus && !unlocked && !!l.preview_text;
          if (teaserLesson && row.watched_seconds >= (Number(previewSeconds) || 120)) {
            setTeaserEnded(true);
          }
        }
        if (row?.completed) setCompleted(true);
        setCompletedIds(data?.completed_lessons || []);
        setIsEnrolled(data?.enrolled || false);
      })
      .catch(err => console.error('[progress restore]', err.message));
    return () => { cancelled = true; };
  }, [course?.id, lessonId, user?.id, isPlus, unlocked, previewSeconds]);

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

  const isFree = lesson.is_free;
  const isPremium = course.access_type === 'premium' || course.access_type === 'paid';
  const canAccessFull = isFree || isPlus || unlocked;
  const isPreviewLesson = !canAccessFull && !!lesson.preview_text;
  const isLocked = !isFree && !canAccessFull && !isPreviewLesson;
  const isLessonCompleted = completedIds.includes(lessonId);

  const itemType = lessonDetail?.item_type || lesson.item_type ||
    (lesson.content_type === 'video' ? 'video_lesson'
      : lesson.content_type === 'article' ? 'lesson'
        : lesson.content_type === 'assignment' ? 'practice'
          : lesson.content_type === 'quiz' ? 'quiz' : 'video_lesson');
  const practiceWords = lessonDetail?.practice_words || [];
  const bodyHtml = lessonDetail?.body_html || lesson.article_body || '';
  const hasRichBody = !!(lessonDetail?.body_html || lesson.article_body);
  const ptType = lessonDetail?.practice_type || 'speak_passage';
  const practiceHasContent =
    ptType === 'voice_recorder' ||
    (['listen_choose', 'listen_fill', 'listen_mark'].includes(ptType)
      ? (lessonDetail?.practice_questions || []).length > 0
      : practiceWords.length > 0);

  const ctx = soundContext(course, lessonId);
  const soundItems = ctx?.sound?.items && ctx.sound.items.length ? ctx.sound.items : courseLessons;
  const soundIdx = soundItems.findIndex(l => l.id === lessonId);
  const prevInSound = soundIdx > 0 ? soundItems[soundIdx - 1] : null;
  const nextInSound = soundIdx < soundItems.length - 1 ? soundItems[soundIdx + 1] : null;
  const typeIcon = (l) => {
    switch (l.item_type || l.content_type) {
      case 'video_lesson': return '🎬';
      case 'lesson': return '📄';
      case 'practice': return '🎤';
      case 'quiz': return '📝';
      case 'video': return '🎬';
      case 'article': return '📄';
      default: return '📄';
    }
  };

  const teaserLimit = videoInfo?.previewSeconds ?? previewSeconds;

  function handleTimeUpdate() {
    if (videoRef.current && !videoRef.current.seeking) {
      maxWatchedRef.current = Math.max(maxWatchedRef.current, videoRef.current.currentTime);
      setMaxWatched(maxWatchedRef.current);
    }
    if (isPreviewLesson && videoRef.current && teaserLimit > 0) {
      if (videoRef.current.currentTime >= teaserLimit) {
        videoRef.current.pause();
        setTeaserEnded(true);
      }
    }
  }

  function handleSeeking() {
    if (videoRef.current && videoRef.current.currentTime > maxWatchedRef.current + 2) {
      videoRef.current.currentTime = maxWatchedRef.current;
    }
  }

  function handleSeeked() {
    if (isPreviewLesson && videoRef.current && teaserLimit > 0) {
      if (videoRef.current.currentTime >= teaserLimit) {
        videoRef.current.currentTime = Math.max(0, teaserLimit - 1);
        videoRef.current.pause();
        setTeaserEnded(true);
      }
    }
    if (videoRef.current && videoRef.current.currentTime > maxWatchedRef.current + 2) {
      videoRef.current.currentTime = maxWatchedRef.current;
    }
  }

  function handleLoadedMetadata() {
    if (videoRef.current && maxWatchedRef.current > 0 && !restoredRef.current) {
      const dur = videoRef.current.duration || 0;
      const target = safeResumeTarget(maxWatchedRef.current, dur);
      if (target > 0) videoRef.current.currentTime = target;
      restoredRef.current = true;
    }
  }

  function handleEnded() {
    setVideoComplete(true);
  }

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

  const dur = lesson.video_duration_seconds || lesson.duration || 0;
  const lessonHasVideo = itemType === 'video_lesson' && !!lesson.video_url;
  const completeBlockedByVideo = lessonHasVideo && !videoComplete;

  const handleComplete = async () => {
    if (lessonHasVideo && !videoComplete) return;
    try {
      await api.lessons.progress(lessonId, {
        completed: true,
        watched_seconds: Math.round(maxWatchedRef.current),
      });
    } catch (err) {
      setVideoError(err.message);
      return;
    }
    setCompleted(true);
    updateStreak();
    addXp(60);
    showToast('+60 XP', 'success');
    logActivity('lesson', 'Đã học bài: ' + lesson.title, course.title);
    dispatchAction('lesson_complete');
    setIsEnrolled(true);
    if (!completedIds.includes(lessonId)) {
      setCompletedIds(prev => [...prev, lessonId]);
    }
  };

  return (
    <div className="lesson-content page-enter">
      <div className="back-btn" style={{ flexWrap: 'wrap', gap: 6 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={() => navigate(`/courses/${slug}`)}>
          <Icon.ArrowLeft size={14} /> {course.title}
        </span>
        {ctx?.moduleId && (
          <>
            <span style={{ color: 'var(--muted)' }}>/</span>
            <span style={{ cursor: 'pointer' }} onClick={() => navigate(`/courses/${slug}/module/${ctx.moduleId}`)}>{ctx.moduleTitle}</span>
          </>
        )}
        {ctx?.sound && (
          <>
            <span style={{ color: 'var(--muted)' }}>/</span>
            <span style={{ cursor: 'pointer' }} onClick={() => navigate(`/courses/${slug}/module/${ctx.moduleId}/sound/${ctx.soundNo}`)}>{ctx.sound.title}</span>
          </>
        )}
        <span style={{ color: 'var(--muted)' }}>/</span>
        <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{lesson.title.length > 34 ? lesson.title.slice(0, 34) + '…' : lesson.title}</span>
      </div>

      <h1 style={{ fontSize: 22, marginBottom: 8 }}>
        {lesson.title}{' '}
        {isPreviewLesson && (
          <span className="pill" style={{ background: 'var(--gold-bg)', color: 'var(--gold)', fontSize: 10, verticalAlign: 'middle' }}>
            Xem trước {Math.round(teaserLimit / 60)} phút đầu
          </span>
        )}
      </h1>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>{lesson.description}</p>

      {(lessonDetail?.audio_url || lesson.audio_url) && (
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>🎵 Bài nghe</span>
          <audio controls src={lessonDetail?.audio_url || lesson.audio_url} preload="none" style={{ width: '100%', maxWidth: 440, height: 42 }} />
        </div>
      )}

      {ctx?.sound && soundItems.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {soundItems.map(l => {
            const done = completedIds.includes(l.id);
            const active = l.id === lessonId;
            return (
              <div
                key={l.id}
                onClick={() => navigate(`/courses/${slug}/lessons/${l.id}`)}
                title={l.title}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', borderRadius: 999, cursor: 'pointer',
                  fontSize: 12, fontWeight: 700,
                  border: `1px solid ${active ? 'var(--red)' : 'var(--line)'}`,
                  background: active ? 'var(--red-bg)' : done ? 'var(--green-bg)' : 'var(--surface-hover)',
                  color: active ? 'var(--red)' : done ? 'var(--green)' : 'var(--muted)',
                }}
              >
                {done ? '✓' : typeIcon(l)}
                <span style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {l.title.split(' - ').pop()}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {itemType === 'video_lesson' && (
        <div className="video-player" style={{ position: 'relative' }}>
          {videoInfo?.legacy ? (
            <iframe src={videoInfo.url} allowFullScreen title={lesson.title} />
          ) : videoInfo ? (
            <video
              ref={videoRef}
              src={videoInfo.url}
              controls
              controlsList="nodownload noremoteplayback"
              disablePictureInPicture
              playsInline
              onContextMenu={e => e.preventDefault()}
              onTimeUpdate={handleTimeUpdate}
              onPause={() => saveProgressRef.current()}
              onSeeking={handleSeeking}
              onSeeked={handleSeeked}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleEnded}
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
            </div>
          )}

          {teaserEnded && videoInfo && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 5,
              background: 'rgba(10,14,20,.92)',
              borderRadius: 12,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 12, textAlign: 'center', padding: 24,
            }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--red)', color: '#fff', display: 'grid', placeItems: 'center' }}>
                <Icon.Gem size={26} />
              </div>
              <b style={{ fontSize: 16, color: '#fff' }}>Bạn đã xem hết phần xem trước</b>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', margin: 0 }}>
                Nâng cấp Plus để xem toàn bộ bài học này.
              </p>
              <Button size="sm" variant="primary" onClick={() => navigate('/plus')} style={{ marginTop: 6 }}>
                Nâng cấp Plus
              </Button>
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

      {itemType === 'practice' && practiceHasContent ? (
        /* Một khối liền mạch: nội dung giới thiệu + bài tập như H5P.Column của LMS */
        <Card style={{ marginBottom: 20, padding: 20 }}>
          {hasRichBody && (
            <>
              <div className="article-content" dangerouslySetInnerHTML={{ __html: bodyHtml }} style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }} />
              <div style={{ borderTop: '1px dashed var(--line)', margin: '18px 0 12px' }} />
            </>
          )}
          {(() => {
            const pt = ptType;
            const ansMap = {};
            (lessonDetail?.practice_answers || []).forEach(a => { ansMap[a.question_id] = a; });
            const done = () => {
              api.lessons.progress(lessonId, { completed: true })
                .then(() => {
                  setCompleted(true);
                  updateStreak();
                  addXp(60);
                  showToast('+60 XP', 'success');
                  logActivity('lesson', 'Đã hoàn thành bài tập: ' + lesson.title, course.title);
                  dispatchAction('lesson_complete');
                  setIsEnrolled(true);
                  if (!completedIds.includes(lessonId)) setCompletedIds(prev => [...prev, lessonId]);
                })
                .catch(err => showToast(err.message || 'Lỗi lưu tiến độ', 'error'));
            };
            if (pt === 'listen_choose') return <ListenChoose lesson={lesson} questions={lessonDetail?.practice_questions || []} answers={ansMap} onCompleted={done} />;
            if (pt === 'listen_fill') return <ListenFill lesson={lesson} questions={lessonDetail?.practice_questions || []} answers={ansMap} onCompleted={done} />;
            if (pt === 'listen_mark') return <ListenMark lesson={lesson} questions={lessonDetail?.practice_questions || []} answers={ansMap} onCompleted={done} />;
            if (pt === 'voice_recorder') return <VoiceRecorder lesson={lesson} questions={lessonDetail?.practice_questions || []} answers={ansMap} onCompleted={done} />;
            return <SpeakPractice lesson={lesson} words={practiceWords} onCompleted={done} />;
          })()}
        </Card>
      ) : hasRichBody ? (
        <Card style={{ marginBottom: 20, padding: 20 }}>
          <div className="article-content" dangerouslySetInnerHTML={{ __html: bodyHtml }} style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }} />
        </Card>
      ) : itemType !== 'video_lesson' && (
        <Card style={{ marginBottom: 20, padding: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
            {itemType === 'practice'
              ? 'Bài học đang được cập nhật...'
              : itemType === 'quiz'
                ? 'Hoàn thành bài kiểm tra để ôn tập kiến thức.'
                : bodyHtml || 'Nội dung bài học đang được cập nhật...'}
          </p>
        </Card>
      )}

      {itemType === 'quiz' && (
        <Card style={{ marginBottom: 20, padding: 20, textAlign: 'center' }}>
          <h4 style={{ fontSize: 15, marginBottom: 8 }}>📝 Bài kiểm tra</h4>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
            Làm bài kiểm tra để ôn lại nội dung bài học.
          </p>
          <Button variant="primary" onClick={() => navigate(`/quiz/${lesson.quiz_slug || lessonDetail?.quiz_slug}`)}>
            Vào làm bài kiểm tra
          </Button>
        </Card>
      )}

      {lesson.content_type === 'assignment' && itemType !== 'practice' && (
        <Card style={{ background: 'var(--gold-bg)', borderColor: 'var(--gold)', marginBottom: 20, padding: 20 }}>
          <h4 style={{ fontSize: 15, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><Icon.Pen size={16} /> Bài tập</h4>
          <div className="article-content" dangerouslySetInnerHTML={{ __html: bodyHtml }} style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }} />
        </Card>
      )}

      {itemType !== 'practice' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          <Button variant="primary" onClick={handleComplete} isDisabled={completed || isLessonCompleted || completeBlockedByVideo}>
            {completed || isLessonCompleted ? <><Icon.Check size={16} /> Đã hoàn thành</> : (completeBlockedByVideo ? 'Xem hết video để hoàn thành' : 'Đánh dấu hoàn thành')}
          </Button>
          {videoError && (
            <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{videoError}</p>
          )}
        </div>
      )}

      <div className="lesson-nav">
        {prevInSound ? (
          <Button variant="ghost" onClick={() => navigate(`/courses/${slug}/lessons/${prevInSound.id}`)} style={{ minWidth: 0 }}>
            <Icon.ArrowLeft size={16} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{prevInSound.title}</span>
          </Button>
        ) : <div />}
        {nextInSound ? (
          <Button variant="primary" onClick={() => navigate(`/courses/${slug}/lessons/${nextInSound.id}`)} style={{ minWidth: 0 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{nextInSound.title}</span>
            <Icon.ArrowRight size={16} style={{ flexShrink: 0 }} />
          </Button>
        ) : <div />}
      </div>
    </div>
  );
}
