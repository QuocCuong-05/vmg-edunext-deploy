import { PASSWORD_RULES } from '../../lib/password';

export default function PasswordChecklist({ password }) {
  const value = password || '';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
      {PASSWORD_RULES.map(rule => {
        const ok = rule.test(value);
        return (
          <div key={rule.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span style={{ color: ok ? 'var(--green)' : 'var(--muted)', flexShrink: 0, fontWeight: 700 }}>
              {ok ? '✓' : '○'}
            </span>
            <span style={{ color: ok ? 'var(--green)' : (value ? 'var(--red)' : 'var(--muted)') }}>
              {rule.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
