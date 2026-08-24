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
      item_type: l.item_type ?? null,
      module_id: l.module_id ?? null,
      points: l.points ?? 0,
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

    const enrollIds = new Set((enrolls || []).map(e => e.course_id));

    // Khóa user có tiến độ (lesson_progress) nhưng chưa enroll — ví dụ học bài free trong khóa Premium
    const { data: lpRows, error: lpErr } = await supabaseAdmin
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', req.user.id);
    if (lpErr) throw lpErr;

    let courseIds = [...enrollIds];
    if (lpRows && lpRows.length) {
      const { data: lpLessons } = await supabaseAdmin
        .from('lessons')
        .select('course_id')
        .in('id', lpRows.map(l => l.lesson_id));
      (lpLessons || []).forEach(l => {
        if (l.course_id && !enrollIds.has(l.course_id)) courseIds.push(l.course_id);
      });
    }

    if (!courseIds.length) return res.json({ data: [] });

    const [{ data: courses }, { data: lessons }, { data: progress }] = await Promise.all([
      supabaseAdmin.from('courses').select('id, title, slug, level, category, lesson_count').in('id', courseIds),
      supabaseAdmin.from('lessons').select('id, course_id, item_type, points').in('course_id', courseIds),
      supabaseAdmin.from('lesson_progress').select('lesson_id, completed').eq('user_id', req.user.id),
    ]);

    // Điểm practice: điểm tổng + điểm đạt được của user
    const practiceLessonIds = (lessons || []).filter(l => l.item_type === 'practice').map(l => l.id);
    let pointsTotalByCourse = {};
    let pointsEarnedByCourse = {};
    if (practiceLessonIds.length) {
      const [answersRes, subsRes, qCountRes] = await Promise.all([
        supabaseAdmin.from('practice_answers').select('lesson_id, score, is_correct').eq('user_id', req.user.id).in('lesson_id', practiceLessonIds),
        supabaseAdmin.from('practice_submissions').select('lesson_id, ai_score, teacher_score').eq('user_id', req.user.id).in('lesson_id', practiceLessonIds),
        supabaseAdmin.from('practice_questions').select('lesson_id').in('lesson_id', practiceLessonIds),
      ]);
      const answers = answersRes.data || [];
      const subs = subsRes.data || [];
      const qCount = {};
      (qCountRes.data || []).forEach(q => { qCount[q.lesson_id] = (qCount[q.lesson_id] || 0) + 1; });

      const bestVoice = {};
      (subs || []).forEach(s => {
        const sc = s.teacher_score ?? s.ai_score;
        if (sc != null) bestVoice[s.lesson_id] = Math.max(bestVoice[s.lesson_id] || 0, sc);
      });
      const correctCount = {};
      (answers || []).forEach(a => { if (a.is_correct) correctCount[a.lesson_id] = (correctCount[a.lesson_id] || 0) + 1; });

      (lessons || []).forEach(l => {
        if (l.item_type !== 'practice' || !l.points) return;
        const cid = l.course_id;
        pointsTotalByCourse[cid] = (pointsTotalByCourse[cid] || 0) + (l.points || 0);
        let ratio = 0;
        if (bestVoice[l.id] != null) ratio = bestVoice[l.id] / 10;
        else if (qCount[l.id]) ratio = Math.min(1, (correctCount[l.id] || 0) / qCount[l.id]);
        pointsEarnedByCourse[cid] = (pointsEarnedByCourse[cid] || 0) + Math.round((l.points || 0) * ratio);
      });
    }

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
        enrolled: enrollIds.has(c.id),
        completed_lessons: info.completed,
        points_total: pointsTotalByCourse[c.id] || 0,
        points_earned: pointsEarnedByCourse[c.id] || 0,
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

    const sanitized = sanitizeLessons(lessons, canAccessFull);

    // Cấu trúc phân tầng theo module (course_modules) — giữ luôn lessons phẳng cho tương thích
    let modules = [];
    try {
      const { data, error } = await supabaseAdmin
        .from('course_modules')
        .select('id, title, position')
        .eq('course_id', course.id)
        .order('position', { ascending: true });
      if (!error) modules = data || [];
    } catch {}

    const itemsByModule = {};
    const loose = [];
    (sanitized || []).forEach(l => {
      if (l.module_id && modules?.some(m => m.id === l.module_id)) {
        (itemsByModule[l.module_id] = itemsByModule[l.module_id] || []).push(l);
      } else {
        loose.push(l);
      }
    });

    const modulesOut = (modules || []).map(m => ({
      id: m.id,
      title: m.title,
      position: m.position,
      items: (itemsByModule[m.id] || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    }));
    if (loose.length) {
      modulesOut.unshift({ id: null, title: 'Nội dung khác', position: -1, items: loose });
    }

    res.json({ data: { ...course, modules: modulesOut, lessons: sanitized } });
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
      .select('id, item_type, points')
      .eq('course_id', req.params.courseId);

    const lessonIds = (lessons || []).map(l => l.id);

    const { data: progress, error: progErr } = await supabaseAdmin
      .from('lesson_progress')
      .select('lesson_id, completed, watched_seconds, score')
      .eq('user_id', req.user.id)
      .in('lesson_id', lessonIds);
    if (progErr) throw progErr;

    // Điểm practice
    let pointsTotal = 0;
    let pointsEarned = 0;
    const practiceScores = {};
    const practiceLessonIds = (lessons || []).filter(l => l.item_type === 'practice').map(l => l.id);
    if (practiceLessonIds.length) {
      const [answersRes, subsRes, qCountRes] = await Promise.all([
        supabaseAdmin.from('practice_answers').select('lesson_id, score, is_correct').eq('user_id', req.user.id).in('lesson_id', practiceLessonIds),
        supabaseAdmin.from('practice_submissions').select('lesson_id, ai_score, teacher_score').eq('user_id', req.user.id).in('lesson_id', practiceLessonIds),
        supabaseAdmin.from('practice_questions').select('lesson_id').in('lesson_id', practiceLessonIds),
      ]);
      const answers = answersRes.data || [];
      const subs = subsRes.data || [];
      const qCount = {};
      (qCountRes.data || []).forEach(q => { qCount[q.lesson_id] = (qCount[q.lesson_id] || 0) + 1; });
      const bestVoice = {};
      (subs || []).forEach(s => {
        const sc = s.teacher_score ?? s.ai_score;
        if (sc != null) bestVoice[s.lesson_id] = Math.max(bestVoice[s.lesson_id] || 0, sc);
      });
      const correctCount = {};
      (answers || []).forEach(a => { if (a.is_correct) correctCount[a.lesson_id] = (correctCount[a.lesson_id] || 0) + 1; });

      (lessons || []).forEach(l => {
        if (l.item_type !== 'practice') return;
        const max = l.points || 0;
        pointsTotal += max;
        let ratio = 0;
        if (bestVoice[l.id] != null) ratio = bestVoice[l.id] / 10;
        else if (qCount[l.id]) ratio = Math.min(1, (correctCount[l.id] || 0) / qCount[l.id]);
        const earned = Math.round(max * ratio);
        pointsEarned += earned;
        if (max > 0) practiceScores[l.id] = { earned, max };
      });
    }

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
        points_total: pointsTotal,
        points_earned: pointsEarned,
        practice_scores: practiceScores,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
