import { Router } from 'express';
import { supabase, supabaseAdmin } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { hasActivePlus } from '../lib/plus.js';
import { logActivity } from '../lib/activity.js';

const router = Router();

// GET /api/lessons/:id — single lesson detail (sanitized theo quyền)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data: lesson, error } = await supabaseAdmin
      .from('lessons')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'Lesson not found' });

    await logActivity(req.user.id, 'lesson_view', `Xem bài học "${lesson.title}"`, req, `Bài học: ${lesson.title}`);

    let accessible = lesson;
    if (!(lesson.is_free || (await hasActivePlus(req.user.id)))) {
      const { data: courseEnrolled } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', req.user.id)
        .eq('course_id', lesson.course_id)
        .maybeSingle();
      if (!courseEnrolled) {
        accessible = {
          id: lesson.id,
          title: lesson.title,
          sort_order: lesson.sort_order,
          content_type: lesson.content_type,
          duration_minutes: lesson.duration_minutes,
          is_free: lesson.is_free,
          preview_text: lesson.preview_text,
        };
      }
    }

    let practiceWords = [];
    let practiceQuestions = [];
    let practiceAnswers = [];
    try {
      const [wRes, qRes] = await Promise.all([
        supabaseAdmin
          .from('practice_words')
          .select('id, word, audio_url, image_url, position')
          .eq('lesson_id', lesson.id)
          .order('position', { ascending: true }),
        supabaseAdmin
          .from('practice_questions')
          .select('id, qtype, position, audio_url, prompt, text_content, options')
          .eq('lesson_id', lesson.id)
          .order('position', { ascending: true }),
      ]);
      if (wRes.data) practiceWords = wRes.data;
      if (qRes.data) practiceQuestions = qRes.data;
    } catch {}

    try {
      const { data } = await supabaseAdmin
        .from('practice_answers')
        .select('question_id, answer, is_correct, score')
        .eq('user_id', req.user.id)
        .eq('lesson_id', lesson.id);
      if (data) practiceAnswers = data;
    } catch {}

    const [progRes] = await Promise.all([
      supabaseAdmin
        .from('lesson_progress')
        .select('completed, watched_seconds, score, completed_at')
        .eq('user_id', req.user.id)
        .eq('lesson_id', lesson.id)
        .maybeSingle(),
    ]);

    res.json({
      data: {
        ...accessible,
        practice_type: lesson.practice_type || 'speak_words',
        practice_words: practiceWords,
        practice_questions: practiceQuestions,
        practice_answers: practiceAnswers,
        progress: progRes.data || null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/lessons/:id/progress — update lesson progress
router.post('/:id/progress', authenticate, async (req, res) => {
  try {
    const { completed, watched_seconds, score } = req.body;

    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from('lessons')
      .select('id, video_url')
      .eq('id', req.params.id)
      .maybeSingle();
    if (lessonError) return res.status(400).json({ error: lessonError.message });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    if (completed && !lesson.video_url) {
      return res.status(400).json({ error: 'Bài học chưa có video, không thể hoàn thành' });
    }

    const { data: existing } = await supabaseAdmin
      .from('lesson_progress')
      .select('completed, completed_at')
      .eq('user_id', req.user.id)
      .eq('lesson_id', req.params.id)
      .maybeSingle();

    const { data, error } = await supabaseAdmin
      .from('lesson_progress')
      .upsert({
        user_id: req.user.id,
        lesson_id: req.params.id,
        completed: completed || existing?.completed || false,
        watched_seconds: watched_seconds || 0,
        score: score || null,
        completed_at: completed ? new Date().toISOString() : (existing?.completed_at || null)
      }, { onConflict: 'user_id, lesson_id' })
      .select()
      .single();

    if (error) {
      console.error('[progress upsert]', error.message);
      return res.status(400).json({ error: error.message });
    }
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
