-- ============================================================
-- VMG EduNext — Hoàn thiện luồng thanh toán: trạng thái đơn hàng
-- thêm 'awaiting' (đã xác nhận chuyển khoản, chờ admin duyệt)
-- và 'expired' (đơn hết hạn chưa thanh toán)
-- Chạy từng lệnh riêng trên Supabase SQL Editor (staging + production)
-- ============================================================

alter type public.order_status add value if not exists 'awaiting';
alter type public.order_status add value if not exists 'expired';

-- thời điểm user xác nhận chuyển khoản / hủy đơn
alter table public.orders add column if not exists confirmed_at timestamptz;
alter table public.orders add column if not exists cancelled_at timestamptz;
