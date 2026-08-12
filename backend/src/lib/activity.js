import { supabaseAdmin } from '../config/database.js';
import { getClientIp } from './ip.js';

export async function logActivity(userId, event, description, req = null) {
  try {
    const ua = req?.headers?.['user-agent'] || null;
    await supabaseAdmin
      .from('access_log')
      .insert({
        user_id: userId,
        event,
        description: description || null,
        origin: 'web',
        ip: req ? getClientIp(req) : null,
        user_agent: ua,
      });
  } catch {
    // log lỗi không được làm hỏng request chính
  }
}
