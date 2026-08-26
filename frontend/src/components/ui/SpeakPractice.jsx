import { useState, useRef, useCallback, useEffect } from 'react';
import { api } from '../../lib/api';
import Button from './Button';
import { useToast } from './Toast';

function browserRecognition() {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

const norm = (s) => (s || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const lev = (a, b) => {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1)
      );
    }
    prev = cur;
  }
  return prev[n];
};

const similarity = (a, b) => {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  return 1 - lev(a, b) / Math.max(a.length, b.length);
};

// So khớp từ mục tiêu với transcript (chuẩn H5P SpeakTheWords):
// khớp chính xác/chứa trong chuỗi, hoặc tương đồng >= 75% theo từng token
export function matchWord(target, heard) {
  const t = norm(target);
  const h = norm(heard);
  if (!h) return false;
  if (h === t || h.includes(t)) return true;
  const tw = t.split(' ').filter(Boolean);
  const hw = h.split(' ').filter(Boolean);
  const used = new Set();
  let hits = 0;
  for (const w of tw) {
    let best = 0;
    let bi = -1;
    hw.forEach((x, i) => {
      if (!used.has(i)) {
        const s = similarity(w, x);
        if (s > best) { best = s; bi = i; }
      }
    });
    if (best >= 0.75) { hits += 1; used.add(bi); }
  }
  return hits >= Math.ceil(tw.length * 0.8);
}

const LISTEN_TIMEOUT_MS = 8000;

