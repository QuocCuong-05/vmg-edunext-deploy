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

    // Lấy câu hỏi + options bằng 2 query tách có order (embed không order không ổn định
    // -> correctMap có lúc thiếu -> chấm 0% dù trả lời đúng)
    const { data: questions, error: qErr } = await supabaseAdmin
      .from('quiz_questions')
      .select('id')
      .eq('quiz_set_id', quizSetId)
      .order('sort_order');
    if (qErr) throw qErr;

    const qids = (questions || []).map(q => q.id);
    const correctMap = {};
    if (qids.length) {
      const { data: options, error: oErr } = await supabaseAdmin
        .from('quiz_options')
        .select('id, question_id, is_correct')
        .in('question_id', qids)
        .order('question_id')
        .order('sort_order');
      if (oErr) throw oErr;
      (options || []).forEach(o => {
        if (o.is_correct && o.question_id && !correctMap[o.question_id]) {
          correctMap[o.question_id] = o.id;
        }
      });
    }

    let correct = 0;
    const total = qids.length;
    answers.forEach(a => {
      if (correctMap[a.question_id] && correctMap[a.question_id] === a.option_id) correct += 1;
    });
    const score = total ? Math.round((correct / total) * 1000) / 10 : 0;

    if (correct === 0 && answers.length > 0) {
      console.warn(`[Quiz] submit 0/${total} — answers=${answers.length} correctMap=${Object.keys(correctMap).length} sampleQ=${(answers[0]?.question_id || '').slice(0, 8)}`);
    } else {
      console.log(`[Quiz] submit ${correct}/${total} (${score}%) — answers=${answers.length}`);
    }

    await supabaseAdmin.from('quiz_attempts').insert({
      user_id: req.user.id,
      quiz_set_id: quizSetId,
      score,
      total_questions: total,
      correct_answers: correct,
    });

    await logActivity(req.user.id, 'quiz_submit', `Nộp bài quiz (điểm ${score}%)`, req, 'Bài tập');

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

// GET /api/quiz/attempts-count — số bài quiz đã nộp (mọi tài khoản)
router.get('/attempts-count', authenticate, async (req, res, next) => {
  try {
    const { count, error } = await supabaseAdmin
      .from('quiz_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ count: count || 0 });
  } catch (err) {
    next(err);
  }
});

export default router;
