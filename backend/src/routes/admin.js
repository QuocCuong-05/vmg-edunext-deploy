import { Router } from 'express';
import { supabaseAdmin } from '../config/database.js';
import { importTable, TABLES } from '../lib/seedData.js';
import { activatePlus } from '../lib/plus.js';

const router = Router();

const ALLOWED_TABLES = TABLES.map(t => t.name);

router.post('/import', async (req, res) => {
  try {
    const { table, rows, mode } = req.body;

    if (!table || !rows || !Array.isArray(rows)) {
      return res.status(400).json({ error: 'table (string) and rows (array) are required' });
    }

    if (!ALLOWED_TABLES.includes(table)) {
      return res.status(400).json({ error: `Table "${table}" is not allowed. Allowed: ${ALLOWED_TABLES.join(', ')}` });
    }

    if (rows.length === 0) {
      return res.status(400).json({ error: 'rows array is empty' });
    }

    const importMode = mode === 'append' ? 'append' : 'replace';
    const result = await importTable(table, rows, importMode);

    res.json({ imported: result.count, table: result.table, mode: result.mode });
  } catch (err) {
    console.error('Admin import error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/orders', async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, courses(title, slug)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;

    const orders = data || [];
    const userIds = [...new Set(orders.map(o => o.user_id))];
    let profileMap = {};
    if (userIds.length) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      profileMap = {};
      (profiles || []).forEach(p => { profileMap[p.id] = p.full_name; });
    }
    res.json(orders.map(o => ({ ...o, full_name: profileMap[o.user_id] || null })));
  } catch (err) {
    next(err);
  }
});

