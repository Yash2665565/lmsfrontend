import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { IconBell, IconLogout, IconChevronD } from '../ui/Icons'
import { useState } from 'react'

const NAV = [
  { to: '/student/lms',         label: 'Home',       end: true },
  { to: '/student/lms/courses', label: 'My Courses', end: false },
]

export default function LmsLayout({ children }) {
  const { user, isAdmin, isTeacher, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const portalHome = isAdmin() ? '/admin' : isTeacher() ? '/teacher' : '/student'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--canvas)', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @media (max-width: 640px) {
          .lms-bar         { padding: 0 14px !important; }
          .lms-brand       { margin-right: 14px !important; }
          .lms-brand-text  { display: none !important; }
          .lms-portal-text { display: none !important; }
          .lms-portal-link { margin-right: 8px !important; }
          .lms-bell        { display: none !important; }
          .lms-user-name   { display: none !important; }
          .lms-content     { padding: 18px 14px !important; }
        }
      `}</style>
      <header style={{ background: '#163528', position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(244,239,228,0.08)' }}>
        <div className="lms-bar" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '58px', display: 'flex', alignItems: 'center' }}>
          <Link to="/student/lms" className="lms-brand" style={{ display: 'flex', alignItems: 'center', gap: '11px', textDecoration: 'none', marginRight: '32px', flexShrink: 0 }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'linear-gradient(150deg,#2a6047,#1d4233)', border: '1px solid rgba(200,154,91,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e9d5b3', fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600, fontSize: '17px' }}>
              L
            </div>
            <div className="lms-brand-text">
              <p style={{ margin: 0, color: '#f4efe4', fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500, fontSize: '15px', lineHeight: 1.15, letterSpacing: '-0.01em' }}>Learning Portal</p>
              <p style={{ margin: 0, color: 'rgba(196,210,196,0.5)', fontSize: '10px', letterSpacing: '0.07em', textTransform: 'uppercase', marginTop: '2px' }}>EduSphere LMS</p>
            </div>
          </Link>
          <nav style={{ display: 'flex', alignItems: 'stretch', height: '58px' }}>
            {NAV.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
                display: 'inline-flex', alignItems: 'center', padding: '0 16px', fontSize: '13.5px',
                fontWeight: isActive ? 600 : 400, color: isActive ? '#fbf8f1' : 'rgba(216,225,214,0.65)',
                textDecoration: 'none', transition: 'color 0.15s',
                borderBottom: isActive ? '2px solid #c89a5b' : '2px solid transparent',
              })}>{label}</NavLink>
            ))}
          </nav>
          <div style={{ flex: 1 }} />
          <Link to={portalHome} className="lms-portal-link" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(196,210,196,0.6)', textDecoration: 'none', marginRight: '20px', fontWeight: 500, whiteSpace: 'nowrap' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            <span className="lms-portal-text">School Portal</span>
          </Link>
          <button className="lms-bell" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(196,210,196,0.6)', padding: '6px', borderRadius: '6px', marginRight: '8px', display: 'flex', alignItems: 'center' }}>
            <IconBell size={16} />
          </button>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(244,239,228,0.06)', border: '1px solid rgba(244,239,228,0.11)', borderRadius: '9px', padding: '4px 10px 4px 4px', cursor: 'pointer' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'linear-gradient(150deg,#b07a3c,#8a5e2a)', color: '#fbf8f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fraunces', Georgia, serif", fontSize: '12px', fontWeight: 600 }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="lms-user-name" style={{ color: 'rgba(244,239,228,0.88)', fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap' }}>{user?.name?.split(' ')[0] || 'User'}</span>
              <IconChevronD size={13} color="rgba(196,210,196,0.6)" />
            </button>
            {menuOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setMenuOpen(false)} />
                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 50, background: '#fff', border: '1px solid var(--line)', borderRadius: '11px', boxShadow: 'var(--shadow-lg)', minWidth: '190px', padding: '6px' }}>
                  <div style={{ padding: '8px 10px 10px', borderBottom: '1px solid var(--line-2)', marginBottom: '4px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{user?.name}</p>
                    <p style={{ fontSize: '11.5px', color: 'var(--faint)', marginTop: '2px' }}>{user?.email}</p>
                  </div>
                  <button onClick={() => { logout(); navigate('/') }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '7px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--danger)', fontWeight: 500, fontFamily: 'inherit' }}>
                    <IconLogout size={14} /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="lms-content" style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '28px 24px', boxSizing: 'border-box' }}>
        {children}
      </main>
      <footer style={{ background: '#fff', borderTop: '1px solid var(--line)', padding: '14px 24px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--faint)' }}>EduSphere LMS · Learning Management System · © {new Date().getFullYear()} EduSphere</p>
      </footer>
    </div>
  )
}
