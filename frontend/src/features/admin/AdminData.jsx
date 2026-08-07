import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { Icon } from '../../lib/icons';

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
  rewards: { required: ['name','desc_text','price','icon_type','content_type','category','content_json','stock','is_active'] },
  courses: { required: ['title','slug','description','level','category','duration_hours','lesson_count','instructor','is_published'], optional: ['id','access_type','price','sale_price'] },
  lessons: { required: ['course_id','title','slug','description','sort_order','content_type','video_url','video_duration_seconds','article_body','is_free'] },
  level_challenges: { required: ['title','description','xp_reward','quiz_set_id','level_min','sort_order','is_active'] },
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
  { key: 'import', label: 'Nhập CSV', icon: Icon.Download },
  { key: 'orders', label: 'Đơn hàng', icon: Icon.CartAlt },
  { key: 'plus', label: 'Tài khoản Plus', icon: Icon.Gem },
  { key: 'courses', label: 'Khóa Premium', icon: Icon.Courses },
  { key: 'settings', label: 'Cấu hình', icon: Icon.Cog },
];

const badge = (status) => {
  if (status === 'paid') return <span className="admin-badge green">Đã thanh toán</span>;
  if (status === 'pending') return <span className="admin-badge gold">Chờ xác nhận</span>;
  if (status === 'cancelled') return <span className="admin-badge gray">Đã hủy</span>;
  if (status === 'active') return <span className="admin-badge green">Hoạt động</span>;
  if (status === 'expired') return <span className="admin-badge red">Hết hạn</span>;
  return <span className="admin-badge red">{status}</span>;
};

export default function AdminData() {
  const { user } = useAuth();
  const [tab, setTab] = useState('import');

  const [table, setTable] = useState('');
  const [csvText, setCsvText] = useState('');
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState('replace');
  const fileRef = useRef(null);

  const [orders, setOrders] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [courseForm, setCourseForm] = useState({});
  const [settings, setSettings] = useState({});
  const [activateForm, setActivateForm] = useState({ userId: '', period: '1' });

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
    try { setOrders(await api.admin.orders()); } catch {}
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

  useEffect(() => {
    if (tab === 'orders') loadOrders();
    if (tab === 'plus') loadSubscriptions();
    if (tab === 'courses') loadCourses();
    if (tab === 'settings') loadSettings();
  }, [tab]);

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
    const f = courseForm[courseId] || {};
    if (!f.price) { setError('Nhập giá cho khóa trả phí'); return; }
    try {
      const updated = await api.admin.setPaidCourse(courseId, Number(f.price), f.sale_price ? Number(f.sale_price) : null);
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ margin: 0 }}>Đơn hàng</h3>
            <button className="admin-btn-ghost" onClick={loadOrders}>Làm mới</button>
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
                    <tr key={o.id}>
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
                        {o.status === 'pending' && (
                          <button className="admin-btn" onClick={() => handleApproveOrder(o.id)}>Xác nhận</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            Khóa Premium chỉ mở khi tài khoản có gói Plus — không bán lẻ từng khóa. Giá để tham khảo/nội bộ.
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
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: 11, marginBottom: 5, color: 'var(--muted)' }}>Giá tham khảo (đ)</label>
                      <input type="number" className="admin-input" style={{ width: 140 }}
                        value={f.price ?? c.price ?? ''}
                        onChange={e => setCourseForm({ ...courseForm, [c.id]: { ...f, price: e.target.value } })} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: 11, marginBottom: 5, color: 'var(--muted)' }}>Giá khuyến mãi (đ)</label>
                      <input type="number" className="admin-input" style={{ width: 140 }}
                        value={f.sale_price ?? c.sale_price ?? ''}
                        onChange={e => setCourseForm({ ...courseForm, [c.id]: { ...f, sale_price: e.target.value } })} />
                    </div>
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
