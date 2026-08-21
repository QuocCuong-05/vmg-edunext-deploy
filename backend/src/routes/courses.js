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

// GET /api/courses/my-progress — tất cả khóa đã enroll + % tiến độ (cho Dashboard + trang Courses)
router.get('/my-progress', authenticate, async (req, res) => {
  try {
    const { data: enrolls, error: enrollErr } = await supabaseAdmin
      .from('enrollments')
      .select('course_id')
      .eq('user_id', req.user.id);
    if (enrollErr) throw enrollErr;

    const courseIds = (enrolls || []).map(e => e.course_id);
    if (!courseIds.length) return res.json({ data: [] });

    const [{ data: courses }, { data: lessons }, { data: progress }] = await Promise.all([
      supabaseAdmin.from('courses').select('id, title, slug, level, category, lesson_count').in('id', courseIds),
      supabaseAdmin.from('lessons').select('id, course_id').in('course_id', courseIds),
      supabaseAdmin.from('lesson_progress').select('lesson_id, completed').eq('user_id', req.user.id),
    ]);

    const byCourse = {};
    const lessonCourse = {};
    (lessons || []).forEach(l => {
      if (!byCourse[l.course_id]) byCourse[l.course_id] = { total: 0, done: 0, completed: [] };
      byCourse[l.course_id].total++;
      lessonCourse[l.id] = l.course_id;
    });
    (progress || []).forEach(p => {
      const cid = lessonCourse[p.lesson_id];
      if (cid && byCourse[cid] && p.completed) {
        byCourse[cid].done++;
        byCourse[cid].completed.push(p.lesson_id);
      }
    });

    const result = (courses || []).map(c => {
      const info = byCourse[c.id] || { total: c.lesson_count || 0, done: 0, completed: [] };
      const total = c.lesson_count || info.total || 0;
      const pct = total ? Math.round((info.done / total) * 100) : 0;
      return {
        course_id: c.id,
        title: c.title,
        slug: c.slug,
        level: c.level,
        category: c.category,
        lesson_count: total,
        progress_pct: pct,
        enrolled: true,
        completed_lessons: info.completed,
      };
    });

    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/courses/:slug — single course with lessons (sanitized theo quyền)
router.get('/:slug', authenticate, async (req, res) => {
  try {
    let slug = req.params.slug;
    let { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (courseError) return res.status(400).json({ error: courseError.message });

    if (!course && LEGACY_SLUGS[slug]) {
      slug = LEGACY_SLUGS[slug];
      const legacy = await supabaseAdmin
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

    await logActivity(req.user.id, 'course_view', `Xem khóa học "${course.title}"`, req, `Khóa học: ${course.title}`);

    const { data: lessons, error: lessonsError } = await supabaseAdmin
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
    const courseId = req.params.courseId;
    const { data: existing } = await supabaseAdmin
      .from('enrollments')
      .select('id, status')
      .eq('user_id', req.user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (existing) {
      return res.status(200).json({ data: existing, already_enrolled: true });
    }

    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .insert({ user_id: req.user.id, course_id: courseId, status: 'active' })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/courses/:courseId/progress — user progress in course (tính % động từ lesson_progress)
router.get('/:courseId/progress', authenticate, async (req, res) => {
  try {
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('id, lesson_count')
      .eq('id', req.params.courseId)
      .maybeSingle();

    const { data: lessons } = await supabaseAdmin
      .from('lessons')
      .select('id')
      .eq('course_id', req.params.courseId);

    const lessonIds = (lessons || []).map(l => l.id);

    const { data: progress, error: progErr } = await supabaseAdmin
      .from('lesson_progress')
      .select('lesson_id, completed, watched_seconds, score')
      .eq('user_id', req.user.id)
      .in('lesson_id', lessonIds);
    if (progErr) throw progErr;

    const completedLessons = (progress || []).filter(p => p.completed).map(p => p.lesson_id);
    const total = course?.lesson_count || lessonIds.length || 0;
    const progress_pct = total ? Math.round((completedLessons.length / total) * 100) : 0;

    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('course_id', req.params.courseId)
      .maybeSingle();

    res.json({
      data: {
        enrolled: !!enrollment,
        progress_pct,
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
