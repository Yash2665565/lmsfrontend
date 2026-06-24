import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../../auth/AuthContext'
import { IconMenu, IconBell, IconLogout, IconChevronD } from '../ui/Icons'

// Map route segments to human-readable labels
const ROUTE_LABELS = {
  admin:      'Dashboard',
  teacher:    'Dashboard',
  student:    'Dashboard',
  parent:     'Dashboard',
  students:   'Students',
  teachers:   'Teachers',
  academics:  'Academics',
  enrollment: 'Enrollment',
  exams:      'Exams',
  attendance: 'Attendance',
  reports:    'Reports',
  notices:    'Notices',
  timetable:  'Timetable',
  marks:      'Marks Entry',
  lessons:    'Lessons',
}

function buildBreadcrumbs(pathname) {
  const parts = pathname.split('/').filter(Boolean)
  const crumbs = []
  let path = ''
  for (const part of parts) {
    path += '/' + part
    const label = ROUTE_LABELS[part]
    if (label) crumbs.push({ label, path })
  }
  return crumbs
}

function getPageTitle(pathname) {
  const parts = pathname.split('/').filter(Boolean)
  for (let i = parts.length - 1; i >= 0; i--) {
    const label = ROUTE_LABELS[parts[i]]
    if (label) return label
  }
  return 'Dashboard'
}

function getRoleLabel(user) {
  if (!user?.roles?.length) return 'User'
  const role = user.roles[0].toUpperCase()
  if (role.includes('ADMIN'))   return 'Admin'
  if (role.includes('TEACHER')) return 'Teacher'
  if (role.includes('STUDENT')) return 'Student'
  if (role.includes('PARENT'))  return 'Parent'
  return 'User'
}

function getInitials(user) {
  if (!user) return 'U'
  const name = user.name || user.username || user.email || ''
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase() || '')
    .join('') || 'U'
}

