/* Restraint over rainbow: every KPI icon uses one calm pine chip.
   Colour is reserved for genuinely semantic states (trend, data). */
export default function StatCard({ label, value, Icon, icon, sub, trend }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      padding: '22px 22px 20px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          margin: 0,
        }}>
          {label}
        </p>
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: '#f1ece1', color: 'var(--muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {Icon ? <Icon size={17} /> : <span style={{ fontSize: '16px', lineHeight: 1 }}>{icon}</span>}
        </div>
      </div>

      {/* Value — serif display numerals, the focal point */}
      <p style={{
        fontFamily: "'Fraunces', Georgia, serif",
        fontSize: '36px',
        fontWeight: 500,
        color: 'var(--ink)',
        letterSpacing: '-0.02em',
        lineHeight: 1.02,
        marginTop: '18px',
        marginBottom: 0,
        fontOpticalSizing: 'auto',
        fontVariantNumeric: 'tabular-nums lining-nums',
      }}>
        {value ?? <span style={{ color: 'var(--disabled)' }}>—</span>}
      </p>

      {sub && (
        <p style={{ fontSize: '12px', color: 'var(--faint)', marginTop: '6px', marginBottom: 0 }}>
          {sub}
        </p>
      )}

      {trend !== undefined && trend !== null && (
        <p style={{
          fontSize: '11.5px',
          fontWeight: 500,
          color: trend > 0 ? 'var(--success)' : 'var(--danger)',
          marginTop: '8px',
          marginBottom: 0,
        }}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)} this month
        </p>
      )}
    </div>
  )
}
