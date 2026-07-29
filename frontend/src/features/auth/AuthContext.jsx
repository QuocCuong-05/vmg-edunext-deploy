import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MOCK_USER } from '../../mock/data';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('vmg_user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch { setUser(null); }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    if (password.length < 6) throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
    const mockUser = {
      ...MOCK_USER,
      email,
      full_name: email.includes('teacher') ? 'Nguyễn Văn Mười' : email.split('@')[0],
    };
    localStorage.setItem('vmg_user', JSON.stringify(mockUser));
    localStorage.setItem('vmg_token', 'mock-token-' + Date.now());
    setUser(mockUser);
    return mockUser;
  }, []);

  const signup = useCallback(async (email, password, full_name, school, ward) => {
    if (password.length < 6) throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
    const mockUser = { ...MOCK_USER, email, full_name: full_name || email.split('@')[0], school: school || '', ward: ward || '' };
    localStorage.setItem('vmg_user', JSON.stringify(mockUser));
    localStorage.setItem('vmg_token', 'mock-token-' + Date.now());
    setUser(mockUser);
    return mockUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('vmg_user');
    localStorage.removeItem('vmg_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
