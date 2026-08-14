import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../lib/icons';
import { useSpeechRecognition } from '../../lib/useSpeechRecognition';
import { useStreamChat } from '../../lib/useStreamChat';
import { dispatchAction } from '../../lib/quest-engine';
import { API_BASE } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function ViMiChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const bodyRef = useRef(null);
  const { isRecording, transcript, startRecording, stopRecording, clearTranscript } = useSpeechRecognition();
  const { user, isPlus } = useAuth();

  const { messages, append, isLoading, error } = useStreamChat({
    api: `${API_BASE}/vimi-ai/chat`,
    initialMessages: [{
      role: 'assistant',
      content: 'Xin chào! Tôi là **ViMi** - trợ lý AI của VMG EduNext. Hãy hỏi tôi về Classroom English, CLIL, đánh giá, từ vựng, hoặc gợi ý hoạt động dạy học!',
    }],
  });

  const remainingCount = !isPlus ? (user?.aiUsage?.chatLeft ?? null) : null;
  const outOfQuota = !isPlus && remainingCount !== null && remainingCount <= 0;

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, isLoading]);

  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading || outOfQuota) return;
    setInput('');
    clearTranscript();
    append({ role: 'user', content: text });
    dispatchAction('vimi_chat');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleMic = () => {
    if (isRecording) {
      stopRecording();
    } else {
      clearTranscript();
      startRecording(input);
    }
  };

  const filteredMessages = messages.filter(m => !(m.role === 'assistant' && m.content === ''));

  return (
    <>
      {open && (
        <div className="vimi-panel">
          <div className="vimi-header">
            <div className="vimi-avatar"><Icon.ViMi size={18} /></div>
            <div>
              <h3>ViMi AI Tutor</h3>
              <p>Trợ lý giảng dạy thông minh</p>
            </div>
            {remainingCount !== null && (
              <span className="pill" style={{ background: 'rgba(255,255,255,.14)', color: '#fff', fontSize: 10, fontWeight: 800, marginLeft: 8 }}>
                Còn {remainingCount}/5 lượt
              </span>
            )}
            <button onClick={() => setOpen(false)} style={{ marginLeft: 'auto', color: '#fff', opacity: .7 }}><Icon.Close size={18} /></button>
          </div>
          <div className="vimi-body" ref={bodyRef}>
            {filteredMessages.map((msg, i) => (
              <div key={i} className={`vimi-msg ${msg.role === 'user' ? 'user' : 'bot'}`}>
                {msg.content.split('\n').map((line, j) => (
                  <div key={j}>{line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./) ? <span style={{ display: 'block', paddingLeft: 8 }}>{renderInline(line)}</span> : renderInline(line)}</div>
                ))}
              </div>
            ))}
            {isLoading && (
              <div className="vimi-msg bot" style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '12px 18px' }}>
                <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--muted)', animation: 'typingBounce 1.2s ease infinite' }} />
                <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--muted)', animation: 'typingBounce 1.2s ease infinite .15s' }} />
                <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--muted)', animation: 'typingBounce 1.2s ease infinite .3s' }} />
              </div>
            )}
          </div>
          {error && (
            <div style={{ padding: '8px 16px', fontSize: 11, color: 'var(--red)', background: 'rgba(189,23,48,0.06)', borderTop: '1px solid var(--line)' }}>
              Lỗi: {error}
            </div>
          )}
          {outOfQuota && (
            <div style={{ padding: '10px 16px', fontSize: 12, background: 'var(--gold-bg)', color: 'var(--gold)', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700 }}>Bạn đã dùng hết lượt chat hôm nay.</span>
              <Link to="/plus" style={{ fontSize: 12, fontWeight: 800, color: 'var(--red)', whiteSpace: 'nowrap' }}>Nâng cấp Plus →</Link>
            </div>
          )}
          <div className="vimi-input">
            <button onClick={handleMic} disabled={outOfQuota} title={isRecording ? 'Dừng thu âm' : 'Thu âm'} style={{ background: 'none', border: 'none', cursor: outOfQuota ? 'not-allowed' : 'pointer', color: isRecording ? 'var(--red)' : outOfQuota ? 'rgba(0,0,0,.15)' : 'var(--muted)', padding: 4 }}>
              {isRecording ? <Icon.MicOff size={18} /> : <Icon.Mic size={18} />}
            </button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={outOfQuota}
              placeholder={outOfQuota ? 'Hết lượt hôm nay — nâng cấp Plus để chat không giới hạn' : (isRecording ? 'Đang nghe...' : 'Nhập câu hỏi của bạn...')}
            />
            <button onClick={handleSend} disabled={!input.trim() || isLoading || outOfQuota} style={{ opacity: input.trim() && !isLoading && !outOfQuota ? 1 : .4 }}><Icon.Send size={18} /></button>
          </div>
        </div>
      )}
      <div className="vimi-float">
        <button className="vimi-toggle" onClick={() => setOpen(!open)} title="ViMi AI Tutor">
          <Icon.ViMi size={28} />
        </button>
      </div>
    </>
  );
}
