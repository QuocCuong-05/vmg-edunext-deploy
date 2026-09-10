import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../../lib/api';

export default function ProtectedRoute({ children }) {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const checkingRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    if (checkingRef.current) return;
    checkingRef.current = true;
    api.auth.sessionCheck()
      .then(data => {
        if (data && data.ok === false) {
          logout().then(() => navigate('/login', { replace: true }));
        }
      })
      .catch(() => {})
      .finally(() => { checkingRef.current = false; });
  }, [location.pathname, user, logout, navigate]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return children;
}
