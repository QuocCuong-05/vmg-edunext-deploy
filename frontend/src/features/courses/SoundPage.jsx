import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Icon } from '../../lib/icons';
import { findModule, groupSounds, hasSoundStructure } from '../../lib/courseStructure';

const typeIcon = (l) => {
  switch (l.item_type) {
    case 'video_lesson': return '🎬';
    case 'lesson': return '📄';
    case 'practice': return '🎤';
    case 'quiz': return '📝';
    default: return '📄';
  }
};

export default function SoundPage() {
  const { slug, moduleId, no } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [completedIds, setCompletedIds] = useState([]);
  const [practiceScores, setPracticeScores] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api.courses.get(slug)
      .then(async data => {
        setCourse(data);
        try {
          const p = await api.courses.progress(data.id);
          setCompletedIds(p?.completed_lessons || []);
          setPracticeScores(p?.practice_scores || {});
        } catch {}
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) return <p style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Đang tải...</p>;
  if (!course) return <div className="empty"><h3>Không tìm thấy khóa học</h3></div>;

  const module_ = findModule(course, moduleId);
  if (!module_ || !hasSoundStructure(module_.items)) {
    return <div className="empty"><h3>Không tìm thấy nội dung</h3></div>;
  }
  const sounds = groupSounds(module_.items);
  const idx = Math.max(0, Math.min(sounds.length - 1, (Number(no) || 1) - 1));
  const sound = sounds[idx];

  const doneCount = sound.items.filter(it => completedIds.includes(it.id)).length;

  return (
    <div className="page-enter">
      <div className="back-btn" onClick={() => navigate(`/courses/${slug}/module/${moduleId}`)}><Icon.ArrowLeft size={14} /> {module_.title}</div>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>{sound.title}</h1>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
        {doneCount}/{sound.items.length} bài đã hoàn thành
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sound.items.map(it => {
          const done = completedIds.includes(it.id);
          const sc = practiceScores[it.id];
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
              {sc && <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gold)' }}>{sc.earned}/{sc.max}đ</span>}
              <Icon.ArrowRight size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
            </div>
          );
        })}
      </div>

      {sounds.length > 1 && (
        <div className="lesson-nav" style={{ marginTop: 24 }}>
          {idx > 0 ? (
            <div className="lesson-item" style={{ cursor: 'pointer', margin: 0 }} onClick={() => navigate(`/courses/${slug}/module/${moduleId}/sound/${idx}`)}>
              <Icon.ArrowLeft size={16} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{sounds[idx - 1].title}</span>
            </div>
          ) : <div />}
          {idx < sounds.length - 1 ? (
            <div className="lesson-item" style={{ cursor: 'pointer', margin: 0 }} onClick={() => navigate(`/courses/${slug}/module/${moduleId}/sound/${idx + 2}`)}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{sounds[idx + 1].title}</span>
              <Icon.ArrowRight size={16} style={{ flexShrink: 0 }} />
            </div>
          ) : <div />}
        </div>
      )}
    </div>
  );
}