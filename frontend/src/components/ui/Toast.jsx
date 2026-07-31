import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type, duration) => {
    setToast({ message, type: type || 'success', key: Date.now() });
    setTimeout(() => setToast(null), duration || 3000);
  }, []);

  useEffect(() => {
    window.__vimi_toast = showToast;
    return () => { delete window.__vimi_toast; };
  }, [showToast]);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div key={toast.key} className={`toast toast-${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'success' ? '🎉' : toast.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          <span className="toast-xp">{toast.message}</span>
          <button className="toast-close" onClick={() => setToast(null)}>✕</button>
        </div>
      )}
    </ToastContext.Provider>
  );
}
