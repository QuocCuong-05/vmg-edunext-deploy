import { Router } from 'express';
import { supabaseAdmin } from '../config/database.js';
import { authenticate, requireTeacher } from '../middleware/auth.js';
import { gradePronunciation } from '../lib/practiceGrade.js';

const router = Router();

const AUDIO_BUCKET = 'practice-audio';
const MAX_AUDIO = 10 * 1024 * 1024; // 10MB

async function ensureAudioBucket() {
  const { error } = await supabaseAdmin.storage.createBucket(AUDIO_BUCKET, { public: true });
  if (error && !/already exists/i.test(error.message)) {
    console.warn('[practice] createBucket warn:', error.message);
  }
}

async function uploadAudio(fileB64, filename) {
  await ensureAudioBucket();
  const buffer = Buffer.from(fileB64, 'base64');
  if (buffer.length > MAX_AUDIO) throw new Error('File âm thanh tối đa 10MB');
  const safeName = (filename || 'rec.webm').replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `sub/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  const { error } = await supabaseAdmin.storage
    .from(AUDIO_BUCKET)
    .upload(path, buffer, { contentType: 'audio/webm', upsert: false });
  if (error) throw error;
  const { data: pub } = supabaseAdmin.storage.from(AUDIO_BUCKET).getPublicUrl(path);
  return pub.publicUrl;
}

// POST /api/practice/submit — học viên gửi bài ghi âm + transcript, chấm AI
router.post('/submit', authenticate, async (req, res) => {
  try {
    const { lesson_id, practice_word_id, word, audio_b64, filename, transcript, practice_type, local_score, local_detail } = req.body;
    if (!lesson_id) return res.status(400).json({ error: 'lesson_id là bắt buộc' });

    const { data: lesson, error: lerr } = await supabaseAdmin
      .from('lessons')
      .select('id, item_type')
      .eq('id', lesson_id)
      .maybeSingle();
    if (lerr) return res.status(400).json({ error: lerr.message });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    let audioUrl = null;
    if (audio_b64) {
      try {
        audioUrl = await uploadAudio(audio_b64, filename);
      } catch (e) {
        return res.status(400).json({ error: e.message });
      }
    }

    // Ưu tiên điểm khớp local (kiểu H5P) nếu client gửi lên — bỏ qua AI
    let grade;
    if (local_score != null && Number.isFinite(Number(local_score))) {
      grade = {
        score: Math.max(1, Math.min(10, Math.round(Number(local_score)))),
        feedback: String(local_detail || 'Đã hoàn thành bài luyện nói.').slice(0, 500),
      };
    } else {
      grade = await gradePronunciation(word || '', transcript, { passage: (practice_type || '') === 'speak_passage' });
    }

    const { data, error } = await supabaseAdmin
      .from('practice_submissions')
      .insert({
        user_id: req.user.id,
        lesson_id,
        practice_word_id: practice_word_id || null,
        word: word || null,
        audio_url: audioUrl,
        transcript: transcript || null,
        practice_type: practice_type || 'speak_words',
        ai_score: grade.score,
        ai_feedback: grade.feedback,
        ai_status: grade.score != null ? 'graded' : 'pending',
        review_status: 'new',
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ data });
  } catch (err) {
    console.error('[practice submit]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/practice/my-submissions — lịch sử bài của học viên (lọc theo lesson)
router.get('/my-submissions', authenticate, async (req, res) => {
  try {
    let q = supabaseAdmin
      .from('practice_submissions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (req.query.lesson_id) q = q.eq('lesson_id', req.query.lesson_id);
    if (req.query.limit) q = q.limit(Number(req.query.limit) || 50);
    const { data, error } = await q;
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/practice/submissions — danh sách bài học viên gửi (giáo viên/admin)
router.get('/submissions', authenticate, requireTeacher, async (req, res) => {
  try {
    let q = supabaseAdmin
      .from('practice_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Number(req.query.limit) || 100);
    if (req.query.lesson_id) q = q.eq('lesson_id', req.query.lesson_id);
    if (req.query.review_status) q = q.eq('review_status', req.query.review_status);
    if (req.query.user_id) q = q.eq('user_id', req.query.user_id);
    const { data, error } = await q;
    if (error) return res.status(400).json({ error: error.message });
    if (!data || !data.length) return res.json({ data: [] });

    const userIds = [...new Set(data.map(s => s.user_id))];
    const lessonIds = [...new Set(data.map(s => s.lesson_id))];
    const [profiles, lessons] = await Promise.all([
      supabaseAdmin.from('profiles').select('id, full_name, email').in('id', userIds),
      supabaseAdmin.from('lessons').select('id, title, course_id').in('id', lessonIds),
    ]);
    const courseIds = [...new Set((lessons.data || []).map(l => l.course_id))];
    const courses = courseIds.length
      ? await supabaseAdmin.from('courses').select('id, title').in('id', courseIds)
      : { data: [] };
    const profileMap = Object.fromEntries((profiles.data || []).map(p => [p.id, p]));
    const lessonMap = Object.fromEntries((lessons.data || []).map(l => [l.id, l]));
    const courseMap = Object.fromEntries((courses.data || []).map(c => [c.id, c]));

    const enriched = data.map(s => ({
      ...s,
      user_name: profileMap[s.user_id]?.full_name || profileMap[s.user_id]?.email || 'Học viên',
      user_email: profileMap[s.user_id]?.email || null,
      lesson_title: lessonMap[s.lesson_id]?.title || null,
      course_title: lessonMap[s.lesson_id] ? courseMap[lessonMap[s.lesson_id].course_id]?.title || null : null,
    }));
    res.json({ data: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/practice/submissions/:id/review — giáo viên chấm lại
router.post('/submissions/:id/review', authenticate, requireTeacher, async (req, res) => {
  try {
    const { teacher_score, teacher_feedback, review_status } = req.body;
    const { data, error } = await supabaseAdmin
      .from('practice_submissions')
      .update({
        teacher_score: teacher_score != null ? Math.max(1, Math.min(10, Number(teacher_score))) : null,
        teacher_feedback: teacher_feedback || null,
        teacher_id: req.user.id,
        review_status: review_status || 'reviewed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/practice/answer — trả lời câu hỏi nghe (choose/fill/mark), tự chấm máy
function normalizeAnswer(v) {
  return String(v || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

router.post('/answer', authenticate, async (req, res) => {
  try {
    const { lesson_id, question_id, answer } = req.body;
    if (!lesson_id || !question_id) return res.status(400).json({ error: 'lesson_id và question_id là bắt buộc' });

    const { data: q, error: qErr } = await supabaseAdmin
      .from('practice_questions')
      .select('*')
      .eq('id', question_id)
      .maybeSingle();
    if (qErr) return res.status(400).json({ error: qErr.message });
    if (!q) return res.status(404).json({ error: 'Question not found' });

    let isCorrect = false;
    let correctInfo = null;
    let correctCount = 0;
    let totalPairs = 0;
    const correct = q.correct || [];

    if (q.qtype === 'choose') {
      const selIdx = Number(answer);
      const correctIdx = Number(correct[0]);
      isCorrect = selIdx === correctIdx;
      correctInfo = correctIdx;
    } else if (q.qtype === 'fill') {
      const expected = (correct || []).map(normalizeAnswer);
      let given;
      try { given = JSON.parse(answer || '[]'); } catch { given = []; }
      given = given.map(normalizeAnswer);
      isCorrect = given.length === expected.length && expected.every((e, i) => e === given[i]);
      correctInfo = correct || [];
    } else if (q.qtype === 'mark') {
      const expected = (correct || []).map(normalizeAnswer).sort();
      let given;
      try { given = JSON.parse(answer || '[]'); } catch { given = []; }
      given = given.map(normalizeAnswer).sort();
      isCorrect = given.length === expected.length && expected.every((e, i) => e === given[i]);
      correctInfo = correct || [];
    } else if (q.qtype === 'match') {
      const normSet = (x) => {
        const arr = Array.isArray(x) ? x : (x == null || x === '' ? [] : [x]);
        return new Set(arr.map(s => String(s).trim().toLowerCase()).filter(Boolean));
      };
      const expected = (correct || []).map(normSet);
      let given;
      try { given = JSON.parse(answer || '[]'); } catch { given = []; }
      if (!Array.isArray(given)) given = [];
      for (const s of expected) totalPairs += s.size;
      for (let i = 0; i < Math.max(expected.length, given.length); i++) {
        const es = expected[i] || new Set();
        const gs = normSet(given[i]);
        for (const v of gs) if (es.has(v)) correctCount++;
      }
      isCorrect = totalPairs > 0 && correctCount === totalPairs;
      correctInfo = correct || [];
    }

    const score = isCorrect ? 10 : (q.qtype === 'match' && totalPairs ? Math.round((10 * correctCount) / totalPairs) : 0);

    // upsert giữ điểm cao nhất
    const { data: existing } = await supabaseAdmin
      .from('practice_answers')
      .select('score')
      .eq('user_id', req.user.id)
      .eq('question_id', question_id)
      .maybeSingle();

    const finalScore = Math.max(score, existing?.score || 0);
    const { data, error } = await supabaseAdmin
      .from('practice_answers')
      .upsert({
        user_id: req.user.id,
        lesson_id,
        question_id,
        answer: typeof answer === 'string' ? answer : JSON.stringify(answer),
        is_correct: isCorrect || !!existing?.is_correct,
        score: finalScore,
        created_at: new Date().toISOString(),
      }, { onConflict: 'user_id, question_id' })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data: { ...data, is_correct: isCorrect, correct: correctInfo, score: finalScore } });
  } catch (err) {
    console.error('[practice answer]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/practice/my-answers — câu trả lời của user (lọc theo lesson)
router.get('/my-answers', authenticate, async (req, res) => {
  try {
    let q = supabaseAdmin
      .from('practice_answers')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (req.query.lesson_id) q = q.eq('lesson_id', req.query.lesson_id);
    const { data, error } = await q;
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
