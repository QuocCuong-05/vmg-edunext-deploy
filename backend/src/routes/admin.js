import { Router } from 'express';
import { supabaseAdmin } from '../config/database.js';
import { importTable, TABLES } from '../lib/seedData.js';

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
    const { course_id: courseId, price, sale_price: salePrice } = req.body;
    if (!courseId || !price) return res.status(400).json({ error: 'course_id và price là bắt buộc' });
    const { data, error } = await supabaseAdmin
      .from('courses')
      .update({ access_type: 'paid', price: Math.round(price), sale_price: salePrice ? Math.round(salePrice) : null })
      .eq('id', courseId)
      .select('id, title, access_type, price, sale_price')
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
      .update({ access_type: 'free', price: null, sale_price: null })
      .eq('id', courseId)
      .select('id, title, access_type, price, sale_price')
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

export default router;
