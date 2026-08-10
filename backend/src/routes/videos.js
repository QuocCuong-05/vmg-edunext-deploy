import { Router } from 'express';
import { supabase, supabaseAdmin } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { hasActivePlus } from '../lib/plus.js';

const router = Router();

// GET /api/videos/token/:lessonId — signed URL để phát video (bảo vệ khỏi tải trực tiếp)
router.get('/token/:lessonId', authenticate, async (req, res, next) => {
  try {
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('id, course_id, video_url, is_free, preview_text')
      .eq('id', req.params.lessonId)
      .maybeSingle();
    if (error || !lesson) return res.status(404).json({ error: 'Bài học không tồn tại' });
    if (!lesson.video_url) return res.status(404).json({ error: 'Bài học chưa có video' });

    const isFreeLesson = !!lesson.is_free;
    const isPreviewLesson = !!lesson.preview_text;
    let canAccessFull = isFreeLesson || (await hasActivePlus(req.user.id));

    if (!canAccessFull) {
      const { data: enrolled } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', req.user.id)
        .eq('course_id', lesson.course_id)
        .maybeSingle();
      canAccessFull = !!enrolled;
    }

    if (!canAccessFull && !isPreviewLesson) {
      return res.status(403).json({ error: 'Bài học này yêu cầu gói Plus' });
    }

    // URL http (YouTube...) — giữ nguyên iframe legacy
    if (lesson.video_url.startsWith('http')) {
      return res.json({
        url: lesson.video_url,
        legacy: true,
        canAccessFull: true,
        previewSeconds: null,
      });
    }

    // Storage path (Supabase Storage / sau này R2) — ký URL tạm thời
    const { data, error: signError } = await supabaseAdmin.storage
      .from('lesson-videos')
      .createSignedUrl(lesson.video_url, 3600);
    if (signError || !data?.signedUrl) throw signError || new Error('Không thể tạo signed URL');

    const { data: ps } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'preview_seconds')
      .maybeSingle();
    const previewSeconds = Number(ps?.value) || 120;

    res.json({
      url: data.signedUrl,
      legacy: false,
      canAccessFull,
      previewSeconds: !canAccessFull && isPreviewLesson ? previewSeconds : null,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
