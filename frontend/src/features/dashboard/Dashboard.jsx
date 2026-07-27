import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { MOCK_COURSES, MOCK_ENROLLMENTS, MOCK_TIPS, MOCK_VOCABULARY, MOCK_QUIZZES } from '../../mock/data';
import { getDailyQuests, getWeeklyQuests, getDateKey, getWeekKey } from '../../mock/quests';
import { getXp, addXp } from '../../lib/xp';
import { getStreak } from '../../lib/streak';
import { getActivities, logActivity } from '../../lib/activity';
import { Icon } from '../../lib/icons';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';

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
  const [dailyQuests] = useState(getDailyQuests);
  const [weeklyQuests] = useState(getWeeklyQuests);
  const [done, setDone] = useState(() => {
    try {
      const stored = localStorage.getItem('vmg_quests');
      if (!stored) return {};
      const p = JSON.parse(stored);
      if (p.date !== getDateKey() || p.week !== getWeekKey()) return {};
      return p.done || {};
    } catch { return {}; }
  });
  const [xp, setXp] = useState(getXp());
  const [animXp, setAnimXp] = useState(null);
  const [activities, setActivities] = useState(getActivities(5));
  const showToast = useToast();

  const activeQuests = tab === 'daily' ? dailyQuests : weeklyQuests;
  const doneCount = activeQuests.filter(q => done[q.id]).length;
  const pct = Math.round((doneCount / activeQuests.length) * 100);

  const enrolledCount = Object.values(MOCK_ENROLLMENTS).filter(e => e.enrolled).length;
  const vocabCount = MOCK_VOCABULARY.length;
  const quizCount = MOCK_QUIZZES.length;
  const tipsCount = MOCK_TIPS.length;
  const inProgress = MOCK_COURSES.filter(c => MOCK_ENROLLMENTS[c.id]?.enrolled);

  const todaysWord = MOCK_VOCABULARY[new Date().getDate() % MOCK_VOCABULARY.length];

  const STATS = {
    courses: enrolledCount,
    vocab: vocabCount,
    quiz: quizCount,
    tips: tipsCount,
  };

  function handleToggle(q) {
    if (done[q.id]) return;
    const next = { ...done, [q.id]: true };
    setDone(next);
    setXp(addXp(q.xp));
    logActivity('quest', 'Hoàn thành: ' + q.title, '+' + q.xp + 'XP');
    setActivities(getActivities(5));
    showToast('+' + q.xp + ' XP', 'success');
    localStorage.setItem('vmg_quests', JSON.stringify({
      date: getDateKey(), week: getWeekKey(), done: next,
    }));
    setAnimXp({ xp: q.xp });
    setTimeout(() => setAnimXp(null), 1500);
  }

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
              <div className="dash-wotd-detail">{todaysWord.level} · {todaysWord.part_of_speech.replace('_', ' ')}</div>
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
                const enroll = MOCK_ENROLLMENTS[course.id];
                const coverColor = course.cover === 'red' ? 'var(--red)' : course.cover === 'blue' ? 'var(--blue)' : course.cover === 'gold' ? 'var(--gold)' : 'var(--green)';
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
                <div className={`quest-item ${done[q.id] ? 'done' : ''}`}>
                  <input type="checkbox" className="quest-checkbox" checked={!!done[q.id]} onChange={() => handleToggle(q)} />
                  <span className={`quest-title ${done[q.id] ? 'done' : ''}`}>{q.title}</span>
                  <span className={`quest-xp ${done[q.id] ? 'done' : ''}`}>+{q.xp}XP</span>
                </div>
                <div className="quest-desc">{q.desc}</div>
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

            {animXp && (
              <div className="quest-anim" style={{ left: '50%', top: '50%' }}>
                +{animXp.xp}XP
              </div>
            )}
          </Card>

          <Card style={{ padding: 20 }}>
            <h3 className="section-sub-title" style={{ marginBottom: 12, fontSize: 14 }}>
              <Icon.Lightbulb size={15} /> Tips
            </h3>
            {MOCK_TIPS.slice(0, 4).map((tip, i) => (
              <div key={i} className="tip-row" style={{ borderBottom: i < 3 ? '1px solid var(--line)' : 'none', padding: '10px 0' }}>
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
