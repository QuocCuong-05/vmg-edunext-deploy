import { supabase, supabaseAdmin } from '../config/database.js';
import { getSessionId } from '../lib/jwt.js';

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const sid = getSessionId(token);
  if (sid) {
    const { data: revoked } = await supabaseAdmin
      .from('revoked_sessions')
      .select('session_id')
      .eq('session_id', sid)
      .maybeSingle();
    if (revoked) {
      return res.status(401).json({ error: 'Phiên đã bị thu hồi. Vui lòng đăng nhập lại.' });
    }
  }

  req.user = user;
  next();
}

export async function requireAdmin(req, res, next) {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', req.user.id)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: 'Failed to check permissions' });
  }

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  supabase.auth.getUser(token).then(({ data: { user } }) => {
    req.user = user || null;
    next();
  }).catch(() => {
    req.user = null;
    next();
  });
}
