import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Icon } from '../../lib/icons';

export default function OrderApprovePage() {
  const { orderId } = useParams();
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  const [info, setInfo] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.orders.approveInfo(orderId, token)
      .then(setInfo)
      .catch(err => setError(err.message));
  }, [orderId, token]);

  const handleApprove = async () => {
    setBusy(true);
    setError('');
    try {
      await api.orders.approve(orderId, token);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)', padding: 16 }}>
      <Card style={{ width: '100%', maxWidth: 420, padding: 'min(32px, 7vw)', textAlign: 'center' }}>
        {error ? (
          <>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--red-bg)', color: 'var(--red)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
              <Icon.X size={28} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Liên kết không hợp lệ</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 }}>{error}</p>
            <Link to="/login"><Button variant="primary" style={{ width: '100%', justifyContent: 'center' }}>Về trang đăng nhập</Button></Link>
          </>
        ) : !info ? (
          <div style={{ padding: 24 }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Đang tải thông tin đơn hàng...</p>
          </div>
        ) : done ? (
          <>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--green-bg)', color: 'var(--green)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
              <Icon.Check size={30} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Thanh toán thành công!</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 }}>
              Khóa học đã được mở khóa cho người mua.
            </p>
            <Link to={info.course?.slug ? `/courses/${info.course.slug}` : '/'}>
              <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }}>Quay lại khóa học</Button>
            </Link>
          </>
        ) : (
          <>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--blue-bg)', color: 'var(--blue)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
              <Icon.CartAlt size={26} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Xác nhận thanh toán</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>Xác nhận đã nhận tiền cho đơn hàng này</p>

            <div style={{
              background: 'var(--surface-hover)', borderRadius: 10, padding: 14, marginBottom: 16,
              textAlign: 'left',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                <span style={{ color: 'var(--muted)' }}>Mã đơn</span><b>{info.order_no}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                <span style={{ color: 'var(--muted)' }}>Khóa học</span><b>{info.course?.title}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                <span style={{ color: 'var(--muted)' }}>Số tiền</span>
                <b style={{ color: 'var(--red)' }}>{(info.amount || 0).toLocaleString('vi-VN')} đ</b>
              </div>
            </div>

            {info.status !== 'pending' && (
              <div style={{ padding: '10px 14px', background: 'var(--gold-bg)', color: 'var(--gold)', borderRadius: 10, fontSize: 13, marginBottom: 14 }}>
                Đơn hàng này đã được xử lý ({info.status === 'paid' ? 'đã thanh toán' : info.status}).
              </div>
            )}

            {info.status === 'pending' && (
              <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleApprove} isDisabled={busy}>
                {busy ? 'Đang xử lý...' : 'OK — Xác nhận đã thanh toán'}
              </Button>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
