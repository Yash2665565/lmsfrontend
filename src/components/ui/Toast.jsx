import { useState } from 'react'

export function useToast() {
  const [toasts, setToasts] = useState([])

  const show = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }

  return { toasts, show }
}

export function ToastContainer({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2" role="region" aria-label="Notifications">
      {toasts.map(t => (
        <div
          key={t.id}
          role="alert"
          className={
            'flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium ' +
            'animate-in slide-in-from-right-4 ' +
            (t.type === 'success' ? 'bg-green-600' : t.type === 'warning' ? 'bg-yellow-500' : 'bg-red-600')
          }
        >
          {t.type === 'success' && (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {t.type === 'error' && (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {t.type === 'warning' && (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          )}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
