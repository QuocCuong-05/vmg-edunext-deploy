import { useState, useRef, useEffect } from 'react';
import { Icon } from '../../lib/icons';
import { useSpeechRecognition } from '../../lib/useSpeechRecognition';
import { useStreamChat } from '../../lib/useStreamChat';
import { API_BASE } from '../../lib/api';

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

  const { messages, append, isLoading } = useStreamChat({
    api: `${API_BASE}/vimi-ai/chat`,
    initialMessages: [{
      role: 'assistant',
      content: 'Xin chào! Tôi là **ViMi** - trợ lý AI của VMG EduNext. Hãy hỏi tôi về Classroom English, CLIL, đánh giá, từ vựng, hoặc gợi ý hoạt động dạy học!',
    }],
  });

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, isLoading]);

  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    clearTranscript();
    append({ role: 'user', content: text });
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
          <div className="vimi-input">
            <button onClick={handleMic} title={isRecording ? 'Dừng thu âm' : 'Thu âm'} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isRecording ? 'var(--red)' : 'var(--muted)', padding: 4 }}>
              {isRecording ? <Icon.MicOff size={18} /> : <Icon.Mic size={18} />}
            </button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? 'Đang nghe...' : 'Nhập câu hỏi của bạn...'}
            />
            <button onClick={handleSend} disabled={!input.trim() || isLoading} style={{ opacity: input.trim() && !isLoading ? 1 : .4 }}><Icon.Send size={18} /></button>
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
