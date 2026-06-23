import { useEffect } from 'react'
import { IconX } from './Icons'

const MAX_WIDTHS = { sm: '400px', md: '520px', lg: '680px', xl: '860px' }

export default function Modal({ open, onClose, title, children, size = 'md', footer }) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <style>{`
        @keyframes modalSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 60,
          background: 'rgba(33, 30, 24, 0.42)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
        onClick={onClose}
      >
        {/* Sheet */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          style={{
            position: 'relative',
            background: '#ffffff',
            borderRadius: '13px',
            boxShadow: '0 28px 56px -12px rgba(40,32,16,0.32), 0 0 0 1px rgba(227,218,201,0.8)',
            width: '100%',
            maxWidth: MAX_WIDTHS[size] || MAX_WIDTHS.md,
            maxHeight: 'calc(100vh - 48px)',
            display: 'flex',
            flexDirection: 'column',
            animation: 'modalSlideIn 180ms ease-out',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '17px 22px',
              borderBottom: '1px solid var(--line-2)',
              flexShrink: 0,
            }}
          >
            <h2
              id="modal-title"
              style={{
                margin: 0,
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: '17px',
                fontWeight: 500,
                color: 'var(--ink)',
                letterSpacing: '-0.01em',
                lineHeight: 1.35,
              }}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--faint)',
                padding: '4px',
                borderRadius: '6px',
                transition: 'background 0.15s, color 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--canvas-sunk)'
                e.currentTarget.style.color = 'var(--ink-2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none'
                e.currentTarget.style.color = 'var(--faint)'
              }}
            >
              <IconX size={16} />
            </button>
          </div>

          {/* Body */}
          <div
            style={{
              padding: '20px',
              overflowY: 'auto',
              flex: 1,
            }}
          >
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div
              style={{
                padding: '15px 22px',
                borderTop: '1px solid var(--line-2)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                flexShrink: 0,
              }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
