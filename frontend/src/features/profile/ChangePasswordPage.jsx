import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../../lib/supabase';
import { Icon } from '../../lib/icons';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PasswordChecklist from '../../components/ui/PasswordChecklist';
import { validatePassword } from '../../lib/password';

export default function ChangePasswordPage() {
  const { user, logout } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!current) {
      window.__vimi_toast?.('Vui lòng nhập mật khẩu hiện tại', 'error');
      return;
    }
    const v = validatePassword(next);
    if (!v.ok) {
      window.__vimi_toast?.('Mật khẩu mới yếu — cần: ' + v.failed.join(', '), 'error');
      return;
    }
    if (next !== confirm) {
      window.__vimi_toast?.('Mật khẩu nhập lại không khớp', 'error');
      return;
    }
    if (next === current) {
      window.__vimi_toast?.('Mật khẩu mới phải khác mật khẩu hiện tại', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user?.email,
        password: current,
      });
      if (verifyError) throw new Error('Mật khẩu hiện tại không đúng');

      const { error: updateError } = await supabase.auth.updateUser({ password: next });
      if (updateError) throw new Error(updateError.message);

      setCurrent('');
      setNext('');
      setConfirm('');
      window.__vimi_toast?.('Đổi mật khẩu thành công', 'success');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        await logout();
        window.__vimi_toast?.('Mật khẩu đã đổi. Vui lòng đăng nhập lại.', 'success');
      }
    } catch (e) {
      window.__vimi_toast?.(e.message || 'Đổi mật khẩu thất bại', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-enter">
      <div className="page-title">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Icon.Cog size={24} /> Đổi mật khẩu</h1>
        <p>Đặt mật khẩu mới cho tài khoản của bạn.</p>
      </div>

      <Card style={{ padding: 24, maxWidth: 520 }}>
        <div className="form-group">
          <label>Mật khẩu hiện tại *</label>
          <input
            type="password"
            value={current}
            onChange={e => setCurrent(e.target.value)}
            placeholder="Nhập mật khẩu hiện tại"
            autoComplete="current-password"
          />
        </div>

        <div className="form-group">
          <label>Mật khẩu mới *</label>
          <input
            type="password"
            value={next}
            onChange={e => setNext(e.target.value)}
            placeholder="Nhập mật khẩu mới"
            autoComplete="new-password"
          />
          <PasswordChecklist password={next} />
        </div>

        <div className="form-group">
          <label>Nhập lại mật khẩu mới *</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Nhập lại mật khẩu mới"
            autoComplete="new-password"
          />
        </div>

        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.5 }}>
          Yêu cầu: tối thiểu 6 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt; khác mật khẩu hiện tại. Sau khi đổi, bạn có thể cần đăng nhập lại.
        </p>

        <Button variant="primary" isDisabled={submitting} onClick={handleSubmit}>
          {submitting ? 'Đang xử lý...' : 'Đổi mật khẩu'}
        </Button>
      </Card>
    </div>
  );
}
