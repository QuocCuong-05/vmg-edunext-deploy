import { Router } from 'express';
import { supabase, supabaseAdmin } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { hasActivePlus } from '../lib/plus.js';
import { logActivity } from '../lib/activity.js';

const router = Router();

const LEGACY_SLUGS = {
  'pronunciation-all-in-one': 'pronunciation-vowels',
};

function sanitizeLessons(lessons, canAccessFull) {
  return (lessons || []).map(l => {
    if (canAccessFull || l.is_free) return l;
    return {
      id: l.id,
      title: l.title,
      sort_order: l.sort_order,
      content_type: l.content_type,
      duration_minutes: l.duration_minutes,
      duration: l.duration ?? null,
      video_duration_seconds: l.video_duration_seconds ?? null,
      is_free: l.is_free,
      preview_text: l.preview_text,
      module: l.module ?? null,
    };
  });
}

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

// GET /api/courses/:slug — single course with lessons (sanitized theo quyền)
router.get('/:slug', authenticate, async (req, res) => {
  try {
    let slug = req.params.slug;
    let { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (courseError) return res.status(400).json({ error: courseError.message });

    if (!course && LEGACY_SLUGS[slug]) {
      slug = LEGACY_SLUGS[slug];
      const legacy = await supabase
        .from('courses')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();
      course = legacy.data;
      courseError = legacy.error;
      if (courseError) return res.status(400).json({ error: courseError.message });
    }

    if (!course) return res.status(404).json({ error: 'Course not found' });

    await logActivity(req.user.id, 'course_view', `Xem khóa học "${course.title}"`, req);

    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', course.id)
      .order('sort_order', { ascending: true });

    if (lessonsError) return res.status(400).json({ error: lessonsError.message });

    const [plusActive, enrolled] = await Promise.all([
      hasActivePlus(req.user.id),
      supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', req.user.id)
        .eq('course_id', course.id)
        .maybeSingle(),
    ]);
    const canAccessFull = plusActive || !!enrolled?.data;

    res.json({ data: { ...course, lessons: sanitizeLessons(lessons, canAccessFull) } });
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
    const { data: progress } = await supabaseAdmin
      .from('lesson_progress')
      .select('lesson_id, completed, watched_seconds, score')
      .eq('user_id', req.user.id);

    const completedLessons = (progress || []).filter(p => p.completed).map(p => p.lesson_id);

    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('course_id', req.params.courseId)
      .maybeSingle();

    if (enrollError) throw enrollError;

    res.json({
      data: {
        enrolled: !!enrollment,
        progress_pct: enrollment?.progress_pct || 0,
        status: enrollment?.status || null,
        completed_lessons: completedLessons,
        details: progress || [],
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
