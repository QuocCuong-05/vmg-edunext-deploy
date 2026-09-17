import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

export const signupLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Bạn đăng ký quá nhanh. Vui lòng thử lại sau 10 phút.' },
});

// Khoá theo email (chuẩn hoá) — chống dò mật khẩu đúng tài khoản,
// không chặn nhầm cả trường học chung một IP NAT
export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = String(req.body?.email || '').toLowerCase().trim();
    return email || ipKeyGenerator(req.ip);
  },
  message: { error: 'Đăng nhập quá nhiều lần. Vui lòng thử lại sau 10 phút.' },
});

// Cấp link video: khoá theo user id (mỗi người một "xô" riêng).
// Người học bình thường ~5-15 lần/buổi; chặn thu thập link hàng loạt.
export const videoTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip),
  message: { error: 'Bạn yêu cầu quá nhiều liên kết video. Vui lòng thử lại sau 15 phút.' },
});
