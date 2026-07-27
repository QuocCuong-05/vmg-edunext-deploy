import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Icon } from '../../lib/icons';
import { updateStreak } from '../../lib/streak';
import { logActivity } from '../../lib/activity';
import { addXp } from '../../lib/xp';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const QUESTIONS_PER_ROUND = 5;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Quiz() {
  const { slug } = useParams();
  const showToast = useToast();
  const [quizSet, setQuizSet] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [loading, setLoading] = useState(!!slug);

  useEffect(() => {
    if (slug) {
      api.quiz.get(slug).then(qs => {
        if (qs) {
          setQuizSet(qs);
          const questions = (qs.questions || []).map(q => ({
            id: q.id,
            prompt: q.prompt,
            prompt_translation: q.prompt_translation,
            correct_answer: q.correct_answer,
            explanation: q.explanation || '',
            explanation_vi: q.explanation_vi || '',
            competency_code: q.competency_code || '',
            level: q.level || 'B1',
            options: (q.options || []).map(o => ({
              option_text: o.option_text,
              is_correct: o.is_correct,
              feedback_correct: o.feedback_correct || '',
              feedback_incorrect: o.feedback_incorrect || '',
            })),
          }));
          setQuizQuestions(questions);
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      import('../../mock/data').then(({ MOCK_QUIZZES, MOCK_QUIZ_QUESTIONS }) => {
        setQuizSet(MOCK_QUIZZES[0]);
        setQuizQuestions(shuffle(MOCK_QUIZ_QUESTIONS).slice(0, QUESTIONS_PER_ROUND));
      });
    }
  }, [slug]);

  const quiz = quizSet;
  const allQuestions = quizQuestions;
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [results, setResults] = useState([]);
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);

  const question = allQuestions[currentQ];
  const isLast = currentQ === allQuestions.length - 1;

  const correctCount = results.filter(r => r.correct).length;
  const score = Math.round((correctCount / allQuestions.length) * 100);

  useEffect(() => {
    if (finished && score >= quiz.passing_score) {
      updateStreak();
      addXp(quiz.xp_reward);
      showToast('+' + quiz.xp_reward + ' XP', 'success');
      logActivity('quiz', 'Quiz: ' + score + '% - ' + quiz.title, 'Đạt ' + correctCount + '/' + allQuestions.length);
    }
  }, [finished, score]);

  const handleSelect = (idx) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    setResults(prev => [...prev, {
      question: question.prompt,
      selected: idx,
      correct: question.options[idx].is_correct,
      correctAnswer: question.correct_answer,
      explanation: question.explanation_vi,
    }]);
  };

  const handleNext = () => {
    if (isLast) {
      setFinished(true);
    } else {
      setCurrentQ(prev => prev + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const handleRestart = () => {
    setCurrentQ(0);
    setSelected(null);
    setAnswered(false);
    setResults([]);
    setFinished(false);
    setStarted(true);
  };

  if (!started) {
    return (
      <div className="page-enter">
        <div className="page-title">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Icon.Quiz size={24} /> Luyện tập</h1>
          <p>Kiểm tra kiến thức về Classroom English, CLIL, đánh giá và phương pháp giảng dạy</p>
        </div>
        <Card style={{ maxWidth: 600, textAlign: 'center', padding: 40 }}>
          <div style={{ marginBottom: 16 }}><Icon.Target size={48} /></div>
          <h2 style={{ marginBottom: 8 }}>{quiz.title}</h2>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
            {quiz.description}
          </p>
          <div className="course-meta" style={{ justifyContent: 'center', marginBottom: 20 }}>
            <span className="pill">{allQuestions.length} câu hỏi</span>
            <span className="pill">Điểm đạt: {quiz.passing_score}%</span>
            <span className="pill">+{quiz.xp_reward} XP</span>
            <span className="pill">{quiz.level}</span>
          </div>
          <Button variant="primary" onClick={() => setStarted(true)} style={{ padding: '14px 36px', fontSize: 15 }}>
            Bắt đầu luyện tập <Icon.ArrowRight size={16} />
          </Button>
        </Card>
      </div>
    );
  }

  if (finished) {
    const passed = score >= quiz.passing_score;
    return (
      <div className="page-enter">
        <div className="page-title">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}><Icon.Stats size={24} /> Kết quả luyện tập</h1>
        </div>
        <Card style={{ maxWidth: 600, textAlign: 'center', padding: 40 }}>
          <div style={{ marginBottom: 16 }}>{passed ? <Icon.Sparkles size={48} /> : <Icon.Target size={48} />}</div>
          <h2 style={{ marginBottom: 8 }}>{passed ? 'Chúc mừng!' : 'Cố gắng hơn nhé!'}</h2>
          <div style={{ fontSize: 48, fontWeight: 800, color: passed ? 'var(--green)' : 'var(--red)', margin: '16px 0' }}>
            {correctCount}/{allQuestions.length}
          </div>
          <div style={{ fontSize: 20, color: 'var(--muted)', marginBottom: 20 }}>
            Đạt {score}% — Yêu cầu: {quiz.passing_score}%
          </div>
          {passed && <div style={{ fontSize: 13, color: 'var(--green)', marginBottom: 16 }}>+{quiz.xp_reward} XP</div>}

          <div style={{ textAlign: 'left', marginTop: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Chi tiết</h3>
            {results.map((r, i) => (
              <div key={i} style={{ padding: '10px 14px', marginBottom: 8, borderRadius: 10, background: r.correct ? 'var(--green-bg)' : 'var(--red-bg)', fontSize: 13 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {r.correct ? <Icon.Check size={14} style={{ color: 'var(--green)' }} /> : <Icon.X size={14} style={{ color: 'var(--red)' }} />} {r.question}
                </div>
                {!r.correct && (
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                    Đáp án đúng: <strong>{r.correctAnswer}</strong>
                  </div>
                )}
                <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 4 }}>{r.explanation}</div>
              </div>
            ))}
          </div>

          <Button variant="primary" label="Làm lại" onClick={handleRestart} style={{ marginTop: 20 }} />
        </Card>
      </div>
    );
  }

    return (
    <div className="page-enter" style={{ maxWidth: 700 }}>
      <div className="page-title">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Icon.Quiz size={24} /> Luyện tập</h1>
      </div>
      <Card style={{ padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            Câu {currentQ + 1}/{allQuestions.length}
          </span>
          <span className="pill">{question.competency_code}</span>
        </div>
        <div className="progress-bar" style={{ marginBottom: 20 }}>
          <div className="progress-fill" style={{ width: `${((currentQ + 1) / allQuestions.length) * 100}%` }} />
        </div>

        <h3 style={{ fontSize: 16, marginBottom: 8 }}>{question.prompt}</h3>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>{question.prompt_translation}</p>

        <div>
          {question.options.map((opt, idx) => {
            let cls = 'quiz-option';
            if (answered) {
              if (opt.is_correct) cls += ' correct';
              else if (selected === idx) cls += ' incorrect';
            } else if (selected === idx) {
              cls += ' selected';
            }
            return (
              <div key={idx} className={cls} onClick={() => handleSelect(idx)}>
                {opt.option_text}
                {answered && (
                  <div className="feedback">
                    {opt.is_correct
                      ? <span style={{ color: 'var(--green)' }}>{opt.feedback_correct || 'Chính xác!'}</span>
                      : selected === idx
                        ? <span style={{ color: 'var(--red)' }}>{opt.feedback_incorrect || 'Chưa đúng. Xem lại nhé.'}</span>
                        : null
                    }
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {answered && (
          <div style={{ padding: '14px 18px', background: 'var(--surface-hover)', borderRadius: 12, marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}><Icon.Lightbulb size={14} /> Giải thích:</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>{question.explanation_vi}</div>
          </div>
        )}

        {answered && (
          <Button variant="primary" onClick={handleNext} style={{ marginTop: 16 }}>
            {isLast ? <><span>Xem kết quả</span> <Icon.ArrowRight size={16} /></> : <><span>Câu tiếp theo</span> <Icon.ArrowRight size={16} /></>}
          </Button>
        )}
      </Card>
    </div>
  );
}
