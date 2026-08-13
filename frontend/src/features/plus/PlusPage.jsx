import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { api } from '../../lib/api';
import { trackEvent } from '../../lib/ga';
import { useAuth } from '../auth/AuthContext';
import { useMediaQuery } from '../../lib/useMediaQuery';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Icon } from '../../lib/icons';

const PLANS = [
  { period: 1, price: 59000, tag: 'Khởi đầu', perMonth: '59.000đ/tháng' },
  { period: 3, price: 147000, tag: 'Phổ biến', perMonth: '49.000đ/tháng' },
  { period: 6, price: 264000, tag: '1 học kỳ', perMonth: '44.000đ/tháng' },
  { period: 12, price: 399000, tag: 'Tốt nhất', perMonth: '33.250đ/tháng' },
];

const PLAN_NAMES = { 1: '1 tháng', 3: '3 tháng', 6: '6 tháng', 12: '12 tháng' };

const BENEFITS = [
  'Toàn bộ khóa học premium',
  'ViMi chat AI không giới hạn',
  'ViMi speaking không giới hạn',
  'Thiết kế bài dạy AI không giới hạn',
  'Sổ từ không giới hạn',
  'Lịch sử làm quiz + xem lại',
  'x1.2 XP',
  'Quà cửa hàng hạng Plus',
  'Chứng chỉ khóa premium + tải PDF',
];

const ORDER_STATUS = {
  pending: { label: 'Chờ thanh toán', color: 'var(--gold)' },
  awaiting: { label: 'Chờ xác nhận', color: 'var(--blue)' },
  paid: { label: 'Đã thanh toán', color: 'var(--green)' },
  expired: { label: 'Hết hạn', color: 'var(--muted)' },
  cancelled: { label: 'Đã hủy', color: 'var(--muted)' },
  failed: { label: 'Thất bại', color: 'var(--red)' },
};

function formatVnd(n) {
  return (n || 0).toLocaleString('vi-VN') + ' đ';
}

