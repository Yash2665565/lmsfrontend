import { Link } from 'react-router-dom'

/* ─── Editorial / Warm Premium portal ─────────────────────────────────────
   canvas #f4efe4 · pine #1f4b38 · brass #b07a3c · Fraunces serif display
   Role accents (warm earth tones):
     student  pine   #1f4b38
     lms      teal   #2a6056
     teacher  plum   #6b4e78
     admin    brass  #8a5e2a
   ──────────────────────────────────────────────────────────────────────── */

const PORTALS = [
  {
    role: 'student',
    eyebrow: 'Student & Parent',
    title: 'Student Portal',
    desc: 'View attendance, exam results, timetable, fee statements, and notices from the school.',
    accent: '#1f4b38', tint: '#e7efe9', line: '#c8dacd',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    role: 'lms',
    eyebrow: 'LMS — Course Access',
    title: 'Learning Portal',
    desc: 'Access course materials, submit assignments, take assessments, and track your progress.',
    accent: '#2a6056', tint: '#e3eeec', line: '#c2dcd6',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="9" y1="7" x2="15" y2="7" /><line x1="9" y1="11" x2="13" y2="11" />
      </svg>
    ),
  },
  {
    role: 'teacher',
    eyebrow: 'Teacher & Staff',
    title: 'Staff Portal',
    desc: 'Mark attendance, enter grades, manage course delivery, and review your weekly timetable.',
    accent: '#6b4e78', tint: '#efe9f0', line: '#d9cce0',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3.333 1.667 8.667 1.667 12 0v-5" />
      </svg>
    ),
  },
  {
    role: 'admin',
    eyebrow: 'School Administration',
    title: 'Admin Console',
    desc: 'Full system access — manage enrolments, staff records, timetables, academics, and reports.',
    accent: '#8a5e2a', tint: '#f4e9d6', line: '#e6d3b1',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
]

const ArrowRight = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
)

