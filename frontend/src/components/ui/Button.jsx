export default function Button({ variant, size, isDisabled, label, children, onClick, style, type, href, target, rel }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    fontWeight: 700,
    fontSize: size === 'sm' ? 12 : 13,
    padding: size === 'sm' ? '8px 14px' : '12px 22px',
    border: 'none',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.5 : 1,
    transition: 'all .15s',
    lineHeight: 1.3,
    whiteSpace: 'nowrap',
    ...(variant === 'ghost'
      ? { background: 'none', color: 'var(--ink)' }
      : { background: 'var(--red)', color: '#fff' }
    ),
    ...style,
  };

  if (href) {
    return <a href={href} target={target} rel={rel} style={base} onClick={onClick}>{label || children}</a>;
  }

  return (
    <button type={type || 'button'} style={base} onClick={onClick} disabled={isDisabled}>
      {label || children}
    </button>
  );
}
