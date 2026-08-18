import { useState, useEffect } from 'react';
import usePersistedState from '../../lib/usePersistedState';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api } from '../../lib/api';

import { getQuestState, dispatchAction } from '../../lib/quest-engine';
import { getXp } from '../../lib/xp';
import { getStreak } from '../../lib/streak';
import { getActivities } from '../../lib/activity';
import { levelFromXp, levelBounds } from '../../lib/level';
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

function shuffleQuote(exclude) {
  const pool = QUOTES.filter(q => q !== exclude);
  const i = Math.floor(Math.random() * pool.length);
  return pool[i];
}

const STAT_META = [
  { key: 'courses', label: 'Khóa học', icon: Icon.Courses, accent: 'accent-red' },
  { key: 'vocab', label: 'Từ đã lưu', icon: Icon.Book, accent: 'accent-gold' },
  { key: 'quiz', label: 'Quiz đã làm', icon: Icon.Quiz, accent: 'accent-blue' },
];

const CORE_FEATURES = [
  { to: '/courses', title: 'Khóa học của tôi', desc: 'Tiếp tục hành trình học tập', icon: Icon.Courses, cls: 'core-red' },
  { to: '/wordbook', title: 'Sổ từ của tôi', desc: 'Ôn luyện từ vựng hằng ngày', icon: Icon.Vocab, cls: 'core-gold' },
  { to: '/level', title: 'Thử thách lên cấp', desc: 'Chinh phục cấp độ mới', icon: Icon.Target, cls: 'core-blue' },
];

