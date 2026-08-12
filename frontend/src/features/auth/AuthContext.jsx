import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { syncXp, setPlusFlag } from '../../lib/xp';
import { validatePassword } from '../../lib/password';

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
        syncXp();
        await sendPendingConsent();
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
    syncXp();
    await sendPendingConsent();
    return meData.user;
  }, []);

  const signup = useCallback(async (email, password, full_name, school, ward) => {
    const v = validatePassword(password);
    if (!v.ok) {
      throw new Error('Mật khẩu yếu — cần: ' + v.failed.join(', '));
    }
    if (!full_name?.trim() || !ward || !school) {
      throw new Error('Vui lòng nhập đầy đủ: Họ và tên, Phường/Xã và Trường học');
    }

    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name, school, ward }),
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
    syncXp();
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
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
