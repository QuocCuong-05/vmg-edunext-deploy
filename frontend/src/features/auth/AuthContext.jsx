import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { syncXp, setPlusFlag } from '../../lib/xp';
import { validatePassword } from '../../lib/password';
import { api } from '../../lib/api';
import { trackEvent } from '../../lib/ga';
import { CONSENT_ITEMS } from '../../lib/consent';
import ConsentReconsentModal from './ConsentReconsentModal';

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reconsentPolicy, setReconsentPolicy] = useState(null);

  async function checkReconsent(token) {
    try {
      const [activePolicy, consentsData] = await Promise.all([
        api.cms.policyActive('chinh-sach-bao-mat').catch(() => null),
        api.auth.consents().catch(() => null),
      ]);
      if (!activePolicy) return;
      const list = consentsData?.data || [];
      const serviceConsent = list.find(c => c.policy_key === 'service');
      // Chỉ hỏi lại khi chính sách CẬP NHẬT version mới hơn bản user đã đồng ý
      // (user chưa có consent = coi như đã đồng ý v1 — không làm phiền mỗi lần login)
      if (serviceConsent && Number(serviceConsent.version) < Number(activePolicy.version)) {
        setReconsentPolicy(activePolicy);
      }
    } catch {}
  }

  async function saveReconsent(consents) {
    if (!reconsentPolicy) return;
    await api.auth.consent(CONSENT_ITEMS.map(c => ({ key: c.key, version: reconsentPolicy.version, accepted: consents[c.key] })));
    setReconsentPolicy(null);
  }

  async function declineReconsent() {
    setReconsentPolicy(null);
    await logout();
  }

  function applyUser(data) {
    setPlusFlag(data?.user?.plus?.active);
    setUser(data?.user || null);
  }

  async function sendPendingConsent() {
    const raw = localStorage.getItem('vmg_consent_pending');
    if (!raw) return;
    const token = localStorage.getItem('vmg_token');
    if (!token) return;
    try {
      const items = JSON.parse(raw);
      const res = await fetch(`${API_BASE}/auth/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items }),
      });
      if (res.ok) localStorage.removeItem('vmg_consent_pending');
    } catch {
      // giữ lại pending để lần đăng nhập sau thử lại
    }
  }

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      await supabase.auth.setSession(session);

      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        const data = await res.json();
        applyUser(data);
        localStorage.setItem('vmg_token', session.access_token);
        checkReconsent(session.access_token);
        syncXp();
        await sendPendingConsent();
        api.auth.sessionTouch().catch(() => {});
      } else {
        localStorage.removeItem('vmg_token');
      }
    } catch {
      localStorage.removeItem('vmg_token');
    } finally {
      setLoading(false);
    }
  }

  const login = useCallback(async (email, password) => {
    if (password.length < 6) throw new Error('Mật khẩu phải có ít nhất 6 ký tự');

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Sai email hoặc mật khẩu');
    }

    const data = await res.json();

    if (!data.session) {
      throw new Error('Email chưa được xác nhận. Vui lòng kiểm tra hộp thư.');
    }

    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });

    localStorage.setItem('vmg_token', data.session.access_token);

    const meRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    });

    if (!meRes.ok) {
      throw new Error('Không thể lấy thông tin người dùng');
    }

    const meData = await meRes.json();
    applyUser(meData);
    checkReconsent(data.session.access_token);
    syncXp();
    await sendPendingConsent();
    api.auth.sessionTouch().catch(() => {});
    trackEvent('Auth', 'login', email);
    return meData.user;
  }, []);

  const signup = useCallback(async (email, password, full_name, school, ward, consents = null) => {
    const v = validatePassword(password);
    if (!v.ok) {
      throw new Error('Mật khẩu yếu — cần: ' + v.failed.join(', '));
    }
    if (!full_name?.trim()) {
      throw new Error('Vui lòng nhập Họ và tên');
    }

    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name, school, ward, consents }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Đăng ký thất bại');
    }

    const data = await res.json();

    if (!data.session) {
      throw new Error('Tài khoản đã được tạo. Vui lòng kiểm tra email để xác nhận trước khi đăng nhập.');
    }

    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });

    localStorage.setItem('vmg_token', data.session.access_token);

    const meRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    });

    if (!meRes.ok) {
      throw new Error('Không thể lấy thông tin người dùng');
    }

    const meData = await meRes.json();
    applyUser(meData);
    checkReconsent(data.session.access_token);
    syncXp();
    trackEvent('Auth', 'signup', email);
    return meData.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
    } catch {
      // ignore network errors on logout
    }
    localStorage.removeItem('vmg_token');
    setPlusFlag(false);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('vmg_token');
    if (!token) return null;
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    applyUser(data);
    return data.user;
  }, []);

  const consumeAiUsage = useCallback((kind) => {
    setUser(prev => {
      if (!prev?.aiUsage) return prev;
      const key = `${kind}Left`;
      if (typeof prev.aiUsage[key] !== 'number') return prev;
      return { ...prev, aiUsage: { ...prev.aiUsage, [key]: Math.max(0, prev.aiUsage[key] - 1) } };
    });
  }, []);

  const isPlus = !!user?.plus?.active;

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser, consumeAiUsage, isPlus }}>
      {children}
      {reconsentPolicy && (
        <ConsentReconsentModal policy={reconsentPolicy} onSave={saveReconsent} onDecline={declineReconsent} />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
