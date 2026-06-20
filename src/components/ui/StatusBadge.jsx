const statusMap = {
  PRESENT: 'badge-green',
  ABSENT: 'badge-red',
  LATE: 'badge-yellow',
  EXCUSED: 'badge-blue',
  HALF_DAY: 'badge-yellow',
  ACTIVE: 'badge-green',
  TRANSFERRED: 'badge-yellow',
  GRADUATED: 'badge-blue',
}

export default function StatusBadge({ status }) {
  const className = statusMap[status] || 'badge-gray'
  return <span className={className}>{status}</span>
}
