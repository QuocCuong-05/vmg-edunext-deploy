import { Router } from 'express';
import crypto from 'node:crypto';
import { supabase, supabaseAdmin, JWT_SECRET } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const APPROVE_SECRET = process.env.PAYMENT_APPROVE_SECRET || JWT_SECRET;

function genOrderNo() {
  return 'VMG' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
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

router.post('/create', authenticate, async (req, res, next) => {
  try {
    const { course_id: courseId } = req.body;
    if (!courseId) return res.status(400).json({ error: 'course_id is required' });

    const { data: course, error: courseErr } = await supabase
      .from('courses')
      .select('id, title, access_type, price, sale_price')
      .eq('id', courseId)
      .single();
    if (courseErr || !course) return res.status(404).json({ error: 'Khóa học không tồn tại' });
    if (course.access_type !== 'paid') return res.status(400).json({ error: 'Khóa học này không cần thanh toán' });
    if (!course.price) return res.status(400).json({ error: 'Khóa học chưa được đặt giá' });

    if (await isUnlocked(req.user.id, courseId)) {
      return res.status(409).json({ error: 'Bạn đã mở khóa khóa học này rồi' });
    }

    const { data: existing } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('course_id', courseId)
      .eq('status', 'pending')
      .maybeSingle();
    if (existing && new Date(existing.expires_at) > new Date()) {
      return res.json({ order: existing, existing: true });
    }

    const ttlMinutes = await getOrderTtlMinutes();
    const amount = course.sale_price ?? course.price;
    const order = {
      order_no: genOrderNo(),
      user_id: req.user.id,
      course_id: courseId,
      amount,
      method: 'bank_transfer',
      status: 'pending',
      expires_at: new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString(),
    };
    const { data: created, error } = await supabaseAdmin
      .from('orders')
      .insert(order)
      .select('*')
      .single();
    if (error) throw error;

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
});

router.get('/mine', authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabase
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
      return res.json({ unlocked: true, course_id: order.course_id });
    }
    if (order.status !== 'pending') return res.status(400).json({ error: 'Đơn hàng đã xử lý' });
    if (order.expires_at && new Date(order.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Đơn hàng đã hết hạn, vui lòng tạo đơn mới' });
    }

    res.json({ status: 'awaiting_confirmation', course_id: order.course_id });
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
      .select('id, order_no, amount, status, expires_at, courses(title, slug)')
      .eq('id', orderId)
      .maybeSingle();
    if (!order) return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    res.json({ order_no: order.order_no, amount: order.amount, status: order.status, course: order.courses });
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
    if (order.status !== 'pending') return res.status(400).json({ error: 'Đơn hàng đã xử lý' });

    await unlockCourse(order.user_id, order.course_id, order.id, null);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
