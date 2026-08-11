import { PASSWORD_RULES } from '../../lib/password';

export default function PasswordChecklist({ password }) {
  const value = password || '';
  return (
    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {PASSWORD_RULES.map(rule => {
        const ok = rule.test(value);
        return (
          <div
            key={rule.key}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 13, padding: '3px 0',
            }}
          >
            <span style={{
              color: ok ? 'var(--green)' : 'var(--muted)',
              fontSize: 14, fontWeight: 700, width: 16, textAlign: 'center', flexShrink: 0,
            }}>
              {ok ? '✓' : '○'}
            </span>
            <span style={{
              color: ok ? 'var(--green)' : (value ? 'var(--red)' : 'var(--muted)'),
              fontWeight: 500,
            }}>
              {rule.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