function AnimatedNumber({ value, duration = 700 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{display}</>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const streak = useState(getStreak())[0];
  const [quote, setQuote] = useState(() => shuffleQuote());

  const [tab, setTab] = usePersistedState('vmg_dash_tab', 'daily');
  const [questState, setQuestState] = useState(getQuestState());
  const [xp, setXp] = useState(getXp());
  const [activities, setActivities] = useState(getActivities(5));
  const [tips, setTips] = useState([]);
  const [vocab, setVocab] = useState([]);
  const [courses, setCourses] = useState([]);
  const [myVocabCount, setMyVocabCount] = useState(0);
  const [myQuizCount, setMyQuizCount] = useState(0);

  useEffect(() => {
    dispatchAction('dashboard_view');
    Promise.all([
      api.tips.list(),
      api.vocabulary.list(),
      api.courses.list(),
      api.vocabulary.mineCount(),
      api.quiz.attemptsCount(),
    ]).then(([t, v, c, vocabCount, quizCount]) => {
      setTips(t || []);
      setVocab(v || []);
      setCourses(c || []);
      setMyVocabCount(vocabCount);
      setMyQuizCount(quizCount);
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
  const inProgress = courses.filter(c => {
    try {
      const e = localStorage.getItem('vmg_enroll_' + c.slug);
      return e ? JSON.parse(e).enrolled : false;
    } catch { return false; }
  });

  const todaysWord = vocab[new Date().getDate() % Math.max(vocab.length, 1)] || {};

  const STATS = {
    courses: enrolledCount,
    vocab: myVocabCount,
    quiz: myQuizCount,
  };

  return (
    <div className="page-enter">
      <div className="dash-hero">
        <div className="dash-hero-blob blob-a" />
        <div className="dash-hero-blob blob-b" />
        <div className="dash-hero-content">
          <div className="dash-hero-avatar">
            {user?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'VM'}
          </div>
          <div className="dash-hero-text">
            <h1 className="dash-greeting">Xin chào, {user?.full_name?.split(' ')[0] || 'Teacher'}</h1>
            <p className="dash-sub">Chào mừng bạn đến với VMG EduNext. Hôm nay bạn muốn học gì?</p>
          </div>
          <div className="dash-hero-meta">
            {streak > 0 && (
              <div className="streak-badge">
                <Icon.Flame size={16} />
                {streak} ngày
              </div>
            )}
            <div className="dash-level-ring" onClick={() => navigate('/level')} title={`Thử thách lên cấp — còn ${Math.max(0, levelBounds(xp).required - levelBounds(xp).current)} XP nữa`}>
              <svg width="44" height="44" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="17" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="4" />
                <circle
                  cx="22" cy="22" r="17" fill="none" stroke="url(#lvlGrad)" strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={`${(Math.min(100, Math.max(0, (levelBounds(xp).current / levelBounds(xp).required) * 100)) / 100) * (2 * Math.PI * 17)} ${2 * Math.PI * 17}`}
                  transform="rotate(-90 22 22)"
                  style={{ transition: 'stroke-dasharray .6s ease' }}
                />
                <defs>
                  <linearGradient id="lvlGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#d4a84b" />
                    <stop offset="100%" stopColor="#b99447" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="dash-level-ring-text">Lv {levelFromXp(xp)}</span>
            </div>
            <div className="dash-xp-badge" onClick={() => navigate('/level')} title="Thử thách lên cấp" style={{ cursor: 'pointer' }}>
              <Icon.Sparkles size={15} />
              {xp} XP
            </div>
          </div>
        </div>
        <div className="hero-wave">
          <svg viewBox="0 0 1440 500" preserveAspectRatio="none">
            <path className="wave-1" fill="rgba(255,255,255,.13)" d="M0,192L48,176C96,160,192,128,288,106.7C384,85,480,133,576,154.7C672,176,768,171,864,138.7C960,107,1056,48,1152,53.3C1248,59,1344,128,1392,165.3L1440,202.7L1440,500L1392,500C1344,500,1248,500,1152,500C1056,500,960,500,864,500C768,500,672,500,576,500C480,500,384,500,288,500C192,500,96,500,48,500L0,500Z"/>
            <path className="wave-2" fill="rgba(255,255,255,.09)" d="M0,256L48,240C96,224,192,192,288,176C384,160,480,192,576,213.3C672,235,768,229,864,202.7C960,176,1056,117,1152,106.7C1248,96,1344,149,1392,176L1440,202.7L1440,500L1392,500C1344,500,1248,500,1152,500C1056,500,960,500,864,500C768,500,672,500,576,500C480,500,384,500,288,500C192,500,96,500,48,500L0,500Z"/>
            <path className="wave-3" fill="rgba(255,255,255,.06)" d="M0,300L48,288C96,276,192,252,288,240C384,228,480,252,576,264C672,276,768,252,864,228C960,204,1056,180,1152,186.7C1248,192,1344,228,1392,240L1440,252L1440,500L1392,500C1344,500,1248,500,1152,500C1056,500,960,500,864,500C768,500,672,500,576,500C480,500,384,500,288,500C192,500,96,500,48,500L0,500Z"/>
          </svg>
        </div>
      </div>

      <Card className="dash-courses-hero" style={{ border: 'none', borderLeft: '4px solid var(--red)' }}>
        <div className="dash-courses-hero-head">
          <h3><Icon.Courses size={17} /> Khóa học đang học</h3>
          {inProgress.length > 0 && (
            <button className="dash-courses-hero-all" onClick={() => navigate('/courses')}>
              Xem tất cả <Icon.ArrowRight size={12} />
            </button>
          )}
        </div>
        {inProgress.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon"><Icon.Courses size={26} /></div>
            <p className="dash-empty-text">Bạn chưa đăng ký khóa học nào.</p>
            <Button variant="primary" size="sm" onClick={() => navigate('/courses')} label="Khám phá khóa học" />
          </div>
        ) : (
          <div className="dash-courses-hero-list">
            {inProgress.slice(0, 2).map((course, idx) => {
              const enroll = (() => {
                try {
                  const e = localStorage.getItem('vmg_enroll_' + course.slug);
                  return e ? JSON.parse(e) : null;
                } catch { return null; }
              })();
              const coverColor = course.category === 'classroom_english' ? 'var(--red)' : course.category === 'clil_stem' ? 'var(--blue)' : course.category === 'assessment' ? 'var(--gold)' : course.category === 'vocabulary' ? 'var(--blue)' : 'var(--red)';
              const pct = Math.max(0, Math.min(100, enroll.progress_pct || 0));
              const doneLessons = Math.round((pct / 100) * (course.lesson_count || 0));
              return (
                <div key={course.id} className="course-hero-row" onClick={() => navigate(`/courses/${course.slug}`)}>
                  <div className="course-hero-cover" style={{ background: coverColor }}>
                    <span className="course-hero-level">{course.level}</span>
                  </div>
                  <div className="course-hero-body">
                    <div className="course-hero-title">{course.title}</div>
                    <div className="course-hero-meta">Đã hoàn thành {doneLessons}/{course.lesson_count} bài học</div>
                    <div className="course-hero-progress">
                      <div className="course-hero-bar">
                        <div
                          className={`course-hero-fill ${pct === 100 ? 'done' : ''}`}
                          style={{ width: `${pct}%`, background: coverColor, color: coverColor, animationDelay: `${idx * 180}ms` }}
                        />
                      </div>
                      <span className="course-hero-pct" style={{ color: pct === 100 ? 'var(--green)' : coverColor }}>{pct}%</span>
                    </div>
                  </div>
                  <button className="course-hero-btn">
                    {pct === 100 ? 'Ôn lại' : 'Tiếp tục'} <Icon.ArrowRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="core-grid">
        {CORE_FEATURES.map((c, i) => {
          const IconCmp = c.icon;
          return (
            <div key={c.to} className={`core-card ${c.cls}`} style={{ animationDelay: `${i * 80}ms` }} onClick={() => navigate(c.to)}>
              <div className="core-icon"><IconCmp size={24} /></div>
              <div className="core-body">
                <b>{c.title}</b>
                <span>{c.desc}</span>
              </div>
              <Icon.ArrowRight size={18} className="core-arrow" />
            </div>
          );
        })}
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        {STAT_META.map((s, i) => {
          const IconCmp = s.icon;
          return (
            <Card key={s.key} className={`stat-card-new ${s.accent}`} style={{ animationDelay: `${i * 70}ms` }}>
              <div className="stat-header">
                <div className="stat-icon-box"><IconCmp size={20} /></div>
                <span className="stat-value"><AnimatedNumber value={STATS[s.key]} /></span>
              </div>
              <span className="stat-label">{s.label}</span>
            </Card>
          );
        })}
      </div>

      <div className="dash-main-grid">
        <div>
          {activities.length > 0 && (
            <Card style={{ padding: 20, marginBottom: 20 }}>
              <h3 className="section-sub-title" style={{ marginBottom: 14, fontSize: 14 }}>
                <Icon.Clock size={15} /> Hoạt động gần đây
              </h3>
              <div className="activity-list">
                {activities.map(a => {
                  const icons = { lesson: Icon.Book, quiz: Icon.Quiz, quest: Icon.Target };
                  const colors = { lesson: 'var(--blue)', quiz: 'var(--gold)', quest: 'var(--gold)' };
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

          <div className="dash-wotd-row" style={{ marginTop: 16 }} onClick={() => navigate('/vocabulary')}>
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

          <div className="dash-quote" style={{ marginTop: 16 }}>
            <span className="dash-quote-mark">“</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="dash-quote-text">{quote.text}</div>
              <div className="dash-quote-author">— {quote.author}</div>
            </div>
            <button onClick={() => setQuote(shuffleQuote(quote))} className="dash-quote-btn">
              <Icon.Sparkles size={13} /> Câu khác
            </button>
          </div>

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
