import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import {
  IconDashboard, IconUsers, IconUser, IconGradCap, IconBook, IconCalendar,
  IconClipboard, IconChart, IconNotice, IconBuilding, IconEdit, IconLogout,
  IconBookOpen, IconFileText, IconUserPlus, IconHome, IconLayers,
} from '../ui/Icons'

/* ─── Pine-green sidebar tokens ──────────────────────────────────────────── */
const BG           = '#163528'
const BORDER       = 'rgba(244,239,228,0.09)'
const SECTION_CLR  = 'rgba(196,210,196,0.42)'
const ITEM_DEFAULT = 'rgba(216,225,214,0.72)'
const ITEM_HOVER   = '#f4efe4'
const ITEM_ACTIVE  = '#fbf8f1'
const ACTIVE_BG    = 'rgba(244,239,228,0.10)'
const ACTIVE_BAR   = '#c89a5b'   /* brass */
const HOVER_BG     = 'rgba(244,239,228,0.05)'

const s = {
  sidebar: {
    position: 'fixed',
    inset: '0 auto 0 0',
    zIndex: 50,
    width: '248px',
    background: BG,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    transition: 'transform 0.22s cubic-bezier(.4,0,.2,1)',
    borderRight: `1px solid ${BORDER}`,
    fontFamily: 'inherit',
  },

  logoArea: {
    padding: '20px 18px 18px',
    borderBottom: `1px solid ${BORDER}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  logoInner: { display: 'flex', alignItems: 'center', gap: '11px' },
  logoMark: {
    width: '36px',
    height: '36px',
    borderRadius: '9px',
    background: 'linear-gradient(150deg, #2a6047 0%, #1d4233 100%)',
    border: '1px solid rgba(200,154,91,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#e9d5b3',
    fontFamily: "'Fraunces', Georgia, serif",
    fontWeight: 600,
    fontSize: '19px',
    flexShrink: 0,
    boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
  },
  logoText: {
    color: '#f4efe4',
    fontFamily: "'Fraunces', Georgia, serif",
    fontWeight: 500,
    fontSize: '17px',
    lineHeight: 1.1,
    letterSpacing: '-0.01em',
  },
  logoSub: {
    color: 'rgba(196,210,196,0.5)',
    fontSize: '10.5px',
    marginTop: '3px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    fontWeight: 500,
  },

  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'rgba(196,210,196,0.6)', padding: '4px',
    display: 'flex', alignItems: 'center', borderRadius: '5px',
    transition: 'color 0.15s',
  },

  nav: {
    flex: 1, padding: '14px 12px',
    overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none',
  },
  section: { marginBottom: '22px' },
  sectionTitle: {
    padding: '0 11px 7px',
    fontSize: '10px',
    fontWeight: 600,
    color: SECTION_CLR,
    textTransform: 'uppercase',
    letterSpacing: '0.11em',
    userSelect: 'none',
  },

  footer: { padding: '12px 12px 16px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 },
  userCard: {
    display: 'flex', alignItems: 'center', gap: '11px',
    padding: '9px 11px', borderRadius: '9px', marginBottom: '6px',
  },
  avatar: {
    width: '34px', height: '34px', borderRadius: '9px',
    background: 'linear-gradient(150deg, #b07a3c 0%, #8a5e2a 100%)',
    color: '#fbf8f1',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: 600, flexShrink: 0, letterSpacing: '0.02em',
    fontFamily: "'Fraunces', Georgia, serif",
  },
  userName: {
    color: '#f4efe4', fontSize: '12.5px', fontWeight: 500, lineHeight: 1.3,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  userEmail: {
    color: 'rgba(196,210,196,0.5)', fontSize: '10.5px', marginTop: '1px',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  logoutBtn: {
    width: '100%', display: 'flex', alignItems: 'center', gap: '9px',
    padding: '8px 11px', borderRadius: '7px', border: 'none', cursor: 'pointer',
    background: 'transparent', color: 'rgba(196,210,196,0.7)',
    fontSize: '13px', fontWeight: 400,
    transition: 'background 0.15s, color 0.15s',
  },
}

function NavItem({ to, Icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '7px 11px',
        borderRadius: '7px',
        marginBottom: '2px',
        textDecoration: 'none',
        fontSize: '13px',
        fontWeight: isActive ? 500 : 400,
        color: isActive ? ITEM_ACTIVE : ITEM_DEFAULT,
        background: isActive ? ACTIVE_BG : 'transparent',
        transition: 'background 0.13s, color 0.13s',
        overflow: 'hidden',
      })}
      onMouseEnter={e => {
        if (e.currentTarget.getAttribute('aria-current') !== 'page') {
          e.currentTarget.style.background = HOVER_BG
          e.currentTarget.style.color = ITEM_HOVER
        }
      }}
      onMouseLeave={e => {
        if (e.currentTarget.getAttribute('aria-current') !== 'page') {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = ITEM_DEFAULT
        }
      }}
    >
      {({ isActive }) => <NavItemContent isActive={isActive} Icon={Icon} label={label} />}
    </NavLink>
  )
}

function NavItemContent({ isActive, Icon, label }) {
  return (
    <>
      {isActive && (
        <span style={{
          position: 'absolute', left: 0, top: '22%', bottom: '22%',
          width: '2.5px', background: ACTIVE_BAR, borderRadius: '0 2px 2px 0',
        }} />
      )}
      <span style={{ color: isActive ? '#d8b585' : 'inherit', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        <Icon size={15} />
      </span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </>
  )
}

function Section({ title, children }) {
  return (
    <div style={s.section}>
      <p style={s.sectionTitle}>{title}</p>
      {children}
    </div>
  )
}

export default function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin, isTeacher, isStudent, isParent, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/') }

  const initials = user?.name
    ? user.name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U'

  return (
    <>
      <style>{`
        .edusphere-sidebar { transform: translateX(-100%); }
        @media (min-width: 768px) {
          .edusphere-sidebar { transform: translateX(0) !important; position: relative !important; }
          .edusphere-close-btn { display: none !important; }
        }
        .edusphere-sidebar.open { transform: translateX(0) !important; }
        .edusphere-nav::-webkit-scrollbar { display: none; }
      `}</style>

      <div className={`edusphere-sidebar${isOpen ? ' open' : ''}`} style={s.sidebar}>
        {/* Logo */}
        <div style={s.logoArea}>
          <div style={s.logoInner}>
            <div style={s.logoMark}>E</div>
            <div>
              <p style={s.logoText}>EduSphere</p>
              <p style={s.logoSub}>School Management</p>
            </div>
          </div>
          <button
            className="edusphere-close-btn"
            onClick={onClose}
            style={s.closeBtn}
            aria-label="Close sidebar"
            onMouseEnter={e => { e.currentTarget.style.color = '#f4efe4' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(196,210,196,0.6)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav style={s.nav} className="edusphere-nav" onClick={onClose}>
          {isAdmin() && (
            <>
              <Section title="Overview">
                <NavItem to="/admin" end Icon={IconDashboard} label="Dashboard" />
              </Section>
              <Section title="LMS">
                <NavItem to="/student/lms" Icon={IconHome} label="LMS Home" />
                <NavItem to="/student/lms/courses" Icon={IconBookOpen} label="Courses" />
              </Section>
              <Section title="People">
                <NavItem to="/admin/students"   Icon={IconUser}     label="Students" />
                <NavItem to="/admin/teachers"   Icon={IconGradCap}  label="Teachers" />
                <NavItem to="/admin/enrollment" Icon={IconUserPlus} label="Enrollment" />
              </Section>
              <Section title="Academics">
                <NavItem to="/admin/academics" Icon={IconBuilding} label="Classes & Subjects" />
                <NavItem to="/admin/timetable" Icon={IconCalendar} label="Timetable" />
                <NavItem to="/admin/exams"     Icon={IconFileText} label="Exams & Marks" />
              </Section>
              <Section title="Attendance">
                <NavItem to="/admin/attendance"         Icon={IconClipboard} label="Mark Attendance" />
                <NavItem to="/admin/reports/attendance" Icon={IconChart}     label="Reports" />
              </Section>
              <Section title="Communication">
                <NavItem to="/admin/notices" Icon={IconNotice} label="Notices" />
              </Section>
            </>
          )}

          {isTeacher() && !isAdmin() && (
            <>
              <Section title="Overview">
                <NavItem to="/teacher" end Icon={IconDashboard} label="Dashboard" />
              </Section>
              <Section title="LMS">
                <NavItem to="/student/lms"         Icon={IconHome}     label="LMS Home" />
                <NavItem to="/student/lms/courses" Icon={IconBookOpen} label="Courses" />
              </Section>
              <Section title="Teaching">
                <NavItem to="/teacher/attendance" Icon={IconClipboard} label="Mark Attendance" />
                <NavItem to="/teacher/marks"      Icon={IconEdit}      label="Enter Marks" />
                <NavItem to="/teacher/timetable"  Icon={IconCalendar}  label="My Timetable" />
              </Section>
              <Section title="Reports">
                <NavItem to="/teacher/reports" Icon={IconChart} label="Attendance Report" />
              </Section>
              <Section title="Communication">
                <NavItem to="/teacher/notices" Icon={IconNotice} label="Notices" />
              </Section>
            </>
          )}

          {isStudent() && (
            <>
              <Section title="Overview">
                <NavItem to="/student" end Icon={IconDashboard} label="Dashboard" />
              </Section>
              <Section title="LMS">
                <NavItem to="/student/lms"         Icon={IconHome}     label="LMS Home" />
                <NavItem to="/student/lms/courses" Icon={IconBookOpen} label="My Courses" />
              </Section>
              <Section title="My Academics">
                <NavItem to="/student/timetable"  Icon={IconCalendar}  label="Timetable" />
                <NavItem to="/student/attendance" Icon={IconClipboard} label="My Attendance" />
                <NavItem to="/student/marks"      Icon={IconChart}     label="My Marks" />
              </Section>
              <Section title="Communication">
                <NavItem to="/student/notices" Icon={IconNotice} label="Notices" />
              </Section>
            </>
          )}

          {isParent() && (
            <>
              <Section title="Overview">
                <NavItem to="/parent" end Icon={IconDashboard} label="Dashboard" />
              </Section>
              <Section title="My Child">
                <NavItem to="/parent/attendance" Icon={IconClipboard} label="Attendance" />
                <NavItem to="/parent/report"     Icon={IconChart}     label="Report Card" />
              </Section>
              <Section title="Communication">
                <NavItem to="/parent/notices" Icon={IconNotice} label="Notices" />
              </Section>
            </>
          )}
        </nav>

        {/* User footer */}
        <div style={s.footer}>
          <div style={s.userCard}>
            <div style={s.avatar}>{initials}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={s.userName}>{user?.name || 'User'}</p>
              <p style={s.userEmail}>{user?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={s.logoutBtn}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(162,59,44,0.18)'
              e.currentTarget.style.color = '#e8a99b'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'rgba(196,210,196,0.7)'
            }}
          >
            <IconLogout size={14} />
            Sign out
          </button>
        </div>
      </div>
    </>
  )
}
