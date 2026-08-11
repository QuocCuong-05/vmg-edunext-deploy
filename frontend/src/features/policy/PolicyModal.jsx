import { useEffect } from 'react';
import { PolicyContent, POLICIES } from './PolicyPage';

export default function PolicyModal({ slug, onClose }) {
  const policy = POLICIES[slug];

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!policy) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,.55)', display: 'flex',
        justifyContent: 'center', alignItems: 'flex-start',
        overflow: 'auto', padding: '60px 16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--surface)', borderRadius: 16,
        maxWidth: 720, width: '100%', padding: '32px 24px 36px',
        position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,.3)',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 12, right: 12,
            width: 36, height: 36, borderRadius: 10,
            border: 'none', background: 'var(--surface-hover)',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 18, color: 'var(--ink)',
          }}
          aria-label="Đóng"
        >
          ✕
        </button>
        <PolicyContent policy={policy} />
      </div>
    </div>
  );
}
