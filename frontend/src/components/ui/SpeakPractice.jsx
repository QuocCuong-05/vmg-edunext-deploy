import { useState, useRef, useCallback, useEffect } from 'react';
import { api } from '../../lib/api';
import Button from './Button';
import { useToast } from './Toast';

function browserRecognition() {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

export default function SpeakPractice({ lesson, words, onCompleted }) {
  const showToast = useToast();
  const [results, setResults] = useState({});
  const [busy, setBusy] = useState({});
  const [recordState, setRecordState] = useState({}); // wordId -> {recording, blobUrl, transcript}
  const mediaRecorderRef = useRef({});
  const chunksRef = useRef({});
  const recognitionRef = useRef({});

  const cleanupRec = useCallback((wordId) => {
    if (recognitionRef.current[wordId]) {
      try { recognitionRef.current[wordId].onend = null; recognitionRef.current[wordId].stop(); } catch {}
      recognitionRef.current[wordId] = null;
    }
    if (mediaRecorderRef.current[wordId] && mediaRecorderRef.current[wordId].state !== 'inactive') {
      try { mediaRecorderRef.current[wordId].stop(); } catch {}
    }
    mediaRecorderRef.current[wordId] = null;
  }, []);

  useEffect(() => {
    return () => { Object.keys(recognitionRef.current).forEach(cleanupRec); };
  }, [cleanupRec]);

  const startRecording = async (wordId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current[wordId] = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current[wordId].push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current[wordId] || [], { type: rec.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordState(prev => ({
          ...prev,
          [wordId]: { ...(prev[wordId] || {}), recording: false, blobUrl: url, blob },
        }));
        chunksRef.current[wordId] = [];
      };
      rec.start();
      mediaRecorderRef.current[wordId] = rec;

      // Transcript song song
      const Ctor = browserRecognition();
      let transcriptText = '';
      if (Ctor) {
        try {
          const recognition = new Ctor();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = 'en-US';
          recognition.onresult = (e) => {
            let t = '';
            for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
            transcriptText = t.trim();
            setRecordState(prev => ({ ...prev, [wordId]: { ...(prev[wordId] || {}), transcript: transcriptText } }));
          };
          recognition.onend = () => {
            setRecordState(prev => ({ ...prev, [wordId]: { ...(prev[wordId] || {}), transcript: transcriptText } }));
            recognitionRef.current[wordId] = null;
          };
          recognition.onerror = () => { recognitionRef.current[wordId] = null; };
          recognition.start();
          recognitionRef.current[wordId] = recognition;
        } catch {}
      }

      setRecordState(prev => ({ ...prev, [wordId]: { ...(prev[wordId] || {}), recording: true } }));
    } catch (err) {
      showToast('Không truy cập được mic. Hãy cho phép quyền microphone.', 'error');
    }
  };

  const stopRecording = (wordId) => {
    if (mediaRecorderRef.current[wordId]) {
      try { mediaRecorderRef.current[wordId].stop(); } catch {}
    }
    if (recognitionRef.current[wordId]) {
      try { recognitionRef.current[wordId].stop(); } catch {}
    }
  };

  const submit = async (word) => {
    const st = recordState[word.id] || {};
    if (!st.blob) return;
    setBusy(prev => ({ ...prev, [word.id]: true }));
    try {
      const b64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
        reader.onerror = reject;
        reader.readAsDataURL(st.blob);
      });
      const res = await api.practice.submit({
        lesson_id: lesson.id,
        practice_word_id: word.id,
        word: word.word,
        audio_b64: b64,
        filename: `${word.word}-rec.webm`,
        transcript: st.transcript || '',
      });
      setResults(prev => ({ ...prev, [word.id]: res }));
      showToast(res.ai_score != null ? `Chấm xong: ${res.ai_score}/10` : 'Đã gửi bài', 'success');
    } catch (err) {
      showToast(err.message || 'Gửi bài thất bại', 'error');
    } finally {
      setBusy(prev => ({ ...prev, [word.id]: false }));
    }
  };

  const allSubmitted = words.length > 0 && words.every(w => results[w.id]);
  const someSubmitted = Object.keys(results).length > 0;

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {(words || []).map((word, i) => {
          const st = recordState[word.id] || {};
          const res = results[word.id];
          return (
            <div key={word.id} style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 16, background: 'var(--card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--red-bg)', color: 'var(--red)', fontWeight: 800, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{i + 1}</div>
                {word.image_url && (
                  <img src={word.image_url} alt={word.word} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--line)', flexShrink: 0 }} />
                )}
                <b style={{ fontSize: 20, letterSpacing: 0.3 }}>{word.word}</b>
                {word.audio_url && (
                  <audio controls src={word.audio_url} preload="none" style={{ height: 38, maxWidth: 180 }} />
                )}
                {!word.audio_url && (
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>Chưa có audio mẫu</span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                {!st.recording ? (
                  <Button size="sm" variant={st.blobUrl ? 'ghost' : 'primary'} onClick={() => startRecording(word.id)}>
                    {st.blobUrl ? '🎙️ Ghi lại' : '🎙️ Bật mic đọc từ này'}
                  </Button>
                ) : (
                  <>
                    <span style={{ fontSize: 13, color: 'var(--red)', fontWeight: 700 }}>Đang ghi...</span>
                    <Button size="sm" variant="primary" onClick={() => stopRecording(word.id)}>Dừng</Button>
                  </>
                )}

                {st.blobUrl && !st.recording && (
                  <>
                    <audio controls src={st.blobUrl} style={{ height: 38, maxWidth: 180 }} />
                    <Button size="sm" variant="ghost" isDisabled={busy[word.id] || !!res} onClick={() => submit(word)}>
                      {busy[word.id] ? 'Đang chấm...' : (res ? 'Đã chấm' : 'Gửi chấm điểm')}
                    </Button>
                  </>
                )}
              </div>

              {res && (
                <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: res.ai_score != null && res.ai_score >= 6 ? 'var(--green-bg)' : 'var(--red-bg)', border: `1px solid ${res.ai_score != null && res.ai_score >= 6 ? 'var(--green)' : 'var(--red)'}` }}>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>
                    {res.ai_score != null ? `Điểm: ${res.ai_score}/10` : 'Chưa chấm được'}
                    {res.teacher_score != null && <span> · Giáo viên chấm: {res.teacher_score}/10</span>}
                  </div>
                  {res.ai_feedback && <p style={{ fontSize: 12, lineHeight: 1.6, margin: 0 }}>{res.ai_feedback}</p>}
                </div>
              )}
            </div>
          );
        })}

        {!words.length && (
          <div className="placeholder">
            <p>Chưa có từ nào trong bài luyện nói này. Quản trị viên sẽ cập nhật sớm.</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <Button
          variant="primary"
          onClick={onCompleted}
          isDisabled={!someSubmitted}
        >
          {allSubmitted ? 'Hoàn thành bài tập ✓' : 'Đánh dấu hoàn thành'}
        </Button>
        {!someSubmitted && (
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>Gửi ít nhất 1 từ để hoàn thành bài tập.</p>
        )}
      </div>
    </div>
  );
}
