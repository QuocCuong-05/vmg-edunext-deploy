import { supabaseAdmin } from '../config/database.js';
import { getClientIp } from './ip.js';

export const EVENT_COMPONENT = {
  login: 'Hệ thống',
  logout: 'Hệ thống',
  consent_update: 'Hệ thống',
  delete_request: 'Hệ thống',
  course_view: 'Khóa học',
  lesson_view: 'Khóa học',
  quiz_submit: 'Bài tập',
  follow: 'Thành viên',
  unfollow: 'Thành viên',
  remind: 'Thành viên',
};

export async function logActivity(userId, event, description, req = null, context = null, affectedUserId = null) {
  try {
    const ua = req?.headers?.['user-agent'] || null;
    await supabaseAdmin
      .from('access_log')
      .insert({
        user_id: userId,
        event,
        description: description || null,
        context: context || null,
        origin: 'web',
        ip: req ? getClientIp(req) : null,
        user_agent: ua,
        affected_user_id: affectedUserId || null,
      });
  } catch {
    // log lỗi không được làm hỏng request chính
  }
}
