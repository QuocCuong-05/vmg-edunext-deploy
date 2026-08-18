import { useState } from 'react';
import { CONSENT_ITEMS } from '../../lib/consent';
import Button from '../../components/ui/Button';

export default function ConsentReconsentModal({ policy, onSave, onDecline }) {
  const [consents, setConsents] = useState(() => {
    const init = {};
    CONSENT_ITEMS.forEach(c => { init[c.key] = c.required; });
    return init;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const missing = CONSENT_ITEMS.filter(c => c.required && !consents[c.key]);
    if (missing.length) {
      setError('Vui lòng đồng ý các mục bắt buộc để tiếp tục sử dụng dịch vụ.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSave(consents);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const requiredItems = CONSENT_ITEMS.filter(c => c.required);
  const optionalItems = CONSENT_ITEMS.filter(c => !c.required);

  const renderItem = (item) => (
    <label
      key={item.key}
      style={{
        display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer',
        padding: '12px 14px', borderRadius: 12, marginBottom: 8,
        border: item.required ? (consents[item.key] ? '1px solid var(--red)' : '1px solid var(--line)') : '1px solid var(--line)',
        background: item.required && consents[item.key] ? 'var(--red-bg)' : 'var(--surface-hover)',
      }}
    >
      <input
        type="checkbox"
        checked={!!consents[item.key]}
        onChange={e => setConsents({ ...consents, [item.key]: e.target.checked })}
        style={{ marginTop: 3, flexShrink: 0, width: 16, height: 16 }}
      />
      <span style={{ flex: 1, minWidth: 0 }}>
        <b style={{ fontSize: 13 }}>
          {item.title}{' '}
          {!item.required && <span style={{ color: 'var(--muted)', fontSize: 11 }}>(tùy chọn)</span>}
        </b>
        <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, marginTop: 3 }}>{item.desc}</div>
      </span>
    </label>
  );

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,.6)', display: 'flex',
        justifyContent: 'center', alignItems: 'flex-start',
        overflow: 'auto', padding: '40px 16px',
      }}
    >
      <div style={{
        background: 'var(--surface)', borderRadius: 16,
        maxWidth: 560, width: '100%', padding: '28px 24px 32px',
        boxShadow: '0 20px 60px rgba(0,0,0,.3)',
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Chính sách bảo mật đã được cập nhật</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 18 }}>
          VMG EduNext đã cập nhật <b style={{ color: 'var(--ink)' }}>{policy.title}</b>{' '}
          (bản {policy.version}). Vui lòng xem lại và cập nhật lựa chọn của bạn để tiếp tục sử dụng dịch vụ.
        </p>

        <div style={{ maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 8 }}>
            Bắt buộc — cần thiết để vận hành dịch vụ
          </div>
          {requiredItems.map(renderItem)}
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5, margin: '14px 0 8px' }}>
            Tùy chọn
          </div>
          {optionalItems.map(renderItem)}
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'var(--red-bg)', color: 'var(--red)', borderRadius: 10, fontSize: 13, marginTop: 12 }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <Button variant="primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSave} isDisabled={busy}>
            {busy ? 'Đang lưu...' : 'Lưu lựa chọn'}
          </Button>
          <button
            onClick={onDecline}
            disabled={busy}
            style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 12, padding: '0 18px', fontSize: 13, color: 'var(--muted)', cursor: 'pointer' }}
          >
            Từ chối
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12, lineHeight: 1.6 }}>
          Nếu bạn từ chối, bạn sẽ được đăng xuất và không thể tiếp tục sử dụng VMG EduNext.
        </p>
      </div>
    </div>
  );
}
