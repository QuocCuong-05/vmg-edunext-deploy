import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';
import PasswordChecklist from '../../components/ui/PasswordChecklist';
import { getWards } from '../../mock/wards';
import { getSchools } from '../../mock/schools';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState('teacher@vmg-edunext.com');
  const [password, setPassword] = useState('2026demo');
  const [fullName, setFullName] = useState('');
  const [ward, setWard] = useState('');
  const [school, setSchool] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [wards, setWards] = useState([]);
  const [schools, setSchools] = useState([]);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setWards(getWards());
    setSchools(getSchools());
  }, []);

  const filteredSchools = ward ? schools.filter(s => s.ward === ward) : [];

  useEffect(() => {
    setSchool('');
  }, [ward]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    try {
      if (isForgot) {
        const redirectTo = `${window.location.origin}/reset-password`;
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) throw error;
        setInfo('Đã gửi link đặt lại mật khẩu vào email của bạn. Vui lòng kiểm tra hộp thư.');
      } else if (isLogin) {
        await login(email, password);
        navigate('/dashboard');
      } else {
        await signup(email, password, fullName, school, ward);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="auth-hero-top">
          <img src="/vmg_white.svg" alt="VMG" style={{ height: 28 }} />
          <h1 className="hero-title">VMG EduNext</h1>
        </div>
        <div className="hero-middle">
          <div className="hero-slogan">
            <h2 className="hero-heading">Nâng tầm ngôn ngữ &ndash; Kiến tạo tương lai giáo dục</h2>
            <p className="hero-sub">Giải pháp học tiếng Anh toàn diện, giúp giáo&nbsp;viên tự tin làm&nbsp;chủ lớp học song ngữ</p>
          </div>
        </div>
        <div className="hero-wave">
          <svg viewBox="0 0 1440 500" preserveAspectRatio="none">
            <path className="wave-1" fill="rgba(255,255,255,.13)" d="M0,192L48,176C96,160,192,128,288,106.7C384,85,480,133,576,154.7C672,176,768,171,864,138.7C960,107,1056,48,1152,53.3C1248,59,1344,128,1392,165.3L1440,202.7L1440,500L1392,500C1344,500,1248,500,1152,500C1056,500,960,500,864,500C768,500,672,500,576,500C480,500,384,500,288,500C192,500,96,500,48,500L0,500Z"/>
            <path className="wave-2" fill="rgba(255,255,255,.09)" d="M0,256L48,240C96,224,192,192,288,176C384,160,480,192,576,213.3C672,235,768,229,864,202.7C960,176,1056,117,1152,106.7C1248,96,1344,149,1392,176L1440,202.7L1440,500L1392,500C1344,500,1248,500,1152,500C1056,500,960,500,864,500C768,500,672,500,576,500C480,500,384,500,288,500C192,500,96,500,48,500L0,500Z"/>
          </svg>
        </div>
      </div>
      <div className="auth-form-wrap">
        <div className="auth-form-inner">
          <h2>{isForgot ? 'Quên mật khẩu' : (isLogin ? 'Đăng nhập' : 'Đăng ký')}</h2>
          <p>{isForgot ? 'Nhập email của bạn, chúng tôi sẽ gửi link đặt lại mật khẩu.' : (isLogin ? 'Chào mừng bạn quay trở lại!' : 'Tạo tài khoản mới để bắt đầu học tập.')}</p>

          {error && (
            <div style={{ padding: '12px 16px', background: 'var(--red-bg)', color: 'var(--red)', borderRadius: 12, fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}
          {info && (
            <div style={{ padding: '12px 16px', background: 'var(--green-bg)', color: 'var(--green)', borderRadius: 12, fontSize: 13, marginBottom: 16 }}>
              {info}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {!isForgot && !isLogin && (<>
              <div className="form-group">
                <label>Họ và tên</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nguyễn Văn A" />
              </div>
              <div className="form-group">
                <label>Phường/Xã</label>
                <select value={ward} onChange={e => setWard(e.target.value)}>
                  <option value="">Chọn phường/xã...</option>
                  {wards.map(w => (
                    <option key={w.id} value={w.name}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Trường học</label>
                <select value={school} onChange={e => setSchool(e.target.value)} disabled={!ward}>
                  <option value="">{ward ? 'Chọn trường...' : 'Chọn phường/xã trước'}</option>
                  {filteredSchools.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
            </>)}
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="teacher@vmg-edunext.com" required />
            </div>
            {!isForgot && (
            <div className="form-group">
              <label>Mật khẩu</label>
              <div className="pw-wrap">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                  {showPw
                    ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                </button>
              </div>
              {isLogin && (
                <div style={{ textAlign: 'right', marginTop: 6 }}>
                  <a
                    onClick={() => { setIsForgot(true); setError(''); setInfo(''); }}
                    style={{ fontSize: 12, color: 'var(--red)', cursor: 'pointer', fontWeight: 600 }}
                  >Quên mật khẩu?</a>
                </div>
              )}
              {!isLogin && !isForgot && <PasswordChecklist password={password} />}
            </div>
            )}
            <Button type="submit" variant="primary" style={{ width: '100%', justifyContent: 'center', padding: '16px 24px', fontSize: 15 }} isDisabled={busy}>
              {busy ? 'Đang xử lý...' : isForgot ? 'Gửi link đặt lại mật khẩu' : (isLogin ? 'Đăng nhập' : 'Đăng ký')}
            </Button>
          </form>

          <div className="auth-toggle">
            {isForgot ? (
              <a onClick={() => { setIsForgot(false); setError(''); setInfo(''); }}>Quay lại đăng nhập</a>
            ) : (
              <>
                {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                <a onClick={() => { setIsLogin(!isLogin); setError(''); setInfo(''); }}>{isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}</a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
