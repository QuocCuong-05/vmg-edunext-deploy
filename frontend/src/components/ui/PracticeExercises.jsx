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

// ============ ⑥ Ghép đôi (matching) ============
export function Match({ lesson, questions, answers, onCompleted }) {
  const showToast = useToast();
  const [results, setResults] = useState(answers || {});
  const [pairs, setPairs] = useState({});      // { [qid]: { [leftIdx]: rightIdx } }
  const [shuffled, setShuffled] = useState({}); // { [qid]: string[] } (cột phải đã xáo trộn)
  const [selLeft, setSelLeft] = useState(null); // { qid, leftIdx }
  const [busyId, setBusyId] = useState(null);

  const leftItems = (q) => (q.text_content || '').split('\n').map(s => s.trim()).filter(Boolean);
  const rightOpts = (q) => (q.options || []);
  const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  useEffect(() => {
    const init = {};
    for (const q of questions) init[q.id] = shuffle(rightOpts(q));
    setShuffled(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  const answered = questions.length > 0 && questions.every(q => results[q.id]);

  const assign = (qid, leftIdx, rightIdx) => {
    setPairs(prev => {
      const cur = { ...(prev[qid] || {}) };
      for (const k of Object.keys(cur)) if (Number(cur[k]) === rightIdx) delete cur[k];
      cur[leftIdx] = rightIdx;
      return { ...prev, [qid]: cur };
    });
  };
  const unassignLeft = (qid, leftIdx) => {
    setPairs(prev => { const cur = { ...(prev[qid] || {}) }; delete cur[leftIdx]; return { ...prev, [qid]: cur }; });
  };
  const redo = (q) => {
    setResults(prev => { const n = { ...prev }; delete n[q.id]; return n; });
    setPairs(prev => { const n = { ...prev }; delete n[q.id]; return n; });
    setSelLeft(null);
  };

  const submit = async (q) => {
    const p = pairs[q.id] || {};
    const lefts = leftItems(q);
    const rights = shuffled[q.id] || rightOpts(q);
    const given = lefts.map((_, i) => (p[i] == null ? '' : (rights[p[i]] || '')));
    if (given.every(g => !g)) { showToast('Hãy ghép ít nhất 1 cặp', 'error'); return; }
    setBusyId(q.id);
    try {
      const res = await api.practice.answer({ lesson_id: lesson.id, question_id: q.id, answer: JSON.stringify(given) });
      setResults(prev => ({ ...prev, [q.id]: res }));
      const exp = res.correct || [];
      const cc = given.filter((g, i) => (g || '').trim().toLowerCase() === (exp[i] || '').trim().toLowerCase()).length;
      showToast(res.is_correct ? 'Chính xác!' : `Đúng ${cc}/${exp.length} cặp`, res.is_correct ? 'success' : 'error');
    } catch (e) { showToast(e.message || 'Lỗi', 'error'); } finally { setBusyId(null); }
  };

  const renderFeedback = (q, res) => {
    const lefts = leftItems(q);
    const exp = (res && res.correct) ? res.correct : (q.correct || []);
    let given = [];
    try { given = JSON.parse(res.answer || '[]'); } catch { given = []; }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {lefts.map((l, i) => {
          const chosen = given[i] || '';
          const ok = (chosen || '').trim().toLowerCase() === (exp[i] || '').trim().toLowerCase();
          return (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, flexWrap: 'wrap' }}>
              <span style={{ minWidth: 90 }}>{l}</span>
              <span style={{ color: ok ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>{chosen || '—'} {ok ? '✓' : '✗'}</span>
              {!ok && <span style={{ color: 'var(--muted)', fontSize: 12 }}>(đáp án: {exp[i]})</span>}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {questions.map((q, qi) => {
        const res = results[q.id];
        const lefts = leftItems(q);
        const rights = shuffled[q.id] || rightOpts(q);
        const p = pairs[q.id] || {};
        const leftAtRight = (ri) => Object.keys(p).find(li => Number(p[li]) === ri);
        const graded = !!res;
        return (
          <div key={q.id} style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 16, background: BASE }}>
            {questions.length > 1 && <div style={{ fontWeight: 800, marginBottom: 8 }}>Câu {qi + 1}</div>}
            {q.prompt && <p style={{ fontSize: 13, margin: '0 0 8px' }}>{q.prompt}</p>}
            <AudioRow src={q.audio_url} />
            {graded ? renderFeedback(q, res) : (
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Cột trái (kéo / bấm chọn)</div>
                  {lefts.map((l, li) => {
                    const isSel = selLeft && selLeft.qid === q.id && selLeft.leftIdx === li;
                    const placed = p[li] != null;
                    return (
                      <div
                        key={li}
                        draggable={!graded}
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', String(li))}
                        onClick={() => !graded && setSelLeft(prev => (prev && prev.qid === q.id && prev.leftIdx === li) ? null : { qid: q.id, leftIdx: li })}
                        style={{ padding: '8px 10px', marginBottom: 8, borderRadius: 10, cursor: graded ? 'default' : 'grab', userSelect: 'none',
                          border: `1px solid ${isSel ? 'var(--gold)' : 'var(--line)'}`,
                          background: isSel ? 'var(--gold-bg)' : placed ? 'var(--surface-hover)' : 'var(--surface)',
                          fontWeight: placed ? 800 : 500 }}
                      >
                        {l} {placed ? '🔗' : ''}
                      </div>
                    );
                  })}
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Cột phải (thả / bấm để ghép)</div>
                  {rights.map((r, ri) => {
                    const li = leftAtRight(ri);
                    return (
                      <div
                        key={ri}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); const li2 = Number(e.dataTransfer.getData('text/plain')); if (!Number.isNaN(li2) && !graded) assign(q.id, li2, ri); }}
                        onClick={() => { if (graded) return; if (selLeft && selLeft.qid === q.id) { assign(q.id, selLeft.leftIdx, ri); setSelLeft(null); } else if (li != null) { unassignLeft(q.id, Number(li)); } }}
                        style={{ padding: '8px 10px', marginBottom: 8, borderRadius: 10, border: '1px dashed var(--line)', background: 'var(--surface)', minHeight: 38, display: 'flex', alignItems: 'center', gap: 6, cursor: graded ? 'default' : 'pointer' }}
                      >
                        {li != null && (
                          <span style={{ background: 'var(--gold-bg)', color: 'var(--gold)', fontWeight: 800, padding: '2px 6px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {lefts[Number(li)]}
                            <span style={{ cursor: graded ? 'default' : 'pointer' }} onClick={(e) => { e.stopPropagation(); if (!graded) unassignLeft(q.id, Number(li)); }}>×</span>
                          </span>
                        )}
                        <span style={{ color: 'var(--muted)', fontSize: 12 }}>{r}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div style={{ marginTop: 12 }}>
              <Button size="sm" variant={graded ? 'ghost' : 'primary'} isDisabled={busyId === q.id || (!graded && !Object.keys(p).length)} onClick={() => graded ? redo(q) : submit(q)}>
                {graded ? 'Làm lại' : 'Kiểm tra'}
              </Button>
            </div>
          </div>
        );
      })}
      {!questions.length && <div className="placeholder"><p>Chưa có câu hỏi.</p></div>}
      <div>
        <Button variant="primary" onClick={onCompleted} isDisabled={!answered}>
          {answered ? 'Hoàn thành bài tập ✓' : 'Ghép hết câu hỏi để hoàn thành'}
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