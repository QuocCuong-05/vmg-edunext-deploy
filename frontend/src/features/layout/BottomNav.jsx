import { Link, useLocation } from 'react-router-dom';
import { Icon } from '../../lib/icons';

const ITEMS = [
  { to: '/dashboard', label: 'Tổng quan', icon: Icon.Dashboard },
  { to: '/courses', label: 'Khóa học', icon: Icon.Courses },
  { to: '/quiz', label: 'Luyện tập', icon: Icon.Quiz },
  { to: '/community', label: 'Cộng đồng', icon: Icon.BookOpen },
  { to: '/vimi', label: 'ViMi', icon: Icon.ViMi },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="bottom-nav">
      {ITEMS.map(item => {
        const active = pathname === item.to || pathname.startsWith(item.to + '/');
        return (
          <Link key={item.to} to={item.to} className={`bottom-nav-item${active ? ' active' : ''}`}>
            <item.icon size={20} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
