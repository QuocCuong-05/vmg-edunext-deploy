import { Router } from 'express';
import { supabase, supabaseAdmin } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { hasActivePlus } from '../lib/plus.js';
import { logActivity } from '../lib/activity.js';

const router = Router();

router.get('/sets', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('quiz_sets')
      .select('*')
      .eq('is_published', true)
      .order('title');

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sets/:slug', async (req, res) => {
  try {
    const { data: set, error: setError } = await supabase
      .from('quiz_sets')
      .select('*')
      .eq('slug', req.params.slug)
      .single();

    if (setError) return res.status(404).json({ error: 'Quiz set not found' });

    const { data: questions, error: qError } = await supabase
      .from('quiz_questions')
      .select('*, quiz_options(*)')
      .eq('quiz_set_id', set.id)
      .order('sort_order');

    if (qError) return res.status(400).json({ error: qError.message });
    res.json({ data: { ...set, questions } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quiz/submit — chấm điểm server-side, lưu quiz_attempts (ẩn cho Free, hiển thị Plus)
router.post('/submit', authenticate, async (req, res, next) => {
  try {
    const { quiz_set_id: quizSetId, answers } = req.body;
    if (!quizSetId || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'quiz_set_id và answers (mảng) là bắt buộc' });
    }

    const { data: questions, error } = await supabaseAdmin
      .from('quiz_questions')
      .select('id, quiz_options(is_correct)')
      .eq('quiz_set_id', quizSetId);
    if (error) throw error;

    const correctMap = {};
    (questions || []).forEach(q => {
      const correct = (q.quiz_options || []).find(o => o.is_correct);
      if (correct) correctMap[q.id] = correct.id;
    });

    let correct = 0;
    const total = questions?.length || 0;
    answers.forEach(a => {
      if (correctMap[a.question_id] && correctMap[a.question_id] === a.option_id) correct += 1;
    });
    const score = total ? Math.round((correct / total) * 1000) / 10 : 0;

    await supabaseAdmin.from('quiz_attempts').insert({
      user_id: req.user.id,
      quiz_set_id: quizSetId,
      score,
      total_questions: total,
      correct_answers: correct,
    });

    await logActivity(req.user.id, 'quiz_submit', `Nộp bài quiz (điểm ${score}%)`, req);

    res.json({ data: { score, correct, total } });
  } catch (err) {
    next(err);
  }
});

// GET /api/quiz/attempts — lịch sử làm bài (chỉ Plus)
router.get('/attempts', authenticate, async (req, res, next) => {
  try {
    if (!(await hasActivePlus(req.user.id))) {
      return res.status(403).json({ error: 'Lịch sử làm bài chỉ dành cho tài khoản Plus' });
    }
    const { data, error } = await supabaseAdmin
      .from('quiz_attempts')
      .select('*, quiz_sets(title, slug)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

export default router;
