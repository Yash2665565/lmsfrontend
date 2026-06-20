export default function StatCard({ label, value, icon, color = 'indigo', sub }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
  }
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={"text-lg w-9 h-9 rounded-lg flex items-center justify-center " + (colors[color] || colors.indigo)}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value ?? '—'}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}
