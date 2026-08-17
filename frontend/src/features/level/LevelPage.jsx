import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { getXp, addXp } from '../../lib/xp';
import { Icon } from '../../lib/icons';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

// Thang level động (QL-2): dùng chung từ lib/level.js (đồng bộ backend/src/routes/level.js)
import { levelFromXp, levelBounds } from '../../lib/level';

const CHALLENGES_KEY = 'vmg_challenges_completed';

function loadCompleted() {
  try { return JSON.parse(localStorage.getItem(CHALLENGES_KEY) || '{}'); } catch { return {}; }
}
function saveCompleted(completed) {
  localStorage.setItem(CHALLENGES_KEY, JSON.stringify(completed));
}

export default function LevelPage() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [challenges, setChallenges] = useState([]);
  const [completed, setCompleted] = useState(loadCompleted);
  const [xp, setXp] = useState(getXp);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.level.challenges()
      .then(data => { setChallenges(data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!challenges.length) return;
    try {
      const stored = JSON.parse(localStorage.getItem('vmg_quiz_completed'));
      if (!stored) return;
      const challenge = challenges.find(c => c.quiz_slug === stored.slug);
      if (!challenge || completed[challenge.id]) {
        localStorage.removeItem('vmg_quiz_completed');
        return;
      }
      addXp(challenge.xp_reward);
      setXp(getXp());
      showToast('+' + challenge.xp_reward + ' XP', 'success');
      setCompleted(prev => {
        const next = { ...prev, [challenge.id]: true };
        saveCompleted(next);
        return next;
      });
      localStorage.removeItem('vmg_quiz_completed');
    } catch {}
  }, [challenges]);

  const totalXp = xp;
  const { lvl: level, current: currentLevelXp, required: xpRequired } = levelBounds(totalXp);
  const xpProgress = Math.min(100, (currentLevelXp / xpRequired) * 100);

  const handleNonQuizChallenge = (c) => {
    if (completed[c.id]) return;
    if (c.level_min > level) return;
    addXp(c.xp_reward);
    setXp(getXp());
    showToast('+' + c.xp_reward + ' XP', 'success');
    setCompleted(prev => {
      const next = { ...prev, [c.id]: true };
      saveCompleted(next);
      return next;
    });
  };

  useEffect(() => {
    const interval = setInterval(() => { setXp(getXp()); }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page-enter">
      <div className="page-title">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon.Target size={24} /> Level & Progress
        </h1>
        <p>Hoàn thành thử thách để lên cấp độ mới</p>
      </div>

      <Card style={{ marginBottom: 24, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(145deg, var(--red), var(--red2))',
            display: 'grid', placeItems: 'center', color: '#fff',
            fontSize: 28, fontWeight: 800, flexShrink: 0
          }}>
            {level}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Level {level}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>
              {currentLevelXp} / {xpRequired} XP to next level
            </div>
            <div className="progress-bar" style={{ maxWidth: 400 }}>
              <div className="progress-fill" style={{ width: `${xpProgress}%` }} />
            </div>
          </div>
          <div className="stat-card accent-red" style={{ minWidth: 140, padding: 16 }}>
            <div className="stat-header">
              <Icon.Sparkles size={18} />
              <span className="stat-label">Total XP</span>
            </div>
            <div className="stat-value" style={{ fontSize: 24 }}>{totalXp.toLocaleString()}</div>
          </div>
        </div>
      </Card>

      <div className="section-title">
        <h3>Thử thách lên cấp</h3>
      </div>
      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Đang tải...</p>
      ) : (
        <div className="grid-4" style={{ marginBottom: 28 }}>
          {challenges.map(c => {
            const done = completed[c.id];
            const locked = c.level_min > level;
            return (
              <Card
                key={c.id}
                style={{
                  opacity: done || locked ? 0.5 : 1,
                  cursor: !c.quiz_slug && !done && !locked ? 'pointer' : 'default',
                  display: 'flex', flexDirection: 'column', gap: 8,
                  padding: 20
                }}
                onClick={!c.quiz_slug && !done && !locked ? () => handleNonQuizChallenge(c) : undefined}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Icon.Brain size={20} color={done ? 'var(--green)' : 'var(--muted)'} />
                  {done && <Icon.Check size={18} color="var(--green)" />}
                  {locked && <Icon.X size={18} color="var(--muted)" />}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.xp_reward} XP</div>
                {locked && (
                  <div style={{ fontSize: 11, color: 'var(--orange)' }}>
                    Cần Level {c.level_min}
                  </div>
                )}
                {c.quiz_slug && !locked && !done && (
                  <Button size="small" onClick={() => navigate(`/level/quiz/${c.quiz_slug}`)}>Vào thi</Button>
                )}
              </Card>
            );
          })}
        </div>
      )}


    </div>
  );
}
