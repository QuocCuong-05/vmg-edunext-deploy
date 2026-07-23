import { Router } from 'express';
import { supabase } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/courses — list published courses
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/courses/:slug — single course with lessons
router.get('/:slug', async (req, res) => {
  try {
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('slug', req.params.slug)
      .eq('is_published', true)
      .single();

    if (courseError) return res.status(404).json({ error: 'Course not found' });

    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', course.id)
      .order('sort_order', { ascending: true });

    if (lessonsError) return res.status(400).json({ error: lessonsError.message });

    res.json({ data: { ...course, lessons } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/courses/:courseId/enroll — enroll user
router.post('/:courseId/enroll', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .insert({ user_id: req.user.id, course_id: req.params.courseId })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/courses/:courseId/progress — user progress in course
router.get('/:courseId/progress', authenticate, async (req, res) => {
  try {
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('course_id', req.params.courseId)
      .single();

    if (enrollError && enrollError.code === 'PGRST116') {
      return res.json({ data: { enrolled: false, progress_pct: 0, completed_lessons: [], status: null } });
    }

    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('lesson_id, completed, watched_seconds, score')
      .eq('user_id', req.user.id);

    const completedLessons = (progress || []).filter(p => p.completed).map(p => p.lesson_id);

    res.json({
      data: {
        enrolled: true,
        progress_pct: enrollment?.progress_pct || 0,
        status: enrollment?.status || 'active',
        completed_lessons: completedLessons,
        details: progress || []
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
