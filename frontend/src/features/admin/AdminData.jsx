import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { Icon } from '../../lib/icons';
import CmsManager from './CmsManager';
import usePersistedState from '../../lib/usePersistedState';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const ALLOWED_TABLES = [
  'classroom_phrase_categories', 'classroom_phrases',
  'quiz_sets', 'quiz_questions', 'quiz_options',
  'vocabulary_entries', 'tips', 'quests', 'rewards',
  'courses', 'lessons', 'level_challenges',
];

const TABLE_COLUMNS = {
  classroom_phrase_categories: { required: ['slug','name_vi','sort_order','icon'], optional: ['id'] },
  classroom_phrases: { required: ['category_id','phrase_en','phrase_vi','purpose','level','sort_order','is_published'] },
  quiz_sets: { required: ['title','slug','description','passing_score','xp_reward','level','question_count','is_published'], optional: ['id'] },
  quiz_questions: { required: ['quiz_set_id','prompt','prompt_translation','correct_answer','explanation','explanation_vi','competency_code','level','sort_order'], optional: ['id'] },
  quiz_options: { required: ['question_id','option_text','is_correct','feedback_correct','feedback_incorrect','sort_order'] },
  vocabulary_entries: { required: ['word','part_of_speech','level','meaning_vi','definition_en','example_en','example_vi','collocation','topic','is_published'] },
  tips: { required: ['title','content','category','is_published'] },
  quests: { required: ['type','title','desc_text','xp','is_active'], optional: ['id'] },
  rewards: { required: ['name','desc_text','price','icon_type','content_type','category','content_json','stock','is_active'], optional: ['id','tier'] },
  courses: { required: ['title','slug','description','level','category','duration_hours','lesson_count','instructor','is_published'], optional: ['id','access_type','thumbnail'] },
  lessons: { required: ['course_id','title','slug','description','sort_order','content_type','video_url','video_duration_seconds','article_body','is_free'], optional: ['id','module','preview_text'] },
  level_challenges: { required: ['title','description','xp_reward','quiz_set_id','level_min','sort_order','is_active'] },
  wards: { required: ['name'], optional: ['id'] },
  schools: { required: ['name','ward_name','level'], optional: ['id'] },
};

