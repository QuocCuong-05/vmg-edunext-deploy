import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PasswordChecklist from '../../components/ui/PasswordChecklist';
import { validatePassword } from '../../lib/password';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let sub;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const hasRecovery = data?.session?.user?.email_confirmed_at != null || !!data?.session;
        if (!cancelled && hasRecovery) setValid(true);
      } catch {}
      if (!cancelled) setChecking(false);
    })();
    sub = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        if (!cancelled) { setValid(true); setChecking(false); }
      }
    });
    return () => { cancelled = true; sub?.data?.subscription?.unsubscribe(); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const v = validatePassword(password);
    if (!v.ok) {
      setError('Mật khẩu yếu — cần: ' + v.failed.join(', '));
      return;
    }
    if (password !== confirm) {
      setError('Xác nhận mật khẩu không khớp.');
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      localStorage.removeItem('vmg_token');
      setDone(true);
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)', padding: 16 }}>
      <Card style={{ width: '100%', maxWidth: 440, padding: 'min(32px, 7vw)' }}>
        {checking ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Đang kiểm tra liên kết...</p>
          </div>
        ) : valid ? (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Đặt mật khẩu mới</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18, lineHeight: 1.6 }}>
              Nhập mật khẩu mới cho tài khoản của bạn.
            </p>
            {error && (
              <div style={{ padding: '12px 16px', background: 'var(--red-bg)', color: 'var(--red)', borderRadius: 12, fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}
            {done && (
              <div style={{ padding: '12px 16px', background: 'var(--green-bg)', color: 'var(--green)', borderRadius: 12, fontSize: 13, marginBottom: 16 }}>
                Đổi mật khẩu thành công! Đang chuyển về trang đăng nhập...
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Mật khẩu mới</label>
                <div className="pw-wrap">
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Nhập mật khẩu mới" required />
                  <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                    {showPw
                      ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                  </button>
                </div>
                <PasswordChecklist password={password} />
              </div>
              <div className="form-group">
                <label>Xác nhận mật khẩu</label>
                <div className="pw-wrap">
                  <input type={showPw ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Nhập lại mật khẩu" required />
                </div>
              </div>
              <Button type="submit" variant="primary" style={{ width: '100%', justifyContent: 'center', padding: '16px 24px', fontSize: 15 }} isDisabled={busy || done}>
                {busy ? 'Đang lưu...' : 'Đổi mật khẩu'}
              </Button>
            </form>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Liên kết không hợp lệ</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 18 }}>
              Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu link mới từ trang đăng nhập.
            </p>
            <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/login')}>
              Về trang đăng nhập
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
