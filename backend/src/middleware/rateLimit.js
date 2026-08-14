import rateLimit from 'express-rate-limit';

export const signupLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Bạn đăng ký quá nhanh. Vui lòng thử lại sau 10 phút.' },
});

export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Đăng nhập quá nhiều lần. Vui lòng thử lại sau 10 phút.' },
});
