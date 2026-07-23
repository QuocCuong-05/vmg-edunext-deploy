import { useState } from 'react';
import { MOCK_USER, MOCK_QUIZ_QUESTIONS } from '../../mock/data';
import { Icon } from '../../lib/icons';
import Card from '../../components/ui/Card';

const XP_PER_LEVEL = 3000;

const CHALLENGES = [
  { id: 'c1', title: 'Classroom English Basics', xp: 150, completed: true },
  { id: 'c2', title: 'CLIL Lesson Design', xp: 200, completed: true },
  { id: 'c3', title: 'Assessment Strategies', xp: 250, completed: false, locked: false },
  { id: 'c4', title: 'Learning Science', xp: 300, completed: false, locked: true },
];

const level = Math.floor(MOCK_USER.xp / XP_PER_LEVEL) + 1;
const currentLevelXp = MOCK_USER.xp % XP_PER_LEVEL;
const xpProgress = (currentLevelXp / XP_PER_LEVEL) * 100;

export default function LevelPage() {
  const [selected, setSelected] = useState(null);

  const sampleQuestions = MOCK_QUIZ_QUESTIONS.slice(0, 3);

  return (
    <div className="page-enter">
      <div className="page-title">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon.Target size={24} /> Level & Progress
        </h1>
        <p>Track your development journey</p>
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
              {MOCK_USER.full_name} | {currentLevelXp} / {XP_PER_LEVEL} XP to next level
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
            <div className="stat-value" style={{ fontSize: 24 }}>{MOCK_USER.xp.toLocaleString()}</div>
          </div>
        </div>
      </Card>

      <div className="section-title">
        <h3>Challenges</h3>
      </div>
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {CHALLENGES.map(c => (
          <Card key={c.id} style={{
            opacity: c.locked ? 0.5 : 1,
            cursor: c.locked ? 'default' : 'pointer',
            display: 'flex', flexDirection: 'column', gap: 8,
            padding: 20
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Icon.Brain size={20} color={c.completed ? 'var(--green)' : 'var(--muted)'} />
              {c.completed && <Icon.Check size={18} color="var(--green)" />}
              {c.locked && <Icon.X size={18} color="var(--muted)" />}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{c.title}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.xp} XP</div>
          </Card>
        ))}
      </div>

      <div className="section-title">
        <h3>Level Quiz</h3>
        <p>Sample questions to test your knowledge</p>
      </div>
      {sampleQuestions.map((q, qi) => (
        <Card key={q.id} style={{ marginBottom: 16, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
            {qi + 1}. {q.prompt}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, fontStyle: 'italic' }}>
            {q.prompt_translation}
          </div>
          {q.options.map((opt, oi) => {
            const isSelected = selected === `${q.id}-${oi}`;
            const showResult = selected && selected.startsWith(q.id);
            let cls = 'quiz-option';
            if (isSelected && showResult) {
              cls += opt.is_correct ? ' correct' : ' incorrect';
            } else if (showResult && opt.is_correct) {
              cls += ' correct';
            } else if (isSelected) {
              cls += ' selected';
            }
            return (
              <div
                key={oi}
                className={cls}
                onClick={() => !selected?.startsWith(q.id) && setSelected(`${q.id}-${oi}`)}
              >
                {opt.option_text}
                {isSelected && showResult && (
                  <div className="feedback">
                    {opt.is_correct ? opt.feedback_correct : opt.feedback_incorrect}
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      ))}
    </div>
  );
}
