import { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { api } from '../../lib/api';
import Button from '../../components/ui/Button';
import { Icon } from '../../lib/icons';

function formatVnd(n) {
  return (n || 0).toLocaleString('vi-VN') + ' đ';
}

export default function RegisterCourseModal({ course, isAdmin, onClose, onUnlocked }) {
  const [step, setStep] = useState('choose');
  const [order, setOrder] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [remaining, setRemaining] = useState(0);

  const price = course.sale_price ?? course.price;

  const startCountdown = useCallback((expiresAt) => {
    const tick = () => {
      const left = new Date(expiresAt).getTime() - Date.now();
      setRemaining(Math.max(0, Math.floor(left / 1000)));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChooseTransfer = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await api.orders.create(course.id, 'bank_transfer');
      setOrder(res.order);
      setStep('transfer');
      if (res.qr_type === 'approve' && res.approve_url) {
        QRCode.toDataURL(res.approve_url, { width: 220, margin: 1 }).then(setQrDataUrl).catch(() => {});
      }
      startCountdown(res.order.expires_at);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmTransfer = async () => {
    setError('');
    setBusy(true);
    try {
      await api.orders.confirmTransfer(order.id);
      setStep('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRedeem = async () => {
    setError('');
    if (!code.trim()) {
      setError('Vui lòng nhập mã kích hoạt');
      return;
    }
    setBusy(true);
    try {
      await api.orders.redeem(code.trim(), course.id);
      setStep('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (step !== 'choose') return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [step, onClose]);

  const mmss = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
  const expired = step === 'transfer' && remaining === 0;

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
      display: 'grid', placeItems: 'center', zIndex: 1000, padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--card)', borderRadius: 14, width: 'min(440px, 100%)',
        padding: 24, boxShadow: 'var(--shadow)', maxHeight: '90vh', overflow: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: 'var(--red-bg)', color: 'var(--red)',
            display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            <Icon.CartAlt size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800 }}>Đăng ký khóa học</h3>
            <div style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.title}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
            <Icon.Close size={18} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'var(--red-bg)', color: 'var(--red)', borderRadius: 10, fontSize: 13, marginBottom: 14 }}>{error}</div>
        )}

        {step === 'choose' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 18 }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: 'var(--red)' }}>{formatVnd(price)}</span>
              {course.sale_price != null && course.sale_price < course.price && (
                <span style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'line-through' }}>{formatVnd(course.price)}</span>
              )}
            </div>

            <button
              onClick={handleChooseTransfer}
              disabled={busy}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface-input)',
                cursor: 'pointer', textAlign: 'left', marginBottom: 10,
              }}
            >
              <Icon.Download size={20} style={{ color: 'var(--blue)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Chuyển khoản qua mã QR</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Quét QR bằng app ngân hàng để thanh toán</div>
              </div>
              <Icon.ArrowRight size={16} style={{ color: 'var(--muted)' }} />
            </button>

            <div style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface-input)',
              marginBottom: 10,
            }}>
              <Icon.Check size={20} style={{ color: 'var(--gold)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Nhập mã kích hoạt</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Dùng mã được cấp bởi VMG EduNext</div>
              </div>
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="MÃ"
                style={{
                  width: 110, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)',
                  fontSize: 13, textTransform: 'uppercase', background: 'var(--card)',
                }}
              />
              <Button size="sm" onClick={handleRedeem} isDisabled={busy}>Kích hoạt</Button>
            </div>

            <div style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              borderRadius: 10, border: '1px dashed var(--line)', opacity: .6,
            }}>
              <Icon.CartAlt size={20} style={{ color: 'var(--muted)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Thanh toán online</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Thẻ / ví điện tử / Internet banking — sắp ra mắt</div>
              </div>
            </div>
          </div>
        )}

        {step === 'transfer' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
              Đơn <b style={{ color: 'var(--ink)' }}>{order?.order_no}</b> · {formatVnd(order?.amount)}
            </div>

            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR thanh toán" style={{ width: 220, height: 220, borderRadius: 10, border: '1px solid var(--line)' }} />
            ) : (
              <div style={{
                width: 220, height: 220, margin: '0 auto', borderRadius: 10, border: '1px dashed var(--line)',
                display: 'grid', placeItems: 'center', color: 'var(--muted)', fontSize: 12, padding: 12,
              }}>
                {isAdmin
                  ? 'QR xác nhận thanh toán (admin)\n— quét để mở link —'
                  : 'QR chuyển khoản\n(sẽ hiển thị ở đây)'}
              </div>
            )}

            {isAdmin && (
              <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 8 }}>
                Chỉ admin: quét QR này để mở link xác nhận thanh toán (test nhanh)
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14 }}>
              <Icon.Clock size={14} style={{ color: expired ? 'var(--red)' : 'var(--muted)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: expired ? 'var(--red)' : 'var(--ink)' }}>
                {expired ? 'Đơn đã hết hạn' : `Còn ${mmss} để hoàn tất chuyển khoản`}
              </span>
            </div>

            {expired ? (
              <Button variant="primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={() => { setStep('choose'); setOrder(null); setQrDataUrl(''); }}>
                Tạo đơn mới
              </Button>
            ) : (
              <Button variant="primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={handleConfirmTransfer} isDisabled={busy}>
                {busy ? 'Đang xử lý...' : 'Tôi đã chuyển khoản xong'}
              </Button>
            )}
          </div>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%', background: 'var(--green-bg)', color: 'var(--green)',
              display: 'grid', placeItems: 'center', margin: '0 auto 14px',
            }}>
              <Icon.Check size={30} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Chuyển khoản thành công!</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
              Khóa học đã được mở khóa cho tài khoản của bạn.
            </p>
            <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { onUnlocked(); onClose(); }}>
              Quay lại khóa học
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
