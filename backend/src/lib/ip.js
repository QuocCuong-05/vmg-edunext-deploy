// Lấy IP người dùng để ghi log truy vết.
// Dùng req.ip — Express đã tính sẵn theo trust proxy (2 lớp Caddy), an toàn
// trước việc client tự chèn X-Forwarded-For giả (Caddy luôn nối IP thật vào cuối chuỗi).
export function getClientIp(req) {
  return req.ip || req.socket?.remoteAddress || null;
}
