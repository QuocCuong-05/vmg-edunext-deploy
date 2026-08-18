import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import ViMiChat from '../vimi/ViMiChat';
import AvatarDropdown from './AvatarDropdown';
import NotificationBell from './NotificationBell';
import BottomNav from './BottomNav';
import { useAuth } from '../auth/AuthContext';
import { Icon } from '../../lib/icons';
import { ToastProvider } from '../../components/ui/Toast';
import { useMediaQuery } from '../../lib/useMediaQuery';

const CORE_NAV = [
  { to: '/courses', label: 'Khóa học của tôi', icon: Icon.Courses, color: 'var(--red)', bg: 'var(--red-bg)' },
  { to: '/wordbook', label: 'Sổ từ của tôi', icon: Icon.Vocab, color: 'var(--gold)', bg: 'var(--gold-bg)' },
  { to: '/level', label: 'Thử thách lên cấp', icon: Icon.Target, color: 'var(--blue)', bg: 'var(--blue-bg)' },
  { to: '/admin/data', label: 'Quản lý dữ liệu', icon: Icon.Cog, color: 'var(--cyan)', bg: 'rgba(32,165,201,.12)', adminOnly: true },
];

const GROUPS = [
  {
    label: 'Luyện tập',
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
    label: 'Cộng đồng',
    items: [
      { to: '/ranking', label: 'Bảng xếp hạng', icon: Icon.Stats },
      { to: '/community', label: 'Cộng đồng', icon: Icon.BookOpen },
      { to: '/certificate', label: 'Chứng nhận', icon: Icon.Check },
      { to: '/rewards', label: 'Cửa hàng', icon: Icon.CartAlt },
    ],
  },
  {
    label: 'Khám phá',
    items: [
      { to: '/blog', label: 'Kiến thức giáo dục', icon: Icon.Sparkles },
      { to: '/booking', label: 'Đặt lịch chuyên gia', icon: Icon.Calendar },
      { to: '/about', label: 'Về VMG EduNext', icon: Icon.Lightbulb },
    ],
  },
];

