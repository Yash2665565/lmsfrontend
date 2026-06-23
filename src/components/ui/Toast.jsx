import { useState, useEffect, useRef } from 'react'

// ─── Config ──────────────────────────────────────────────────────────────────

const DISMISS_MS = 3500

const TYPE_CONFIG = {
  success: {
    bar: '#2e6b4c',
    label: 'Success',
    icon: (color) => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <polyline points="3,8.5 6.5,12 13,5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  error: {
    bar: '#a23b2c',
    label: 'Error',
    icon: (color) => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <line x1="4" y1="4" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="4" x2="4" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  warning: {
    bar: '#b07a3c',
    label: 'Warning',
    icon: (color) => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <line x1="8" y1="4.5" x2="8" y2="9.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <circle cx="8" cy="12" r="1" fill={color} />
      </svg>
    ),
  },
  info: {
    bar: '#1f4b38',
    label: 'Info',
    icon: (color) => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="4.5" r="1" fill={color} />
        <line x1="8" y1="7" x2="8" y2="12.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimestamp(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// ─── useToast ─────────────────────────────────────────────────────────────────

export function useToast() {
  const [toasts, setToasts] = useState([])

  const dismiss = (id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    )
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 300)
  }

  const show = (message, type = 'info') => {
    const id = Date.now() + Math.random()
    const timestamp = new Date()
    setToasts((prev) => [...prev, { id, message, type, timestamp, exiting: false }])
    setTimeout(() => dismiss(id), DISMISS_MS)
  }

  return { toasts, show, dismiss }
}

// ─── ToastItem ────────────────────────────────────────────────────────────────

function ToastItem({ toast, onDismiss }) {
  const [hovered, setHovered] = useState(false)
  const config = TYPE_CONFIG[toast.type] || TYPE_CONFIG.info

  const containerStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'stretch',
    gap: 0,
    background: '#ffffff',
    border: '1px solid #e3dac9',
    borderRadius: '9px',
    boxShadow: '0 8px 24px rgba(40,32,16,0.14)',
    padding: '12px 16px',
    maxWidth: '340px',
    minWidth: '260px',
    width: 'max-content',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    overflow: 'hidden',
    animation: toast.exiting
      ? 'toast-slide-out 0.3s cubic-bezier(0.4,0,1,1) forwards'
      : 'toast-slide-in 0.28s cubic-bezier(0.16,1,0.3,1) forwards',
    boxSizing: 'border-box',
  }

  const barStyle = {
    position: 'absolute',
    left: '0',
    top: '8px',
    bottom: '8px',
    width: '3px',
    background: config.bar,
    borderRadius: '2px',
  }

  const bodyStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    paddingLeft: '11px',
    width: '100%',
  }

  const iconWrapStyle = {
    flexShrink: 0,
    marginTop: '1px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const textBlockStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
    minWidth: 0,
  }

  const labelStyle = {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    lineHeight: '1.2',
  }

  const messageStyle = {
    fontSize: '13.5px',
    fontWeight: 500,
    color: 'var(--ink)',
    lineHeight: '1.4',
    wordBreak: 'break-word',
  }

  const timestampStyle = {
    fontSize: '11px',
    color: 'var(--faint)',
    marginTop: '3px',
    lineHeight: '1',
  }

  const closeBtnStyle = {
    flexShrink: 0,
    marginTop: '0',
    marginLeft: '8px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    opacity: hovered ? 1 : 0,
    transition: 'opacity 0.15s ease',
    color: 'var(--faint)',
    lineHeight: 1,
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={containerStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={barStyle} />
      <div style={bodyStyle}>
        <div style={iconWrapStyle}>
          {config.icon(config.bar)}
        </div>
        <div style={textBlockStyle}>
          <span style={labelStyle}>{config.label}</span>
          <span style={messageStyle}>{toast.message}</span>
          <span style={timestampStyle}>{formatTimestamp(toast.timestamp)}</span>
        </div>
        <button
          style={closeBtnStyle}
          onClick={() => onDismiss(toast.id)}
          aria-label="Dismiss notification"
          tabIndex={0}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <line x1="2" y1="2" x2="12" y2="12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            <line x1="12" y1="2" x2="2" y2="12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ─── ToastContainer ───────────────────────────────────────────────────────────

export function ToastContainer({ toasts, dismiss }) {
  return (
    <>
      <style>{`
        @keyframes toast-slide-in {
          from {
            opacity: 0;
            transform: translateX(calc(100% + 24px));
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes toast-slide-out {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(calc(100% + 24px));
          }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          alignItems: 'flex-end',
          pointerEvents: 'none',
        }}
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: 'all' }}>
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </>
  )
}
