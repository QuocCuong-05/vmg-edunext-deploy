import { useState, useMemo, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { api } from '../../lib/api';
import { Icon } from '../../lib/icons';
import { updateStreak } from '../../lib/streak';
import { trackEvent } from '../../lib/ga';
import { logActivity } from '../../lib/activity';
import { addXp } from '../../lib/xp';
import { dispatchAction } from '../../lib/quest-engine';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useAuth } from '../auth/AuthContext';
function normalizeQuestions(qs) {
  return (qs.questions || []).map(q => ({
    id: q.id,
    prompt: q.prompt,
    prompt_translation: q.prompt_translation,
    correct_answer: q.correct_answer,
    explanation: q.explanation || '',
    explanation_vi: q.explanation_vi || '',
    competency_code: q.competency_code || '',
    level: q.level || 'B1',
    options: (q.options || []).map(o => ({
      id: o.id,
      option_text: o.option_text,
      is_correct: o.is_correct,
      feedback_correct: o.feedback_correct || '',
      feedback_incorrect: o.feedback_incorrect || '',
    })),
  }));
}

export default function Quiz() {
  const { slug } = useParams();
  const showToast = useToast();
  const location = useLocation();
  const { isPlus } = useAuth();
  const isChallenge = location.pathname.startsWith('/level/quiz');
  const [quizSet, setQuizSet] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [loading, setLoading] = useState(!!slug);
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    if (slug) {
      api.quiz.get(slug).then(qs => {
        if (qs) {
          setQuizSet(qs);
          setQuizQuestions(normalizeQuestions(qs));
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      api.quiz.list().then(list => {
        if (list?.length) {
          api.quiz.get(list[0].slug).then(qs => {
            if (qs) { setQuizSet(qs); setQuizQuestions(normalizeQuestions(qs)); }
            setLoading(false);
          }).catch(() => setLoading(false));
        } else {
          setLoading(false);
        }
      }).catch(() => setLoading(false));
    }
  }, [slug]);

  const quiz = quizSet;
  const allQuestions = quizQuestions;
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [results, setResults] = useState([]);
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(!!slug);

  const progressKey = slug ? `vmg_quiz_progress_${slug}` : null;
  const saveProgress = (extra) => {
    if (!progressKey) return;
    try {
      localStorage.setItem(progressKey, JSON.stringify({ ...extra, savedAt: Date.now() }));
    } catch {}
  };
  const clearProgress = () => {
    if (!progressKey) return;
    try { localStorage.removeItem(progressKey); } catch {}
  };

  // Khôi phục tiến độ/kết quả khi load lại trang
  useEffect(() => {
    if (!slug || loading || !quizQuestions.length) return;
    try {
      const raw = localStorage.getItem(`vmg_quiz_progress_${slug}`);
      if (!raw) return;
      const p = JSON.parse(raw);
      if (p.finished) {
        setResults(p.results || []);
        setServerScore(p.serverScore ?? null);
        setFinished(true);
        setStarted(true);
      } else if (p.results?.length > 0 || p.started) {
        setCurrentQ(Math.min(p.currentQ ?? 0, Math.max(quizQuestions.length - 1, 0)));
        setSelected(p.selected ?? null);
        setAnswered(p.answered ?? false);
        setResults(p.results || []);
        setStarted(true);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, loading, quizQuestions.length]);

  const question = allQuestions[currentQ];
  const isLast = currentQ === allQuestions.length - 1;

  const correctCount = results.filter(r => r.correct).length;
  const score = Math.round((correctCount / allQuestions.length) * 100);
  const [serverScore, setServerScore] = useState(null);

  useEffect(() => {
    if (finished && score >= quiz.passing_score) {
      updateStreak();
      addXp(quiz.xp_reward);
      showToast('+' + quiz.xp_reward + ' XP', 'success');
      logActivity('quiz', 'Quiz: ' + score + '% - ' + quiz.title, 'Đạt ' + correctCount + '/' + allQuestions.length);
      dispatchAction('quiz_complete', { score });
      if (slug) {
        try { localStorage.setItem('vmg_quiz_completed', JSON.stringify({ slug, xp: quiz.xp_reward })); } catch {}
        try {
          const list = JSON.parse(localStorage.getItem('vmg_completed_quizzes') || '[]');
          if (!list.includes(slug)) { list.push(slug); localStorage.setItem('vmg_completed_quizzes', JSON.stringify(list)); }
        } catch {}
      }
    }
  }, [finished, score]);

  useEffect(() => {
    if (isPlus && !loading) {
      api.quiz.attempts().then(setAttempts).catch(() => {});
    }
  }, [isPlus, loading]);

  const handleSelect = (idx) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const entry = {
      question_id: question.id,
      option_id: question.options[idx].id,
      question: question.prompt,
      selected: idx,
      correct: question.options[idx].is_correct,
      correctAnswer: question.correct_answer,
      explanation: question.explanation_vi,
    };
    const nextResults = [...results, entry];
    setResults(nextResults);
    saveProgress({ currentQ, selected: idx, answered: true, results: nextResults, finished: false, started: true });
  };

  const handleNext = () => {
    if (isLast) {
      setFinished(true);
      saveProgress({ currentQ, selected, answered, results, finished: true, started: true });
      api.quiz.submit(quizSet.id, results.map(r => ({ question_id: r.question_id, option_id: r.option_id })))
        .then(res => {
          const sc = res?.score ?? null;
          setServerScore(sc);
          saveProgress({ currentQ, selected, answered, results, finished: true, serverScore: sc, started: true });
          trackEvent('Quiz', 'submit', `${quizSet.slug || ''} (${sc ?? 0}%)`);
        })
        .catch(() => {});
    } else {
      const nq = currentQ + 1;
      setCurrentQ(nq);
      setSelected(null);
      setAnswered(false);
      saveProgress({ currentQ: nq, selected: null, answered: false, results, started: true });
    }
  };

  const handleRestart = () => {
    clearProgress();
    setCurrentQ(0);
    setSelected(null);
    setAnswered(false);
    setResults([]);
    setFinished(false);
    setServerScore(null);
    setStarted(true);
  };

  if (loading) {
    return (
      <div className="page-enter">
        <div className="page-title">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{isChallenge ? <Icon.Target size={24} /> : <Icon.Quiz size={24} />} {isChallenge ? 'Thử thách lên cấp' : 'Luyện tập'}</h1>
        </div>
        <p style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Đang tải...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="page-enter">
        <div className="page-title">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{isChallenge ? <Icon.Target size={24} /> : <Icon.Quiz size={24} />} {isChallenge ? 'Thử thách lên cấp' : 'Luyện tập'}</h1>
        </div>
        <p style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Không tìm thấy bài tập</p>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="page-enter">
        <div className="page-title">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{isChallenge ? <Icon.Target size={24} /> : <Icon.Quiz size={24} />} {isChallenge ? 'Thử thách lên cấp' : 'Luyện tập'}</h1>
          {!isChallenge && <p>Kiểm tra kiến thức về Classroom English, CLIL, đánh giá và phương pháp giảng dạy</p>}
          {isChallenge && <p>Làm bài thi để vượt qua thử thách này</p>}
        </div>
        <Card style={{ maxWidth: 600, textAlign: 'center', padding: 'min(40px, 9vw)' }}>
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
            {isChallenge ? 'Vào thi' : 'Bắt đầu luyện tập'} <Icon.ArrowRight size={16} />
          </Button>
        </Card>

        {isPlus && attempts.length > 0 && (
          <Card style={{ maxWidth: 600, padding: 24, marginTop: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Lịch sử làm bài của bạn</h3>
            {attempts.slice(0, 10).map(a => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
                <span>{a.quiz_sets?.title || 'Bài quiz'}</span>
                <span>
                  <b style={{ color: a.score >= (quiz?.passing_score || 60) ? 'var(--green)' : 'var(--red)' }}>{a.score}%</b>
                  <span style={{ color: 'var(--muted)', fontSize: 11, marginLeft: 8 }}>
                    {new Date(a.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </span>
              </div>
            ))}
          </Card>
        )}
      </div>
    );
  }

  if (finished) {
    const finalScore = serverScore ?? score;
    const passed = finalScore >= quiz.passing_score;
    return (
      <div className="page-enter">
        <div className="page-title">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}><Icon.Stats size={24} /> {isChallenge ? 'Kết quả thử thách' : 'Kết quả luyện tập'}</h1>
        </div>
        <Card style={{ maxWidth: 600, textAlign: 'center', padding: 'min(40px, 9vw)' }}>
          <div style={{ marginBottom: 16 }}>{passed ? <Icon.Sparkles size={48} /> : <Icon.Target size={48} />}</div>
          <h2 style={{ marginBottom: 8 }}>{passed ? 'Chúc mừng!' : 'Cố gắng hơn nhé!'}</h2>
          <div style={{ fontSize: 48, fontWeight: 800, color: passed ? 'var(--green)' : 'var(--red)', margin: '16px 0' }}>
            {correctCount}/{allQuestions.length}
          </div>
          <div style={{ fontSize: 20, color: 'var(--muted)', marginBottom: 20 }}>
            Đạt {finalScore}% — Yêu cầu: {quiz.passing_score}%
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
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{isChallenge ? <Icon.Target size={24} /> : <Icon.Quiz size={24} />} {isChallenge ? 'Thử thách lên cấp' : 'Luyện tập'}</h1>
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
