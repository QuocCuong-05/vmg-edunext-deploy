import { useEffect, useRef } from 'react';

export default function Dialog({ isOpen, onOpenChange, children }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onOpenChange?.(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onOpenChange]);

  if (!isOpen) return null;

  return (
    <div
      onClick={() => onOpenChange?.(false)}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,.4)',
        display: 'grid', placeItems: 'center',
        padding: 24,
      }}
    >
      <div
        ref={ref}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--line)',
          boxShadow: '0 20px 60px rgba(0,0,0,.2)',
          maxWidth: 500, width: '100%',
          maxHeight: '80vh', overflow: 'auto',
          padding: 28,
          animation: 'fadeIn .15s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
