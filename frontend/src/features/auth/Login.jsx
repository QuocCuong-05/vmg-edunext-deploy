import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';
import Button from '../../components/ui/Button';
import PasswordChecklist from '../../components/ui/PasswordChecklist';
import { validatePassword } from '../../lib/password';
import { getWards } from '../../mock/wards';
import { getSchools } from '../../mock/schools';
import PolicyModal from '../policy/PolicyModal';
import { CONSENT_ITEMS } from '../../lib/consent';
import { trackEvent } from '../../lib/ga';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [ward, setWard] = useState('');
  const [school, setSchool] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [wards, setWards] = useState([]);
  const [schools, setSchools] = useState([]);
  const [step, setStep] = useState(1);
  const [consents, setConsents] = useState({ service: false, support: false, security: false, quality: false, marketing: false });
  const [showPolicyModal, setShowPolicyModal] = useState(false);
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
    if (isForgot) {
      setBusy(true);
      try {
        const redirectTo = `${window.location.origin}/reset-password`;
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) throw error;
        setInfo('Đã gửi link đặt lại mật khẩu vào email của bạn. Vui lòng kiểm tra hộp thư.');
      } catch (err) {
        setError(err.message);
      } finally {
        setBusy(false);
      }
      return;
    }
    if (isLogin) {
      setBusy(true);
      try {
        await login(email, password);
        navigate('/dashboard');
      } catch (err) {
        setError(err.message);
      } finally {
        setBusy(false);
      }
      return;
    }
    if (step === 1) {
      const v = validatePassword(password);
      if (!v.ok) {
        setError('Mật khẩu yếu — cần: ' + v.failed.join(', '));
        return;
      }
      if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp');
        return;
      }
      setStep(2);
      return;
    }
    setBusy(true);
    try {
      const requiredMissing = CONSENT_ITEMS.filter(c => c.required && !consents[c.key]);
      if (requiredMissing.length) {
        setError('Vui lòng đồng ý các mục bắt buộc để tạo tài khoản: ' + requiredMissing.map(c => c.title).join(', '));
        setBusy(false);
        return;
      }
      await signup(email, password, fullName, school, ward, consents);
      try {
        await api.auth.consent(CONSENT_ITEMS.map(c => ({ key: c.key, version: 1, accepted: consents[c.key] })));
        trackEvent('Consent', 'signup_consent', String(CONSENT_ITEMS.filter(c => consents[c.key]).length));
      } catch (consentErr) {
        console.error('[consent]', consentErr.message);
      }
      navigate('/dashboard');
    } catch (err) {
      if (/kiểm tra email|xác nhận|confirm/i.test(err.message)) {
        localStorage.setItem('vmg_consent_pending', JSON.stringify(
          CONSENT_ITEMS.map(c => ({ key: c.key, version: 1, accepted: consents[c.key] }))
        ));
        setInfo(err.message + ' Sau khi xác nhận và đăng nhập, lựa chọn của bạn sẽ được lưu tự động.');
      } else {
        setError(err.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const title = isForgot ? 'Quên mật khẩu' : (isLogin ? 'Đăng nhập' : 'Tạo tài khoản');
  const subtitle = isForgot
    ? 'Nhập email của bạn, chúng tôi sẽ gửi link đặt lại mật khẩu.'
    : (isLogin ? 'Chào mừng bạn quay trở lại!' : 'Bắt đầu hành trình học tập của bạn');

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
            <path className="wave-3" fill="rgba(255,255,255,.06)" d="M0,300L48,288C96,276,192,252,288,240C384,228,480,252,576,264C672,276,768,252,864,228C960,204,1056,180,1152,186.7C1248,192,1344,228,1392,240L1440,252L1440,500L1392,500C1344,500,1248,500,1152,500C1056,500,960,500,864,500C768,500,672,500,576,500C480,500,384,500,288,500C192,500,96,500,48,500L0,500Z"/>
          </svg>
        </div>
      </div>
      <div className="auth-form-wrap">
        <div className="auth-form-inner">
          <h2>{title}</h2>
          <p>{subtitle}</p>

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
            {!isForgot && !isLogin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>1</div>
                  <span style={{ fontSize: 13, fontWeight: step === 1 ? 700 : 500, color: step === 1 ? 'var(--ink)' : 'var(--muted)', whiteSpace: 'nowrap' }}>Thông tin cá nhân</span>
                </div>
                <div style={{ flex: 1, height: 2, background: step >= 2 ? 'var(--red)' : 'var(--line)', margin: '0 12px' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: step >= 2 ? 'var(--red)' : 'var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>2</div>
                  <span style={{ fontSize: 13, fontWeight: step === 2 ? 700 : 500, color: step === 2 ? 'var(--ink)' : 'var(--muted)', whiteSpace: 'nowrap' }}>Xác nhận</span>
                </div>
              </div>
            )}

            {step === 1 && (
              <>
                {!isLogin && (
                  <>
                    <div className="form-group">
                      <label>Họ và tên</label>
                      <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nguyễn Văn A" required />
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>* Hóa đơn sẽ được xuất theo tên này</div>
                    </div>
                    <div className="form-group">
                      <label>Phường/Xã</label>
                      <select value={ward} onChange={e => setWard(e.target.value)} required>
                        <option value="">Chọn phường/xã...</option>
                        {wards.map(w => (
                          <option key={w.id} value={w.name}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Trường học</label>
                      <select value={school} onChange={e => setSchool(e.target.value)} disabled={!ward} required>
                        <option value="">{ward ? 'Chọn trường...' : 'Chọn phường/xã trước'}</option>
                        {filteredSchools.map(s => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="teacher@vmg-edunext.com" required />
                </div>
                {!isForgot && (
                  <>
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
                      {!isLogin && <PasswordChecklist password={password} />}
                    </div>
                    {!isLogin && (
                      <div className="form-group">
                        <label>Xác nhận mật khẩu</label>
                        <input
                          type={showPw ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="Xác nhận mật khẩu"
                          required
                          style={password && confirmPassword && password !== confirmPassword ? { borderColor: 'var(--red)' } : {}}
                        />
                        {password && confirmPassword && password !== confirmPassword && (
                          <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 4 }}>Mật khẩu không khớp</div>
                        )}
                      </div>
                    )}
                    {isLogin && (
                      <div style={{ textAlign: 'right', marginTop: 6, marginBottom: 16 }}>
                        <a
                          onClick={() => { setIsForgot(true); setError(''); setInfo(''); }}
                          style={{ fontSize: 12, color: 'var(--red)', cursor: 'pointer', fontWeight: 600 }}
                        >Quên mật khẩu?</a>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {!isLogin && !isForgot && step === 2 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 8 }}>
                  Bắt buộc — cần thiết để vận hành dịch vụ
                </div>
                {CONSENT_ITEMS.filter(c => c.required).map(item => (
                  <label
                    key={item.key}
                    style={{
                      display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer',
                      padding: '12px 14px', borderRadius: 12, marginBottom: 8,
                      border: `1px solid ${consents[item.key] ? 'var(--red)' : 'var(--line)'}`, background: consents[item.key] ? 'var(--red-bg)' : 'var(--surface-hover)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!consents[item.key]}
                      onChange={e => setConsents({ ...consents, [item.key]: e.target.checked })}
                      style={{ marginTop: 3, flexShrink: 0, width: 16, height: 16 }}
                    />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <b style={{ fontSize: 13 }}>{item.title}</b>
                      <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, marginTop: 3 }}>{item.desc}</div>
                    </span>
                  </label>
                ))}
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5, margin: '14px 0 8px' }}>
                  Tùy chọn
                </div>
                {CONSENT_ITEMS.filter(c => !c.required).map(item => (
                  <label
                    key={item.key}
                    style={{
                      display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer',
                      padding: '12px 14px', borderRadius: 12, marginBottom: 8,
                      border: '1px solid var(--line)', background: 'var(--surface-hover)',
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
                        <span style={{ color: 'var(--muted)', fontSize: 11 }}>(tùy chọn)</span>
                      </b>
                      <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, marginTop: 3 }}>{item.desc}</div>
                    </span>
                  </label>
                ))}
                <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, marginTop: 12 }}>
                  Bằng cách đăng ký, bạn đồng ý với Điều khoản dịch vụ và{' '}
                  <a
                    onClick={(e) => { e.preventDefault(); setShowPolicyModal(true); }}
                    style={{ color: 'var(--red)', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    Chính sách bảo mật
                  </a>
                  {' '}của VMG EduNext.
                </p>
              </div>
            )}

            <Button type="submit" variant="primary" style={{ width: '100%', justifyContent: 'center', padding: '16px 24px', fontSize: 15 }} isDisabled={busy}>
              {busy ? 'Đang xử lý...' : isForgot ? 'Gửi link đặt lại mật khẩu' : isLogin ? 'Đăng nhập' : (step === 2 ? 'Tạo tài khoản' : 'Tiếp tục')}
            </Button>
            {!isForgot && !isLogin && step === 2 && (
              <Button variant="ghost" type="button" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                onClick={() => { setStep(1); setError(''); }}>
                ← Quay lại
              </Button>
            )}
          </form>

          <div className="auth-toggle">
            {isForgot ? (
              <a onClick={() => { setIsForgot(false); setError(''); setInfo(''); }}>Quay lại đăng nhập</a>
            ) : (
              <>
                {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                <a onClick={() => {
                  const toLogin = !isLogin;
                  setIsLogin(toLogin);
                  setError('');
                  setInfo('');
                  if (toLogin) { setEmail(''); setPassword(''); setConfirmPassword(''); setStep(1); }
                }}>{isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}</a>
              </>
            )}
          </div>
        </div>
      </div>

      {showPolicyModal && <PolicyModal slug="chinh-sach-bao-mat" onClose={() => setShowPolicyModal(false)} />}
    </div>
  );
}
