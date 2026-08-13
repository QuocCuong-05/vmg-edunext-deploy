import { Router } from 'express';
import crypto from 'node:crypto';
import { supabase, supabaseAdmin, JWT_SECRET } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { activatePlus } from '../lib/plus.js';

const router = Router();

const APPROVE_SECRET = process.env.PAYMENT_APPROVE_SECRET || JWT_SECRET;

function genOrderNo() {
  const ymd = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(2, 10).replace(/-/g, '');
  let no = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = 0; i < 6; i++) no += chars[Math.floor(Math.random() * chars.length)];
  return `VMG${ymd}${no}`;
}

function isUniqueViolation(err) {
  return err && (err.code === '23505' || /duplicate key/.test(err.message || ''));
}

function signApproveToken(orderId) {
  const payload = `${orderId}:${Date.now()}`;
  const sig = crypto.createHmac('sha256', APPROVE_SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verifyApproveToken(token) {
  if (!token || typeof token !== 'string') return null;
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expect = crypto.createHmac('sha256', APPROVE_SECRET).update(payload).digest('hex');
  if (sig !== expect) return null;
  const sep = payload.indexOf(':');
  if (sep <= 0) return null;
  const orderId = payload.slice(0, sep);
  const ts = Number(payload.slice(sep + 1));
  if (!orderId || !ts) return null;
  const ttl = 10 * 60 * 1000;
  if (Date.now() - ts > ttl) return null;
  return orderId;
}

async function getProfileRole(userId) {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();
  return data?.role || 'learner';
}

async function isUnlocked(userId, courseId) {
  const { data } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();
  return !!data;
}

async function unlockCourse(userId, courseId, orderId, confirmedById) {
  if (!(await isUnlocked(userId, courseId))) {
    const { error: enrollErr } = await supabaseAdmin
      .from('enrollments')
      .insert({ user_id: userId, course_id: courseId, status: 'active' })
      .select('id');
    if (enrollErr) throw enrollErr;
  }

  const { data: current } = await supabaseAdmin
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .maybeSingle();
  if (current?.status !== 'paid') {
    await supabaseAdmin
      .from('orders')
      .update({ status: 'paid', paid_at: new Date().toISOString(), confirmed_by: confirmedById || null })
      .eq('id', orderId);
  }

  const { data: course } = await supabaseAdmin
    .from('courses')
    .select('title')
    .eq('id', courseId)
    .maybeSingle();

  await supabaseAdmin
    .from('notifications')
    .insert({
      user_id: userId,
      from_user_id: userId,
      type: 'purchase',
      message: `Bạn đã mua khóa học "${course?.title || ''}" thành công.`,
    });
}

async function getOrderTtlMinutes() {
  const { data } = await supabaseAdmin
    .from('app_settings')
    .select('value')
    .eq('key', 'order_ttl_minutes')
    .maybeSingle();
  const minutes = Number(data?.value) || 10;
  return Math.max(1, Math.min(60, minutes));
}

async function getPlusPrice(period) {
  const { data } = await supabaseAdmin
    .from('app_settings')
    .select('value')
    .eq('key', 'plus_prices')
    .maybeSingle();
  const price = Number(data?.value?.[String(period)]) || 0;
  if (!price) throw Object.assign(new Error('Giá gói Plus chưa được cấu hình'), { status: 400 });
  return price;
}

async function createPlusOrder(req, res, next) {
  try {
    const period = Number(req.body.period) || 0;
    if (![1, 3, 6, 12].includes(period)) {
      return res.status(400).json({ error: 'period phải là 1, 3, 6 hoặc 12 tháng' });
    }

    const { data: existing } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('item_type', 'plus')
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) {
      if (existing.period !== period) {
        const err = Object.assign(
          new Error(`Bạn đang có đơn ${existing.order_no} (Plus ${existing.period} tháng) chưa hoàn tất. Hãy hủy đơn cũ để chọn gói khác.`),
          { status: 409, code: 'existing_order', order: existing },
        );
        throw err;
      }
      const role = await getProfileRole(req.user.id);
      const isAdmin = ['admin', 'super_admin'].includes(role);
      const result = { order: existing, existing: true, qr_type: isAdmin ? 'approve' : 'transfer' };
      if (isAdmin) {
        const origin = req.get('origin') || process.env.FRONTEND_URL || '';
        result.approve_url = `${origin}/order-approve/${existing.id}?token=${signApproveToken(existing.id)}`;
      }
      return res.json(result);
    }

    const amount = await getPlusPrice(period);
    const ttlMinutes = await getOrderTtlMinutes();
    let order = {
      order_no: null,
      user_id: req.user.id,
      item_type: 'plus',
      plan: 'plus',
      period,
      amount,
      method: 'bank_transfer',
      status: 'pending',
      expires_at: new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString(),
    };
    let created;
    for (let attempt = 0; attempt < 3; attempt++) {
      order.order_no = genOrderNo();
      const { data, error } = await supabaseAdmin
        .from('orders')
        .insert(order)
        .select('*')
        .single();
      if (!error) { created = data; break; }
      if (!isUniqueViolation(error)) throw error;
    }
    if (!created) throw new Error('Không thể tạo mã đơn, vui lòng thử lại');

    const role = await getProfileRole(req.user.id);
    const isAdmin = ['admin', 'super_admin'].includes(role);
    const result = { order: created, existing: false, qr_type: isAdmin ? 'approve' : 'transfer' };
    if (isAdmin) {
      const origin = req.get('origin') || process.env.FRONTEND_URL || '';
      result.approve_url = `${origin}/order-approve/${created.id}?token=${signApproveToken(created.id)}`;
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
}

router.post('/create', authenticate, async (req, res, next) => {
  try {
    const { plan } = req.body;
    if (plan !== 'plus') {
      return res.status(400).json({ error: 'Chỉ hỗ trợ mua gói Plus (plan: "plus")' });
    }
    return await createPlusOrder(req, res, next);
  } catch (err) {
    next(err);
  }
});

router.get('/mine', authenticate, async (req, res, next) => {
  try {
    await supabaseAdmin
      .from('orders')
      .update({ status: 'expired' })
      .eq('user_id', req.user.id)
      .in('status', ['pending', 'awaiting'])
      .lt('expires_at', new Date().toISOString());

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, courses(title, slug, access_type)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

router.get('/public-settings', async (_req, res, next) => {
  try {
    const { data } = await supabaseAdmin
      .from('app_settings')
      .select('key, value');
    const map = {};
    (data || []).forEach(r => { map[r.key] = r.value; });
    res.json({
      bank_transfer: map.bank_transfer || {},
      preview_seconds: Number(map.preview_seconds) || 120,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/confirm-transfer', authenticate, async (req, res, next) => {
  try {
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!order) return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    if (order.user_id !== req.user.id) return res.status(403).json({ error: 'Không phải đơn của bạn' });
    if (order.status === 'paid') {
      return res.json({ unlocked: true, item_type: order.item_type, course_id: order.course_id });
    }
    if (order.status === 'awaiting') {
      return res.json({ status: 'awaiting_confirmation', item_type: order.item_type, course_id: order.course_id });
    }
    if (!['pending', 'expired'].includes(order.status)) {
      return res.status(400).json({ error: 'Đơn hàng đã xử lý' });
    }
    if (order.status === 'expired' || (order.expires_at && new Date(order.expires_at) < new Date())) {
      await supabaseAdmin.from('orders').update({ status: 'expired' }).eq('id', order.id);
      return res.status(400).json({ error: 'Đơn hàng đã hết hạn, vui lòng tạo đơn mới' });
    }

    const { error: updErr } = await supabaseAdmin
      .from('orders')
      .update({ status: 'awaiting', confirmed_at: new Date().toISOString() })
      .eq('id', order.id);
    if (updErr) throw updErr;

    const { data: admins } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'super_admin']);
    const adminRows = (admins || []).map(a => ({
      user_id: a.id,
      from_user_id: req.user.id,
      type: 'payment_pending',
      message: `Đơn ${order.order_no} (${(order.amount || 0).toLocaleString('vi-VN')}đ) đang chờ xác nhận chuyển khoản.`,
    }));
    if (adminRows.length) {
      await supabaseAdmin.from('notifications').insert(adminRows);
    }

    res.json({ status: 'awaiting_confirmation', item_type: order.item_type, course_id: order.course_id });
  } catch (err) {
    next(err);
  }
});

// POST /orders/:id/cancel — hủy đơn chưa thanh toán (pending/awaiting còn hạn)
router.post('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!order) return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    if (order.user_id !== req.user.id) return res.status(403).json({ error: 'Không phải đơn của bạn' });
    if (!['pending', 'awaiting', 'expired'].includes(order.status)) {
      return res.status(400).json({ error: 'Đơn hàng đã xử lý, không thể hủy' });
    }
    const { error: updErr } = await supabaseAdmin
      .from('orders')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', order.id);
    if (updErr) throw updErr;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/approve-info', async (req, res, next) => {
  try {
    const orderId = verifyApproveToken(req.query.token);
    if (!orderId) return res.status(400).json({ error: 'Liên kết không hợp lệ hoặc đã hết hạn' });

    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id, order_no, amount, status, expires_at, item_type, plan, period, courses(title, slug)')
      .eq('id', orderId)
      .maybeSingle();
    if (!order) return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    res.json({
      order_no: order.order_no,
      amount: order.amount,
      status: order.status,
      item_type: order.item_type,
      plan: order.plan,
      period: order.period,
      course: order.courses,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/approve', async (req, res, next) => {
  try {
    const orderId = verifyApproveToken(req.query.token);
    if (!orderId) return res.status(400).json({ error: 'Liên kết không hợp lệ hoặc đã hết hạn' });

    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();
    if (!order) return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    if (order.status === 'paid') {
      return res.json({ ok: true });
    }
    if (order.status === 'expired' || (order.expires_at && new Date(order.expires_at) < new Date())) {
      await supabaseAdmin.from('orders').update({ status: 'expired' }).eq('id', order.id);
      return res.status(400).json({ error: 'Đơn hàng đã hết hạn, không thể xác nhận' });
    }
    if (!['pending', 'awaiting'].includes(order.status)) {
      return res.status(400).json({ error: 'Đơn hàng đã xử lý' });
    }

    if (order.item_type === 'plus') {
      await activatePlus(order.user_id, order.id, order.period, order.amount, null);
      return res.json({ ok: true });
    }
    await unlockCourse(order.user_id, order.course_id, order.id, null);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
