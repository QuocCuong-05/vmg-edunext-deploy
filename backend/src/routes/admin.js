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

async function profileMapFor(userIds) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (!ids.length) return {};
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email')
    .in('id', ids);
  const map = {};
  (data || []).forEach(p => { map[p.id] = p; });
  return map;
}

// GET /admin/trace/activity — access_log toàn bộ user (truy vết IP)
router.get('/trace/activity', async (req, res, next) => {
  try {
    const { email, ip, event, from, to, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 50));
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from('access_log')
      .select('id, event, description, context, origin, ip, user_agent, created_at, user_id', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (ip) query = query.ilike('ip', `%${ip}%`);
    if (event) query = query.eq('event', event);
    if (from) query = query.gte('created_at', new Date(from).toISOString());
    if (to) query = query.lte('created_at', new Date(to).toISOString());

    const { data, error, count } = await query;
    if (error) throw error;

    const pmap = await profileMapFor((data || []).map(a => a.user_id));
    res.json({
      data: (data || []).map(a => ({
        ...a,
        email: pmap[a.user_id]?.email || (a.user_id ? '' : '(đã ẩn danh)'),
        full_name: pmap[a.user_id]?.full_name || '-',
      })),
      total: count || 0,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    next(err);
  }
});

// GET /admin/trace/consents — consent_log theo user
router.get('/trace/consents', async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 50));
    const offset = (pageNum - 1) * limitNum;

    const { data, error, count } = await supabaseAdmin
      .from('consent_log')
      .select('user_id, policy_key, accepted, version, ip, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);
    if (error) throw error;

    const pmap = await profileMapFor((data || []).map(c => c.user_id));
    res.json({
      data: (data || []).map(c => ({
        ...c,
        email: pmap[c.user_id]?.email || (c.user_id ? '' : '(đã ẩn danh)'),
        full_name: pmap[c.user_id]?.full_name || '-',
      })),
      total: count || 0,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    next(err);
  }
});

// GET /admin/trace/devices — login_sessions mọi user (thiết bị + IP)
router.get('/trace/devices', async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 50));
    const offset = (pageNum - 1) * limitNum;

    const { data, error, count } = await supabaseAdmin
      .from('login_sessions')
      .select('id, device_name, ip, user_agent, logged_in_at, last_active_at, user_id', { count: 'exact' })
      .order('logged_in_at', { ascending: false })
      .range(offset, offset + limitNum - 1);
    if (error) throw error;

    const pmap = await profileMapFor((data || []).map(d => d.user_id));
    res.json({
      data: (data || []).map(d => ({
        ...d,
        email: pmap[d.user_id]?.email || (d.user_id ? '' : '(đã ẩn danh)'),
        full_name: pmap[d.user_id]?.full_name || '-',
      })),
      total: count || 0,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    next(err);
  }
});

// GET /admin/trace/stats — thống kê analytics
router.get('/trace/stats', async (_req, res, next) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [{ count: totalUsers }, { count: logins7d }, { count: uniqueIps7d }] = await Promise.all([
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('access_log').select('id', { count: 'exact', head: true }).eq('event', 'login').gte('created_at', weekAgo),
      supabaseAdmin.from('access_log').select('ip', { count: 'exact', head: true }).gte('created_at', weekAgo).not('ip', 'is', null),
    ]);

    const { data: events } = await supabaseAdmin
      .from('access_log')
      .select('event')
      .gte('created_at', weekAgo);

    const eventCount = {};
    (events || []).forEach(e => { eventCount[e.event] = (eventCount[e.event] || 0) + 1; });

    const { data: topIps } = await supabaseAdmin
      .from('access_log')
      .select('ip')
      .gte('created_at', weekAgo)
      .not('ip', 'is', null)
      .limit(1000);

    const ipCount = {};
    (topIps || []).forEach(r => { if (r.ip) ipCount[r.ip] = (ipCount[r.ip] || 0) + 1; });
    const topIpList = Object.entries(ipCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([ip, n]) => ({ ip, count: n }));

    const { data: topUsers } = await supabaseAdmin
      .from('access_log')
      .select('user_id')
      .gte('created_at', weekAgo)
      .not('user_id', 'is', null)
      .limit(1000);

    const pmap = await profileMapFor((topUsers || []).map(r => r.user_id));
    const userCount = {};
    (topUsers || []).forEach(r => {
      if (!userCount[r.user_id]) {
        userCount[r.user_id] = { count: 0, name: pmap[r.user_id]?.full_name || '-', email: pmap[r.user_id]?.email || r.user_id };
      }
      userCount[r.user_id].count += 1;
    });
    const topUserList = Object.values(userCount).sort((a, b) => b.count - a.count).slice(0, 10);

    res.json({
      data: {
        total_users: totalUsers || 0,
        logins_7d: logins7d || 0,
        unique_ips_7d: uniqueIps7d || 0,
        events_7d: eventCount,
        top_ips: topIpList,
        top_users: topUserList,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