export default function Layout() {
  const { user, logout, isPlus } = useAuth();
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

  const isMobile = useMediaQuery('(max-width: 768px)');
  const showRail = !isMobile && rail;
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isMobile) setDrawerOpen(false);
  }, [isMobile]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = e => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  const toggleRail = () => {
    setRail(prev => {
      localStorage.setItem('vmg_sidebar_rail', !prev ? '1' : '0');
      return !prev;
    });
  };

  const closeDrawer = () => { if (isMobile) setDrawerOpen(false); };

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Scrim — covers the page behind the mobile drawer */}
        {isMobile && drawerOpen && (
          <div onClick={() => setDrawerOpen(false)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200,
            animation: 'fadeIn .15s ease-out',
          }} />
        )}
        {/* Sidebar */}
        <aside className="app-sidebar" style={{
          width: isMobile ? 260 : (showRail ? 64 : 260),
          flexShrink: 0,
          borderRight: '1px solid var(--line)',
          background: 'var(--card)',
          display: 'flex', flexDirection: 'column',
          position: isMobile ? 'fixed' : 'sticky',
          top: 0,
          overflow: 'hidden',
          transition: isMobile ? 'transform .2s ease' : 'width .2s',
          transform: isMobile ? (drawerOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
          zIndex: isMobile ? 210 : 'auto',
          boxShadow: isMobile && drawerOpen ? 'var(--shadow)' : 'none',
        }}>
          {/* Sidebar header */}
          <div className="brand" style={{ padding: showRail ? '16px 0' : '16px 16px 20px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', justifyContent: showRail ? 'center' : 'flex-start' }} onClick={() => { navigate('/dashboard'); closeDrawer(); }}>
              <img src="/vmg.png" alt="VMG" style={{ height: 24, maxWidth: 60 }} />
              {!showRail && (
                <div className="brand-title">
                  <b>VMG EduNext</b>
                  <small>Nền tảng phát triển giáo viên</small>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, minHeight: 0, padding: showRail ? '8px 0' : '8px', overflowY: 'auto', overflowX: 'hidden', scrollbarGutter: 'stable', overscrollBehavior: 'contain' }}>
            {/* Dashboard first */}
            <div
              onClick={() => { navigate('/dashboard'); closeDrawer(); }}
              title={showRail ? 'Tổng quan' : undefined}
              onMouseEnter={e => { if (!isActive('/dashboard')) e.target.style.background = 'var(--surface)'; }}
              onMouseLeave={e => { if (!isActive('/dashboard')) e.target.style.background = 'none'; }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                justifyContent: showRail ? 'center' : 'flex-start',
                padding: showRail ? '10px 0' : '8px 12px',
                borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                fontSize: 13, fontWeight: isActive('/dashboard') ? 700 : 500,
                background: isActive('/dashboard') ? 'var(--red-bg)' : 'none',
                color: isActive('/dashboard') ? 'var(--red)' : 'var(--ink)',
                transition: 'all .12s',
              }}
            >
              <Icon.Dashboard size={18} style={{ flexShrink: 0 }} />
              {!showRail && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Tổng quan</span>}
            </div>

            {CORE_NAV.filter(item => !item.adminOnly || user?.role === 'admin').map(item => (
              <div
                key={item.to}
                onClick={() => { navigate(item.to); closeDrawer(); }}
                title={showRail ? item.label : undefined}
                onMouseEnter={e => { if (!isActive(item.to)) e.target.style.background = 'var(--surface)'; }}
                onMouseLeave={e => { if (!isActive(item.to)) e.target.style.background = 'none'; }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  justifyContent: showRail ? 'center' : 'flex-start',
                  padding: showRail ? '9px 0' : '7px 10px',
                  borderRadius: 8, cursor: 'pointer', marginBottom: 1,
                  fontSize: 13, fontWeight: isActive(item.to) ? 700 : 600,
                  background: isActive(item.to) ? item.bg : 'none',
                  color: isActive(item.to) ? item.color : 'var(--ink)',
                  borderLeft: isActive(item.to) ? `3px solid ${item.color}` : '3px solid transparent',
                  transition: 'all .12s', overflow: 'hidden',
                }}
              >
                <span style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: item.bg, color: item.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <item.icon size={16} />
                </span>
                {!showRail && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>}
              </div>
            ))}

            {!showRail && <div style={{ height: 1, margin: '10px 12px', background: 'var(--line)' }} />}
            {showRail && <div style={{ height: 1, margin: '8px 10px', background: 'var(--line)' }} />}

            {GROUPS.map((group, gi) => {
              const groupHasActive = group.items.some(it => isActive(it.to));
              const groupOpen = !collapsed[group.label] || groupHasActive;
              return (
              <div key={gi}>
                {showRail ? (
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
                {groupOpen && group.items.map(item => (
                  <div
                    key={item.to}
                    onClick={() => { navigate(item.to); closeDrawer(); }}
                    title={showRail ? item.label : undefined}
                    onMouseEnter={e => { if (!isActive(item.to)) e.target.style.background = 'var(--surface)'; }}
                    onMouseLeave={e => { if (!isActive(item.to)) e.target.style.background = 'none'; }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      justifyContent: showRail ? 'center' : 'flex-start',
                      padding: showRail ? '10px 0' : '7px 12px',
                      borderRadius: 8, cursor: 'pointer', marginBottom: 1,
                      fontSize: 13, fontWeight: isActive(item.to) ? 700 : 500,
                      background: isActive(item.to) ? 'var(--red-bg)' : 'none',
                      color: isActive(item.to) ? 'var(--red)' : 'var(--ink)',
                      transition: 'all .12s', overflow: 'hidden',
                    }}
                  >
                    <item.icon size={18} style={{ flexShrink: 0 }} />
                    {!showRail && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>}
                  </div>
                ))}
              </div>
              );
            })}
          </nav>

          {/* Sidebar footer with user info — fixed at bottom */}
          <div style={{
            padding: showRail ? '12px 0' : '12px 8px', borderTop: '1px solid var(--line)', flexShrink: 0,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              justifyContent: showRail ? 'center' : 'flex-start',
              padding: '8px 12px',
            }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div className="avatar-btn" title={user?.full_name} style={{ width: 36, height: 36, fontSize: 12 }}>{initials}</div>
                {isPlus && (
                  <span className="avatar-plus-badge" title="Gói Plus" style={{ bottom: -3, right: -3, width: 15, height: 15 }}>
                    <Icon.Gem size={9} />
                  </span>
                )}
              </div>
              {!showRail && (
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
              <button
                className="avatar-btn"
                onClick={() => (isMobile ? setDrawerOpen(true) : toggleRail())}
                title={isMobile ? 'Mở menu' : (rail ? 'Mở rộng menu' : 'Thu gọn menu')}
              >
                <Icon.Menu size={16} />
              </button>
              <div className="header-title" style={{ fontWeight: 800, fontSize: 15, letterSpacing: -.3 }}>VMG EduNext</div>
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
              <a style={{ cursor: 'pointer' }} onClick={() => navigate('/help')}>Trung tâm trợ giúp</a>
            </div>
            <div>
              <b>VMG English</b>
              <p>Đồng hành cùng giáo viên trên hành trình nâng cao năng lực ngoại ngữ và hội nhập <span style={{ whiteSpace: 'nowrap' }}>giáo dục</span>.</p>
              <small>&copy; 2026 VMG English. All rights reserved.</small>
            </div>
          </footer>
        </div>
      </div>
      <BottomNav />
      <ViMiChat />
    </div>
  );
}
