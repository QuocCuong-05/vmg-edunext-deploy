import { useState, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';

const API_BASE = __API_URL__ || '/api';

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
  rewards: { required: ['name','desc_text','price','icon_type','content_type','content_json','stock','is_active'] },
  courses: { required: ['title','slug','description','level','category','duration_hours','lesson_count','instructor','is_published'], optional: ['id'] },
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

export default function AdminData() {
  const { user } = useAuth();
  const [table, setTable] = useState('');
  const [csvText, setCsvText] = useState('');
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState('replace');
  const fileRef = useRef(null);

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

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
      <h2 style={{ marginBottom: '0.5rem' }}>Admin — Data Import</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
        Logged in as <strong>{user?.email}</strong> (role: {user?.role})
      </p>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>Table</label>
        <select
          value={table}
          onChange={e => { setTable(e.target.value); handleClearFile(); }}
          style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
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
            <table style={{ fontSize: '0.8rem', width: '100%', borderCollapse: 'collapse' }}>
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

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Mode:</label>
        {['replace', 'append'].map(m => (
          <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: '0.85rem', padding: '4px 12px', borderRadius: 6, background: mode === m ? 'var(--red)' : 'var(--card-bg)', color: mode === m ? '#fff' : 'var(--text)', border: '1px solid', borderColor: mode === m ? 'var(--red)' : 'var(--border)' }}>
            <input type="radio" name="importMode" value={m} checked={mode === m} onChange={() => setMode(m)} style={{ display: 'none' }} />
            {m === 'replace' ? 'Replace (xóa hết cũ, chèn mới)' : 'Append (thêm mới, bỏ qua trùng)'}
          </label>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button
          onClick={handleImport}
          disabled={busy || !preview || !table}
          style={{
            padding: '0.6rem 1.5rem',
            borderRadius: 8,
            border: 'none',
            background: busy ? 'var(--text-muted)' : 'var(--red)',
            color: '#fff',
            cursor: busy || !preview || !table ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          {busy ? 'Importing...' : mode === 'replace' ? 'Import (truncate + insert)' : 'Import (append, skip duplicates)'}
        </button>

        {csvText && (
          <button
            onClick={handleClearFile}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--card-bg)',
              color: 'var(--text)',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        )}
      </div>

      {status && (
        <p style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--card-bg)', borderRadius: 8, color: 'var(--accent-green)' }}>
          {status}
        </p>
      )}

      {error && (
        <p style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--card-bg)', borderRadius: 8, color: 'var(--red)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
