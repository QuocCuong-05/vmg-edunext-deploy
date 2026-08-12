export function getClientIp(req) {
  const forwarded = req.headers['cf-connecting-ip']
    || req.headers['x-real-ip']
    || req.headers['x-forwarded-for']?.split(',')[0]?.trim();
  return forwarded || req.socket?.remoteAddress || null;
}
