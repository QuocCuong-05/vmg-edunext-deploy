import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';

export default function GradingPage() {
  const showToast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ review_status: '', lesson_id: '' });
  const [lessons, setLessons] = useState([]);
  const [scores, setScores] = useState({});
  const [feedbacks, setFeedbacks] = useState({});
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    api.practice.submissions({ limit: 100 }).then(d => setRows(d?.data || [])).catch(() => {}).finally(() => setLoading(false));
    api.courses.list().then(async d => {
      const list = d?.data || [];
      const all = [];
      for (const c of list.slice(0, 10)) {
        try {
          const detail = await api.courses.get(c.slug);
          (detail?.lessons || []).filter(l => l.item_type === 'practice').forEach(l => all.push({ id: l.id, title: l.title, course: c.title }));
        } catch {}
      }
      setLessons(all);
    }).catch(() => {});
  }, []);

  const load = async (params = {}) => {
    setLoading(true);
    try {
      const d = await api.practice.submissions({ limit: 100, ...params });
      setRows(d?.data || []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filter.review_status || filter.lesson_id) load(filter);
  }, [filter.review_status, filter.lesson_id]);

  const submitReview = async (id) => {
    setBusyId(id);
    try {
      await api.practice.review(id, {
        teacher_score: scores[id] != null ? Number(scores[id]) : null,
        teacher_feedback: feedbacks[id] || null,
        review_status: 'reviewed',
      });
      showToast('Đã chấm lại', 'success');
      setRows(prev => prev.map(r => r.id === id ? { ...r, review_status: 'reviewed', teacher_score: scores[id] != null ? Number(scores[id]) : r.teacher_score } : r));
    } catch (err) {
      showToast(err.message || 'Lỗi chấm bài', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const pending = rows.filter(r => r.review_status !== 'reviewed').length;

  return (
    <div className="page-enter">
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Chấm bài phát âm</h1>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
        {rows.length} bài · {pending} bài chưa chấm lại. Nghe audio học viên và chấm điểm thay cho AI nếu cần.
      </p>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <select className="admin-input" style={{ maxWidth: 200 }} value={filter.review_status} onChange={e => setFilter({ ...filter, review_status: e.target.value })}>
          <option value="">Tất cả trạng thái</option>
          <option value="new">Chưa chấm lại</option>
          <option value="reviewed">Đã chấm lại</option>
        </select>
        <select className="admin-input" style={{ maxWidth: 280 }} value={filter.lesson_id} onChange={e => setFilter({ ...filter, lesson_id: e.target.value })}>
          <option value="">Tất cả bài luyện nói</option>
          {lessons.map(l => <option key={l.id} value={l.id}>{l.course} — {l.title}</option>)}
        </select>
        <Button size="sm" variant="ghost" onClick={() => { setFilter({ review_status: '', lesson_id: '' }); load(); }}>Xóa lọc</Button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Đang tải...</p>
      ) : !rows.length ? (
        <div className="empty"><h3>Chưa có bài nào</h3></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {rows.map(r => (
            <Card key={r.id} style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                <div>
                  <b style={{ fontSize: 14 }}>{r.user_name}</b>
                  <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8 }}>{r.user_email}</span>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
                    {r.course_title} — {r.lesson_title}{r.word ? ` — "${r.word}"` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={`admin-badge ${r.review_status === 'reviewed' ? 'green' : 'red'}`}>
                    {r.review_status === 'reviewed' ? 'Đã chấm lại' : 'Cần chấm'}
                  </span>
                  {r.ai_score != null && <span className="admin-badge gray">AI: {r.ai_score}/10</span>}
                  {r.teacher_score != null && <span className="admin-badge green">GV: {r.teacher_score}/10</span>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                <audio controls src={r.audio_url} style={{ height: 38, maxWidth: 260 }} />
                {r.transcript && <span style={{ fontSize: 12, color: 'var(--muted)' }}>Transcript: <b>{r.transcript}</b></span>}
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(r.created_at).toLocaleString('vi-VN')}</span>
              </div>

              {r.ai_feedback && (
                <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 12 }}>AI: {r.ai_feedback}</p>
              )}

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="number" min={1} max={10}
                  placeholder="Điểm GV (1-10)"
                  className="admin-input"
                  style={{ width: 130 }}
                  value={scores[r.id] ?? r.teacher_score ?? ''}
                  onChange={e => setScores({ ...scores, [r.id]: e.target.value })}
                />
                <input
                  placeholder="Nhận xét của giáo viên..."
                  className="admin-input"
                  style={{ flex: 1, minWidth: 220 }}
                  value={feedbacks[r.id] ?? r.teacher_feedback ?? ''}
                  onChange={e => setFeedbacks({ ...feedbacks, [r.id]: e.target.value })}
                />
                <Button size="sm" variant="primary" isDisabled={busyId === r.id} onClick={() => submitReview(r.id)}>
                  {busyId === r.id ? 'Đang lưu...' : 'Chấm lại'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}