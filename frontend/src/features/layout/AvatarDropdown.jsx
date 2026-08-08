import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useThemeMode } from '../../contexts/ThemeModeContext';
import { Icon } from '../../lib/icons';

export default function AvatarDropdown({ initials }) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('vmg_lang') || 'vi'; }
    catch { return 'vi'; }
  });
  const ref = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();

  const isPlus = !!user?.plus?.active;

  const plusLabel = isPlus ? 'Gói Plus của bạn' : 'Nâng cấp Plus';

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  function toggleLang() {
    const next = lang === 'vi' ? 'en' : 'vi';
    setLang(next);
    localStorage.setItem('vmg_lang', next);
  }

  const items = [
    { icon: Icon.Gem, label: plusLabel, onClick: () => navigate('/plus'), close: true, gold: true },
    { icon: Icon.User, label: 'Thông tin tài khoản', onClick: () => navigate('/account'), close: true },
    { icon: mode === 'dark' ? Icon.Sun : Icon.Moon, label: mode === 'dark' ? 'Giao diện sáng' : 'Giao diện tối', onClick: toggleTheme },
    { icon: Icon.Globe, label: lang === 'vi' ? 'English' : 'Tiếng Việt', onClick: toggleLang },
    { icon: Icon.Cog, label: 'Đổi mật khẩu', onClick: () => navigate('/password'), close: true },
  ];

  return (
    <div ref={ref} className="avatar-wrap">
      <button className="avatar-btn" onClick={() => setOpen(o => !o)}>
        {initials}
        {isPlus && (
          <span className="avatar-plus-badge" title="Gói Plus">
            <Icon.Gem size={10} />
          </span>
        )}
      </button>
      {open && (
        <div className="avatar-dropdown">
          {items.map((item, i) => (
            <button key={i} className={`avatar-dropdown-item${item.gold ? ' gold' : ''}`} onClick={() => {
              item.onClick();
              if (item.close) setOpen(false);
            }}>
              <item.icon size={16} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
            </button>
          ))}
          <div className="avatar-dropdown-divider" />
          <button className="avatar-dropdown-item danger" onClick={handleLogout}>
            <Icon.LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      )}
    </div>
  );
}
