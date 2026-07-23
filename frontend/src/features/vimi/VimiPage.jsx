import { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from '../../lib/icons';
import { useSpeechRecognition } from '../../lib/useSpeechRecognition';
import { useStreamChat } from '../../lib/useStreamChat';
import { API_BASE } from '../../lib/api';

const SUGGESTIONS = [
  'Classroom English là gì?',
  'Giải thích CLIL',
  'Cách đưa feedback',
  'Gợi ý hoạt động warm-up',
  'Tips giảng dạy',
  'Từ vựng scaffold là gì?',
];

const SPEAKING_Q = [
  { en: 'What subject do you teach?', vi: 'Bạn dạy môn gì?' },
  { en: 'How long have you been teaching?', vi: 'Bạn dạy học bao lâu rồi?' },
  { en: 'Describe a memorable teaching moment.', vi: 'Hãy kể về một khoảnh khắc dạy học đáng nhớ.' },
  { en: 'What is your favorite teaching method?', vi: 'Phương pháp giảng dạy yêu thích của bạn là gì?' },
  { en: 'How do you motivate students?', vi: 'Bạn làm thế nào để tạo động lực cho học sinh?' },
  { en: 'Explain how you use group work in your classroom.', vi: 'Giải thích cách bạn tổ chức hoạt động nhóm trong lớp.' },
  { en: 'Describe a challenge you faced in the classroom.', vi: 'Kể về một thử thách bạn gặp phải trong lớp học.' },
  { en: 'How do you assess student understanding?', vi: 'Bạn đánh giá mức độ hiểu bài của học sinh như thế nào?' },
];

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function renderLine(line, i) {
  return (
    <div key={i} style={{ lineHeight: 1.7 }}>
       {line.startsWith('#') ? <strong>{line.slice(1)}</strong> :
        line.startsWith('•') || line.startsWith('-') ? <span style={{ display: 'block', paddingLeft: 8 }}>{renderInline(line)}</span> :
       line.startsWith('_') && line.endsWith('_') ? <em>{line.slice(1, -1)}</em> :
       renderInline(line)}
    </div>
  );
}

function parseFeedback(text) {
  const braceStart = text.indexOf('{');
  const braceEnd = text.lastIndexOf('}');
  if (braceStart === -1 || braceEnd <= braceStart) return null;
  try {
    const parsed = JSON.parse(text.slice(braceStart, braceEnd + 1));
    if (parsed && parsed.type === 'speaking_feedback') return parsed;
  } catch {}
  return null;
}

function SpeakingFeedbackCard({ feedback, originalText }) {
  return (
    <div style={{ marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
      {feedback.reaction && (
        <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--muted)', marginBottom: 8 }}>{feedback.reaction}</p>
      )}
      {feedback.comment && (
        <div style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--red)', marginBottom: 4 }}>Nhận xét</p>
          <p style={{ fontSize: 13, lineHeight: 1.6 }}>{feedback.comment}</p>
        </div>
      )}
      {feedback.correctedResponse && (
        <div style={{ marginBottom: 8, background: 'rgba(189,23,48,0.04)', borderRadius: 8, padding: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--red)', marginBottom: 4 }}>Sửa lỗi</p>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 2 }}>Bạn nói:</p>
          <p style={{ fontSize: 13, lineHeight: 1.6, textDecoration: 'line-through', color: 'var(--red)' }}>{originalText}</p>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4, marginBottom: 2 }}>Sửa thành:</p>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--green)' }}>{feedback.correctedResponse}</p>
        </div>
      )}
      {feedback.expansionIdeas?.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--red)', marginBottom: 4 }}>Mở rộng ý</p>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, lineHeight: 1.8 }}>
            {feedback.expansionIdeas.map((idea, i) => <li key={i}>{idea}</li>)}
          </ul>
        </div>
      )}
      {feedback.improvedResponse && (
        <div style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--red)', marginBottom: 4 }}>Câu trả lời cải thiện</p>
          <p style={{ fontSize: 13, lineHeight: 1.6, fontStyle: 'italic' }}>{feedback.improvedResponse}</p>
        </div>
      )}
      {feedback.vocabularyExplanations?.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--red)', marginBottom: 4 }}>Từ vựng nâng cao</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {feedback.vocabularyExplanations.map((v, i) => (
              <div key={i} style={{ fontSize: 13 }}>
                <span style={{ background: 'var(--line)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{v.word}</span>
                <span style={{ marginLeft: 4, color: 'var(--muted)' }}>{v.meaning}</span>
                {v.usage && <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0 0', fontStyle: 'italic' }}>e.g. "{v.usage}"</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BotMessage({ content, feedback, userText, speakingMode }) {
  const [playing, setPlaying] = useState(false);
  const synthRef = useRef(null);

  const handleSpeak = useCallback(() => {
    if (playing && synthRef.current) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      synthRef.current = null;
      return;
    }
    try {
      const text = content.replace(/\*\*|[*#•\-]/g, '');
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      const voices = window.speechSynthesis.getVoices();
      const female = voices.find(v => /female|zira|samantha|google us english/i.test(v.name));
      if (female) utterance.voice = female;
      utterance.onend = () => { setPlaying(false); synthRef.current = null; };
      synthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setPlaying(true);
    } catch {}
  }, [content, playing]);

  const feedbackText = feedback
    ? content.replace(/\{.*\}/s, '').trim()
    : content;

  return (
    <div className="vimi-msg bot" style={{ maxWidth: speakingMode ? '80%' : '100%' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {feedbackText.split('\n').map((line, j) => renderLine(line, j))}
          {feedback && (
            <SpeakingFeedbackCard feedback={feedback} originalText={userText || ''} />
          )}
        </div>
        {speakingMode && (
          <button onClick={handleSpeak} title="Đọc to" style={{ flexShrink: 0, background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 2, marginTop: 2 }}>
            {playing ? <Icon.Pause size={14} /> : <Icon.Volume2 size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function VimiPage() {
  const [speakingMode, setSpeakingMode] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(0);
  const [speakingStarted, setSpeakingStarted] = useState(false);
  const bodyRef = useRef(null);
  const { isRecording, transcript, startRecording, stopRecording, clearTranscript } = useSpeechRecognition();
  const lastUserTextRef = useRef('');

  const [input, setInput] = useState('');
  const { messages, append, isLoading, error } = useStreamChat({
    api: `${API_BASE}/vimi-ai/chat`,
    initialMessages: [{
      role: 'assistant',
      content: 'Xin chào! Tôi là **ViMi** - trợ lý AI của VMG EduNext. Tôi có thể giúp bạn về Classroom English, CLIL, đánh giá, từ vựng và hoạt động dạy học. Bạn muốn bắt đầu với chủ đề nào?',
    }],
  });

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, isLoading]);

  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  const handleSend = (text) => {
    if (!text.trim() || isLoading) return;
    lastUserTextRef.current = text.trim();
    const msg = text.trim();
    setInput('');
    clearTranscript();
    append({ role: 'user', content: msg }, { mode: speakingMode ? 'speaking' : 'chat' });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    lastUserTextRef.current = input.trim();
    const text = input.trim();
    setInput('');
    clearTranscript();
    append({ role: 'user', content: text }, { mode: speakingMode ? 'speaking' : 'chat' });
  };

  const filteredMessages = messages.filter(m => !(m.role === 'assistant' && m.content === ''));

  const handleStartSpeaking = () => {
    if (speakingMode) {
      setSpeakingMode(false);
      setSpeakingIndex(0);
      setSpeakingStarted(false);
      append({
        role: 'user',
        content: '/exit_speaking',
      }, { mode: 'speaking' });
      return;
    }
    setSpeakingMode(true);
    setSpeakingIndex(0);
    setSpeakingStarted(true);
    const q = SPEAKING_Q[0];
    append({
      role: 'user',
      content: `/start_speaking Xin chào, tôi muốn luyện nói tiếng Anh. Câu hỏi đầu tiên là: "${q.en}" (${q.vi})`,
    }, { mode: 'speaking' });
  };

  const lastAssistantMsg = filteredMessages.filter(m => m.role === 'assistant').slice(-1)[0];
  const feedback = lastAssistantMsg ? parseFeedback(lastAssistantMsg.content) : null;
  const showSpeakingPrompt = speakingMode && speakingStarted && !isLoading && !feedback;

  return (
    <div className="page-enter" style={{ maxWidth: 800 }}>
      <div className="page-title">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Icon.ViMi size={26} /> ViMi AI Tutor</h1>
        <p>Trợ lý giảng dạy thông minh — hỏi đáp về phương pháp, ngôn ngữ và hoạt động dạy học</p>
      </div>

      {!speakingMode && (
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-sm btn-outline" onClick={handleStartSpeaking} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon.Mic size={16} /> Bắt đầu luyện nói
          </button>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Nhập "speaking" hoặc click để luyện tập phát âm với feedback AI</span>
        </div>
      )}

      {speakingMode && (
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(189,23,48,0.06)', borderRadius: 8, padding: '10px 14px' }}>
          <Icon.Mic size={18} style={{ color: 'var(--red)' }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Chế độ luyện nói</span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>({speakingIndex + 1}/{SPEAKING_Q.length} câu)</span>
          <button className="btn btn-sm btn-outline" onClick={handleStartSpeaking} style={{ marginLeft: 'auto', fontSize: 12 }}>Thoát</button>
        </div>
      )}

      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 260px)', minHeight: 450 }}>
        <div ref={bodyRef} style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredMessages.map((msg, i) =>
            msg.role === 'user' ? (
              <div key={i} className="vimi-msg user" style={{ maxWidth: '80%' }}>
                {msg.content.replace(/^\/\w+\s*/,'').split('\n').map((line, j) => <div key={j} style={{ lineHeight: 1.7 }}>{line}</div>)}
              </div>
            ) : (
              <BotMessage
                key={i}
                content={msg.content}
                feedback={parseFeedback(msg.content)}
                userText={lastUserTextRef.current}
                speakingMode={speakingMode}
              />
            )
          )}

          {isLoading && (
            <div className="vimi-msg bot" style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '12px 18px', maxWidth: '80%' }}>
              <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--muted)', animation: 'typingBounce 1.2s ease infinite' }} />
              <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--muted)', animation: 'typingBounce 1.2s ease infinite .15s' }} />
              <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--muted)', animation: 'typingBounce 1.2s ease infinite .3s' }} />
            </div>
          )}

          {showSpeakingPrompt && speakingIndex < SPEAKING_Q.length && (
            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>
              💡 Hãy trả lời câu hỏi trên bằng tiếng Anh...
            </div>
          )}

          {filteredMessages.length === 1 && !speakingMode && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="btn btn-sm btn-outline" onClick={() => handleSend(s)}
                  style={{ fontSize: 12, padding: '8px 14px' }}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding: '8px 20px', fontSize: 12, color: 'var(--red)', background: 'rgba(189,23,48,0.06)', borderTop: '1px solid var(--line)' }}>
            Lỗi: {error}
          </div>
        )}
        <form onSubmit={handleFormSubmit} style={{ padding: '12px 20px', borderTop: '1px solid var(--line)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <button type="button" onClick={() => {
            if (isRecording) { stopRecording(); }
            else { clearTranscript(); startRecording(input); }
          }} title={isRecording ? 'Dừng thu âm' : 'Thu âm'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: isRecording ? 'var(--red)' : 'var(--muted)', padding: 4, flexShrink: 0 }}>
            {isRecording ? <Icon.MicOff size={20} /> : <Icon.Mic size={20} />}
          </button>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={isRecording ? 'Đang nghe...' : 'Nhập câu hỏi của bạn về giảng dạy...'}
            style={{ flex: 1, minWidth: 0, border: '1px solid var(--line)', borderRadius: 24, padding: '12px 18px', fontSize: 14 }}
          />
          <button type="submit" disabled={!input.trim() || isLoading}
            style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--red)', color: '#fff', display: 'grid', placeItems: 'center', border: 'none', cursor: 'pointer', flexShrink: 0, opacity: (!input.trim() || isLoading) ? .4 : 1 }}>
            <Icon.Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
