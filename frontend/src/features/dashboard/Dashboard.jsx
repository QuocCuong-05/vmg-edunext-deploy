import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api } from '../../lib/api';

import { getQuestState, dispatchAction } from '../../lib/quest-engine';
import { getXp } from '../../lib/xp';
import { getStreak } from '../../lib/streak';
import { getActivities } from '../../lib/activity';
import { Icon } from '../../lib/icons';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
const QUOTES = [
  { text: 'Giáo dục không phải là đổ đầy một chiếc bình, mà là thắp lên một ngọn lửa.', author: 'William Butler Yeats' },
  { text: 'Dạy học là nghệ thuật giúp người khác khám phá tiềm năng của chính họ.', author: 'Thông điệp giáo dục' },
  { text: 'Một giáo viên tốt không chỉ truyền đạt kiến thức, mà còn truyền cảm hứng.', author: 'Thông điệp giáo dục' },
  { text: 'Học để làm được, không chỉ để hoàn thành.', author: 'Thông điệp giáo dục' },
  { text: 'Công nghệ không thay thế giáo viên — công nghệ giúp giáo viên tập trung vào điều quan trọng nhất.', author: 'Thông điệp giáo dục' },
];

function shuffleQuote() {
  const i = Math.floor(Math.random() * QUOTES.length);
  return QUOTES[i];
}

