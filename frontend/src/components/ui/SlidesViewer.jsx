import { useState, useEffect, useRef } from 'react';
import Button from '../../components/ui/Button';

export default function SlidesViewer({ html, onComplete, completed }) {
  const [index, setIndex] = useState(0);
  const slideRef = useRef(null);

  const slides = (html || '')
    .split(/<hr\s*\/?>/i)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const count = slides.length;
  const safeIndex = Math.min(index, Math.max(0, count - 1));
  const isLast = safeIndex >= count - 1;

  const go = (step) => {
    setIndex(prev => Math.max(0, Math.min(count - 1, prev + step)));
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  if (count === 0) return null;

  return (
    <div>
      <div
        ref={slideRef}
        className="article-content"
        style={{ overflowY: 'auto', maxHeight: '70vh', padding: '4px 2px' }}
        dangerouslySetInnerHTML={{ __html: slides[safeIndex] }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
        <Button variant="ghost" size="sm" onClick={() => go(-1)} isDisabled={safeIndex === 0}>◀ Trước</Button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {slides.map((_, i) => (
            <span
              key={i}
              onClick={() => setIndex(i)}
              style={{
                width: 10, height: 10, borderRadius: '50%', cursor: 'pointer',
                background: i === safeIndex ? 'var(--red)' : 'var(--line)',
                transition: 'background .15s',
              }}
            />
          ))}
          <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 4 }}>{safeIndex + 1}/{count}</span>
        </div>

        <Button variant="ghost" size="sm" onClick={() => go(1)} isDisabled={isLast}>Sau ▶</Button>
      </div>

      {isLast && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Button variant="primary" size="md" isDisabled={completed} onClick={onComplete}>
            {completed ? '✓ Đã hoàn thành' : 'Hoàn thành bài học'}
          </Button>
        </div>
      )}
    </div>
  );
}
