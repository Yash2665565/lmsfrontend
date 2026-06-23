export default function PageHeader({ title, subtitle, actions, breadcrumb, eyebrow }) {
  return (
    <div style={{ marginBottom: '26px' }}>
      {breadcrumb && (
        <nav style={{ marginBottom: '8px' }}>
          {Array.isArray(breadcrumb) ? (
            <ol style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '5px', listStyle: 'none', margin: 0, padding: 0 }}>
              {breadcrumb.map((crumb, index) => {
                const isLast = index === breadcrumb.length - 1
                return (
                  <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {index > 0 && (
                      <span style={{ fontSize: '12px', color: 'var(--faint)', userSelect: 'none' }}>/</span>
                    )}
                    <span style={{
                      fontSize: '12px',
                      color: isLast ? 'var(--muted)' : 'var(--faint)',
                      fontWeight: isLast ? 500 : 400,
                      lineHeight: 1.4,
                    }}>
                      {crumb}
                    </span>
                  </li>
                )
              })}
            </ol>
          ) : (
            <span style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.4 }}>{breadcrumb}</span>
          )}
        </nav>
      )}

      {eyebrow && (
        <p className="eyebrow" style={{ margin: '0 0 8px' }}>{eyebrow}</p>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: '26px',
            fontWeight: 500,
            color: 'var(--ink)',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            margin: 0,
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{
              fontSize: '13.5px',
              color: 'var(--muted)',
              marginTop: '5px',
              marginBottom: 0,
              lineHeight: 1.55,
            }}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
