import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { MOCK_COURSES, MOCK_ENROLLMENTS, MOCK_TIPS, MOCK_VOCABULARY, MOCK_QUIZZES, MOCK_USER } from '../../mock/data';
import { getDailyQuests, getWeeklyQuests, getDateKey, getWeekKey } from '../../mock/quests';
import { getXp, addXp } from '../../lib/xp';
import { Icon } from '../../lib/icons';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const PATHS = [
  { title: 'Giao tiếp lớp học', desc: '104 câu lệnh song ngữ, phản xạ giảng dạy tự tin', icon: Icon.Classroom, color: 'var(--red)', to: '/classroom' },
  { title: 'Phương pháp & CLIL', desc: 'Thiết kế bài học, đánh giá, scaffolding', icon: Icon.Brain, color: 'var(--blue)', to: '/courses' },
  { title: 'Từ vựng & Ngôn ngữ', desc: '82 từ giáo dục, collocations, ngữ cảnh thực tế', icon: Icon.Book, color: 'var(--gold)', to: '/vocabulary' },
];

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

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const activeQuests = tab === 'daily' ? dailyQuests : weeklyQuests;
  const doneCount = activeQuests.filter(q => done[q.id]).length;
  const pct = Math.round((doneCount / activeQuests.length) * 100);

  const enrolledCount = Object.values(MOCK_ENROLLMENTS).filter(e => e.enrolled).length;
  const vocabCount = MOCK_VOCABULARY.length;
  const quizCount = MOCK_QUIZZES.length;
  const tipsCount = MOCK_TIPS.length;
  const inProgress = MOCK_COURSES.filter(c => MOCK_ENROLLMENTS[c.id]?.enrolled);

  const todaysWord = MOCK_VOCABULARY[new Date().getDate() % MOCK_VOCABULARY.length];

  function handleToggle(q) {
    if (done[q.id]) return;
    const next = { ...done, [q.id]: true };
    setDone(next);
    setXp(addXp(q.xp));
    localStorage.setItem('vmg_quests', JSON.stringify({
      date: getDateKey(), week: getWeekKey(), done: next,
    }));
    setAnimXp({ xp: q.xp });
    setTimeout(() => setAnimXp(null), 1500);
  }

  return (
    <div className="page-enter">
      <div className="dash-top">
        <h1 className="dash-greeting">Xin chào, {user?.full_name?.split(' ')[0] || 'Teacher'}</h1>
        <p className="dash-sub">Chào mừng bạn đến với VMG EduNext. Hôm nay bạn muốn học gì?</p>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <Card className="stat-card accent-red">
          <div className="accent-bar" />
          <div className="stat-header">
            <div className="stat-icon-box"><Icon.Courses size={20} /></div>
            <span className="stat-value">{enrolledCount}</span>
          </div>
          <span className="stat-label">Khóa học</span>
        </Card>
        <Card className="stat-card accent-blue">
          <div className="accent-bar" />
          <div className="stat-header">
            <div className="stat-icon-box"><Icon.Book size={20} /></div>
            <span className="stat-value">{vocabCount}</span>
          </div>
          <span className="stat-label">Từ vựng</span>
        </Card>
        <Card className="stat-card accent-gold">
          <div className="accent-bar" />
          <div className="stat-header">
            <div className="stat-icon-box"><Icon.Quiz size={20} /></div>
            <span className="stat-value">{quizCount}</span>
          </div>
          <span className="stat-label">Bài tập</span>
        </Card>
        <Card className="stat-card accent-green">
          <div className="accent-bar" />
          <div className="stat-header">
            <div className="stat-icon-box"><Icon.Lightbulb size={20} /></div>
            <span className="stat-value">{tipsCount}</span>
          </div>
          <span className="stat-label">Tips</span>
        </Card>
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

      <div className="section-title">
        <h3>Lộ trình học tập</h3>
        <p>Khám phá các hướng phát triển năng lực giảng dạy</p>
      </div>
      <div className="path-grid" style={{ marginBottom: 32 }}>
        {PATHS.map((p, i) => (
          <Card key={i} className="path-card" style={{ borderTop: `3px solid ${p.color}` }} onClick={() => navigate(p.to)}>
            <div className="path-icon" style={{ background: `${p.color}18`, color: p.color }}><p.icon size={22} /></div>
            <h4 className="path-title">{p.title}</h4>
            <p className="path-desc">{p.desc}</p>
            <span className="path-arrow" style={{ color: p.color, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              Khám phá <Icon.ArrowRight size={14} />
            </span>
          </Card>
        ))}
      </div>

      <div className="dash-body">
        <div>
          <Card style={{ padding: 24 }}>
            <h3 className="section-sub-title"><Icon.Courses size={18} /> Khóa học đang học</h3>
            {inProgress.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>Bạn chưa đăng ký khóa học nào.</p>
                <Button variant="primary" size="sm" onClick={() => navigate('/courses')} label="Khám phá khóa học" />
              </div>
            ) : (
              inProgress.slice(0, 3).map(course => {
                const enroll = MOCK_ENROLLMENTS[course.id];
                return (
                  <div key={course.id} className="course-row" onClick={() => navigate(`/courses/${course.slug}`)}>
                    <div className="course-row-info">
                      <div className="course-row-level" style={{ background: course.cover === 'red' ? 'var(--red)' : course.cover === 'blue' ? 'var(--blue)' : course.cover === 'gold' ? 'var(--gold)' : 'var(--green)' }}>{course.level}</div>
                      <div>
                        <div className="course-row-title">{course.title}</div>
                        <div className="course-row-meta">{enroll.progress_pct}% hoàn thành · {course.lesson_count} bài học</div>
                      </div>
                    </div>
                    <div className="progress-bar" style={{ height: 6, flex: 1, minWidth: 80 }}>
                      <div className="progress-fill" style={{ width: `${enroll.progress_pct}%` }} />
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
        </div>

        <div>
          <Card style={{ padding: 22, marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
            <h3 className="section-sub-title" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span><Icon.Target size={16} /> Nhiệm vụ</span>
              <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{xp} XP</span>
            </h3>

            <div className="quest-tabs">
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

          <Card style={{ padding: 24, marginBottom: 20 }}>
            <h3 className="section-sub-title"><Icon.Book size={18} /> Word of the Day</h3>
            <div className="wotd-word">{todaysWord.word}</div>
            <div className="wotd-level">{todaysWord.level} · {todaysWord.part_of_speech.replace('_', ' ')}</div>
            <div className="wotd-meaning">{todaysWord.meaning_vi}</div>
            <div className="wotd-example">"{todaysWord.example_en}"</div>
            <Button variant="ghost" size="sm" style={{ marginTop: 8 }} onClick={() => navigate('/vocabulary')}>
              Xem thêm từ vựng <Icon.ArrowRight size={12} />
            </Button>
          </Card>

          <Card style={{ padding: 24 }}>
            <h3 className="section-sub-title"><Icon.Lightbulb size={18} /> Tips hôm nay</h3>
            {MOCK_TIPS.slice(0, 3).map((tip, i) => (
              <div key={i} className="tip-row" style={{ borderBottom: i < 2 ? '1px solid var(--line)' : 'none' }}>
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
