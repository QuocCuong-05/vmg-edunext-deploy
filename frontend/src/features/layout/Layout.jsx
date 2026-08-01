import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import ViMiChat from '../vimi/ViMiChat';
import AvatarDropdown from './AvatarDropdown';
import NotificationBell from './NotificationBell';
import { useAuth } from '../auth/AuthContext';
import { Icon } from '../../lib/icons';
import { ToastProvider } from '../../components/ui/Toast';

const GROUPS = [
  {
    label: 'Học tập',
    items: [
      { to: '/courses', label: 'Khóa học của tôi', icon: Icon.Courses },
      { to: '/level', label: 'Thử thách lên cấp', icon: Icon.Target },
      { to: '/wordbook', label: 'Sổ từ của tôi', icon: Icon.Vocab },
    ],
  },
  {
    label: 'Ngôn ngữ & Luyện tập',
    items: [
      { to: '/quiz', label: 'Luyện tập', icon: Icon.Quiz },
      { to: '/classroom', label: 'Classroom Phrases', icon: Icon.Mic },

    ],
  },
  {
    label: 'ViMi AI',
    items: [
      { to: '/vimi', label: 'Trò chuyện với ViMi', icon: Icon.ViMi },
      { to: '/planner', label: 'Thiết kế bài dạy AI', icon: Icon.Pen },
    ],
  },
  {
    label: 'Tiến bộ & Cộng đồng',
    items: [
      { to: '/ranking', label: 'Bảng xếp hạng', icon: Icon.Stats },
      { to: '/community', label: 'Cộng đồng', icon: Icon.BookOpen },
      { to: '/certificate', label: 'Chứng nhận', icon: Icon.Check },
      { to: '/rewards', label: 'Cửa hàng', icon: Icon.CartAlt },
    ],
  },
  {
    label: 'Khám phá & Hỗ trợ',
    items: [
      { to: '/blog', label: 'Kiến thức giáo dục', icon: Icon.Sparkles },
      { to: '/booking', label: 'Đặt lịch chuyên gia', icon: Icon.Calendar },
      { to: '/about', label: 'Về VMG EduNext', icon: Icon.Lightbulb },
    ],
  },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'VM';

  useEffect(() => {
    fetch('/api/health').catch(() => {});
  }, []);

  const [collapsed, setCollapsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vmg_sidebar_collapsed') || '{}'); }
    catch { return {}; }
  });

  const toggleGroup = (label) => {
    setCollapsed(prev => {
      const next = { ...prev, [label]: !prev[label] };
      localStorage.setItem('vmg_sidebar_collapsed', JSON.stringify(next));
      return next;
    });
  };

  const [rail, setRail] = useState(() => {
    try { return localStorage.getItem('vmg_sidebar_rail') === '1'; }
    catch { return false; }
  });

  const toggleRail = () => {
    setRail(prev => {
      localStorage.setItem('vmg_sidebar_rail', !prev ? '1' : '0');
      return !prev;
    });
  };

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside style={{
          width: rail ? 64 : 260, flexShrink: 0,
          borderRight: '1px solid var(--line)',
          background: 'var(--card)',
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, height: '100vh',
          overflow: 'hidden',
          transition: 'width .2s',
        }}>
          {/* Sidebar header */}
          <div className="brand" style={{ padding: rail ? '16px 0' : '16px 16px 20px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', justifyContent: rail ? 'center' : 'flex-start' }} onClick={() => navigate('/dashboard')}>
              <img src="/vmg.png" alt="VMG" style={{ height: 24, maxWidth: 60 }} />
              {!rail && (
                <div className="brand-title">
                  <b>VMG EduNext</b>
                  <small>Nền tảng phát triển giáo viên</small>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, minHeight: 0, padding: rail ? '8px 0' : '8px', overflowY: 'auto', overflowX: 'hidden', scrollbarGutter: 'stable' }}>
            {/* Dashboard first */}
            <div
              onClick={() => navigate('/dashboard')}
              title={rail ? 'Tổng quan' : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                justifyContent: rail ? 'center' : 'flex-start',
                padding: rail ? '10px 0' : '8px 12px',
                borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                fontSize: 13, fontWeight: isActive('/dashboard') ? 700 : 500,
                background: isActive('/dashboard') ? 'var(--surface)' : 'none',
                color: isActive('/dashboard') ? 'var(--red)' : 'var(--ink)',
                transition: 'all .12s',
              }}
            >
              <Icon.Dashboard size={18} style={{ flexShrink: 0 }} />
              {!rail && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Tổng quan</span>}
            </div>

            {GROUPS.map((group, gi) => (
              <div key={gi}>
                {rail ? (
                  <div style={{ height: 1, margin: '8px 10px', background: 'var(--line)' }} />
                ) : (
                  <div
                    onClick={() => toggleGroup(group.label)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: .6, color: 'var(--muted)',
                      padding: '12px 12px 6px', cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <span style={{
                      fontSize: 8, transition: 'transform .15s',
                      transform: collapsed[group.label] ? 'rotate(-90deg)' : 'rotate(0deg)',
                    }}>
                      ▾
                    </span>
                    {group.label}
                  </div>
                )}
                {!collapsed[group.label] && group.items.map(item => (
                  <div
                    key={item.to}
                    onClick={() => navigate(item.to)}
                    title={rail ? item.label : undefined}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      justifyContent: rail ? 'center' : 'flex-start',
                      padding: rail ? '10px 0' : '7px 12px',
                      borderRadius: 8, cursor: 'pointer', marginBottom: 1,
                      fontSize: 13, fontWeight: isActive(item.to) ? 700 : 500,
                      background: isActive(item.to) ? 'var(--surface)' : 'none',
                      color: isActive(item.to) ? 'var(--red)' : 'var(--ink)',
                      transition: 'all .12s', overflow: 'hidden',
                    }}
                  >
                    <item.icon size={18} style={{ flexShrink: 0 }} />
                    {!rail && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>}
                  </div>
                ))}
              </div>
            ))}

            {user?.role === 'admin' && (
              <div>
                {rail ? (
                  <div style={{ height: 1, margin: '8px 10px', background: 'var(--line)' }} />
                ) : (
                  <div
                    onClick={() => toggleGroup('Quản trị')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: .6, color: 'var(--muted)',
                      padding: '12px 12px 6px', cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <span style={{
                      fontSize: 8, transition: 'transform .15s',
                      transform: collapsed['Quản trị'] ? 'rotate(-90deg)' : 'rotate(0deg)',
                    }}>
                      ▾
                    </span>
                    Quản trị
                  </div>
                )}
                {!collapsed['Quản trị'] && (
                  <div
                    onClick={() => navigate('/admin/data')}
                    title={rail ? 'Quản lý dữ liệu' : undefined}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      justifyContent: rail ? 'center' : 'flex-start',
                      padding: rail ? '10px 0' : '7px 12px',
                      borderRadius: 8, cursor: 'pointer', marginBottom: 1,
                      fontSize: 13, fontWeight: isActive('/admin/data') ? 700 : 500,
                      background: isActive('/admin/data') ? 'var(--surface)' : 'none',
                      color: isActive('/admin/data') ? 'var(--red)' : 'var(--ink)',
                      transition: 'all .12s', overflow: 'hidden',
                    }}
                  >
                    <Icon.Cog size={18} style={{ flexShrink: 0 }} />
                    {!rail && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Quản lý dữ liệu
                    </span>}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Sidebar footer with user info — fixed at bottom */}
          <div style={{
            padding: rail ? '12px 0' : '12px 8px', borderTop: '1px solid var(--line)', flexShrink: 0,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              justifyContent: rail ? 'center' : 'flex-start',
              padding: '8px 12px',
            }}>
              <div className="avatar-btn" title={user?.full_name} style={{ width: 36, height: 36, fontSize: 12, flexShrink: 0 }}>{initials}</div>
              {!rail && (
                <>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.full_name || 'User'}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>{user?.xp || 0} XP</div>
                  </div>
                  <button
                    onClick={logout}
                    style={{
                      fontSize: 11, color: 'var(--muted)', padding: '4px 8px',
                      borderRadius: 8, border: '1px solid var(--line)',
                      cursor: 'pointer', background: 'none', transition: 'all .15s', flexShrink: 0,
                    }}
                    onMouseEnter={e => { e.target.style.borderColor = 'var(--red)'; e.target.style.color = 'var(--red)'; }}
                    onMouseLeave={e => { e.target.style.borderColor = 'var(--line)'; e.target.style.color = 'var(--muted)'; }}
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* Content area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Top nav */}
          <header style={{
            height: 56, flexShrink: 0,
            borderBottom: '1px solid var(--line)',
            background: 'var(--card)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            position: 'sticky', top: 0, zIndex: 50,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="avatar-btn" onClick={toggleRail} title={rail ? 'Mở rộng menu' : 'Thu gọn menu'}>
                <Icon.Menu size={16} />
              </button>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: -.3 }}>VMG EduNext</div>
            </div>
            <div className="top-actions" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="avatar-btn" onClick={() => navigate('/vimi')} title="ViMi AI Tutor">
                <Icon.ViMi size={16} />
              </button>
              <button className="avatar-btn" onClick={() => navigate('/quiz')} title="Luyện tập">
                <Icon.Quiz size={16} />
              </button>
              <NotificationBell />
              <AvatarDropdown initials={initials} />
            </div>
          </header>

          <main className="main" style={{ flex: 1, minHeight: 0 }}>
            <ToastProvider><Outlet /></ToastProvider>
          </main>

          <footer className="site-footer">
            <div className="footer-brand">
              <b>VMG EduNext</b>
              <p>Nền tảng phát triển năng lực tiếng Anh và năng lực giảng dạy dành cho giáo viên.</p>
            </div>
            <div>
              <b>Hệ sinh thái</b>
              <a onClick={() => navigate('/about')}>Về VMG EduNext</a>
              <a onClick={() => navigate('/community')}>Cộng đồng giáo viên</a>
              <a onClick={() => navigate('/blog')}>Kiến thức giáo dục</a>
            </div>
            <div>
              <b>Hỗ trợ</b>
              <a onClick={() => navigate('/booking')}>Đặt lịch chuyên gia</a>
              <a onClick={() => navigate('/vimi')}>Hỏi ViMi</a>
              <a style={{ cursor: 'pointer' }} onClick={() => alert('Trung tâm trợ giúp')}>Trung tâm trợ giúp</a>
            </div>
            <div>
              <b>VMG English</b>
              <p>Đồng hành cùng giáo viên trên hành trình nâng cao năng lực ngoại ngữ và hội nhập giáo dục.</p>
              <small>&copy; 2026 VMG English. All rights reserved.</small>
            </div>
          </footer>
        </div>
      </div>
      <ViMiChat />
    </div>
  );
}
