import { Router } from 'express';
import { supabase, supabaseAdmin } from '../config/database.js';
import { getPlusStatus, getAiRemaining } from '../lib/plus.js';
import { getClientIp } from '../lib/ip.js';

const router = Router();

const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;

router.post('/signup', async (req, res) => {
  try {
    const { email, password, full_name, school, ward } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (!PASSWORD_RULE.test(password)) {
      return res.status(400).json({
        error: 'Mật khẩu yếu: cần tối thiểu 6 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt',
      });
    }
    if (!full_name || !full_name.trim() || !ward || !school) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ: Họ và tên, Phường/Xã và Trường học' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: full_name || '' } }
    });

    if (error) return res.status(400).json({ error: error.message });

    if (data.user && (school || ward)) {
      await supabaseAdmin
        .from('profiles')
        .update({ school: school || null, ward: ward || null })
        .eq('id', data.user.id);
    }

    res.json({ user: data.user, session: data.session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: error.message });
    res.json({ user: data.user, session: data.session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/logout', async (_req, res) => {
  await supabase.auth.signOut();
  res.json({ message: 'Logged out' });
});

router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error) return res.status(401).json({ error: error.message });

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, avatar_url, role, xp, streak_days, bio, school, ward')
    .eq('id', user.id)
    .maybeSingle();

  await supabaseAdmin
    .from('profiles')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', user.id)
    .then(() => {})
    .catch(() => {});

  const [plus, aiUsage] = await Promise.all([
    getPlusStatus(user.id),
    getAiRemaining(user.id),
  ]);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      ...(profile || {}),
      plus,
      aiUsage,
    }
  });
});

router.post('/sync-xp', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) return res.status(401).json({ error: error.message });

    const sent = Math.max(0, Math.min(10000000, Math.round(req.body?.xp) || 0));
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp')
      .eq('id', user.id)
      .maybeSingle();

    const next = Math.max(profile?.xp || 0, sent);
    await supabase.from('profiles').update({ xp: next }).eq('id', user.id);
    res.json({ xp: next });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/consent', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) return res.status(401).json({ error: error.message });

    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items (mảng) là bắt buộc' });
    }

    const ip = getClientIp(req);
    const rows = items
      .filter(it => it && it.key)
      .map(it => ({
        user_id: user.id,
        policy_key: String(it.key),
        version: Number(it.version) || 1,
        accepted: !!it.accepted,
        ip,
      }));
    if (rows.length === 0) return res.status(400).json({ error: 'Không có mục hợp lệ' });

    const { data, error: insertError } = await supabaseAdmin
      .from('consent_log')
      .upsert(rows, { onConflict: 'user_id,policy_key,version' });
    if (insertError) throw insertError;

    res.json({ saved: rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /auth/consents — lịch sử đồng ý của user (trang cá nhân)
router.get('/consents', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) return res.status(401).json({ error: error.message });

    const { data, error: listError } = await supabaseAdmin
      .from('consent_log')
      .select('policy_key, accepted, version, ip, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (listError) throw listError;

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/anonymize — khử nhận dạng: xóa PII, giữ dữ liệu học tập ẩn danh
router.post('/anonymize', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) return res.status(401).json({ error: error.message });
    const userId = user.id;

    await supabaseAdmin
      .from('consent_log')
      .upsert({ user_id: userId, policy_key: 'deletion_request', version: 1, accepted: true, ip: null },
        { onConflict: 'user_id,policy_key,version' });

    await supabaseAdmin.from('profiles').delete().eq('id', userId);
    await supabaseAdmin.from('orders').delete().eq('user_id', userId);
    await supabaseAdmin.from('enrollments').delete().eq('user_id', userId);
    await supabaseAdmin.from('user_vocabulary').delete().eq('user_id', userId);
    await supabaseAdmin.from('notifications').delete().eq('user_id', userId);
    await supabaseAdmin.from('community_posts').delete().eq('user_id', userId);
    await supabaseAdmin.from('community_comments').delete().eq('user_id', userId);
    await supabaseAdmin.from('community_likes').delete().eq('user_id', userId);
    await supabaseAdmin.from('community_reports').delete().eq('user_id', userId);
    await supabaseAdmin.from('user_follows').delete().eq('follower_id', userId);
    await supabaseAdmin.from('user_follows').delete().eq('following_id', userId);
    await supabaseAdmin.from('plus_subscriptions').delete().eq('user_id', userId);

    await supabaseAdmin.auth.admin.deleteUser(userId);

    res.json({ anonymized: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
