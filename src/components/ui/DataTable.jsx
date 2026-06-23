import Spinner from './Spinner'

const styles = {
  wrapper: {
    overflowX: 'auto',
    width: '100%',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'auto',
  },
  thead: {
    backgroundColor: 'var(--canvas-sunk)',
    borderBottom: '1px solid var(--line)',
  },
  th: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: 'var(--muted)',
    padding: '12px 18px',
    textAlign: 'left',
    whiteSpace: 'nowrap',
  },
  td: {
    fontSize: '13.5px',
    color: 'var(--ink)',
    padding: '13px 18px',
    borderBottom: '1px solid var(--line-2)',
    verticalAlign: 'middle',
  },
  tdLastRow: {
    fontSize: '13.5px',
    color: 'var(--ink)',
    padding: '13px 18px',
    borderBottom: 'none',
    verticalAlign: 'middle',
  },
  loadingCell: {
    padding: '48px 16px',
    textAlign: 'center',
  },
  emptyCell: {
    padding: '0',
    border: 'none',
  },
  emptyInner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '56px 24px',
    gap: '10px',
  },
  emptyIcon: {
    color: 'var(--faint)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMessage: {
    fontSize: '13.5px',
    color: 'var(--faint)',
    margin: 0,
  },
}

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No records found',
  emptyIcon,
}) {
  const isLastRow = (index) => index === data.length - 1

  return (
    <div className="table-container">
      <div style={styles.wrapper}>
        <table className="data-table" style={styles.table}>
          <thead style={styles.thead}>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ ...styles.th, width: col.width ?? undefined }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} style={styles.loadingCell}>
                  <Spinner />
                </td>
              </tr>
            ) : !data.length ? (
              <tr>
                <td colSpan={columns.length} style={styles.emptyCell}>
                  <div style={styles.emptyInner}>
                    {emptyIcon && (
                      <div style={styles.emptyIcon}>{emptyIcon}</div>
                    )}
                    <p style={styles.emptyMessage}>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={row.id ?? rowIndex}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = ''
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={isLastRow(rowIndex) ? styles.tdLastRow : styles.td}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
