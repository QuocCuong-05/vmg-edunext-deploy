import { useState, useRef, useCallback, useEffect } from 'react';
import { api } from '../../lib/api';
import Button from './Button';
import { useToast } from './Toast';

const BASE = 'var(--surface-hover)';

function AudioRow({ src, label = 'Nghe' }) {
  if (!src) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{label}:</span>
      <audio controls src={src} preload="none" style={{ height: 36, maxWidth: 220 }} />
    </div>
  );
}

function ResultBox({ res }) {
  if (!res) return null;
  const ok = res.is_correct;
  return (
    <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: ok ? 'var(--green-bg)' : 'var(--red-bg)', color: ok ? 'var(--green)' : 'var(--red)', border: `1px solid ${ok ? 'var(--green)' : 'var(--red)'}` }}>
      {ok ? '✓ Chính xác! +10 điểm' : `✗ Chưa đúng${res.correct != null && res.correct !== '' ? ` — Đáp án đúng: ${Array.isArray(res.correct) ? res.correct.join(', ') : res.correct}` : ''}`}
    </div>
  );
}

// ============ ③ Nghe → chọn đáp án ============
export function ListenChoose({ lesson, questions, answers, onCompleted }) {
  const showToast = useToast();
  const [results, setResults] = useState(answers || {});
  const [busyId, setBusyId] = useState(null);

  const submit = async (q, idx) => {
    setBusyId(q.id);
    try {
      const res = await api.practice.answer({ lesson_id: lesson.id, question_id: q.id, answer: String(idx) });
      setResults(prev => ({ ...prev, [q.id]: res }));
      showToast(res.is_correct ? 'Chính xác!' : 'Chưa đúng', res.is_correct ? 'success' : 'error');
    } catch (e) { showToast(e.message || 'Lỗi', 'error'); } finally { setBusyId(null); }
  };

  const answered = questions.length > 0 && questions.every(q => results[q.id]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {questions.map((q, i) => (
        <div key={q.id} style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 16, background: BASE }}>
          {questions.length > 1 && <div style={{ fontWeight: 800, marginBottom: 8 }}>Câu {i + 1}</div>}
          {q.prompt && <p style={{ fontSize: 13, margin: '0 0 8px' }}>{q.prompt}</p>}
          <AudioRow src={q.audio_url} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {(q.options || []).map((opt, idx) => {
              const res = results[q.id];
              const isSel = res && Number(res.answer) === idx;
              return (
                <button
                  key={idx}
                  onClick={() => !res && !busyId && submit(q, idx)}
                  disabled={!!res || busyId === q.id}
                  style={{
                    textAlign: 'left', padding: '10px 14px', borderRadius: 10, cursor: res ? 'default' : 'pointer',
                    fontSize: 13, border: `1px solid ${res && Number(res.correct) === idx ? 'var(--green)' : res && isSel && !res.is_correct ? 'var(--red)' : 'var(--line)'}`,
                    background: res && Number(res.correct) === idx ? 'var(--green-bg)' : res && isSel && !res.is_correct ? 'var(--red-bg)' : 'var(--surface-hover)',
                    color: res && (Number(res.correct) === idx || (isSel && !res.is_correct)) ? (Number(res.correct) === idx ? 'var(--green)' : 'var(--red)') : 'var(--ink)',
                    fontWeight: isSel ? 800 : 500,
                  }}
                >
                  {res && Number(res.correct) === idx ? '✓ ' : res && isSel && !res.is_correct ? '✗ ' : ''}{opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {!questions.length && <div className="placeholder"><p>Chưa có câu hỏi.</p></div>}
      <div>
        <Button variant="primary" onClick={onCompleted} isDisabled={!answered}>
          {answered ? 'Hoàn thành bài tập ✓' : 'Trả lời hết câu hỏi để hoàn thành'}
        </Button>
      </div>
    </div>
  );
}

// ============ ⑤ Nghe → điền từ ============
export function ListenFill({ lesson, questions, answers, onCompleted }) {
  const showToast = useToast();
  const [results, setResults] = useState(answers || {});
  const [values, setValues] = useState({});
  const [busyId, setBusyId] = useState(null);

  const submit = async (q) => {
    const list = values[q.id] || [];
    if (!list.length || list.some(v => !v.trim())) return;
    setBusyId(q.id);
    try {
      const res = await api.practice.answer({ lesson_id: lesson.id, question_id: q.id, answer: JSON.stringify(list.map(v => v.trim())) });
      setResults(prev => ({ ...prev, [q.id]: res }));
      showToast(res.is_correct ? 'Chính xác!' : 'Chưa đúng', res.is_correct ? 'success' : 'error');
    } catch (e) { showToast(e.message || 'Lỗi', 'error'); } finally { setBusyId(null); }
  };

  const redo = (q) => {
    setResults(prev => { const n = { ...prev }; delete n[q.id]; return n; });
    setValues(prev => { const n = { ...prev }; delete n[q.id]; return n; });
  };

  const blankCount = (q) => ((q.text_content || '').match(/____/g) || []).length;
  const renderText = (q) => {
    const res = results[q.id];
    const correct = res && res.correct ? res.correct : (q.correct || []);
    const parts = (q.text_content || '').split('____');
    const vals = values[q.id] || [];
    let correctIdx = 0;
    return parts.map((part, i) => (
      <span key={i}>
        {part}
        {i < parts.length - 1 && (
          res ? (
            <b style={{ color: (correct[i] || '').trim().toLowerCase() === (vals[i] || '').trim().toLowerCase() ? 'var(--green)' : 'var(--red)' }}>
              {vals[i] || '...'}
            </b>
          ) : (
            <input
              value={vals[i] || ''}
              onChange={e => {
                const nv = [...vals]; nv[i] = e.target.value;
                setValues({ ...values, [q.id]: nv });
              }}
              style={{ width: Math.min(180, Math.max(60, (vals[i] || '').length * 10)), border: '1px solid var(--line)', borderRadius: 8, padding: '4px 8px', fontSize: 13, margin: '0 4px' }}
            />
          )
        )}
      </span>
    ));
  };

  const answered = questions.length > 0 && questions.every(q => results[q.id]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {questions.map((q, i) => (
        <div key={q.id} style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 16, background: BASE }}>
          {questions.length > 1 && <div style={{ fontWeight: 800, marginBottom: 8 }}>Câu {i + 1}</div>}
          {q.prompt && <p style={{ fontSize: 13, margin: '0 0 8px' }}>{q.prompt}</p>}
          <AudioRow src={q.audio_url} />
          <p style={{ fontSize: 15, lineHeight: 2, margin: '12px 0', whiteSpace: 'pre-wrap' }}>{renderText(q)}</p>
          <Button size="sm" variant={results[q.id] ? 'ghost' : 'primary'} isDisabled={busyId === q.id} onClick={() => results[q.id] ? redo(q) : submit(q)}>
            {results[q.id] ? 'Làm lại' : 'Kiểm tra'}
          </Button>
        </div>
      ))}
      {!questions.length && <div className="placeholder"><p>Chưa có câu hỏi.</p></div>}
      <div>
        <Button variant="primary" onClick={onCompleted} isDisabled={!answered}>
          {answered ? 'Hoàn thành bài tập ✓' : 'Trả lời hết câu hỏi để hoàn thành'}
        </Button>
      </div>
    </div>
  );
}

// ============ ④ Nghe → đánh dấu từ ============
export function ListenMark({ lesson, questions, answers, onCompleted }) {
  const showToast = useToast();
  const [results, setResults] = useState(answers || {});
  const [selected, setSelected] = useState({});
  const [busyId, setBusyId] = useState(null);

  const tokens = (q) => (q.text_content || '').split(/(\s+)/).filter(Boolean);

  const submit = async (q) => {
    const sel = selected[q.id] || [];
    if (!sel.length) return;
    setBusyId(q.id);
    try {
      const res = await api.practice.answer({ lesson_id: lesson.id, question_id: q.id, answer: JSON.stringify(sel) });
      setResults(prev => ({ ...prev, [q.id]: res }));
      showToast(res.is_correct ? 'Chính xác!' : 'Chưa đúng', res.is_correct ? 'success' : 'error');
    } catch (e) { showToast(e.message || 'Lỗi', 'error'); } finally { setBusyId(null); }
  };

  const redo = (q) => {
    setResults(prev => { const n = { ...prev }; delete n[q.id]; return n; });
    setSelected(prev => { const n = { ...prev }; delete n[q.id]; return n; });
  };

  const answered = questions.length > 0 && questions.every(q => results[q.id]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {questions.map((q, i) => {
        const res = results[q.id];
        const correctWords = res && res.correct ? res.correct.map(w => w.toLowerCase()) : (q.correct || []).map(w => w.toLowerCase());
        return (
          <div key={q.id} style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 16, background: BASE }}>
          {questions.length > 1 && <div style={{ fontWeight: 800, marginBottom: 8 }}>Câu {i + 1}</div>}
            {q.prompt && <p style={{ fontSize: 13, margin: '0 0 8px' }}>{q.prompt}</p>}
            <AudioRow src={q.audio_url} />
            <p style={{ fontSize: 16, lineHeight: 2.2, margin: '12px 0', userSelect: 'none', whiteSpace: 'pre-wrap' }}>
              {tokens(q).map((tok, ti) => {
                const isSpace = /^\s+$/.test(tok);
                if (isSpace) return <span key={ti}>{tok}</span>;
                const clean = tok.replace(/[^a-zA-Z']/g, '').toLowerCase();
                const sel = (selected[q.id] || []).includes(tok);
                const inCorrect = res && sel && clean && correctWords.includes(clean);
                const selWrong = res && sel && clean && !correctWords.includes(clean);
                const missed = res && !sel && clean && correctWords.includes(clean);
                return (
                  <span
                    key={ti}
                    onClick={() => !res && setSelected(prev => {
                      const cur = prev[q.id] || [];
                      return { ...prev, [q.id]: cur.includes(tok) ? cur.filter(t => t !== tok) : [...cur, tok] };
                    })}
                    style={{
                      cursor: res ? 'default' : 'pointer', margin: '0 2px', padding: '1px 6px', borderRadius: 8,
                      background: inCorrect ? 'var(--green-bg)' : selWrong ? 'var(--red-bg)' : (missed || sel) ? 'var(--gold-bg)' : 'transparent',
                      color: inCorrect ? 'var(--green)' : selWrong ? 'var(--red)' : (missed || sel) ? 'var(--gold)' : 'var(--ink)',
                      fontWeight: sel || inCorrect || missed ? 800 : 500,
                      textDecoration: missed ? 'underline' : (inCorrect ? 'none' : undefined),
                    }}
                  >
                    {tok}
                  </span>
                );
              })}
            </p>
            <Button size="sm" variant={res ? 'ghost' : 'primary'} isDisabled={busyId === q.id || (!res && !(selected[q.id] || []).length)} onClick={() => res ? redo(q) : submit(q)}>
              {res ? 'Làm lại' : 'Kiểm tra'}
            </Button>
          </div>
        );
      })}
      {!questions.length && <div className="placeholder"><p>Chưa có câu hỏi.</p></div>}
      <div>
        <Button variant="primary" onClick={onCompleted} isDisabled={!answered}>
          {answered ? 'Hoàn thành bài tập ✓' : 'Chọn và kiểm tra hết câu hỏi để hoàn thành'}
        </Button>
      </div>
    </div>
  );
}

// ============ ② Ghi âm tự do ============
export function VoiceRecorder({ lesson, questions, answers, onCompleted }) {
  const showToast = useToast();
  const [recording, setRecording] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const [blob, setBlob] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(answers?.submission || null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => () => { if (mediaRecorderRef.current) { try { mediaRecorderRef.current.stop(); } catch {} } }, []);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = e => { if (e.data && e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const b = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        setBlob(b);
        setBlobUrl(URL.createObjectURL(b));
        setRecording(false);
      };
      rec.start();
      mediaRecorderRef.current = rec;
      setRecording(true);
    } catch {
      showToast('Không truy cập được mic. Hãy cho phép quyền microphone.', 'error');
    }
  };

  const stop = () => { if (mediaRecorderRef.current) { try { mediaRecorderRef.current.stop(); } catch {} } };

  const submit = async () => {
    if (!blob) return;
    setBusy(true);
    try {
      const b64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const res = await api.practice.submit({
        lesson_id: lesson.id,
        practice_type: 'voice_recorder',
        audio_b64: b64,
        filename: 'voice-rec.webm',
        transcript: '',
      });
      setResult(res);
      showToast('Đã nộp bài', 'success');
    } catch (e) { showToast(e.message || 'Nộp bài thất bại', 'error'); } finally { setBusy(false); }
  };

  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 18, background: BASE }}>
      <h4 style={{ fontSize: 15, marginBottom: 10 }}>🎙️ Ghi âm bài nói</h4>
      {(lesson.audio_url || (questions[0] && questions[0].audio_url)) && (
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Nghe mẫu:</span>
          <audio controls src={lesson.audio_url || questions[0].audio_url} preload="none" style={{ height: 38, maxWidth: 240, marginLeft: 8 }} />
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {!recording ? (
          <Button size="sm" variant={blobUrl ? 'ghost' : 'primary'} onClick={start}>{blobUrl ? '🎙️ Ghi lại' : '🎙️ Bắt đầu ghi âm'}</Button>
        ) : (
          <>
            <span style={{ fontSize: 13, color: 'var(--red)', fontWeight: 700 }}>Đang ghi...</span>
            <Button size="sm" variant="primary" onClick={stop}>Dừng</Button>
          </>
        )}
        {blobUrl && !recording && (
          <>
            <audio controls src={blobUrl} style={{ height: 38, maxWidth: 220 }} />
            <Button size="sm" variant="ghost" isDisabled={busy || !!result} onClick={submit}>
              {busy ? 'Đang nộp...' : (result ? 'Đã nộp ✓' : 'Nộp bài')}
            </Button>
          </>
        )}
      </div>
      {result && (
        <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: 'var(--green-bg)', border: '1px solid var(--green)' }}>
          <b style={{ fontSize: 13 }}>{result.ai_score != null ? `Điểm AI: ${result.ai_score}/10` : 'Đã nộp, chờ chấm điểm'}</b>
          {result.ai_feedback && <p style={{ fontSize: 12, margin: '4px 0 0' }}>{result.ai_feedback}</p>}
          {result.teacher_score != null && <p style={{ fontSize: 12, margin: '4px 0 0' }}>Giáo viên chấm: {result.teacher_score}/10</p>}
        </div>
      )}
      <div style={{ marginTop: 16 }}>
        <Button variant="primary" onClick={onCompleted} isDisabled={!result}>
          {result ? 'Hoàn thành bài tập ✓' : 'Nộp bài để hoàn thành'}
        </Button>
      </div>
    </div>
  );
}