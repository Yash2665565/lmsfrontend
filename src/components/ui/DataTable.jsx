import Spinner from './Spinner'

export default function DataTable({ columns, data, loading, emptyMessage = 'No records found' }) {
  if (loading) return <Spinner />
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data?.length === 0 ? (
            <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-slate-400 text-sm">{emptyMessage}</td></tr>
          ) : (
            data?.map((row, i) => (
              <tr key={row.id ?? i} className="hover:bg-slate-50 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-slate-700 whitespace-nowrap">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
