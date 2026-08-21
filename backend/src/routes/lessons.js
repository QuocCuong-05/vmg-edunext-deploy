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

    if (lesson.is_free || (await hasActivePlus(req.user.id))) {
      return res.json({ data: lesson });
    }

    const { data: courseEnrolled } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('course_id', lesson.course_id)
      .maybeSingle();
    if (courseEnrolled) return res.json({ data: lesson });

    return res.json({
      data: {
        id: lesson.id,
        title: lesson.title,
        sort_order: lesson.sort_order,
        content_type: lesson.content_type,
        duration_minutes: lesson.duration_minutes,
        is_free: lesson.is_free,
        preview_text: lesson.preview_text,
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

    const { data, error } = await supabaseAdmin
      .from('lesson_progress')
      .upsert({
        user_id: req.user.id,
        lesson_id: req.params.id,
        completed: completed || false,
        watched_seconds: watched_seconds || 0,
        score: score || null,
        completed_at: completed ? new Date().toISOString() : null
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