export default function PlusPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const isNarrow = useMediaQuery('(max-width: 860px)');
  const isPlusActive = !!user?.plus?.active;
  const plusPeriod = user?.plus?.period;
  const plusEndAt = user?.plus?.endAt ? new Date(user.plus.endAt).toLocaleDateString('vi-VN') : '';

  const [showPayment, setShowPayment] = useState(false);
  const [period, setPeriod] = useState(12);
  const [order, setOrder] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [bankInfo, setBankInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [awaiting, setAwaiting] = useState(false);
  const [done, setDone] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [history, setHistory] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLimit, setHistoryLimit] = useState(5);
  const [cancelBusy, setCancelBusy] = useState('');
  const submittingRef = useRef(false);
  const payRef = useRef(null);

  const loadHistory = useCallback(async () => {
    try {
      const data = await api.orders.mine();
      setHistory(data);
      return data;
    } catch {
      setHistory([]);
      return [];
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setBankInfo((await api.orders.publicSettings().catch(() => ({}))).bank_transfer || {});
      } catch {}
      setLoading(false);
    })();
    loadHistory();
  }, [loadHistory]);

  const createOrder = useCallback(async (p = period) => {
    setError('');
    setBusy(true);
    try {
      const res = await api.orders.createPlus(p);
      setOrder(res.order);
      trackEvent('Order', 'create', `${p} tháng`);
      setRemaining(Math.max(0, Math.floor((new Date(res.order.expires_at).getTime() - Date.now()) / 1000)));
      if (res.qr_type === 'approve' && res.approve_url) {
        QRCode.toDataURL(res.approve_url, { width: 220, margin: 1 }).then(setQrDataUrl).catch(() => {});
      }
      loadHistory();
    } catch (err) {
      if (err.status === 409) {
        setError(err.message);
        const h = await loadHistory();
        setShowPayment(true);
        const pending = (h || []).find(o => o.status === 'pending' && o.expires_at && new Date(o.expires_at) > new Date());
        if (pending) setOrder(pending);
      } else {
        setError(err.message);
      }
    } finally {
      setBusy(false);
    }
  }, [period, loadHistory]);

  const handleContinue = async (o) => {
    setError('');
    if (o.status === 'awaiting') {
      setOrder(o);
      setShowPayment(true);
      setAwaiting(true);
      return;
    }
    if (o.status === 'pending') {
      try {
        const res = await api.orders.createPlus(o.period);
        setOrder(res.order);
        setShowPayment(true);
        setAwaiting(false);
        setRemaining(Math.max(0, Math.floor((new Date(res.order.expires_at).getTime() - Date.now()) / 1000)));
        if (res.qr_type === 'approve' && res.approve_url) {
          QRCode.toDataURL(res.approve_url, { width: 220, margin: 1 }).then(setQrDataUrl).catch(() => {});
        }
      } catch (err) {
        setError(err.message);
        loadHistory();
      }
    }
  };

  const handleCancel = async (o) => {
    if (cancelBusy) return;
    if (!window.confirm(`Hủy đơn ${o.order_no}?`)) return;
    setCancelBusy(o.id);
    setError('');
    try {
      await api.orders.cancel(o.id);
      if (order?.id === o.id) {
        setOrder(null);
        setQrDataUrl('');
        setAwaiting(false);
      }
      loadHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelBusy('');
    }
  };

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
      loadHistory();
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
    if (!awaiting) return;
    const timer = setInterval(async () => {
      try {
        await refreshUser();
        if (user?.plus?.active) {
          setAwaiting(false);
          setDone(true);
          loadHistory();
        }
      } catch {}
    }, 10000);
    return () => clearInterval(timer);
  }, [awaiting, refreshUser, user?.plus?.active, loadHistory]);

  const handleScrollToPay = () => {
    setShowPayment(true);
    setTimeout(() => payRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  if (loading) {
    return <p style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Đang tải...</p>;
  }

  const mmss = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
  const expired = !!order && remaining === 0;
  const active = PLANS.find(p => p.period === period) || PLANS[3];

  return (
    <div style={{ maxWidth: 900, margin: '24px auto', padding: '0 16px' }}>
      <div className="back-btn" onClick={() => navigate(-1)}><Icon.ArrowLeft size={14} /> Quay lại</div>

      {error && (
        <div style={{ padding: '10px 14px', background: 'var(--red-bg)', color: 'var(--red)', borderRadius: 10, fontSize: 13, marginBottom: 14 }}>{error}</div>
      )}

      {awaiting && (
        <Card style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--gold-bg)', color: 'var(--gold)', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
            <Icon.Clock size={30} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Đã gửi yêu cầu chuyển khoản</h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 }}>
            VMG sẽ kiểm tra khoản thanh toán và kích hoạt gói Plus cho bạn.
          </p>
          <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/dashboard')}>
            Về trang chủ
          </Button>
        </Card>
      )}

      {done && (
        <Card style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--green-bg)', color: 'var(--green)', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
            <Icon.Check size={30} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Kích hoạt Plus thành công!</h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
            Toàn bộ khóa học premium và tính năng Plus đã mở cho tài khoản của bạn.
          </p>
          <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/courses')}>
            Khám phá khóa học
          </Button>
        </Card>
      )}

      {!awaiting && !done && (
        <>
          {isPlusActive && (
            <Card style={{ padding: 'min(28px, 6vw)', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--purple-bg, #f3e8ff)', color: '#8b5cf6', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon.Gem size={22} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 2 }}>
                    Gói Plus {PLAN_NAMES[plusPeriod] || ''}
                  </h3>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                    Ngày hết hạn: <b style={{ color: 'var(--ink)' }}>{plusEndAt}</b>
                  </div>
                </div>
                <Button size="sm" variant="primary" onClick={handleScrollToPay} style={{ whiteSpace: 'nowrap' }}>
                  Gia hạn thêm
                </Button>
              </div>
            </Card>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: 16 }}>
          <Card style={{ padding: 'min(28px, 6vw)', marginBottom: isNarrow ? 16 : 0, height: '100%' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon.Gem size={16} style={{ color: '#8b5cf6' }} /> Quyền lợi gói Plus
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {BENEFITS.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
                  <span style={{ color: '#8b5cf6', marginTop: 2, flexShrink: 0 }}><Icon.Check size={14} /></span>
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card style={{ padding: 'min(28px, 6vw)' }} ref={payRef}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>
              {isPlusActive ? 'Gia hạn hoặc nâng cấp gói' : 'Chọn gói Plus'}
            </h3>

            {!showPayment && !isPlusActive ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 18 }}>
                  {PLANS.map(p => (
                    <button
                      key={p.period}
                      onClick={() => setPeriod(p.period)}
                      style={{
                        padding: '12px 8px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                        border: `1.5px solid ${period === p.period ? 'var(--red)' : 'var(--line)'}`,
                        background: period === p.period ? 'var(--red-bg)' : 'var(--surface)',
                        color: 'var(--ink)',
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--red)', marginBottom: 4 }}>{p.tag}</div>
                      <div style={{ fontSize: 16, fontWeight: 900 }}>{formatVnd(p.price)}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.period} tháng · {p.perMonth}</div>
                    </button>
                  ))}
                </div>
                <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setShowPayment(true); createOrder(period); }} isDisabled={busy}>
                  {busy ? 'Đang tạo đơn...' : `Mua gói ${active.period} tháng · ${formatVnd(active.price)}`}
                </Button>
              </div>
            ) : (
              <div>
                {!order && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 18 }}>
                      {PLANS.map(p => (
                        <button
                          key={p.period}
                          onClick={() => setPeriod(p.period)}
                          style={{
                            padding: '12px 8px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                            border: `1.5px solid ${period === p.period ? 'var(--red)' : 'var(--line)'}`,
                            background: period === p.period ? 'var(--red-bg)' : 'var(--surface)',
                            color: 'var(--ink)',
                          }}
                        >
                          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--red)', marginBottom: 4 }}>{p.tag}</div>
                          <div style={{ fontSize: 16, fontWeight: 900 }}>{formatVnd(p.price)}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.period} tháng · {p.perMonth}</div>
                        </button>
                      ))}
                    </div>
                    <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => createOrder(period)} isDisabled={busy}>
                      {busy ? 'Đang tạo đơn...' : `Mua gói ${active.period} tháng · ${formatVnd(active.price)}`}
                    </Button>
                  </div>
                )}

                {order && (
                  <div style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => { setOrder(null); setQrDataUrl(''); setError(''); }}
                      style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, marginBottom: 14, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Icon.ArrowLeft size={14} /> Quay lại
                    </button>
                    {awaiting && (
                      <div style={{ padding: '10px 14px', background: 'var(--blue-bg)', color: 'var(--blue)', borderRadius: 10, fontSize: 13, marginBottom: 14, textAlign: 'left' }}>
                        Đơn đang <b>chờ xác nhận</b>. VMG sẽ kích hoạt Plus sau khi kiểm tra chuyển khoản thành công.
                      </div>
                    )}
                    <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--red)', marginBottom: 4 }}>
                      {formatVnd(order.amount)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                      Gói Plus {order.period} tháng · Đơn <b style={{ color: 'var(--ink)' }}>{order.order_no}</b>
                    </div>

                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="QR thanh toán" style={{ width: 220, height: 220, borderRadius: 10, border: '1px solid var(--line)' }} />
                    ) : (
                      <div style={{ fontSize: 13, color: 'var(--muted)', margin: '12px 0' }}>
                        Vui lòng chuyển khoản theo thông tin bên dưới
                      </div>
                    )}

                    {(bankInfo.bank_name || bankInfo.account_number) && (
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
                        {expired ? 'Đơn đã hết hạn' : `Còn ${mmss} để hoàn tất`}
                      </span>
                    </div>

                    {expired ? (
                      <Button variant="primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={() => createOrder(period)} isDisabled={busy}>
                        Tạo đơn mới
                      </Button>
                    ) : (
                      <Button variant="primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={handleConfirmTransfer} isDisabled={busy}>
                        {busy ? 'Đang xử lý...' : 'Tôi đã hoàn tất thanh toán'}
                      </Button>
                    )}

                    {!expired && (order.status === 'pending' || order.status === 'awaiting') && (
                      <button
                        onClick={() => handleCancel(order)}
                        disabled={!!cancelBusy}
                        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 12, marginTop: 12, textDecoration: 'underline' }}
                      >
                        {cancelBusy === order.id ? 'Đang hủy...' : 'Hủy đơn này'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>

          {history && history.length > 0 && (
            <Card style={{ padding: 'min(24px, 5vw)', marginBottom: 16 }}>
              <button
                onClick={() => setHistoryOpen(o => !o)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
              >
                <h3 style={{ fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, flex: 1, margin: 0 }}>
                  <Icon.CartAlt size={16} style={{ color: 'var(--red)' }} /> Lịch sử thanh toán
                </h3>
                {(() => {
                  const open = (history || []).filter(o => ['pending', 'awaiting'].includes(o.status)).length;
                  return open > 0 ? (
                    <span style={{ fontSize: 10, fontWeight: 800, background: 'var(--gold-bg)', color: 'var(--gold)', borderRadius: 999, padding: '2px 8px' }}>{open} chưa xong</span>
                  ) : null;
                })()}
                <Icon.ArrowLeft size={16} style={{ color: 'var(--muted)', transform: historyOpen ? 'rotate(90deg)' : 'rotate(-90deg)', transition: 'transform .2s' }} />
              </button>

              {historyOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                  {history.slice(0, historyLimit).map(o => {
                    const st = ORDER_STATUS[o.status] || { label: o.status, color: 'var(--muted)' };
                    const alive = ['pending', 'awaiting'].includes(o.status) && o.expires_at && new Date(o.expires_at) > new Date();
                    return (
                      <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--surface)', borderRadius: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700 }}>{o.order_no}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                            {o.item_type === 'plus' ? `Plus ${o.period} tháng` : 'Khóa học'} · {(o.amount || 0).toLocaleString('vi-VN')}đ · {o.created_at ? new Date(o.created_at).toLocaleDateString('vi-VN') : ''}
                          </div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: st.color }}>{st.label}</span>
                        {alive && o.status === 'pending' && (
                          <Button size="sm" variant="primary" style={{ whiteSpace: 'nowrap' }} onClick={() => handleContinue(o)}>
                            Tiếp tục
                          </Button>
                        )}
                        {alive && o.status === 'awaiting' && (
                          <Button size="sm" style={{ whiteSpace: 'nowrap' }} onClick={() => handleContinue(o)}>
                            Xem trạng thái
                          </Button>
                        )}
                        {(o.status === 'pending' || o.status === 'awaiting') && (
                          <button
                            onClick={() => handleCancel(o)}
                            disabled={!!cancelBusy}
                            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 11, textDecoration: 'underline' }}
                          >
                            {cancelBusy === o.id ? '...' : 'Hủy'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {history.length > historyLimit && (
                    <button
                      onClick={() => setHistoryLimit(l => (l >= history.length ? 5 : l + 5))}
                      style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 12, fontWeight: 600, marginTop: 4 }}
                    >
                      {historyLimit >= history.length ? 'Thu gọn' : `Xem thêm (${history.length - historyLimit})`}
                    </button>
                  )}
                </div>
              )}
            </Card>
          )}
          </div>
          </div>
        </>
      )}
    </div>
  );
}