router.post('/orders/:id/approve', async (req, res, next) => {
  try {
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (!order) return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    if (order.status !== 'pending') return res.status(400).json({ error: 'Đơn hàng đã xử lý' });

    await supabaseAdmin
      .from('orders')
      .update({ status: 'paid', paid_at: new Date().toISOString(), confirmed_by: req.user.id })
      .eq('id', order.id);

    if (order.item_type === 'plus') {
      await activatePlus(order.user_id, null, order.period, order.amount, req.user.id);
      return res.json({ ok: true });
    }

    await supabaseAdmin
      .from('enrollments')
      .insert({ user_id: order.user_id, course_id: order.course_id, status: 'active' });
    const { data: course } = await supabaseAdmin.from('courses').select('title').eq('id', order.course_id).maybeSingle();
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: order.user_id,
        from_user_id: order.user_id,
        type: 'purchase',
        message: `Bạn đã mua khóa học "${course?.title || ''}" thành công.`,
      });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post('/courses/paid', async (req, res, next) => {
  try {
    const { course_id: courseId } = req.body;
    if (!courseId) return res.status(400).json({ error: 'course_id là bắt buộc' });
    const { data, error } = await supabaseAdmin
      .from('courses')
      .update({ access_type: 'premium' })
      .eq('id', courseId)
      .select('id, title, access_type')
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/courses/free', async (req, res, next) => {
  try {
    const { course_id: courseId } = req.body;
    if (!courseId) return res.status(400).json({ error: 'course_id là bắt buộc' });
    const { data, error } = await supabaseAdmin
      .from('courses')
      .update({ access_type: 'free' })
      .eq('id', courseId)
      .select('id, title, access_type')
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/courses/preview', async (req, res, next) => {
  try {
    const { lesson_id: lessonId, preview_text: previewText } = req.body;
    if (!lessonId) return res.status(400).json({ error: 'lesson_id là bắt buộc' });
    const { data, error } = await supabaseAdmin
      .from('lessons')
      .update({ preview_text: previewText || null, is_free: previewText ? true : undefined })
      .eq('id', lessonId)
      .select('id, title, is_free, preview_text');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/settings', async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from('app_settings').select('*');
    if (error) throw error;
    const map = {};
    (data || []).forEach(r => { map[r.key] = r.value; });
    res.json(map);
  } catch (err) {
    next(err);
  }
});

router.post('/settings', async (req, res, next) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: 'key là bắt buộc' });
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      .select('*');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard-stats', async (_req, res, next) => {
  try {
    const now = new Date();
    const d7 = new Date(Date.now() - 7 * 86400e3).toISOString();
    const d30 = new Date(Date.now() - 30 * 86400e3).toISOString();
    const d7future = new Date(Date.now() + 7 * 86400e3).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const nowIso = now.toISOString();

    const [
      cu, cu7, cu30, cuAct,
      comp, actLrn, totProg,
      qAtt, qUsr, qAvg,
      tCourses, pCourses,
      pendOrd, mOrd, tRev,
      aPlus, ePlus,
      cP, cC,
      xpAv, xpTp,
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', d7),
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', d30),
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).gte('last_active_at', d7),
      supabaseAdmin.from('lesson_progress').select('id', { count: 'exact', head: true }).eq('completed', true),
      supabaseAdmin.from('lesson_progress').select('user_id', { count: 'exact', head: true }).gte('updated_at', d7),
      supabaseAdmin.from('lesson_progress').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('quiz_attempts').select('id', { count: 'exact', head: true }).gte('created_at', d7),
      supabaseAdmin.from('quiz_attempts').select('user_id', { count: 'exact', head: true }).gte('created_at', d7),
      supabaseAdmin.from('quiz_attempts').select('score').gte('created_at', d7),
      supabaseAdmin.from('courses').select('id', { count: 'exact', head: true }).eq('is_published', true),
      supabaseAdmin.from('courses').select('id', { count: 'exact', head: true }).eq('is_published', true).in('access_type', ['premium', 'paid']),
      supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('orders').select('amount').eq('status', 'paid').gte('paid_at', monthStart),
      supabaseAdmin.from('orders').select('amount').eq('status', 'paid'),
      supabaseAdmin.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active').gt('end_at', nowIso),
      supabaseAdmin.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active').gt('end_at', nowIso).lte('end_at', d7future),
      supabaseAdmin.from('community_posts').select('id', { count: 'exact', head: true }).gte('created_at', d7),
      supabaseAdmin.from('community_comments').select('id', { count: 'exact', head: true }).gte('created_at', d7),
      supabaseAdmin.from('profiles').select('xp'),
      supabaseAdmin.from('profiles').select('id, full_name, xp').order('xp', { ascending: false }).limit(10),
    ]);

    const totalUsers = cu?.count || 0;
    const new7 = cu7?.count || 0;
    const new30 = cu30?.count || 0;
    const activeUsers = cuAct?.count || 0;
    const completed = comp?.count || 0;
    const activeLearners = actLrn?.count || 0;
    const totalProgress = totProg?.count || 0;
    const quizAtt = qAtt?.count || 0;
    const quizUsers = qUsr?.count || 0;
    const totalCourses = tCourses?.count || 0;
    const premiumCourses = pCourses?.count || 0;
    const pendingOrders = pendOrd?.count || 0;
    const activePlus = aPlus?.count || 0;
    const expiringPlus = ePlus?.count || 0;
    const communityPosts = cP?.count || 0;
    const communityComments = cC?.count || 0;

    const monthOrders = mOrd?.data || [];
    const totalRev = tRev?.data || [];
    const quizAvg = qAvg?.data || [];
    const xpAvg = xpAv?.data || [];
    const xpTop = xpTp?.data || [];

    const monthRevenue = monthOrders.reduce((s, o) => s + (o.amount || 0), 0);
    const totalRevenue = totalRev.reduce((s, o) => s + (o.amount || 0), 0);
    const quizAvgScore = quizAvg.length
      ? Math.round((quizAvg.reduce((s, a) => s + (a.score || 0), 0) / quizAvg.length) * 10) / 10
      : null;
    const avgXp = xpAvg.length
      ? Math.round(xpAvg.reduce((s, p) => s + (p.xp || 0), 0) / xpAvg.length)
      : 0;
    const completionPct = totalProgress > 0 ? Math.round((completed / totalProgress) * 100) : 0;

    res.json({
      users: { total: totalUsers, new7d: new7, new30d: new30, active7d: activeUsers },
      learning: { completed, total: totalProgress, completionPct, activeLearners },
      quiz: { attempts7d: quizAtt, users7d: quizUsers, avgScore: quizAvgScore },
      courses: { total: totalCourses, premium: premiumCourses },
      revenue: { pending: pendingOrders, month: monthRevenue, total: totalRevenue },
      plus: { active: activePlus, expiring7d: expiringPlus },
      community: { posts7d: communityPosts, comments7d: communityComments },
      xp: { avg: avgXp, top10: xpTop },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/subscriptions', async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;

    const userIds = [...new Set((data || []).map(s => s.user_id))];
    let profileMap = {};
    if (userIds.length) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      (profiles || []).forEach(p => { profileMap[p.id] = p.full_name; });
    }
    res.json((data || []).map(s => ({ ...s, full_name: profileMap[s.user_id] || null })));
  } catch (err) {
    next(err);
  }
});

router.post('/subscriptions/activate', async (req, res, next) => {
  try {
    const { user_id: userId, period } = req.body;
    if (!userId) return res.status(400).json({ error: 'user_id là bắt buộc' });
    const p = Number(period) || 1;
    if (![1, 3, 6, 12].includes(p)) return res.status(400).json({ error: 'period phải là 1, 3, 6 hoặc 12' });
    const sub = await activatePlus(userId, null, p, null, req.user.id);
    res.json(sub);
  } catch (err) {
    next(err);
  }
});

router.post('/subscriptions/:id/renew', async (req, res, next) => {
  try {
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (!sub) return res.status(404).json({ error: 'Không tìm thấy tài khoản Plus' });
    const base = new Date(Math.max(new Date(sub.end_at).getTime(), Date.now()));
    const end = new Date(base);
    end.setUTCMonth(end.getUTCMonth() + sub.period);
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'active', end_at: end.toISOString(), updated_at: new Date().toISOString() })
      .eq('id', sub.id)
      .select('*')
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/subscriptions/:id/cancel', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