export default function SpeakPractice({ lesson, words, onCompleted }) {
  const showToast = useToast();
  const list = words || [];
  const supported = !!browserRecognition();

  const [phase, setPhase] = useState('intro'); // intro | word | result
  const [idx, setIdx] = useState(0);
  const [listening, setListening] = useState(false);
  const [attempt, setAttempt] = useState(null); // {heard, correct} — lần đọc gần nhất của từ hiện tại
  const [answers, setAnswers] = useState({}); // idx -> {heard, correct}
  const [sending, setSending] = useState(false);
  const recRef = useRef(null);
  const timerRef = useRef(null);

  const stopListening = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (recRef.current) {
      const r = recRef.current;
      recRef.current = null;
      try { r.onend = null; r.stop(); } catch {}
    }
    setListening(false);
  }, []);

  useEffect(() => () => stopListening(), [stopListening]);

  const applyResult = (text) => {
    const w = list[idx];
    if (!w) return;
    const res = { heard: text, correct: text ? matchWord(w.word, text) : false };
    setAttempt(res);
    setAnswers((prev) => ({ ...prev, [idx]: res }));
  };

  const startListening = async () => {
    if (!supported || listening) return;
    const Ctor = browserRecognition();
    try {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        showToast('Không truy cập được mic. Hãy cho phép quyền microphone.', 'error');
        return;
      }
      const recognition = new Ctor();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      let finalText = '';
      recognition.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
        }
      };
      recognition.onerror = () => {
        if (recRef.current === recognition) recRef.current = null;
        setListening(false);
      };
      recognition.onend = () => {
        if (recRef.current === recognition) recRef.current = null;
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
        setListening(false);
        applyResult(finalText.trim());
      };
      recRef.current = recognition;
      setAttempt(null);
      setListening(true);
      recognition.start();
      timerRef.current = setTimeout(() => {
        if (recRef.current === recognition) {
          try { recognition.stop(); } catch {}
        }
      }, LISTEN_TIMEOUT_MS);
    } catch {
      setListening(false);
      showToast('Không bắt đầu được nhận diện giọng nói.', 'error');
    }
  };

  const goTo = (i) => {
    stopListening();
    setIdx(i);
    setAttempt(answers[i] || null);
  };

  const restart = () => {
    stopListening();
    setAnswers({});
    setAttempt(null);
    setIdx(0);
    setPhase('word');
  };

  const correctCount = list.reduce((n, _, i) => n + (answers[i]?.correct ? 1 : 0), 0);

  const handleComplete = async () => {
    setSending(true);
    const total = list.length;
    const missed = list.filter((w, i) => !answers[i]?.correct).map((w) => w.word);
    try {
      await api.practice.submit({
        lesson_id: lesson.id,
        practice_word_id: null,
        word: `Luyện nói từng từ: ${correctCount}/${total} đúng`,
        audio_b64: null,
        filename: null,
        transcript: list.map((w, i) => `${w.word} → "${answers[i]?.heard || ''}"`).join('; '),
        practice_type: 'speak_passage',
        local_score: total ? Math.round((correctCount / total) * 10) : null,
        local_detail: missed.length ? `Chưa đạt: ${missed.join(', ')}` : 'Đọc tốt tất cả các từ.',
      });
    } catch (e) {
      showToast(e.message || 'Không lưu được kết quả.', 'error');
      setSending(false);
      return;
    }
    setSending(false);
    onCompleted();
  };

  /* ==================== INTRO ==================== */
  if (phase === 'intro') {
    return (
      <div style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 28, background: 'var(--card)', textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>🎤</div>
        <h3 style={{ margin: '8px 0 4px', fontSize: 17 }}>Luyện nói — đọc từng từ</h3>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 6px' }}>
          {list.length} từ cần đọc · mỗi lần hiện 1 từ, bấm mic và đọc rõ từ đó
        </p>
        {!supported && (
          <p style={{ fontSize: 12, color: 'var(--red)', margin: '0 0 6px' }}>
            ⚠️ Trình duyệt này không hỗ trợ nhận diện giọng nói. Hãy dùng Chrome hoặc Edge.
          </p>
        )}
        <Button variant="primary" isDisabled={!supported || !list.length} onClick={() => setPhase('word')}>
          ▶ Bắt đầu chương trình!
        </Button>
      </div>
    );
  }

  /* ==================== RESULT ==================== */
  if (phase === 'result') {
    const pct = list.length ? Math.round((correctCount / list.length) * 100) : 0;
    return (
      <div style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 24, background: 'var(--card)', textAlign: 'center' }}>
        <div style={{ fontSize: 34, fontWeight: 900 }}>{correctCount}/{list.length} đúng</div>
        <div style={{ height: 10, borderRadius: 999, background: 'var(--surface-hover)', margin: '14px auto', maxWidth: 360, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: pct >= 60 ? 'var(--green)' : 'var(--red)', transition: 'width .4s' }} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
          {pct >= 80 ? 'Tuyệt vời! 🎉' : pct >= 50 ? 'Khá ổn, luyện thêm nhé!' : 'Thử lại để cải thiện nào!'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 18 }}>
          {list.map((w, i) => (
            <span key={w.id} style={{ padding: '4px 10px', borderRadius: 999, fontSize: 13, fontWeight: 700, background: answers[i]?.correct ? 'var(--green-bg)' : 'var(--red-bg)', border: `1px solid ${answers[i]?.correct ? 'var(--green)' : 'var(--red)'}` }}>
              {answers[i]?.correct ? '✓' : '✗'} {w.word}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="ghost" onClick={restart}>🔄 Thử lại</Button>
          <Button variant="primary" isDisabled={sending} onClick={handleComplete}>
            {sending ? 'Đang lưu...' : '✓ Hoàn thành bài tập'}
          </Button>
        </div>
      </div>
    );
  }

  /* ==================== WORD SLIDE ==================== */
  const w = list[idx];
  if (!w) return null;
  const isLast = idx >= list.length - 1;
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 24, background: 'var(--card)' }}>
      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>Từ {idx + 1}/{list.length}</span>
        <Button size="sm" variant="ghost" onClick={() => { stopListening(); setPhase('result'); }}>Xem kết quả</Button>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: 'var(--surface-hover)', overflow: 'hidden', marginBottom: 22 }}>
        <div style={{ width: `${((idx + (attempt ? 1 : 0)) / list.length) * 100}%`, height: '100%', background: 'var(--red)', transition: 'width .3s' }} />
      </div>

      {/* Word */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-block', padding: '14px 34px', borderRadius: 16, background: 'var(--surface-hover)', fontSize: 32, fontWeight: 900, letterSpacing: 0.5 }}>
          {w.word}
        </div>
        {w.audio_url && (
          <div style={{ marginTop: 12 }}>
            <audio controls src={w.audio_url} preload="none" style={{ height: 36, maxWidth: 220 }} />
          </div>
        )}

        {/* Mic */}
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          {!listening ? (
            <Button variant={attempt ? 'ghost' : 'primary'} onClick={startListening}>
              {attempt ? '🎙️ Đọc lại' : '🎙️ Nhấn để nói'}
            </Button>
          ) : (
            <>
              <span className="sp-listening">🔴 Đang nghe...</span>
              <Button size="sm" variant="ghost" onClick={stopListening}>Dừng</Button>
            </>
          )}
        </div>

        {/* Feedback */}
        {attempt && !listening && (
          <div style={{
            marginTop: 16, padding: '10px 14px', borderRadius: 12, fontSize: 13, textAlign: 'left',
            background: attempt.heard === '' ? '#fef9c3' : attempt.correct ? 'var(--green-bg)' : 'var(--red-bg)',
            border: `1px solid ${attempt.heard === '' ? '#eab308' : attempt.correct ? 'var(--green)' : 'var(--red)'}`,
          }}>
            {attempt.heard === ''
              ? <>🔇 Tôi không thể nghe thấy bạn — đảm bảo microphone được bật và hãy nói to hơn.</>
              : attempt.correct
                ? <>✓ Câu trả lời của bạn đã được hiểu là: <b>{attempt.heard}</b></>
                : <>✗ Đã hiểu là: <b>{attempt.heard}</b> — chưa khớp với <b>{w.word}</b>, thử đọc lại nhé!</>}
          </div>
        )}

        {/* Next */}
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
          <Button variant="primary" onClick={() => (isLast ? setPhase('result') : goTo(idx + 1))}>
            {isLast ? '🏁 Xem kết quả' : 'Câu tiếp theo →'}
          </Button>
        </div>
      </div>
    </div>
  );
}