// Inline CSS for responsive rules (media queries cannot be done in inline style)
const mediaCSS = `
  @media (min-width: 768px) {
    .layout-sidebar-overlay { display: none !important; }
    .layout-hamburger        { display: none !important; }
    .layout-sidebar-drawer   {
      position: relative !important;
      transform: translateX(0) !important;
      width: 248px !important;
      flex-shrink: 0;
      z-index: auto !important;
      box-shadow: none !important;
    }
  }
  @media (max-width: 767px) {
    .layout-sidebar-drawer {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      height: 100vh !important;
      z-index: 50 !important;
      box-shadow: 4px 0 24px rgba(0,0,0,0.18) !important;
    }
  }
  /* Condense the top header on phones */
  @media (max-width: 640px) {
    .layout-header        { padding: 0 14px !important; }
    .hdr-school-badge     { display: none !important; }
    .hdr-user-text        { display: none !important; }
    .hdr-user-pill        { padding: 3px !important; border: none !important; background: transparent !important; }
  }
`

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifActive, setNotifActive] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleSignOut = () => { setMenuOpen(false); logout(); navigate('/login', { replace: true }) }

  const breadcrumbs = buildBreadcrumbs(location.pathname)
  const pageTitle   = getPageTitle(location.pathname)
  const initials    = getInitials(user)
  const roleLabel   = getRoleLabel(user)
  const displayName = user?.name || user?.username || roleLabel

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: 'var(--canvas)',
    }}>
      <style>{mediaCSS}</style>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="layout-sidebar-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            background: 'rgba(22, 53, 40, 0.42)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
          }}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className="layout-sidebar-drawer"
        style={{
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.26s cubic-bezier(0.4,0,0.2,1)',
          width: 248,
        }}
      >
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Right column: header + content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: 0,
      }}>

        {/* Sticky top header */}
        <header className="layout-header" style={{
          flexShrink: 0,
          height: 60,
          background: 'rgba(251, 248, 241, 0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          gap: 12,
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}>

          {/* Left: hamburger (mobile) + breadcrumb/title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {/* Hamburger — hidden on desktop via CSS class */}
            <button
              className="layout-hamburger"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--muted)',
                padding: '6px',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--canvas-sunk)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <IconMenu size={20} />
            </button>

            {/* Breadcrumb / title */}
            {breadcrumbs.length > 1 ? (
              <nav aria-label="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                {breadcrumbs.map((crumb, idx) => (
                  <span key={crumb.path} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {idx > 0 && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c2bba9"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    )}
                    <span style={{
                      fontFamily: idx === breadcrumbs.length - 1 ? "'Fraunces', Georgia, serif" : 'inherit',
                      fontSize: idx === breadcrumbs.length - 1 ? 16 : 13,
                      fontWeight: idx === breadcrumbs.length - 1 ? 500 : 400,
                      color: idx === breadcrumbs.length - 1 ? 'var(--ink)' : 'var(--faint)',
                      letterSpacing: idx === breadcrumbs.length - 1 ? '-0.01em' : 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 200,
                    }}>
                      {crumb.label}
                    </span>
                  </span>
                ))}
              </nav>
            ) : (
              <span style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: 18,
                fontWeight: 500,
                color: 'var(--ink)',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {pageTitle}
              </span>
            )}
          </div>

          {/* Right: school badge + notifications + user avatar pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>

            {/* School name badge */}
            <div className="hdr-school-badge" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '5px 11px',
              background: 'var(--surface)',
              borderRadius: 8,
              border: '1px solid var(--line)',
            }}>
              <div style={{
                width: 20,
                height: 20,
                borderRadius: 5,
                background: 'linear-gradient(150deg, #2a6047 0%, #1d4233 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#e9d5b3',
                fontFamily: "'Fraunces', Georgia, serif",
                fontWeight: 600,
                fontSize: 11,
                flexShrink: 0,
              }}>
                E
              </div>
              <span style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--ink-2)',
                whiteSpace: 'nowrap',
                letterSpacing: '0.01em',
              }}>
                Greenwood High
              </span>
            </div>

            {/* Notifications bell */}
            <button
              onClick={() => setNotifActive(v => !v)}
              aria-label="Notifications"
              style={{
                position: 'relative',
                background: notifActive ? 'var(--accent-tint)' : 'none',
                border: 'none',
                cursor: 'pointer',
                color: notifActive ? 'var(--accent)' : 'var(--muted)',
                padding: '7px',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                if (!notifActive) {
                  e.currentTarget.style.background = 'var(--canvas-sunk)'
                  e.currentTarget.style.color = 'var(--ink-2)'
                }
              }}
              onMouseLeave={e => {
                if (!notifActive) {
                  e.currentTarget.style.background = 'none'
                  e.currentTarget.style.color = 'var(--muted)'
                }
              }}
            >
              <IconBell size={18} />
              {/* Unread dot */}
              <span style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--brass)',
                border: '1.5px solid var(--surface-2)',
              }} aria-hidden="true" />
            </button>

            {/* User menu (avatar → dropdown with Sign out) */}
            <div style={{ position: 'relative' }}>
              <button
                className="hdr-user-pill"
                onClick={() => setMenuOpen(o => !o)}
                aria-label="Account menu"
                aria-expanded={menuOpen}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '4px 10px 4px 4px',
                  background: 'var(--surface)',
                  borderRadius: 10,
                  border: '1px solid var(--line)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  fontFamily: 'inherit',
                }}
              >
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: 'linear-gradient(150deg, #b07a3c 0%, #8a5e2a 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fbf8f1',
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontWeight: 600,
                  fontSize: 12,
                  letterSpacing: '0.02em',
                  flexShrink: 0,
                }}>
                  {initials}
                </div>
                <div className="hdr-user-text" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25, textAlign: 'left' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {displayName}
                  </span>
                  <span style={{ fontSize: 10.5, color: 'var(--faint)', whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>
                    {roleLabel}
                  </span>
                </div>
                <IconChevronD size={13} color="var(--faint)" />
              </button>

              {menuOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setMenuOpen(false)} />
                  <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 50, background: '#fff', border: '1px solid var(--line)', borderRadius: 11, boxShadow: 'var(--shadow-lg)', minWidth: 210, padding: 6 }}>
                    <div style={{ padding: '8px 10px 10px', borderBottom: '1px solid var(--line-2)', marginBottom: 4 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</p>
                      <p style={{ fontSize: 11.5, color: 'var(--faint)', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || roleLabel}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 7, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--danger)', fontWeight: 500, fontFamily: 'inherit' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-tint)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <IconLogout size={14} /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable content area */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}
