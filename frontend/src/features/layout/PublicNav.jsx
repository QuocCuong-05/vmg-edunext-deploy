import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';

export default function PublicNav() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <nav className="landing-nav">
      <div className="landing-nav-inner">
        <div className="landing-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src="/vmg.png" alt="VMG" style={{ height: 22 }} />
          <span className="landing-logo-text"><span style={{ whiteSpace: 'nowrap' }}>VMG EduNext</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 13, fontWeight: 600 }}>
          <button onClick={() => navigate('/blog')} style={{ background: 'none', border: 'none', color: 'var(--ink)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Bài blog</button>
          <button onClick={() => navigate('/help')} style={{ background: 'none', border: 'none', color: 'var(--ink)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Trợ giúp</button>
          <button onClick={() => navigate('/plus')} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Gói Plus</button>
        </div>
        <div className="landing-nav-actions">
          {user ? (
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard')}>
              Vào Dashboard
            </button>
          ) : (
            <>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/login')}>
                Đăng nhập
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/login?signup=1')}>
                Đăng ký miễn phí
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
