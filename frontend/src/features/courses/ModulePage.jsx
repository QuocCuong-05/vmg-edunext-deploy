import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Icon } from '../../lib/icons';
import { hasSoundStructure, groupSounds, findModule, findLesson } from '../../lib/courseStructure';

const typeIcon = (l) => {
  switch (l.item_type) {
    case 'video_lesson': return '🎬';
    case 'lesson': return '📄';
    case 'practice': return '🎤';
    case 'quiz': return '📝';
    case 'slides': return '🖼';
    default: return '📄';
  }
};

export default function ModulePage() {
  const { slug, moduleId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [completedIds, setCompletedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api.courses.get(slug)
      .then(async data => {
        setCourse(data);
        try {
          const p = await api.courses.progress(data.id);
          setCompletedIds(p?.completed_lessons || []);
        } catch {}
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) return <p style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Đang tải...</p>;
  if (!course) return <div className="empty"><h3>Không tìm thấy khóa học</h3></div>;

  const module_ = findModule(course, moduleId) || (course.modules || []).find(m => m.id == null);
  if (!module_) return <div className="empty"><h3>Không tìm thấy module</h3></div>;

  const items = module_.items || [];
  const soundMode = hasSoundStructure(items);
  const sounds = soundMode ? groupSounds(items) : [];

  return (
    <div className="page-enter">
      <div className="back-btn" onClick={() => navigate(`/courses/${slug}`)}><Icon.ArrowLeft size={14} /> {course.title}</div>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>{module_.title}</h1>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
        {soundMode ? `${sounds.length} âm · ${items.length} bài` : `${items.length} bài`}
      </p>

      {soundMode ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sounds.map((s, i) => {
            const done = s.items.filter(it => completedIds.includes(it.id)).length;
            const allDone = done === s.items.length && s.items.length > 0;
            return (
              <div
                key={s.title}
                className={`lesson-item ${allDone ? 'completed' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/courses/${slug}/module/${moduleId}/sound/${i + 1}`)}
              >
                <div className="lesson-number" style={{ background: allDone ? 'var(--green)' : 'var(--red-bg)', color: allDone ? '#fff' : 'var(--red)' }}>
                  {allDone ? '✓' : i + 1}
                </div>
                <div className="lesson-info">
                  <h4>{s.title}</h4>
                  <p>{done}/{s.items.length} bài đã hoàn thành</p>
                </div>
                <Icon.ArrowRight size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(it => {
            const done = completedIds.includes(it.id);
            return (
              <div
                key={it.id}
                className={`lesson-item ${done ? 'completed' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/courses/${slug}/lessons/${it.id}`)}
              >
                <div className="lesson-number">{done ? '✓' : typeIcon(it)}</div>
                <div className="lesson-info">
                  <h4>{it.title}</h4>
                  {it.points > 0 && <p>Điểm tối đa: {it.points}</p>}
                </div>
                <Icon.ArrowRight size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}