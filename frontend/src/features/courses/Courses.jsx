import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Icon } from '../../lib/icons';
import Card from '../../components/ui/Card';

const LEVELS = ['All', 'A2', 'B1', 'B2', 'C1'];
const CATEGORIES = ['All', 'classroom_english', 'clil_stem', 'assessment', 'vocabulary', 'learning_science'];

const COVER_MAP = {
  classroom_english: { color: 'red', icon: Icon.Courses },
  clil_stem: { color: 'blue', icon: Icon.Brain },
  assessment: { color: 'gold', icon: Icon.Pen },
  vocabulary: { color: 'green', icon: Icon.BookOpen },
  learning_science: { color: 'purple', icon: Icon.Microscope },
};

export default function Courses() {
  const [level, setLevel] = useState('All');
  const [category, setCategory] = useState('All');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.courses.list().then(data => {
      setCourses(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c => {
    if (level !== 'All' && c.level !== level) return false;
    if (category !== 'All' && c.category !== category) return false;
    return true;
  });

  return (
    <div className="page-enter">
      <div className="page-title">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Icon.Courses size={24} /> Khóa học</h1>
        <p>Khám phá {courses.length} khóa học chuyên sâu cho giáo viên song ngữ</p>
      </div>

      <div className="filter-bar">
        <select value={level} onChange={e => setLevel(e.target.value)}>
          {LEVELS.map(l => <option key={l} value={l}>{l === 'All' ? 'Tất cả trình độ' : l}</option>)}
        </select>
        <select value={category} onChange={e => setCategory(e.target.value)}>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>
              {c === 'All' ? 'Tất cả danh mục' : c === 'classroom_english' ? 'Classroom English' : c === 'clil_stem' ? 'CLIL/STEM' : c === 'assessment' ? 'Assessment' : c === 'vocabulary' ? 'Vocabulary' : 'Learning Science'}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Đang tải...</p>
      ) : filtered.length === 0 ? (
        <div className="empty"><h3>Không tìm thấy khóa học</h3></div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {filtered.map(course => {
            const cover = COVER_MAP[course.category] || { color: 'red', icon: Icon.Courses };
            const C = cover.icon;
            const enroll = (() => {
              try {
                const e = localStorage.getItem('vmg_enroll_' + course.slug);
                return e ? JSON.parse(e) : null;
              } catch { return null; }
            })();
            return (
              <Card key={course.id} className="course-card" onClick={() => navigate(`/courses/${course.slug}`)}>
                <div className={`course-cover ${cover.color}`}>
                  <C size={32} />
                </div>
                <div className="course-info">
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <div className="course-meta">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon.Stats size={14} /> {course.level}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon.BookOpen size={14} /> {course.lesson_count} bài học</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon.Target size={14} /> {course.duration_hours} giờ</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{course.instructor}</span>
                    {enroll?.enrolled && (
                      <span className="pill" style={{ color: 'var(--green)', background: 'var(--green-bg)' }}>
                        Đang học • {enroll.progress_pct}%
                      </span>
                    )}
                    {course.access_type === 'paid' && (
                      <span className="pill" style={{ background: 'var(--red)', color: '#fff', fontWeight: 800 }}>
                        {course.sale_price ?? course.price} đ
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
