import { useState } from 'react';
import { Icon } from '../../lib/icons';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const PLACEHOLDER = {
  title: 'Sample Lesson Plan',
  objectives: [
    'Students will be able to identify key vocabulary related to the topic.',
    'Students will practice target language through guided activities.',
  ],
  stages: [
    { stage: 'Warm-Up', time: '5 min', activity: 'Engage students with a picture prompt related to the topic.' },
    { stage: 'Presentation', time: '10 min', activity: 'Introduce target language and key concepts using visuals.' },
    { stage: 'Practice', time: '15 min', activity: 'Pair work using sentence frames and structured tasks.' },
    { stage: 'Production', time: '10 min', activity: 'Students create a short dialogue or written response.' },
    { stage: 'Wrap-Up', time: '5 min', activity: 'Exit ticket: one thing learned and one question.' },
  ],
  assessment: 'Formative observation during pair work; exit ticket for individual understanding.',
};

export default function PlannerPage() {
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState('B1');
  const [duration, setDuration] = useState('45');
  const [focus, setFocus] = useState('CLIL');
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    if (!topic.trim()) return;
    setGenerated(true);
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
          isDisabled={!topic.trim()}
        >
          <Icon.Sparkles size={16} /> Generate Lesson Plan
        </Button>
      </Card>

      {generated && (
        <Card style={{ maxWidth: 700, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Icon.Brain size={22} />
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>{PLACEHOLDER.title}</h2>
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
            Topic: <strong>{topic}</strong> | Level: <strong>{grade}</strong> | Duration: <strong>{duration} min</strong> | Focus: <strong>{focus}</strong>
          </p>

          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Objectives</h3>
            {PLACEHOLDER.objectives.map((obj, i) => (
              <div key={i} style={{ fontSize: 13, padding: '4px 0' }}>- {obj}</div>
            ))}
          </div>

          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Lesson Stages</h3>
            {PLACEHOLDER.stages.map((s, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, flexWrap: 'wrap', padding: '10px 0',
                borderBottom: i < PLACEHOLDER.stages.length - 1 ? '1px solid var(--line)' : 'none'
              }}>
                <span className="pill" style={{ minWidth: 90, justifyContent: 'center' }}>{s.stage}</span>
                <span className="pill" style={{ minWidth: 60, justifyContent: 'center', background: 'var(--red-bg)', color: 'var(--red)' }}>{s.time}</span>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>{s.activity}</span>
              </div>
            ))}
          </div>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Assessment</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>{PLACEHOLDER.assessment}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
