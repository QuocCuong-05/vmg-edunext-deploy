import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';

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

const inputStyle = {
  width: '100%', padding: '0.5rem', borderRadius: 6,
  border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)',
};

const TABS = [
  { key: 'import', label: 'Nhập CSV' },
  { key: 'orders', label: 'Đơn hàng' },
  { key: 'courses', label: 'Khóa trả phí' },
  { key: 'settings', label: 'Cấu hình QR' },
];

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
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [courseForm, setCourseForm] = useState({});
  const [settings, setSettings] = useState({});

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

  useEffect(() => {
    if (tab === 'orders') loadOrders();
    if (tab === 'courses') loadCourses();
    if (tab === 'settings') loadSettings();
  }, [tab]);

  async function handleApproveOrder(id) {
    try {
      await api.admin.approveOrder(id);
      await loadOrders();
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
      await api.admin.saveSetting('bank_transfer', {
        bank_name: settings.bank_name || '',
        account_number: settings.account_number || '',
        account_holder: settings.account_holder || '',
        content_prefix: settings.content_prefix || 'VMG',
      });
    } catch (err) { setError(err.message); }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      <h2 style={{ marginBottom: '0.5rem' }}>Admin — Quản lý</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Logged in as <strong>{user?.email}</strong> (role: {user?.role})
      </p>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid',
              borderColor: tab === t.key ? 'var(--red)' : 'var(--border)',
              background: tab === t.key ? 'var(--red)' : 'var(--card-bg)',
              color: tab === t.key ? '#fff' : 'var(--text)',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <p style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--card-bg)', borderRadius: 8, color: 'var(--red)' }}>
          {error}
        </p>
      )}

      {tab === 'import' && (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>Table</label>
            <select
              value={table}
              onChange={e => { setTable(e.target.value); handleClearFile(); }}
              style={inputStyle}
            >
              <option value="">-- Select table --</option>
              {ALLOWED_TABLES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {table && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8 }}>
              <p style={{ margin: '0 0 0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>
                Các cột của <code style={{ background: 'var(--hover)', padding: '2px 6px', borderRadius: 4 }}>{table}</code>
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {TABLE_COLUMNS[table]?.required.map(col => (
                  <span key={col} style={{
                    padding: '3px 10px', borderRadius: 4, fontSize: '0.8rem',
                    background: 'var(--hover)', color: 'var(--text)',
                    border: '1px solid var(--border)',
                  }}>{col}</span>
                ))}
                {TABLE_COLUMNS[table]?.optional?.map(col => (
                  <span key={col} style={{
                    padding: '3px 10px', borderRadius: 4, fontSize: '0.8rem',
                    background: 'transparent', color: 'var(--text-muted)',
                    border: '1px dashed var(--border)',
                  }}>{col} <span style={{ fontSize: '0.7rem' }}>(tự sinh)</span></span>
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
                      <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                        {missing.length > 0 && (
                          <p style={{ margin: 0, color: 'var(--red)' }}>
                            Thiếu cột: {missing.join(', ')}
                          </p>
                        )}
                        {extra.length > 0 && (
                          <p style={{ margin: 0, color: '#e67e22' }}>
                            Cột thừa (sẽ bị bỏ qua): {extra.join(', ')}
                          </p>
                        )}
                      </div>
                    );
                  }
                })()
              )}
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>CSV File</label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: 'block', marginBottom: '0.5rem' }}
            />
            {preview && (
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem', maxHeight: 250, overflow: 'auto' }}>
                <p style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>
                  Preview ({Math.min(5, preview.rows.length)} of {preview.rows.length} rows)
                </p>
                <table style={{ fontSize: '0.8rem', width: '100%', minWidth: 720, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {preview.headers.map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid var(--border)', background: 'var(--hover)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        {preview.headers.map(h => (
                          <td key={h} style={{ padding: '4px 8px', borderBottom: '1px solid var(--border)' }}>
                            {String(row[h] || '').substring(0, 80)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Mode:</label>
            {['replace', 'append'].map(m => (
              <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: '0.85rem', padding: '4px 12px', borderRadius: 6, background: mode === m ? 'var(--red)' : 'var(--card-bg)', color: mode === m ? '#fff' : 'var(--text)', border: '1px solid', borderColor: mode === m ? 'var(--red)' : 'var(--border)' }}>
                <input type="radio" name="importMode" value={m} checked={mode === m} onChange={() => setMode(m)} style={{ display: 'none' }} />
                {m === 'replace' ? 'Replace (xóa hết, chèn mới)' : 'Append (thêm mới, bỏ qua trùng)'}
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={handleImport}
              disabled={busy || !preview || !table}
              style={{
                padding: '0.6rem 1.5rem', borderRadius: 8, border: 'none',
                background: busy ? 'var(--text-muted)' : 'var(--red)', color: '#fff',
                cursor: busy || !preview || !table ? 'not-allowed' : 'pointer', fontWeight: 600,
              }}
            >
              {busy ? 'Importing...' : 'Import'}
            </button>

            {csvText && (
              <button onClick={handleClearFile} style={{
                padding: '0.6rem 1rem', borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--card-bg)', color: 'var(--text)', cursor: 'pointer',
              }}>
                Clear
              </button>
            )}
          </div>

          {status && (
            <p style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--card-bg)', borderRadius: 8, color: 'var(--accent-green)' }}>
              {status}
            </p>
          )}
        </>
      )}

      {tab === 'orders' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Đơn hàng</h3>
            <button onClick={loadOrders} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card-bg)', cursor: 'pointer' }}>Làm mới</button>
          </div>
          {orders.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Chưa có đơn hàng</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ fontSize: '0.8rem', width: '100%', minWidth: 640, borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Mã đơn', 'Người mua', 'Khóa học', 'Số tiền', 'Phương thức', 'Trạng thái', 'Thời gian', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--border)', background: 'var(--hover)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>{o.order_no}</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>{o.profiles?.full_name || o.user_id?.slice(0, 8)}</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>{o.courses?.title}</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>{(o.amount || 0).toLocaleString('vi-VN')} đ</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>{o.method}</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 10, fontSize: '0.75rem',
                          background: o.status === 'paid' ? 'var(--green-bg)' : o.status === 'pending' ? 'var(--gold-bg)' : 'var(--red-bg)',
                          color: o.status === 'paid' ? 'var(--green)' : o.status === 'pending' ? 'var(--gold)' : 'var(--red)',
                        }}>
                          {o.status === 'paid' ? 'Đã thanh toán' : o.status === 'pending' ? 'Chờ xác nhận' : o.status}
                        </span>
                      </td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>{o.created_at ? new Date(o.created_at).toLocaleString('vi-VN') : ''}</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>
                        {o.status === 'pending' && (
                          <button onClick={() => handleApproveOrder(o.id)} style={{
                            padding: '4px 10px', borderRadius: 6, border: 'none',
                            background: 'var(--red)', color: '#fff', cursor: 'pointer', fontSize: '0.75rem',
                          }}>
                            Xác nhận
                          </button>
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

      {tab === 'courses' && (
        <div>
          <h3 style={{ margin: '0 0 12px' }}>Khóa trả phí — đặt giá & preview</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {courses.map(c => {
              const f = courseForm[c.id] || {};
              const paid = c.access_type === 'paid';
              return (
                <div key={c.id} style={{ padding: 14, background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                    <b style={{ fontSize: '0.9rem' }}>{c.title}</b>
                    <span style={{
                      padding: '2px 10px', borderRadius: 10, fontSize: '0.75rem',
                      background: paid ? 'var(--red)' : 'var(--hover)', color: paid ? '#fff' : 'var(--text)',
                    }}>
                      {paid ? 'Trả phí' : 'Miễn phí'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 8 }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: 4 }}>Giá (đ)</label>
                      <input type="number" value={f.price ?? c.price ?? ''} onChange={e => setCourseForm({ ...courseForm, [c.id]: { ...f, price: e.target.value } })} style={{ ...inputStyle, width: 130 }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: 4 }}>Giá khuyến mãi (đ, tùy chọn)</label>
                      <input type="number" value={f.sale_price ?? c.sale_price ?? ''} onChange={e => setCourseForm({ ...courseForm, [c.id]: { ...f, sale_price: e.target.value } })} style={{ ...inputStyle, width: 130 }} />
                    </div>
                    <button onClick={() => handleSavePaid(c.id)} style={{ padding: '0.45rem 1rem', borderRadius: 6, border: 'none', background: 'var(--red)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                      Đặt trả phí
                    </button>
                    {paid && (
                      <button onClick={() => handleSetFree(c.id)} style={{ padding: '0.45rem 1rem', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card-bg)', cursor: 'pointer' }}>
                        Chuyển miễn phí
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: 4 }}>Bài học preview</label>
                      <select value={f.preview_lesson_id ?? ''} onChange={e => setCourseForm({ ...courseForm, [c.id]: { ...f, preview_lesson_id: e.target.value } })} style={inputStyle}>
                        <option value="">-- Chọn bài --</option>
                        {(lessons.filter(l => l.course_id === c.id)).map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 2, minWidth: 200 }}>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: 4 }}>Đoạn xem trước</label>
                      <input
                        value={f.preview_text ?? ''}
                        onChange={e => setCourseForm({ ...courseForm, [c.id]: { ...f, preview_text: e.target.value } })}
                        placeholder="Đoạn trích hiển thị cho người chưa mua..."
                        style={inputStyle}
                      />
                    </div>
                    <button onClick={() => handleSavePreview(c.id)} style={{ padding: '0.45rem 1rem', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card-bg)', cursor: 'pointer' }}>
                      Lưu preview
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div style={{ maxWidth: 480 }}>
          <h3 style={{ margin: '0 0 12px' }}>Cấu hình QR chuyển khoản</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }}>Ngân hàng</label>
              <input value={settings.bank_name || ''} onChange={e => setSettings({ ...settings, bank_name: e.target.value })} placeholder="VD: Vietcombank" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }}>Số tài khoản</label>
              <input value={settings.account_number || ''} onChange={e => setSettings({ ...settings, account_number: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }}>Chủ tài khoản</label>
              <input value={settings.account_holder || ''} onChange={e => setSettings({ ...settings, account_holder: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }}>Tiền tố nội dung chuyển khoản</label>
              <input value={settings.content_prefix || ''} onChange={e => setSettings({ ...settings, content_prefix: e.target.value })} style={inputStyle} />
            </div>
            <button onClick={handleSaveSettings} style={{
              padding: '0.6rem 1.5rem', borderRadius: 8, border: 'none',
              background: 'var(--red)', color: '#fff', cursor: 'pointer', fontWeight: 600,
            }}>
              Lưu cấu hình
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
