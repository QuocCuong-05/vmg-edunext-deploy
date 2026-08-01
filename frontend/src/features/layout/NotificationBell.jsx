import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BiBell } from 'react-icons/bi';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';

const TYPE_TEXT = {
  remind: 'đã nhắc bạn học hôm nay.',
  like: 'đã thích bài viết của bạn.',
  comment: 'đã bình luận bài viết của bạn.',
  follow: 'đã theo dõi bạn.',
  share: 'đã chia sẻ bài viết của bạn.',
};

function getInitials(name) {
  return (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function renderMessage(n, nameMap) {
  const senderName = nameMap[n.from_user_id] || n.from_user_id?.slice(0, 8) + '…';
  const template = TYPE_TEXT[n.type];
  if (template) return `${senderName} ${template}`;
  const raw = n.message || '';
  if (n.from_user_id && raw.includes(n.from_user_id)) {
    return raw.replace(n.from_user_id, senderName);
  }
  return raw || `${senderName} đã có hoạt động mới.`;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [nameMap, setNameMap] = useState({});
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!user?.id) return;
    api.users.notifications(user.id).then(data => {
      if (Array.isArray(data)) setNotifications(data);
    }).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    let channel;
    try {
      channel = supabase
        .channel('notifications:' + user.id)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, payload => {
          if (!payload.new?.id) return;
          setNotifications(prev => {
            if (prev.some(n => n.id === payload.new.id)) return prev;
            return [payload.new, ...prev].slice(0, 50);
          });
        })
        .subscribe();
    } catch {}
    return () => {
      try { channel?.unsubscribe(); } catch {}
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const timer = setInterval(() => {
      api.users.notifications(user.id).then(data => {
        if (Array.isArray(data)) setNotifications(data);
      }).catch(() => {});
    }, 60000);
    return () => clearInterval(timer);
  }, [user?.id]);

  useEffect(() => {
    if (!notifications.length) {
      setNameMap({});
      return;
    }
    const ids = [...new Set(notifications.map(n => n.from_user_id))];
    supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', ids)
      .then(({ data }) => {
        const map = {};
        (data || []).forEach(p => { map[p.id] = p.full_name; });
        setNameMap(map);
      })
      .catch(() => {});
  }, [notifications]);

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
      <button className="avatar-btn" onClick={handleToggle} title="Thông báo" style={{ position: 'relative' }}>
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
          width: 340, maxHeight: 400, overflow: 'auto',
          background: 'var(--card)', border: '1px solid var(--line)',
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.12)',
          zIndex: 100,
        }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: 13, fontWeight: 700 }}>
            Thông báo
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: '24px 14px', textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>
              Chưa có thông báo nào.
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
                {getInitials(nameMap[n.from_user_id])}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--ink)' }}>{renderMessage(n, nameMap)}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                  {n.created_at ? new Date(n.created_at).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
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
