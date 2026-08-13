import { Router } from 'express';
import { supabase, supabaseAdmin } from '../config/database.js';
import { getPlusStatus, getAiRemaining } from '../lib/plus.js';
import { getClientIp } from '../lib/ip.js';
import { parseDeviceName } from '../lib/device.js';
import { logActivity, EVENT_COMPONENT } from '../lib/activity.js';
import { getSessionId } from '../lib/jwt.js';

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

    const ua = req.headers['user-agent'] || null;
    await supabaseAdmin
      .from('login_sessions')
      .insert({
        user_id: data.user.id,
        ip: getClientIp(req),
        user_agent: ua,
        device_name: parseDeviceName(ua),
        session_id: getSessionId(data.session?.access_token),
      })
      .then(() => {})
      .catch(() => {});
    await logActivity(data.user.id, 'login', `Đăng nhập bằng ${email}`, req, 'Hệ thống');

    res.json({ user: data.user, session: data.session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) await logActivity(user.id, 'logout', 'Đăng xuất', req, 'Hệ thống');
    }
  } catch {
    // logout không được chặn
  }
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
    .update({ last_active_at: new Date().toISOString(), email: user.email })
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

    await logActivity(user.id, 'consent_update', `Cập nhật lựa chọn xử lý dữ liệu (version mới nhất)`, req, 'Hệ thống');

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

    await logActivity(userId, 'delete_request', 'Yêu cầu xóa dữ liệu (khử nhận dạng)', req, 'Hệ thống');
    await supabaseAdmin.auth.admin.deleteUser(userId);

    res.json({ anonymized: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /auth/session-check — session còn hợp lệ không (chỉ dựa revoked_sessions tự quản)
router.get('/session-check', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    const sid = getSessionId(token);
    if (!sid) return res.json({ data: { ok: true } });

    const { data: revoked, error: revokedError } = await supabaseAdmin
      .from('revoked_sessions')
      .select('session_id')
      .eq('session_id', sid)
      .maybeSingle();
    if (revokedError) throw revokedError;

    res.json({ data: { ok: !revoked } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/sessions/touch — ghi nhận thiết bị đang hoạt động (mọi luồng login/restore)
router.post('/sessions/touch', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) return res.status(401).json({ error: error.message });

    const ua = req.headers['user-agent'] || null;
    const { error: touchError } = await supabaseAdmin
      .from('login_sessions')
      .upsert({
        user_id: user.id,
        session_id: getSessionId(token),
        ip: getClientIp(req),
        user_agent: ua,
        device_name: parseDeviceName(ua),
        last_active_at: new Date().toISOString(),
      }, { onConflict: 'session_id' });
    if (touchError) throw touchError;

    res.json({ data: { touched: true } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /auth/devices — thiết bị đăng nhập của user (Facebook-style)
router.get('/devices', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) return res.status(401).json({ error: error.message });

    const { data, error: listError } = await supabaseAdmin
      .from('login_sessions')
      .select('id, ip, device_name, logged_in_at, last_active_at')
      .eq('user_id', user.id)
      .order('logged_in_at', { ascending: false })
      .limit(50);
    if (listError) throw listError;

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/devices/:id/signout — đăng xuất khỏi 1 thiết bị cụ thể (revoke refresh token)
router.post('/devices/:id/signout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) return res.status(401).json({ error: error.message });

    const { data: session, error: findError } = await supabaseAdmin
      .from('login_sessions')
      .select('id, session_id')
      .eq('id', req.params.id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (findError) throw findError;
    if (!session) return res.status(404).json({ error: 'Không tìm thấy thiết bị' });

    if (session.session_id) {
      await supabaseAdmin
        .from('revoked_sessions')
        .upsert({ session_id: session.session_id, user_id: user.id }, { onConflict: 'session_id' })
        .then(() => {})
        .catch(() => {});
      const { error: revokeError } = await supabaseAdmin.rpc('revoke_session', {
        p_session_id: session.session_id,
      });
      if (revokeError) throw revokeError;
    }

    await supabaseAdmin.from('login_sessions').delete().eq('id', session.id);
    await logActivity(user.id, 'logout', 'Đăng xuất khỏi một thiết bị', req, 'Hệ thống');

    res.json({ data: { signedOut: true } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /auth/activity — event log của user (Moodle-style)
router.get('/activity', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) return res.status(401).json({ error: error.message });

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    const { data, error: listError } = await supabaseAdmin
      .from('access_log')
      .select('event, description, context, origin, ip, created_at, affected_user_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (listError) throw listError;

    const affectedIds = [...new Set((data || []).map(a => a.affected_user_id).filter(Boolean))];
    let nameMap = {};
    if (affectedIds.length) {
      const { data: affectedProfiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .in('id', affectedIds);
      (affectedProfiles || []).forEach(p => { nameMap[p.id] = p.full_name; });
    }

    res.json({
      data: (data || []).map(a => ({
        ...a,
        full_name: profile?.full_name || user.email,
        affected_user: a.affected_user_id ? (nameMap[a.affected_user_id] || 'thành viên') : null,
        component: EVENT_COMPONENT[a.event] || 'Hệ thống',
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