function parseCsvText(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = splitLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = splitLine(line);
    if (values.length === 0) continue;
    const row = {};
    headers.forEach((h, j) => {
      row[h] = values[j] !== undefined ? values[j] : '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

function splitLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

const TABS = [
  { key: 'overview', label: 'Tổng quan', icon: Icon.Stats },
  { key: 'import', label: 'Nhập CSV', icon: Icon.Download },
  { key: 'orders', label: 'Đơn hàng', icon: Icon.CartAlt },
  { key: 'plus', label: 'Tài khoản Plus', icon: Icon.Gem },
  { key: 'courses', label: 'Khóa Premium', icon: Icon.Courses },
  { key: 'trace', label: 'Truy vết', icon: Icon.Globe },
  { key: 'content', label: 'Nội dung', icon: Icon.Pen },
  { key: 'settings', label: 'Cấu hình', icon: Icon.Cog },
];

const badge = (status) => {
  if (status === 'paid') return <span className="admin-badge green">Đã thanh toán</span>;
  if (status === 'pending') return <span className="admin-badge gold">Chờ thanh toán</span>;
  if (status === 'awaiting') return <span className="admin-badge gold">Chờ xác nhận CK</span>;
  if (status === 'cancelled') return <span className="admin-badge gray">Đã hủy</span>;
  if (status === 'active') return <span className="admin-badge green">Hoạt động</span>;
  if (status === 'expired') return <span className="admin-badge red">Hết hạn</span>;
  return <span className="admin-badge red">{status}</span>;
};

export default function AdminData() {
  const { user } = useAuth();
  const [tab, setTab] = usePersistedState('vmg_admin_tab', 'overview');

  const [dashboard, setDashboard] = useState(null);

  const [table, setTable] = useState('');
  const [csvText, setCsvText] = useState('');
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState('replace');
  const fileRef = useRef(null);

  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = usePersistedState('vmg_admin_order_filter', 'all');
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersMeta, setOrdersMeta] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [courseForm, setCourseForm] = useState({});
  const [settings, setSettings] = useState({});
  const [activateForm, setActivateForm] = useState({ userId: '', period: '1' });

  const [traceSub, setTraceSub] = usePersistedState('vmg_admin_trace_sub', 'activity');
  const [traceFilters, setTraceFilters] = useState({ email: '', ip: '', event: '', from: '', to: '' });
  const [tracePage, setTracePage] = useState(1);
  const [traceData, setTraceData] = useState(null);
  const [traceStats, setTraceStats] = useState(null);
  const [traceLoading, setTraceLoading] = useState(false);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      setCsvText(text);
      const parsed = parseCsvText(text);
      setPreview(parsed);
      setStatus(`Parsed ${parsed.rows.length} rows, ${parsed.headers.length} columns`);
      setError('');
    };
    reader.onerror = () => setError('Cannot read file');
    reader.readAsText(file);
  }

  function handleClearFile() {
    setCsvText('');
    setPreview(null);
    setStatus('');
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleImport() {
    if (!table || !preview || preview.rows.length === 0) {
      setError('Select a table and upload a CSV file');
      return;
    }

    setBusy(true);
    setError('');
    setStatus('Importing...');

    try {
      const token = localStorage.getItem('vmg_token');
      const res = await fetch(`${API_BASE}/admin/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ table, rows: preview.rows, mode }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setStatus(`${data.mode === 'append' ? 'Appended' : 'Imported'} ${data.imported} rows into ${data.table}`);
      setPreview(null);
      setCsvText('');
    } catch (err) {
      setError(err.message);
      setStatus('');
    } finally {
      setBusy(false);
    }
  }

  async function loadOrders() {
    try {
      const data = await api.admin.orders({ status: orderFilter, page: ordersPage, limit: 30 });
      setOrders(data.rows || []);
      setOrdersMeta(data);
    } catch {}
  }
  async function loadCourses() {
    try {
      setCourses(await api.courses.list());
      const { data } = await supabase.from('lessons').select('id, title, course_id');
      setLessons(data || []);
    } catch {}
  }
  async function loadSettings() {
    try { setSettings(await api.admin.settings()); } catch {}
  }
  async function loadSubscriptions() {
    try { setSubscriptions(await api.admin.subscriptions()); } catch {}
  }
  async function loadDashboard() {
    try { setDashboard(await api.admin.dashboardStats()); } catch {}
  }

  useEffect(() => {
    if (tab === 'overview') loadDashboard();
    if (tab === 'orders') loadOrders();
    if (tab === 'plus') loadSubscriptions();
    if (tab === 'courses') loadCourses();
    if (tab === 'settings') loadSettings();
    if (tab === 'trace') loadTrace();
  }, [tab]);

  useEffect(() => {
    if (tab === 'trace') loadTrace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [traceSub, tracePage]);

  useEffect(() => {
    if (tab === 'orders') loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderFilter, ordersPage]);

  async function loadTrace() {
    setTraceLoading(true);
    setError('');
    try {
      if (traceSub === 'stats') {
        setTraceStats(await api.admin.traceStats());
      } else if (traceSub === 'activity') {
        setTraceData(await api.admin.traceActivity({ ...traceFilters, page: tracePage, limit: 50 }));
      } else if (traceSub === 'consents') {
        setTraceData(await api.admin.traceConsents({ email: traceFilters.email, page: tracePage, limit: 50 }));
      } else if (traceSub === 'devices') {
        setTraceData(await api.admin.traceDevices({ email: traceFilters.email, page: tracePage, limit: 50 }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setTraceLoading(false);
    }
  }

async function exportCsv(columns) {
    const params = { ...traceFilters, all: 1 };
    const res = traceSub === 'activity'
      ? await api.admin.traceActivity(params)
      : traceSub === 'consents'
        ? await api.admin.traceConsents(params)
        : await api.admin.traceDevices(params);
    const rows = (res && res.data) || [];
    const header = columns.map(c => c.label).join(',');
    const lines = rows.map(r => columns.map(c => {
      const v = c.get(r);
      const s = v == null ? '' : String(v);
      return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(','));
    const blob = new Blob([header + '\n' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trace-' + traceSub + '.csv';
    a.click();
  }

  async function handleApproveOrder(id) {
    try {
      await api.admin.approveOrder(id);
      await loadOrders();
    } catch (err) { setError(err.message); }
  }

  async function handleRenewSubscription(id) {
    try {
      await api.admin.renewSubscription(id);
      await loadSubscriptions();
    } catch (err) { setError(err.message); }
  }

  async function handleCancelSubscription(id) {
    try {
      await api.admin.cancelSubscription(id);
      await loadSubscriptions();
    } catch (err) { setError(err.message); }
  }

  async function handleActivateSubscription() {
    if (!activateForm.userId.trim()) { setError('Nhập user_id của tài khoản'); return; }
    try {
      await api.admin.activateSubscription(activateForm.userId.trim(), Number(activateForm.period) || 1);
      setActivateForm({ userId: '', period: '1' });
      await loadSubscriptions();
      setError('');
    } catch (err) { setError(err.message); }
  }

  async function handleSavePaid(courseId) {
    try {
      const updated = await api.admin.setPremiumCourse(courseId);
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, ...updated } : c));
    } catch (err) { setError(err.message); }
  }

  async function handleSetFree(courseId) {
    try {
      const updated = await api.admin.setFreeCourse(courseId);
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, ...updated } : c));
    } catch (err) { setError(err.message); }
  }

  async function handleSavePreview(courseId) {
    const f = courseForm[courseId] || {};
    if (!f.preview_lesson_id) { setError('Chọn bài học để đặt preview'); return; }
    try {
      await api.admin.setPreview(f.preview_lesson_id, f.preview_text || '');
    } catch (err) { setError(err.message); }
  }

  async function handleSaveSettings() {
    try {
      await api.admin.saveSetting('preview_seconds', Number(settings.preview_seconds) || 120);
      await api.admin.saveSetting('bank_transfer', {
        bank_name: settings.bank_name || '',
        account_number: settings.account_number || '',
        account_holder: settings.account_holder || '',
        content_prefix: settings.content_prefix || 'VMG',
      });
    } catch (err) { setError(err.message); }
  }

  return (
    <div className="page-enter" style={{ maxWidth: 960, margin: '0 auto' }}>
      <div className="page-title">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Icon.Cog size={24} /> Quản trị</h1>
        <p>Quản lý dữ liệu, đơn hàng và khóa trả phí</p>
      </div>

      <div className="admin-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`admin-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: 'var(--red-bg)', color: 'var(--red)', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {tab === 'overview' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Tổng quan nền tảng</h3>
            <button className="admin-btn-ghost" onClick={loadDashboard}>Làm mới</button>
          </div>

          {!dashboard ? (
            <p className="admin-note">Đang tải...</p>
          ) : (
            <>
              <div className="grid-4" style={{ marginBottom: 24 }}>
                <div className="stat-card accent-red">
                  <div className="accent-bar" />
                  <div style={{ fontSize: 28, fontWeight: 900 }}>{dashboard.users.total}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>Tổng người dùng</div>
                  <div style={{ fontSize: 11, color: 'var(--ink)', marginTop: 4 }}>+{dashboard.users.new7d} trong 7 ngày</div>
                </div>
                <div className="stat-card accent-green">
                  <div className="accent-bar" />
                  <div style={{ fontSize: 28, fontWeight: 900 }}>{dashboard.users.active7d}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>Hoạt động 7 ngày</div>
                  <div style={{ fontSize: 11, color: 'var(--ink)', marginTop: 4 }}>{dashboard.learning.activeLearners} đang học</div>
                </div>
                <div className="stat-card accent-blue">
                  <div className="accent-bar" style={{ background: 'var(--blue)' }} />
                  <div style={{ fontSize: 28, fontWeight: 900 }}>{dashboard.quiz.avgScore ?? '—'}%</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>Điểm quiz TB 7 ngày</div>
                  <div style={{ fontSize: 11, color: 'var(--ink)', marginTop: 4 }}>{dashboard.quiz.attempts7d} lượt làm</div>
                </div>
                <div className="stat-card accent-gold">
                  <div className="accent-bar" style={{ background: 'var(--gold)' }} />
                  <div style={{ fontSize: 28, fontWeight: 900 }}>{dashboard.revenue.pending}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>Đơn chờ duyệt</div>
                  <div style={{ fontSize: 11, color: 'var(--ink)', marginTop: 4 }}>Plus: {dashboard.plus.active} active</div>
                </div>
              </div>

              <div className="grid-2" style={{ marginBottom: 24 }}>
                <div className="admin-panel">
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Doanh thu tháng</h4>
                  <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--green)' }}>
                    {(dashboard.revenue.month || 0).toLocaleString('vi-VN')} đ
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                    Tổng: {(dashboard.revenue.total || 0).toLocaleString('vi-VN')} đ
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0' }}>
                      <span style={{ color: 'var(--muted)' }}>Hoàn thành bài học</span>
                      <b>{dashboard.learning.completionPct}% ({dashboard.learning.completed}/{dashboard.learning.total})</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0' }}>
                      <span style={{ color: 'var(--muted)' }}>User mới 30 ngày</span>
                      <b>{dashboard.users.new30d}</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0' }}>
                      <span style={{ color: 'var(--muted)' }}>Khóa học</span>
                      <b>{dashboard.courses.total} ({dashboard.courses.premium} premium)</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0' }}>
                      <span style={{ color: 'var(--muted)' }}>Cộng đồng 7 ngày</span>
                      <b>{dashboard.community.posts7d} bài · {dashboard.community.comments7d} bình luận</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0' }}>
                      <span style={{ color: 'var(--muted)' }}>XP trung bình</span>
                      <b>{dashboard.xp.avg?.toLocaleString('vi-VN')}</b>
                    </div>
                    {dashboard.plus.expiring7d > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: 'var(--red)' }}>
                        <span>Plus sắp hết hạn 7 ngày</span>
                        <b>{dashboard.plus.expiring7d}</b>
                      </div>
                    )}
                  </div>
                </div>

                <div className="admin-panel">
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Top 10 XP</h4>
                  {dashboard.xp.top10.map((p, i) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < 9 ? '1px solid var(--line)' : 'none', fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 22, textAlign: 'center', fontWeight: 700, color: i < 3 ? 'var(--gold)' : 'var(--muted)' }}>
                          {i + 1}
                        </span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{p.full_name}</span>
                      </div>
                      <b>{p.xp?.toLocaleString('vi-VN')} XP</b>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'import' && (
        <div className="admin-panel">
          <h3>Nhập dữ liệu từ CSV</h3>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: 12, marginBottom: 6, color: 'var(--muted)' }}>Bảng dữ liệu</label>
            <select
              value={table}
              onChange={e => { setTable(e.target.value); handleClearFile(); }}
              className="admin-input"
            >
              <option value="">-- Chọn bảng --</option>
              {ALLOWED_TABLES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {table && (
            <div style={{ marginBottom: 16, padding: '12px 14px', background: 'var(--surface-hover)', border: '1px solid var(--line)', borderRadius: 10 }}>
              <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 13 }}>
                Các cột của <code style={{ background: 'var(--card)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--line)' }}>{table}</code>
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {TABLE_COLUMNS[table]?.required.map(col => (
                  <span key={col} style={{
                    padding: '3px 10px', borderRadius: 6, fontSize: 12,
                    background: 'var(--card)', color: 'var(--ink)',
                    border: '1px solid var(--line)',
                  }}>{col}</span>
                ))}
                {TABLE_COLUMNS[table]?.optional?.map(col => (
                  <span key={col} style={{
                    padding: '3px 10px', borderRadius: 6, fontSize: 12,
                    background: 'transparent', color: 'var(--muted)',
                    border: '1px dashed var(--line)',
                  }}>{col} <span style={{ fontSize: 10 }}>(tự sinh)</span></span>
                ))}
              </div>
              {preview && (
                (() => {
                  const requiredCols = TABLE_COLUMNS[table]?.required || [];
                  const csvCols = new Set(preview.headers);
                  const missing = requiredCols.filter(c => !csvCols.has(c));
                  const extra = preview.headers.filter(h => h && !requiredCols.includes(h) && !(TABLE_COLUMNS[table]?.optional || []).includes(h));
                  if (missing.length > 0 || extra.length > 0) {
                    return (
                      <div style={{ marginTop: 8, fontSize: 12 }}>
                        {missing.length > 0 && (
                          <p style={{ margin: 0, color: 'var(--red)' }}>Thiếu cột: {missing.join(', ')}</p>
                        )}
                        {extra.length > 0 && (
                          <p style={{ margin: 0, color: 'var(--gold)' }}>Cột thừa (sẽ bị bỏ qua): {extra.join(', ')}</p>
                        )}
                      </div>
                    );
                  }
                })()
              )}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: 12, marginBottom: 6, color: 'var(--muted)' }}>File CSV</label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ fontSize: 13, marginBottom: 8 }}
            />
            {preview && (
              <div className="admin-table-wrap" style={{ maxHeight: 260, overflowY: 'auto' }}>
                <table className="admin-table" style={{ minWidth: 720 }}>
                  <thead>
                    <tr>
                      {preview.headers.map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        {preview.headers.map(h => (
                          <td key={h}>{String(row[h] || '').substring(0, 80)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--muted)' }}>Chế độ:</span>
            {['replace', 'append'].map(m => (
              <label key={m} style={{
                display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12,
                padding: '5px 12px', borderRadius: 999, background: mode === m ? 'var(--red)' : 'var(--surface)',
                color: mode === m ? '#fff' : 'var(--muted)', fontWeight: 600,
              }}>
                <input type="radio" name="importMode" value={m} checked={mode === m} onChange={() => setMode(m)} style={{ display: 'none' }} />
                {m === 'replace' ? 'Replace (xóa hết, chèn mới)' : 'Append (thêm mới, bỏ qua trùng)'}
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="admin-btn" onClick={handleImport} disabled={busy || !preview || !table}>
              {busy ? 'Đang import...' : 'Import'}
            </button>
            {csvText && (
              <button className="admin-btn-ghost" onClick={handleClearFile}>Bỏ file</button>
            )}
          </div>

          {status && (
            <p style={{ marginTop: 14, padding: '10px 14px', background: 'var(--green-bg)', borderRadius: 10, color: 'var(--green)', fontSize: 13 }}>
              {status}
            </p>
          )}
        </div>
      )}

      {tab === 'orders' && (
        <div className="admin-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0 }}>Đơn hàng {ordersMeta?.total ? `(${ordersMeta.total})` : ''}</h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                className="admin-input"
                style={{ width: 'auto', padding: '6px 10px', fontSize: 12 }}
                value={orderFilter}
                onChange={e => { setOrderFilter(e.target.value); setOrdersPage(1); }}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ thanh toán</option>
                <option value="awaiting">Chờ xác nhận CK</option>
                <option value="paid">Đã thanh toán</option>
                <option value="expired">Hết hạn</option>
                <option value="cancelled">Đã hủy</option>
              </select>
              <button className="admin-btn-ghost" onClick={loadOrders}>Làm mới</button>
            </div>
          </div>
          {orders.length === 0 ? (
            <p className="admin-note">Chưa có đơn hàng nào.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table" style={{ minWidth: 720 }}>
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Người mua</th>
                    <th>Sản phẩm</th>
                    <th>Số tiền</th>
                    <th>Phương thức</th>
                    <th>Trạng thái</th>
                    <th>Thời gian</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} style={o.status === 'awaiting' ? { background: 'rgba(255, 193, 7, .07)' } : undefined}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{o.order_no}</td>
                      <td>{o.full_name || o.profiles?.full_name || o.user_id?.slice(0, 8)}</td>
                      <td>
                        {o.item_type === 'plus'
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon.Gem size={12} /> Gói Plus {o.period} tháng</span>
                          : (o.courses?.title || '—')}
                      </td>
                      <td style={{ fontWeight: 700 }}>{(o.amount || 0).toLocaleString('vi-VN')} đ</td>
                      <td style={{ fontSize: 12 }}>{o.method === 'bank_transfer' ? 'Chuyển khoản' : o.method}</td>
                      <td>{badge(o.status)}</td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{o.created_at ? new Date(o.created_at).toLocaleString('vi-VN') : ''}</td>
                      <td>
                        {['pending', 'awaiting'].includes(o.status) && (
                          <button className="admin-btn" onClick={() => handleApproveOrder(o.id)}>
                            {o.status === 'awaiting' ? 'Duyệt' : 'Xác nhận'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {ordersMeta?.pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 14 }}>
              <button className="admin-btn-ghost" disabled={ordersPage <= 1} onClick={() => setOrdersPage(p => Math.max(1, p - 1))}>← Trước</button>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Trang {ordersPage}/{ordersMeta.pages}</span>
              <button className="admin-btn-ghost" disabled={ordersPage >= ordersMeta.pages} onClick={() => setOrdersPage(p => p + 1)}>Sau →</button>
            </div>
          )}
        </div>
      )}

      {tab === 'plus' && (
        <div className="admin-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ margin: 0 }}>Tài khoản Plus</h3>
            <button className="admin-btn-ghost" onClick={loadSubscriptions}>Làm mới</button>
          </div>

          <div style={{ marginBottom: 20, padding: 16, background: 'var(--surface-hover)', border: '1px solid var(--line)', borderRadius: 12 }}>
            <b style={{ fontSize: 13, marginBottom: 10, display: 'block' }}>Kích hoạt thủ công (khi nhận chuyển khoản không qua đơn hàng)</b>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: 11, marginBottom: 5, color: 'var(--muted)' }}>User ID</label>
                <input
                  className="admin-input"
                  placeholder="uuid của tài khoản (lấy từ bảng profiles)"
                  value={activateForm.userId}
                  onChange={e => setActivateForm({ ...activateForm, userId: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: 11, marginBottom: 5, color: 'var(--muted)' }}>Kỳ hạn</label>
                <select
                  className="admin-input"
                  value={activateForm.period}
                  onChange={e => setActivateForm({ ...activateForm, period: e.target.value })}
                >
                  {[1, 3, 6, 12].map(p => <option key={p} value={p}>{p} tháng</option>)}
                </select>
              </div>
              <button className="admin-btn" onClick={handleActivateSubscription}>Kích hoạt Plus</button>
            </div>
          </div>

          {subscriptions.length === 0 ? (
            <p className="admin-note">Chưa có tài khoản Plus nào.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table" style={{ minWidth: 720 }}>
                <thead>
                  <tr>
                    <th>Người dùng</th>
                    <th>Gói</th>
                    <th>Giá</th>
                    <th>Bắt đầu</th>
                    <th>Hết hạn</th>
                    <th>Trạng thái</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map(s => {
                    const isExpired = s.status === 'active' && new Date(s.end_at) < new Date();
                    return (
                      <tr key={s.id}>
                        <td>{s.full_name || s.user_id?.slice(0, 8)}</td>
                        <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon.Gem size={12} /> Plus {s.period} tháng</span></td>
                        <td>{s.price ? `${(s.price || 0).toLocaleString('vi-VN')} đ` : '—'}</td>
                        <td style={{ fontSize: 12, color: 'var(--muted)' }}>{s.start_at ? new Date(s.start_at).toLocaleDateString('vi-VN') : ''}</td>
                        <td style={{ fontSize: 12, color: 'var(--muted)' }}>{s.end_at ? new Date(s.end_at).toLocaleDateString('vi-VN') : ''}</td>
                        <td>{badge(isExpired ? 'expired' : s.status)}</td>
                        <td style={{ display: 'flex', gap: 6 }}>
                          <button className="admin-btn" onClick={() => handleRenewSubscription(s.id)}>Gia hạn</button>
                          {s.status === 'active' && !isExpired && (
                            <button className="admin-btn-ghost" onClick={() => handleCancelSubscription(s.id)}>Hủy</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'courses' && (
        <div className="admin-panel">
          <h3>Khóa Premium — đặt trạng thái &amp; preview</h3>
          <p className="admin-note" style={{ marginBottom: 16 }}>
            Khóa Premium chỉ mở khi tài khoản có gói Plus — không bán lẻ từng khóa.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {courses.map(c => {
              const f = courseForm[c.id] || {};
              const premium = c.access_type === 'premium' || c.access_type === 'paid';
              return (
                <div key={c.id} style={{ padding: 16, background: 'var(--surface-hover)', border: '1px solid var(--line)', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                    <b style={{ fontSize: 14 }}>{c.title}</b>
                    <span className={`admin-badge ${premium ? 'red' : 'gray'}`}>
                      {premium ? 'Premium' : 'Miễn phí'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 12 }}>
                    <button className="admin-btn" onClick={() => handleSavePaid(c.id)}>Đặt Premium</button>
                    {premium && (
                      <button className="admin-btn-ghost" onClick={() => handleSetFree(c.id)}>Chuyển miễn phí</button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: 11, marginBottom: 5, color: 'var(--muted)' }}>Bài học preview</label>
                      <select
                        className="admin-input"
                        value={f.preview_lesson_id ?? ''}
                        onChange={e => setCourseForm({ ...courseForm, [c.id]: { ...f, preview_lesson_id: e.target.value } })}
                      >
                        <option value="">-- Chọn bài --</option>
                        {(lessons.filter(l => l.course_id === c.id)).map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 2, minWidth: 220 }}>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: 11, marginBottom: 5, color: 'var(--muted)' }}>Đoạn xem trước</label>
                      <input
                        className="admin-input"
                        value={f.preview_text ?? ''}
                        onChange={e => setCourseForm({ ...courseForm, [c.id]: { ...f, preview_text: e.target.value } })}
                        placeholder="Đoạn trích hiển thị cho người chưa mua..."
                      />
                    </div>
                    <button className="admin-btn-ghost" onClick={() => handleSavePreview(c.id)}>Lưu preview</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'trace' && (
        <div className="admin-panel">
          <h3>Truy vết & phân tích</h3>
          <p className="admin-note" style={{ marginBottom: 16 }}>
            Lịch sử hoạt động, lựa chọn dữ liệu và thiết bị + IP của toàn bộ user.
          </p>

          <div className="admin-tabs" style={{ marginBottom: 14 }}>
            {[
              { key: 'activity', label: 'Hoạt động' },
              { key: 'consents', label: 'Consent' },
              { key: 'devices', label: 'Thiết bị' },
              { key: 'stats', label: 'Thống kê' },
            ].map(t => (
              <button
                key={t.key}
                className={`admin-tab${traceSub === t.key ? ' active' : ''}`}
                onClick={() => { setTraceSub(t.key); setTracePage(1); }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {traceSub !== 'stats' && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <input
                className="admin-input"
                style={{ width: 160 }}
                placeholder="Email / tên"
                value={traceFilters.email}
                onChange={e => setTraceFilters({ ...traceFilters, email: e.target.value })}
              />
              {traceSub === 'activity' && (
                <>
                  <input
                    className="admin-input"
                    style={{ width: 140 }}
                    placeholder="IP"
                    value={traceFilters.ip}
                    onChange={e => setTraceFilters({ ...traceFilters, ip: e.target.value })}
                  />
                  <input
                    className="admin-input"
                    style={{ width: 140 }}
                    placeholder="Sự kiện (login...)"
                    value={traceFilters.event}
                    onChange={e => setTraceFilters({ ...traceFilters, event: e.target.value })}
                  />
                  <input
                    className="admin-input"
                    style={{ width: 140 }}
                    type="date"
                    value={traceFilters.from}
                    onChange={e => setTraceFilters({ ...traceFilters, from: e.target.value })}
                  />
                  <input
                    className="admin-input"
                    style={{ width: 140 }}
                    type="date"
                    value={traceFilters.to}
                    onChange={e => setTraceFilters({ ...traceFilters, to: e.target.value })}
                  />
                </>
              )}
              <button className="admin-btn" onClick={() => { setTracePage(1); loadTrace(); }}>Lọc</button>
              <button
                className="admin-btn"
                onClick={() => exportCsv(traceSub === 'activity'
                  ? [
                      { label: 'Thời gian', get: r => r.created_at },
                      { label: 'Email', get: r => r.email },
                      { label: 'Tên', get: r => r.full_name },
                      { label: 'Sự kiện', get: r => r.event },
                      { label: 'Bối cảnh', get: r => r.context },
                      { label: 'Mô tả', get: r => r.description },
                      { label: 'IP', get: r => r.ip },
                    ]
                  : traceSub === 'consents'
                    ? [
                        { label: 'Thời gian', get: r => r.created_at },
                        { label: 'Email', get: r => r.email },
                        { label: 'Chính sách', get: r => r.policy_key },
                        { label: 'Đồng ý', get: r => r.accepted },
                        { label: 'Version', get: r => r.version },
                        { label: 'IP', get: r => r.ip },
                      ]
                    : [
                        { label: 'Đăng nhập lúc', get: r => r.logged_in_at },
                        { label: 'Email', get: r => r.email },
                        { label: 'Thiết bị', get: r => r.device_name },
                        { label: 'IP', get: r => r.ip },
                        { label: 'Hoạt động cuối', get: r => r.last_active_at },
                      ])}
              >
                Xuất CSV
              </button>
            </div>
          )}

          {traceLoading ? (
            <p className="admin-note">Đang tải...</p>
          ) : traceSub === 'stats' ? (
            traceStats ? (
              <div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
                  {[
                    { label: 'Tổng user', value: traceStats.total_users },
                    { label: 'Đăng nhập 7 ngày', value: traceStats.logins_7d },
                    { label: 'IP duy nhất 7 ngày', value: traceStats.unique_ips_7d },
                  ].map(k => (
                    <div key={k.label} style={{ flex: 1, minWidth: 140, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 18px' }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--red)' }}>{k.value}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{k.label}</div>
                    </div>
                  ))}
                </div>

                <h4 style={{ fontSize: 14, marginBottom: 8 }}>Sự kiện 7 ngày</h4>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                  {Object.entries(traceStats.events_7d || {}).map(([ev, n]) => (
                    <span key={ev} className="pill" style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>{ev}: {n}</span>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <h4 style={{ fontSize: 14, marginBottom: 8 }}>Top IP (7 ngày)</h4>
                    {(traceStats.top_ips || []).map((x, i) => (
                      <div key={x.ip} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
                        <span>{i + 1}. {x.ip}</span>
                        <b>{x.count}</b>
                      </div>
                    ))}
                    {(traceStats.top_ips || []).length === 0 && <p className="admin-note">Chưa có dữ liệu</p>}
                  </div>
                  <div>
                    <h4 style={{ fontSize: 14, marginBottom: 8 }}>User hoạt động nhất (7 ngày)</h4>
                    {(traceStats.top_users || []).map((x, i) => (
                      <div key={x.email} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
                        <span>{i + 1}. {x.name} ({x.email})</span>
                        <b>{x.count}</b>
                      </div>
                    ))}
                    {(traceStats.top_users || []).length === 0 && <p className="admin-note">Chưa có dữ liệu</p>}
                  </div>
                </div>
              </div>
            ) : (
              <p className="admin-note">Đang tải...</p>
            )
          ) : traceData && traceData.data ? (
            <div>
              <div className="admin-table-wrap">
                <table className="admin-table" style={{ minWidth: 860 }}>
                  <thead>
                    <tr>
                      <th>Thời gian</th>
                      <th>Email</th>
                      <th>Tên</th>
                      {traceSub === 'activity' && (<><th>Sự kiện</th><th>Bối cảnh</th><th>Mô tả</th></>)}
                      {traceSub === 'consents' && (<><th>Chính sách</th><th>Đồng ý</th><th>Version</th></>)}
                      {traceSub === 'devices' && (<><th>Thiết bị</th><th>Hoạt động cuối</th></>)}
                      <th>IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {traceData.data.map((r, i) => (
                      <tr key={i}>
                        <td style={{ whiteSpace: 'nowrap' }}>{new Date(r.created_at || r.logged_in_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</td>
                        <td>{r.email}</td>
                        <td>{r.full_name}</td>
                        {traceSub === 'activity' && (<>
                          <td style={{ fontWeight: 700 }}>{r.event}</td>
                          <td>{r.context || '-'}</td>
                          <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description || '-'}</td>
                        </>)}
                        {traceSub === 'consents' && (<>
                          <td>{r.policy_key}</td>
                          <td>{r.accepted ? '✅' : '❌'}</td>
                          <td>v{r.version}</td>
                        </>)}
                        {traceSub === 'devices' && (<>
                          <td>{r.device_name || '-'}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{r.last_active_at ? new Date(r.last_active_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '-'}</td>
                        </>)}
                        <td style={{ whiteSpace: 'nowrap' }}>{r.ip || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {traceData.total > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, fontSize: 13 }}>
                  <button className="admin-btn" disabled={tracePage <= 1} onClick={() => setTracePage(p => p - 1)}>← Trước</button>
                  <span style={{ color: 'var(--muted)' }}>Trang {traceData.page} / {Math.max(1, Math.ceil(traceData.total / traceData.limit))} ({traceData.total} dòng)</span>
                  <button className="admin-btn" disabled={tracePage * traceData.limit >= traceData.total} onClick={() => setTracePage(p => p + 1)}>Sau →</button>
                </div>
              )}
            </div>
          ) : (
            <p className="admin-note">Chưa có dữ liệu</p>
          )}
        </div>
      )}

      {tab === 'content' && <CmsManager />}

      {tab === 'settings' && (
        <div className="admin-panel" style={{ maxWidth: 520 }}>
          <h3>Cấu hình</h3>
          <p className="admin-note" style={{ marginBottom: 16 }}>
            Thông tin chuyển khoản hiển thị trên trang đăng ký khóa học. QR VietQR sẽ được tạo từ thông tin này.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 12, marginBottom: 5, color: 'var(--muted)' }}>Số giây xem trước bài học</label>
              <input
                type="number" min="10" max="600"
                className="admin-input"
                value={settings.preview_seconds ?? 120}
                onChange={e => setSettings({ ...settings, preview_seconds: e.target.value })}
              />
              <p className="admin-note" style={{ marginTop: 4 }}>Video bài preview sẽ tự dừng sau số giây này (mặc định 120 = 2 phút).</p>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 12, marginBottom: 5, color: 'var(--muted)' }}>Ngân hàng</label>
              <input className="admin-input" value={settings.bank_name || ''} onChange={e => setSettings({ ...settings, bank_name: e.target.value })} placeholder="VD: Vietcombank" />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 12, marginBottom: 5, color: 'var(--muted)' }}>Số tài khoản</label>
              <input className="admin-input" value={settings.account_number || ''} onChange={e => setSettings({ ...settings, account_number: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 12, marginBottom: 5, color: 'var(--muted)' }}>Chủ tài khoản</label>
              <input className="admin-input" value={settings.account_holder || ''} onChange={e => setSettings({ ...settings, account_holder: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 12, marginBottom: 5, color: 'var(--muted)' }}>Tiền tố nội dung chuyển khoản</label>
              <input className="admin-input" value={settings.content_prefix || ''} onChange={e => setSettings({ ...settings, content_prefix: e.target.value })} />
            </div>
            <button className="admin-btn" onClick={handleSaveSettings} style={{ alignSelf: 'flex-start' }}>Lưu cấu hình</button>
          </div>
        </div>
      )}
    </div>
  );
}
