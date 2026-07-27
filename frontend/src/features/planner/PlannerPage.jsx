import { useState } from 'react';
import { Icon } from '../../lib/icons';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { API_BASE } from '../../lib/api';

export default function PlannerPage() {
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState('B1');
  const [duration, setDuration] = useState('45');
  const [focus, setFocus] = useState('CLIL');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!topic.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/vimi-ai/lesson-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), level: grade, duration, focus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
      }
      const json = JSON.parse(text.match(/\{.*\}/s)?.[0] || '{}');
      if (!json.title) throw new Error('AI returned invalid response');
      setResult(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter">
      <div className="page-title">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon.Lightbulb size={24} /> AI Lesson Plan Generator
        </h1>
        <p>Generate a structured lesson plan for your bilingual classroom</p>
      </div>

      <Card style={{ maxWidth: 600, marginBottom: 28, padding: 24 }}>
        <div className="form-group">
          <label>Topic</label>
          <input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. Photosynthesis, Water Cycle, Shapes..."
          />
        </div>
        <div className="form-group">
          <label>Grade / Level</label>
          <select value={grade} onChange={e => setGrade(e.target.value)}>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="C1">C1</option>
          </select>
        </div>
        <div className="form-group">
          <label>Duration</label>
          <select value={duration} onChange={e => setDuration(e.target.value)}>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">60 min</option>
            <option value="90">90 min</option>
          </select>
        </div>
        <div className="form-group">
          <label>Focus</label>
          <select value={focus} onChange={e => setFocus(e.target.value)}>
            <option value="CLIL">CLIL</option>
            <option value="Classroom English">Classroom English</option>
            <option value="Vocabulary">Vocabulary</option>
            <option value="Assessment">Assessment</option>
          </select>
        </div>
        <Button
          variant="primary"
          onClick={handleGenerate}
          isDisabled={!topic.trim() || loading}
        >
          {loading ? 'Generating...' : <><Icon.Sparkles size={16} /> Generate Lesson Plan</>}
        </Button>
      </Card>

      {loading && (
        <Card style={{ maxWidth: 700, padding: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <span className="typing-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--muted)', animation: 'typingBounce 1.2s ease infinite' }} />
            <span className="typing-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--muted)', animation: 'typingBounce 1.2s ease infinite .15s' }} />
            <span className="typing-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--muted)', animation: 'typingBounce 1.2s ease infinite .3s' }} />
          </div>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>AI is generating your lesson plan...</span>
        </Card>
      )}

      {error && (
        <Card style={{ maxWidth: 700, padding: 24, background: 'rgba(189,23,48,0.06)', borderColor: 'var(--red)' }}>
          <p style={{ fontSize: 13, color: 'var(--red)' }}>Error: {error}</p>
          <Button variant="ghost" size="sm" onClick={handleGenerate} style={{ marginTop: 8 }}>Try again</Button>
        </Card>
      )}

      {result && (
        <Card style={{ maxWidth: 700, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Icon.Brain size={22} />
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>{result.title}</h2>
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
            Topic: <strong>{topic}</strong> | Level: <strong>{grade}</strong> | Duration: <strong>{duration} min</strong> | Focus: <strong>{focus}</strong>
          </p>

          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Objectives</h3>
            {result.objectives?.map((obj, i) => (
              <div key={i} style={{ fontSize: 13, padding: '4px 0' }}>- {obj}</div>
            ))}
          </div>

          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Lesson Stages</h3>
            {result.stages?.map((s, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, flexWrap: 'wrap', padding: '10px 0',
                borderBottom: i < result.stages.length - 1 ? '1px solid var(--line)' : 'none'
              }}>
                <span className="pill" style={{ minWidth: 90, justifyContent: 'center' }}>{s.stage}</span>
                <span className="pill" style={{ minWidth: 60, justifyContent: 'center', background: 'var(--red-bg)', color: 'var(--red)' }}>{s.time}</span>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>{s.activity}</span>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Assessment</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>{result.assessment}</p>
          </div>

          {result.materials?.length > 0 && (
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Materials</h3>
              {result.materials.map((m, i) => (
                <div key={i} style={{ fontSize: 13, padding: '4px 0' }}>- {m}</div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
