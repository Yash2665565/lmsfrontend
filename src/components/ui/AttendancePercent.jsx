export default function AttendancePercent({ pct }) {
  let className = 'badge-green'
  if (pct < 60) className = 'badge-red'
  else if (pct < 75) className = 'badge-yellow'

  return <span className={className}>{pct}%</span>
}