const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .ep-root {
    min-height: 100vh;
    background: #f4efe4;
    background-image: radial-gradient(1100px 480px at 50% -8%, rgba(31,75,56,0.06), transparent 70%);
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: #211e18;
    display: flex;
    flex-direction: column;
  }

  /* Nav */
  .ep-nav {
    background: #163528;
    border-bottom: 1px solid rgba(244,239,228,0.08);
    height: 56px; padding: 0 2rem;
    display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
  }
  .ep-nav-left { display: flex; align-items: center; gap: 11px; }
  .ep-logo-mark {
    width: 30px; height: 30px; border-radius: 8px;
    background: linear-gradient(150deg,#2a6047,#1d4233);
    border: 1px solid rgba(200,154,91,0.45);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    color: #e9d5b3; font-family: 'Fraunces', Georgia, serif; font-weight: 600; font-size: 15px;
  }
  .ep-logo-name { color: #f4efe4; font-family: 'Fraunces', Georgia, serif; font-size: 16px; font-weight: 500; letter-spacing: -0.01em; line-height: 1; }
  .ep-nav-divider { width: 1px; height: 15px; background: rgba(196,210,196,0.25); margin: 0 3px; }
  .ep-nav-sub { color: rgba(196,210,196,0.55); font-size: 11.5px; letter-spacing: 0.02em; }
  .ep-nav-date { color: rgba(196,210,196,0.45); font-size: 11.5px; font-variant-numeric: tabular-nums; }

  /* Hero */
  .ep-hero { padding: 64px 2rem 8px; text-align: center; }
  .ep-eyebrow {
    display: inline-block; font-size: 11px; font-weight: 600; letter-spacing: 0.14em;
    text-transform: uppercase; color: #b07a3c; margin-bottom: 16px;
  }
  .ep-hero-h1 {
    font-family: 'Fraunces', Georgia, serif;
    font-size: 44px; font-weight: 500; color: #211e18; letter-spacing: -0.025em;
    line-height: 1.08; margin-bottom: 0; font-optical-sizing: auto;
  }
  .ep-hero-rule { width: 48px; height: 2px; background: #b07a3c; margin: 18px auto 0; border-radius: 2px; }
  .ep-hero-sub { font-size: 15.5px; color: #726b5c; line-height: 1.6; max-width: 440px; margin: 14px auto 0; }

  /* Grid */
  .ep-section { flex: 1; max-width: 1060px; width: 100%; margin: 0 auto; padding: 44px 1.5rem 56px; }
  .ep-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
  @media (max-width: 960px) { .ep-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 540px) {
    .ep-grid { grid-template-columns: 1fr; }
    .ep-hero-h1 { font-size: 32px; }
    .ep-hero { padding: 44px 1.25rem 4px; }
    .ep-nav { padding: 0 1.25rem; }
    .ep-nav-divider, .ep-nav-sub { display: none; }
    .ep-section { padding: 32px 1.25rem 44px; }
    .ep-footer { padding: 14px 1.25rem; }
  }

  /* Card */
  .ep-card {
    background: #ffffff; border: 1px solid #e3dac9; border-radius: 14px;
    padding: 24px 22px 20px; display: flex; flex-direction: column;
    box-shadow: 0 1px 3px rgba(64,52,28,0.06);
    transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
    position: relative; overflow: hidden;
  }
  .ep-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: var(--card-accent); opacity: 0; transition: opacity 0.2s ease;
  }
  .ep-card:hover { box-shadow: 0 14px 38px rgba(40,32,16,0.14); transform: translateY(-3px); border-color: var(--card-line); }
  .ep-card:hover::before { opacity: 1; }

  .ep-card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; }
  .ep-icon-wrap { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ep-badge { font-size: 10px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; padding: 4px 9px; border-radius: 6px; line-height: 1.4; white-space: nowrap; }

  .ep-card-title { font-family: 'Fraunces', Georgia, serif; font-size: 19px; font-weight: 500; color: #211e18; letter-spacing: -0.015em; margin-bottom: 8px; line-height: 1.15; }
  .ep-card-desc { font-size: 12.5px; color: #726b5c; line-height: 1.65; flex: 1; }
  .ep-separator { height: 1px; background: #ede5d6; margin: 18px 0; }

  .ep-btn {
    display: flex; align-items: center; justify-content: center; gap: 7px; width: 100%;
    padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 600;
    text-decoration: none; transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, filter 0.15s ease;
    border: 1px solid transparent;
  }
  .ep-btn-primary { background: var(--card-accent); color: #fbf8f1; border-color: var(--card-accent); }
  .ep-btn-primary:hover { filter: brightness(0.92); }
  .ep-btn-secondary { background: var(--card-tint); color: var(--card-accent); border-color: var(--card-line); }
  .ep-btn-secondary:hover { background: var(--card-accent); color: #fbf8f1; border-color: var(--card-accent); }
  .ep-btn:focus-visible { outline: 2px solid var(--card-accent); outline-offset: 2px; }

  /* Info strip */
  .ep-info-strip {
    display: flex; align-items: flex-start; gap: 11px; background: #fbf8f1;
    border: 1px solid #e3dac9; border-radius: 11px; padding: 15px 18px; margin-top: 36px;
  }
  .ep-info-icon { flex-shrink: 0; margin-top: 1px; }
  .ep-info-text { font-size: 12.5px; color: #726b5c; line-height: 1.6; }
  .ep-info-text strong { color: #463f33; font-weight: 600; }

  /* Footer */
  .ep-footer { background: #163528; border-top: 1px solid rgba(244,239,228,0.08); padding: 16px 2rem; text-align: center; flex-shrink: 0; }
  .ep-footer-text { font-size: 11.5px; color: rgba(196,210,196,0.45); letter-spacing: 0.01em; }

  @media (prefers-reduced-motion: reduce) { .ep-card, .ep-btn { transition: none; } }
`

function PortalCard({ role, eyebrow, title, desc, accent, tint, line, icon, primary }) {
  return (
    <article className="ep-card" style={{ '--card-accent': accent, '--card-tint': tint, '--card-line': line }}>
      <div className="ep-card-header">
        <div className="ep-icon-wrap" style={{ background: tint, color: accent }} aria-hidden="true">{icon}</div>
        <span className="ep-badge" style={{ background: tint, color: accent }}>{eyebrow}</span>
      </div>
      <h2 className="ep-card-title">{title}</h2>
      <p className="ep-card-desc">{desc}</p>
      <div className="ep-separator" role="separator" />
      <Link to={`/login?role=${role}`} className={primary ? 'ep-btn ep-btn-primary' : 'ep-btn ep-btn-secondary'} aria-label={`Sign in to ${title}`}>
        Sign in <ArrowRight />
      </Link>
    </article>
  )
}

export default function PortalPage() {
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <>
      <style>{css}</style>
      <div className="ep-root">
        <nav className="ep-nav" role="banner">
          <div className="ep-nav-left">
            <div className="ep-logo-mark" aria-hidden="true">E</div>
            <span className="ep-logo-name">EduSphere</span>
            <div className="ep-nav-divider" aria-hidden="true" />
            <span className="ep-nav-sub">School Management System</span>
          </div>
          <time className="ep-nav-date" dateTime={new Date().toISOString().split('T')[0]}>{today}</time>
        </nav>

        <header className="ep-hero">
          <span className="ep-eyebrow">School Management System</span>
          <h1 className="ep-hero-h1">Welcome back</h1>
          <div className="ep-hero-rule" aria-hidden="true" />
          <p className="ep-hero-sub">Select your portal to sign in to your account.</p>
        </header>

        <main className="ep-section">
          <div className="ep-grid" role="list">
            {PORTALS.map((portal, i) => (
              <div key={portal.role} role="listitem">
                <PortalCard {...portal} primary={i === 0} />
              </div>
            ))}
          </div>

          <div className="ep-info-strip" role="note">
            <span className="ep-info-icon" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b07a3c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </span>
            <p className="ep-info-text">
              <strong>Credentials provided by administration.</strong>{' '}
              Your username and password are issued by the school admin office. Contact administration if you have not received your credentials or need a reset.
            </p>
          </div>
        </main>

        <footer className="ep-footer">
          <p className="ep-footer-text">&copy; {new Date().getFullYear()} EduSphere — School Management System. All rights reserved.</p>
        </footer>
      </div>
    </>
  )
}
