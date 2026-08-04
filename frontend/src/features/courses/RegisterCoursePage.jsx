import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Icon } from '../../lib/icons';

function formatVnd(n) {
  return (n || 0).toLocaleString('vi-VN') + ' đ';
}

export default function RegisterCoursePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const [course, setCourse] = useState(null);
  const [order, setOrder] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [bankInfo, setBankInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [awaiting, setAwaiting] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!slug || !user?.id) return;
    (async () => {
      try {
        const data = await api.courses.get(slug);
        setCourse(data);
        const ids = await api.unlock.courseIds(user.id);
        if (ids.has(data.id)) {
          setUnlocked(true);
          return;
        }
        if (data.access_type !== 'paid') {
          navigate(`/courses/${slug}`, { replace: true });
          return;
        }
        setBankInfo((await api.orders.publicSettings().catch(() => ({}))).bank_transfer || {});
      } catch {}
      setLoading(false);
    })();
  }, [slug, user?.id, navigate]);

  const createOrder = useCallback(async () => {
    if (!course) return;
    setError('');
    setBusy(true);
    try {
      const res = await api.orders.create(course.id, 'bank_transfer');
      setOrder(res.order);
      setRemaining(Math.max(0, Math.floor((new Date(res.order.expires_at).getTime() - Date.now()) / 1000)));
      if (res.qr_type === 'approve' && res.approve_url) {
        QRCode.toDataURL(res.approve_url, { width: 220, margin: 1 }).then(setQrDataUrl).catch(() => {});
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }, [course]);

  useEffect(() => {
    if (course && !unlocked && !order) createOrder();
  }, [course, unlocked, order, createOrder]);

  useEffect(() => {
    if (!order) return;
    const timer = setInterval(() => {
      const left = Math.max(0, Math.floor((new Date(order.expires_at).getTime() - Date.now()) / 1000));
      setRemaining(left);
    }, 1000);
    return () => clearInterval(timer);
  }, [order]);

  const handleConfirmTransfer = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError('');
    setBusy(true);
    try {
      const res = await api.orders.confirmTransfer(order.id);
      if (res?.status === 'awaiting_confirmation') {
        setAwaiting(true);
      } else {
        setDone(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      submittingRef.current = false;
    }
  };

  useEffect(() => {
    if (!awaiting || !user?.id || !course) return;
    const timer = setInterval(async () => {
      try {
        const ids = await api.unlock.courseIds(user.id);
        if (ids.has(course.id)) {
          setAwaiting(false);
          setDone(true);
        }
      } catch {}
    }, 10000);
    return () => clearInterval(timer);
  }, [awaiting, user?.id, course]);

  if (loading) {
    return <p style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Đang tải...</p>;
  }

  if (!course) {
    return (
      <div className="empty">
        <h3>Không tìm thấy khóa học</h3>
        <Button size="sm" variant="primary" label="Quay lại danh sách" onClick={() => navigate('/courses')} style={{ marginTop: 12 }} />
      </div>
    );
  }

  if (unlocked) {
    return (
      <div style={{ maxWidth: 480, margin: '40px auto', padding: '0 16px' }}>
        <Card style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--green-bg)', color: 'var(--green)', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
            <Icon.Check size={30} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Khóa học đã mở khóa</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Bạn đã sở hữu khóa học này.</p>
          <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate(`/courses/${slug}`)}>
            Vào khóa học
          </Button>
        </Card>
      </div>
    );
  }

  const price = course.sale_price ?? course.price;
  const mmss = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
  const expired = !!order && remaining === 0;

  return (
    <div style={{ maxWidth: 480, margin: '24px auto', padding: '0 16px' }}>
      <div className="back-btn" onClick={() => navigate(`/courses/${slug}`)}><Icon.ArrowLeft size={14} /> Quay lại khóa học</div>

      <Card style={{ padding: 'min(28px, 6vw)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--red-bg)', color: 'var(--red)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Icon.CartAlt size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800 }}>Đăng ký khóa học</h3>
            <div style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.title}</div>
          </div>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'var(--red-bg)', color: 'var(--red)', borderRadius: 10, fontSize: 13, marginBottom: 14 }}>{error}</div>
        )}

        {awaiting ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--gold-bg)', color: 'var(--gold)', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
              <Icon.Clock size={30} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Đã gửi yêu cầu chuyển khoản</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 }}>
              VMG sẽ kiểm tra khoản thanh toán và mở khóa khóa học cho bạn. Khóa học sẽ tự mở khi được xác nhận.
            </p>
            <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate(`/courses/${slug}`)}>
              Quay lại khóa học
            </Button>
          </div>
        ) : done ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--green-bg)', color: 'var(--green)', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
              <Icon.Check size={30} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Chuyển khoản thành công!</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
              Khóa học đã được mở khóa cho tài khoản của bạn.
            </p>
            <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate(`/courses/${slug}`)}>
              Quay lại khóa học
            </Button>
          </div>
        ) : !order ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Đang tạo đơn hàng...</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: 'var(--red)' }}>{formatVnd(price)}</span>
              {course.sale_price != null && course.sale_price < course.price && (
                <span style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'line-through' }}>{formatVnd(course.price)}</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
              Đơn <b style={{ color: 'var(--ink)' }}>{order.order_no}</b>
            </div>

            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR thanh toán" style={{ width: 220, height: 220, borderRadius: 10, border: '1px solid var(--line)' }} />
            ) : (
              <div style={{
                width: 220, height: 220, margin: '0 auto', borderRadius: 10,
                border: '1px dashed var(--line)',
                display: 'grid', placeItems: 'center', color: 'var(--muted)', fontSize: 12, padding: 12,
              }}>
                QR chuyển khoản<br />(sẽ hiển thị ở đây)
              </div>
            )}

            {isAdmin && (
              <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 8 }}>
                Chỉ admin: quét QR này để mở link xác nhận thanh toán (test nhanh)
              </div>
            )}

            {!qrDataUrl && (bankInfo.bank_name || bankInfo.account_number) && (
              <div style={{
                margin: '14px auto 0', maxWidth: 320, background: 'var(--surface-hover)',
                borderRadius: 10, padding: '12px 16px', textAlign: 'left', fontSize: 13,
              }}>
                {bankInfo.bank_name && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                    <span style={{ color: 'var(--muted)' }}>Ngân hàng</span><b>{bankInfo.bank_name}</b>
                  </div>
                )}
                {bankInfo.account_number && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                    <span style={{ color: 'var(--muted)' }}>Số tài khoản</span><b>{bankInfo.account_number}</b>
                  </div>
                )}
                {bankInfo.account_holder && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                    <span style={{ color: 'var(--muted)' }}>Chủ tài khoản</span><b>{bankInfo.account_holder}</b>
                  </div>
                )}
                {bankInfo.content_prefix && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                    <span style={{ color: 'var(--muted)' }}>Nội dung CK</span><b>{bankInfo.content_prefix}{order.order_no}</b>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14 }}>
              <Icon.Clock size={14} style={{ color: expired ? 'var(--red)' : 'var(--muted)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: expired ? 'var(--red)' : 'var(--ink)' }}>
                {expired ? 'Đơn đã hết hạn' : `Còn ${mmss} để hoàn tất chuyển khoản`}
              </span>
            </div>

            {expired ? (
              <Button variant="primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={createOrder} isDisabled={busy}>
                Tạo đơn mới
              </Button>
            ) : (
              <Button variant="primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={handleConfirmTransfer} isDisabled={busy}>
                {busy ? 'Đang xử lý...' : 'Tôi đã chuyển khoản xong'}
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