const STAT_META = [
  { key: 'courses', label: 'Khóa học', icon: Icon.Courses, accent: 'accent-red' },
  { key: 'vocab', label: 'Từ vựng', icon: Icon.Book, accent: 'accent-blue' },
  { key: 'quiz', label: 'Bài tập', icon: Icon.Quiz, accent: 'accent-gold' },
  { key: 'tips', label: 'Tips', icon: Icon.Lightbulb, accent: 'accent-green' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const streak = useState(getStreak())[0];
  const [quote] = useState(shuffleQuote);

  const [tab, setTab] = useState('daily');
  const [questState, setQuestState] = useState(getQuestState());
  const [xp, setXp] = useState(getXp());
  const [activities, setActivities] = useState(getActivities(5));
  const [tips, setTips] = useState([]);
  const [vocab, setVocab] = useState([]);
  const [courses, setCourses] = useState([]);
  const [quizSets, setQuizSets] = useState([]);

  useEffect(() => {
    dispatchAction('dashboard_view');
    Promise.all([
      api.tips.list(),
      api.vocabulary.list(),
      api.courses.list(),
      api.quiz.list(),
    ]).then(([t, v, c, q]) => {
      setTips(t || []);
      setVocab(v || []);
      setCourses(c || []);
      setQuizSets(q || []);
    }).catch(() => {});
    const handler = () => {
      setQuestState(getQuestState());
      setXp(getXp());
    };
    window.addEventListener('quest-update', handler);
    return () => window.removeEventListener('quest-update', handler);
  }, []);

  const activeQuests = tab === 'daily' ? questState.daily : questState.weekly;
  const doneCount = activeQuests.filter(q => q.done).length;
  const pct = Math.round((doneCount / activeQuests.length) * 100);

  const enrolledCount = courses.filter(c => {
    try {
      const e = localStorage.getItem('vmg_enroll_' + c.slug);
      return e ? JSON.parse(e).enrolled : false;
    } catch { return false; }
  }).length;
  const vocabCount = vocab.length;
  const quizCount = quizSets.length;
  const tipsCount = tips.length;
  const inProgress = courses.filter(c => {
    try {
      const e = localStorage.getItem('vmg_enroll_' + c.slug);
      return e ? JSON.parse(e).enrolled : false;
    } catch { return false; }
  });

  const todaysWord = vocab[new Date().getDate() % Math.max(vocab.length, 1)] || {};

  const STATS = {
    courses: enrolledCount,
    vocab: vocabCount,
    quiz: quizCount,
    tips: tipsCount,
  };

  return (
    <div className="page-enter">
      <div className="dash-top">
        <div className="dash-greeting-wrap">
          <h1 className="dash-greeting">Xin chào, {user?.full_name?.split(' ')[0] || 'Teacher'}</h1>
          <p className="dash-sub">Chào mừng bạn đến với VMG EduNext. Hôm nay bạn muốn học gì?</p>
        </div>
        <div className="dash-header-right">
          {streak > 0 && (
            <div className="streak-badge">
              <Icon.Flame size={18} />
              {streak} ngày
            </div>
          )}
          <div className="dash-xp-badge">
            <Icon.Stats size={15} />
            {xp} XP
          </div>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        {STAT_META.map(s => {
          const IconCmp = s.icon;
          return (
            <Card key={s.key} className={`stat-card ${s.accent}`}>
              <div className="accent-bar" />
              <div className="stat-header">
                <div className="stat-icon-box"><IconCmp size={20} /></div>
                <span className="stat-value">{STATS[s.key]}</span>
              </div>
              <span className="stat-label">{s.label}</span>
            </Card>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 24, padding: '18px 22px', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', boxShadow: '0 2px 8px rgba(25,37,60,.04)' }}>
        <span style={{ fontSize: 32, lineHeight: 1, color: 'var(--red)', fontFamily: 'Georgia, serif', flexShrink: 0 }}>“</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontStyle: 'italic', lineHeight: 1.6, color: 'var(--ink)', marginBottom: 4 }}>{quote.text}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>— {quote.author}</div>
        </div>
        <button onClick={() => window.location.reload()} style={{ flexShrink: 0, border: '1px solid var(--line)', background: 'var(--card)', borderRadius: 8, padding: '7px 14px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Câu khác
        </button>
      </div>

      <div className="dash-main-grid">
        <div>
          <div className="dash-wotd-row" onClick={() => navigate('/vocabulary')}>
            <div className="dash-wotd-icon">
              <Icon.Book size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="dash-wotd-word">{todaysWord.word}</div>
              <div className="dash-wotd-detail">{todaysWord.level} · {(todaysWord.part_of_speech || '').replace('_', ' ')}</div>
              <div className="dash-wotd-meaning">{todaysWord.meaning_vi}</div>
            </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div className="dash-wotd-example">"{todaysWord.example_en}"</div>
              <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600, marginTop: 4, whiteSpace: 'nowrap' }}>Xem thêm →</div>
            </div>
          </div>

          <Card style={{ padding: 20, marginBottom: 20 }}>
            <h3 className="section-sub-title" style={{ marginBottom: 14, fontSize: 14 }}>
              <Icon.Courses size={16} /> Khóa học đang học
            </h3>
            {inProgress.length === 0 ? (
              <div style={{ padding: '12px 0', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>Bạn chưa đăng ký khóa học nào.</p>
                <Button variant="primary" size="sm" onClick={() => navigate('/courses')} label="Khám phá khóa học" />
              </div>
            ) : (
              inProgress.slice(0, 3).map(course => {
                const enroll = (() => {
                  try {
                    const e = localStorage.getItem('vmg_enroll_' + course.slug);
                    return e ? JSON.parse(e) : null;
                  } catch { return null; }
                })();
                const coverColor = course.category === 'classroom_english' ? 'var(--red)' : course.category === 'clil_stem' ? 'var(--blue)' : course.category === 'assessment' ? 'var(--gold)' : course.category === 'vocabulary' ? 'var(--green)' : 'var(--purple)';
                return (
                  <div key={course.id} className="course-row" onClick={() => navigate(`/courses/${course.slug}`)}>
                    <div className="course-row-info">
                      <div className="course-row-level" style={{ background: coverColor }}>{course.level}</div>
                      <div>
                        <div className="course-row-title">{course.title}</div>
                        <div className="course-row-meta">{enroll.progress_pct}% hoàn thành · {course.lesson_count} bài học</div>
                      </div>
                    </div>
                    <div className="progress-bar" style={{ height: 6, flex: 1, minWidth: 80 }}>
                      <div className="progress-fill" style={{ width: `${enroll.progress_pct}%`, background: coverColor }} />
                    </div>
                  </div>
                );
              })
            )}
            {inProgress.length > 0 && (
              <Button variant="ghost" size="sm" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} onClick={() => navigate('/courses')}>
                Xem tất cả khóa học <Icon.ArrowRight size={12} />
              </Button>
            )}
          </Card>

          {activities.length > 0 && (
            <Card style={{ padding: 20, marginBottom: 20 }}>
              <h3 className="section-sub-title" style={{ marginBottom: 14, fontSize: 14 }}>
                <Icon.Clock size={15} /> Hoạt động gần đây
              </h3>
              <div className="activity-list">
                {activities.map(a => {
                  const icons = { lesson: Icon.Book, quiz: Icon.Quiz, quest: Icon.Target };
                  const colors = { lesson: 'var(--blue)', quiz: 'var(--gold)', quest: 'var(--green)' };
                  const IconCmp = icons[a.type] || Icon.Clock;
                  const color = colors[a.type] || 'var(--muted)';
                  const ts = new Date(a.time);
                  const now = Date.now();
                  const diff = now - ts.getTime();
                  let rel;
                  if (diff < 60000) rel = 'Vừa xong';
                  else if (diff < 3600000) rel = Math.floor(diff / 60000) + ' phút trước';
                  else if (diff < 86400000) rel = Math.floor(diff / 3600000) + ' giờ trước';
                  else rel = Math.floor(diff / 86400000) + ' ngày trước';
                  return (
                    <div key={a.id} className="activity-item">
                      <div className="activity-icon" style={{ background: color + '18', color }}>
                        <IconCmp size={14} />
                      </div>
                      <div className="activity-body">
                        <div className="activity-title">{a.title}</div>
                        {a.detail && <div className="activity-detail">{a.detail}</div>}
                      </div>
                      <div className="activity-time">{rel}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

        </div>

        <div>
          <Card style={{ padding: 20, marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
            <h3 className="section-sub-title" style={{ marginBottom: 10, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span><Icon.Target size={15} /> Nhiệm vụ</span>
              <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{xp} XP</span>
            </h3>

            <div className="quest-tabs" style={{ marginBottom: 12 }}>
              <button className={`quest-tab ${tab === 'daily' ? 'active' : ''}`} onClick={() => setTab('daily')}>Hôm nay</button>
              <button className={`quest-tab ${tab === 'weekly' ? 'active' : ''}`} onClick={() => setTab('weekly')}>Tuần này</button>
            </div>

            {activeQuests.map(q => (
              <div key={q.id}>
                <div className={`quest-item ${q.done ? 'done' : ''}`}>
                  <span className="quest-check-icon">{q.done ? <Icon.CheckCircle size={18} /> : <Icon.Circle size={18} />}</span>
                  <span className={`quest-title ${q.done ? 'done' : ''}`}>{q.title}</span>
                  <span className="quest-progress">{q.done ? '' : `${q.progress}/${q.max}`}</span>
                  <span className={`quest-xp ${q.done ? 'done' : ''}`}>+{q.xp}XP</span>
                </div>
                <div className="quest-desc">{q.desc}</div>
                {!q.done && q.max > 1 && (
                  <div className="progress-bar" style={{ height: 4, margin: '4px 0 8px 26px' }}>
                    <div className="progress-fill" style={{ width: `${Math.round((q.progress / q.max) * 100)}%`, background: 'var(--green)' }} />
                  </div>
                )}
              </div>
            ))}

            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>
                <span>Tiến độ</span><span>{doneCount}/{activeQuests.length}</span>
              </div>
              <div className="progress-bar" style={{ height: 6 }}>
                <div className="progress-fill" style={{ width: `${pct}%`, background: pct === 100 ? 'var(--green)' : 'var(--red)' }} />
              </div>
            </div>

          </Card>

          <Card style={{ padding: 20 }}>
            <h3 className="section-sub-title" style={{ marginBottom: 12, fontSize: 14 }}>
              <Icon.Lightbulb size={15} /> Tips
            </h3>
            {tips.slice(0, 4).map((tip, i) => (
              <div key={tip.id || i} className="tip-row" style={{ borderBottom: i < 3 ? '1px solid var(--line)' : 'none', padding: '10px 0' }}>
                <div className="tip-category">{tip.category}</div>
                <div className="tip-title">{tip.title}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
