export default function Card({ children, className, style, onClick, ...rest }) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        borderRadius: 'var(--radius)',
        background: 'var(--card)',
        border: '1px solid var(--line)',
        minWidth: 0,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
