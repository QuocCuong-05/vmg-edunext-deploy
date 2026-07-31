import { useState, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const ALLOWED_TABLES = [
  'classroom_phrase_categories', 'classroom_phrases',
  'quiz_sets', 'quiz_questions', 'quiz_options',
  'vocabulary_entries', 'tips', 'quests', 'rewards',
  'courses', 'lessons', 'level_challenges',
];

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
        body: JSON.stringify({ table, rows: preview.rows }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setStatus(`Imported ${data.imported} rows into ${data.table}`);
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
          {busy ? 'Importing...' : 'Import (truncate + insert)'}
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
