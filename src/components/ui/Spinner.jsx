const STYLE = `@keyframes _spin{to{transform:rotate(360deg)}}`;

function SpinnerSVG({ size }) {
  const r = 10;
  const stroke = 2.5;
  // Arc: quarter-circle path from top, sweeping clockwise
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ animation: '_spin 0.75s linear infinite', display: 'block', flexShrink: 0 }}
    >
      <style>{STYLE}</style>
      {/* Warm track */}
      <circle
        cx="12"
        cy="12"
        r={r}
        stroke="#e3dac9"
        strokeWidth={stroke}
      />
      {/* Pine spinning arc — quarter-circle */}
      <path
        d="M12 2 a10 10 0 0 1 10 10"
        stroke="#1f4b38"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Spinner({ size = 28 }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '32px',
      }}
    >
      <SpinnerSVG size={size} />
    </div>
  );
}

export function SpinnerInline({ size = 16 }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      style={{ display: 'inline-flex', alignItems: 'center' }}
    >
      <SpinnerSVG size={size} />
    </span>
  );
}
