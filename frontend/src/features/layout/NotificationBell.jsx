import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BiBell } from 'react-icons/bi';
import { useAuth } from '../auth/AuthContext';
import { api } from '../../lib/api';

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!user?.id) return;
    api.users.notifications(user.id).then(data => {
      if (Array.isArray(data)) setNotifications(data);
    }).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unread = notifications.filter(n => !n.read).length;

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && user?.id && unread > 0) {
      api.users.markNotificationsRead(user.id).then(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }).catch(() => {});
    }
  };

  if (!user) return null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="avatar-btn" onClick={handleToggle} title="Notifications" style={{ position: 'relative' }}>
        <BiBell size={18} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            width: 16, height: 16, borderRadius: '50%',
            background: 'var(--red)', color: '#fff',
            fontSize: 9, fontWeight: 700,
            display: 'grid', placeItems: 'center',
            lineHeight: 1,
          }}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: 4,
          width: 320, maxHeight: 360, overflow: 'auto',
          background: '#fff', border: '1px solid var(--line)',
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.12)',
          zIndex: 100,
        }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: 13, fontWeight: 700 }}>
            Notifications
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: '24px 14px', textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>
              No notifications yet.
            </div>
          ) : notifications.map(n => (
            <Link
              key={n.id}
              to={`/profile/${n.from_user_id}`}
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', gap: 10, padding: '10px 14px',
                textDecoration: 'none', color: 'inherit',
                borderBottom: '1px solid var(--line)',
                background: n.read ? 'transparent' : 'var(--red-bg)',
                transition: 'background .15s',
              }}
              onMouseEnter={e => e.target.style.background = 'var(--bg)'}
              onMouseLeave={e => e.target.style.background = n.read ? 'transparent' : 'var(--red-bg)'}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--red)', color: '#fff',
                display: 'grid', placeItems: 'center',
                fontWeight: 700, fontSize: 10, flexShrink: 0,
              }}>
                {n.from_user_id?.slice(-2).toUpperCase() || '??'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--ink)' }}>{n.message}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                  {n.created_at ? new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
              {!n.read && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', flexShrink: 0, marginTop: 4 }} />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
