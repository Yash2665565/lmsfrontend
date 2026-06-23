import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Navigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import api from '../app/axios'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

const ROLES = {
  student: {
    label: 'Student Portal',
    hint: 'Access your academic records, timetable, and attendance.',
    color: '#1f4b38',
    features: ['Attendance Records', 'Exam Results', 'Timetable', 'Notices'],
  },
  lms: {
    label: 'Learning Portal',
    hint: 'Access course materials, assignments, and your learning progress.',
    color: '#2a6056',
    features: ['Course Materials', 'Assignments', 'Tests & Quizzes', 'Progress Tracking'],
  },
  teacher: {
    label: 'Staff Portal',
    hint: 'Manage attendance, marks, and course delivery.',
    color: '#6b4e78',
    features: ['Mark Attendance', 'Enter Marks', 'My Timetable', 'Course Content'],
  },
  admin: {
    label: 'Admin Portal',
    hint: 'Full school management system access.',
    color: '#8a5e2a',
    features: ['Student Management', 'Staff Management', 'Academic Settings', 'Reports'],
  },
}

const ROLE_DISPLAY_NAMES = {
  student: 'Student / Parent',
  teacher: 'Teacher / Staff',
  admin: 'Administration',
  lms: 'Learning',
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(233,213,179,0.85)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'lp-spin 0.75s linear infinite', flexShrink: 0 }}>
      <path d="M21 12A9 9 0 0012 3" />
    </svg>
  )
}

export default function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const role = params.get('role') ?? 'student'
  const meta = ROLES[role] ?? ROLES.student

  if (user) {
    const roles = (user.roles || []).map(r => r.toUpperCase())
    if (roles.some(r => r.includes('ADMIN')))   return <Navigate to="/admin"   replace />
    if (roles.some(r => r.includes('TEACHER'))) return <Navigate to="/teacher" replace />
    if (roles.some(r => r.includes('STUDENT'))) return <Navigate to="/student" replace />
    if (roles.some(r => r.includes('PARENT')))  return <Navigate to="/parent"  replace />
  }

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const PORTAL_ACCESS = {
    student: r => r.includes('STUDENT') || r.includes('PARENT'),
    teacher: r => r.includes('TEACHER'),
    admin:   r => r.includes('ADMIN'),
    lms:     ()  => true,
  }

  const mutation = useMutation({
    mutationFn: data => api.post('/auth/login', data).then(r => r.data),
    onSuccess: res => {
      const roles = (res.data.roles || []).map(r => r.toUpperCase())
      const checker = PORTAL_ACCESS[role] ?? PORTAL_ACCESS.student
      const allowed = roles.some(checker)

      if (!allowed) {
        const portalNames = { student: 'Student', teacher: 'Teacher / Staff', admin: 'Administration' }
        throw Object.assign(
          new Error(`This account does not have ${portalNames[role] || role} access. Please use the correct login portal.`),
          { isPortalMismatch: true }
        )
      }

      login(res.data.token, res.data)
      if (roles.some(r => r.includes('ADMIN'))) navigate('/admin')
      else if (roles.some(r => r.includes('TEACHER'))) navigate('/teacher')
      else if (roles.some(r => r.includes('STUDENT'))) navigate('/student')
      else if (roles.some(r => r.includes('PARENT'))) navigate('/parent')
      else navigate('/')
    },
  })

  const accentHex = meta.color
  const accentBg  = accentHex + '16'
  const accentBrd = accentHex + '33'

  return (
    <>
      <style>{`
        @keyframes lp-spin { to { transform: rotate(360deg); } }
        @keyframes lp-fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .lp-root {
          min-height: 100vh; display: flex;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #f4efe4;
        }
        /* ── Left panel — deep pine ── */
        .lp-left {
          flex: 0 0 44%;
          background: linear-gradient(165deg, #122b21 0%, #163528 52%, #1d4233 100%);
          display: flex; flex-direction: column; position: relative; overflow: hidden;
        }
        .lp-left::before {
          content: ''; position: absolute; inset: 0;
          background-image: radial-gradient(rgba(233,213,179,0.06) 1px, transparent 1px);
          background-size: 26px 26px; pointer-events: none;
        }
        .lp-orb-tr {
          position: absolute; top: -120px; right: -100px; width: 380px; height: 380px; border-radius: 50%;
          background: radial-gradient(circle, rgba(176,122,60,0.20) 0%, transparent 70%); pointer-events: none;
        }
        .lp-orb-bl {
          position: absolute; bottom: -140px; left: -80px; width: 340px; height: 340px; border-radius: 50%;
          background: radial-gradient(circle, rgba(42,96,71,0.5) 0%, transparent 70%); pointer-events: none;
        }
        .lp-left-inner {
          position: relative; z-index: 1; flex: 1; display: flex; flex-direction: column;
          padding: 44px 48px; animation: lp-fade-up 0.45s ease-out both;
        }
        .lp-brand { display: flex; align-items: center; gap: 12px; text-decoration: none; }
        .lp-logomark {
          width: 40px; height: 40px; border-radius: 11px;
          background: linear-gradient(150deg, #2a6047, #1d4233);
          border: 1px solid rgba(200,154,91,0.45);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Fraunces', Georgia, serif; font-weight: 600; font-size: 20px; color: #e9d5b3; flex-shrink: 0;
        }
        .lp-brand-name { display: flex; flex-direction: column; gap: 2px; }
        .lp-brand-title { font-family: 'Fraunces', Georgia, serif; font-size: 17px; font-weight: 500; color: #f4efe4; line-height: 1; letter-spacing: -0.01em; }
        .lp-brand-sub { font-size: 10.5px; color: rgba(196,210,196,0.5); line-height: 1; letter-spacing: 0.05em; text-transform: uppercase; }
        .lp-content { flex: 1; display: flex; flex-direction: column; justify-content: center; margin-top: 52px; }
        .lp-portal-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.13em; text-transform: uppercase; color: #c89a5b; margin-bottom: 14px; }
        .lp-portal-heading {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 48px; font-weight: 500; color: #f4efe4; letter-spacing: -0.03em;
          line-height: 1.05; margin: 0 0 18px; font-optical-sizing: auto;
        }
        .lp-portal-hint { font-size: 14px; color: rgba(216,225,214,0.62); line-height: 1.7; max-width: 320px; margin: 0 0 38px; }
        .lp-features { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; max-width: 350px; }
        .lp-pill {
          display: flex; align-items: center; gap: 9px; padding: 9px 13px; border-radius: 8px;
          background: rgba(244,239,228,0.06); border: 1px solid rgba(244,239,228,0.11);
          font-size: 12.5px; color: rgba(216,225,214,0.82); line-height: 1.3;
        }
        .lp-footer {
          position: relative; z-index: 1; padding: 18px 48px;
          border-top: 1px solid rgba(244,239,228,0.08);
          display: flex; align-items: center; justify-content: space-between;
        }
        .lp-footer-text { font-size: 11.5px; color: rgba(196,210,196,0.35); letter-spacing: 0.01em; }
        /* ── Right panel ── */
        .lp-right { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 24px; background: #f4efe4; }
        .lp-form-wrap { width: 100%; max-width: 392px; animation: lp-fade-up 0.35s ease-out 0.05s both; }
        .lp-back {
          display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500;
          color: #726b5c; text-decoration: none; margin-bottom: 28px; transition: color 0.12s;
        }
        .lp-back:hover { color: #211e18; }
        .lp-card {
          background: #ffffff; border: 1px solid #e3dac9; border-radius: 14px;
          box-shadow: 0 8px 30px rgba(40,32,16,0.10), 0 1px 3px rgba(40,32,16,0.05);
          padding: 34px; border-top: 3px solid var(--lp-role-color);
        }
        .lp-role-badge {
          display: inline-flex; align-items: center; gap: 7px; padding: 5px 11px; border-radius: 7px;
          font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 22px;
        }
        .lp-role-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .lp-heading {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 25px; font-weight: 500; color: #211e18; letter-spacing: -0.02em; margin: 0 0 5px; line-height: 1.2;
        }
        .lp-sub { font-size: 13.5px; color: #726b5c; margin: 0 0 26px; }
        .lp-field { margin-bottom: 16px; }
        .lp-field:last-of-type { margin-bottom: 20px; }
        .lp-submit {
          width: 100%; padding: 11px 16px; border-radius: 8px; border: none;
          font-size: 14px; font-weight: 600; color: #fbf8f1; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: filter 0.15s; font-family: inherit; letter-spacing: 0.01em; background: var(--lp-role-color);
        }
        .lp-submit:hover:not(:disabled) { filter: brightness(1.12); }
        .lp-submit:disabled { opacity: 0.65; cursor: not-allowed; }
        .lp-submit:focus-visible { outline: 2px solid var(--lp-role-color); outline-offset: 2px; }
        .lp-error {
          display: flex; align-items: flex-start; gap: 9px; padding: 11px 13px;
          background: #f6e6e0; border: 1px solid #e6c8bf; border-radius: 8px; margin-bottom: 16px;
          animation: lp-fade-up 0.2s ease-out both;
        }
        .lp-error p { margin: 0; font-size: 13px; color: #a23b2c; line-height: 1.5; }
        .lp-switcher { margin-top: 22px; }
        .lp-switcher-label { font-size: 11.5px; color: #9c9482; text-align: center; margin-bottom: 10px; }
        .lp-switcher-pills { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
        .lp-role-link {
          padding: 5px 14px; border-radius: 7px; font-size: 12px; font-weight: 500;
          text-decoration: none; border: 1px solid; transition: all 0.12s; white-space: nowrap;
        }
        @media (max-width: 919px) { .lp-left { display: none; } }
        @media (prefers-reduced-motion: reduce) {
          .lp-left-inner, .lp-form-wrap { animation: none; }
          .lp-submit { transition: none; }
        }
      `}</style>

      <div className="lp-root" style={{ '--lp-role-color': accentHex }}>

        {/* Left panel */}
        <div className="lp-left">
          <div className="lp-orb-tr" />
          <div className="lp-orb-bl" />

          <div className="lp-left-inner">
            <Link to="/" className="lp-brand">
              <div className="lp-logomark">E</div>
              <div className="lp-brand-name">
                <span className="lp-brand-title">EduSphere</span>
                <span className="lp-brand-sub">School Management System</span>
              </div>
            </Link>

            <div className="lp-content">
              <p className="lp-portal-eyebrow">Current portal</p>
              <h1 className="lp-portal-heading">{meta.label}</h1>
              <p className="lp-portal-hint">{meta.hint}</p>
              <div className="lp-features">
                {meta.features.map(f => (
                  <div key={f} className="lp-pill"><CheckIcon />{f}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="lp-footer">
            <span className="lp-footer-text">Managed by School Administration</span>
          </div>
        </div>

        {/* Right panel */}
        <div className="lp-right">
          <div className="lp-form-wrap">
            <Link to="/" className="lp-back">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back to portal
            </Link>

            <div className="lp-card">
              <div className="lp-role-badge" style={{ background: accentBg, border: `1px solid ${accentBrd}`, color: accentHex }}>
                <span className="lp-role-dot" style={{ background: accentHex }} />
                {ROLE_DISPLAY_NAMES[role] ?? meta.label}
              </div>

              <h2 className="lp-heading">Sign in to your account</h2>
              <p className="lp-sub">Enter your credentials to continue</p>

              <form onSubmit={handleSubmit(data => mutation.mutate(data))} noValidate>
                <div className="lp-field">
                  <label className="label" htmlFor="lp-email">Email address</label>
                  <input
                    id="lp-email" type="email" {...register('email')}
                    placeholder="you@school.edu" className="input"
                    onFocus={e => { e.target.style.borderColor = accentHex; e.target.style.boxShadow = `0 0 0 3px ${accentHex}1f` }}
                    onBlur={e => { e.target.style.borderColor = ''; e.target.style.boxShadow = '' }}
                    aria-invalid={errors.email ? 'true' : undefined}
                  />
                  {errors.email && <span className="field-error" role="alert">{errors.email.message}</span>}
                </div>

                <div className="lp-field">
                  <label className="label" htmlFor="lp-password">Password</label>
                  <input
                    id="lp-password" type="password" {...register('password')}
                    placeholder="••••••••" className="input"
                    onFocus={e => { e.target.style.borderColor = accentHex; e.target.style.boxShadow = `0 0 0 3px ${accentHex}1f` }}
                    onBlur={e => { e.target.style.borderColor = ''; e.target.style.boxShadow = '' }}
                    aria-invalid={errors.password ? 'true' : undefined}
                  />
                  {errors.password && <span className="field-error" role="alert">{errors.password.message}</span>}
                </div>

                {mutation.isError && (
                  <div className="lp-error" role="alert">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a23b2c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                      <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                    </svg>
                    <p>
                      {mutation.error?.isPortalMismatch
                        ? mutation.error.message
                        : mutation.error?.response?.data?.message || 'Invalid email or password. Check your credentials and try again.'}
                    </p>
                  </div>
                )}

                <button type="submit" disabled={mutation.isPending} className="lp-submit">
                  {mutation.isPending ? (<><SpinnerIcon />Signing in…</>) : 'Sign in'}
                </button>
              </form>
            </div>

            <div className="lp-switcher">
              <p className="lp-switcher-label">Sign in to a different portal</p>
              <div className="lp-switcher-pills">
                {Object.entries(ROLES).map(([r, m]) => {
                  const isActive = role === r
                  return (
                    <Link
                      key={r}
                      to={`/login?role=${r}`}
                      className="lp-role-link"
                      style={{
                        background: isActive ? m.color : '#fff',
                        color: isActive ? '#fbf8f1' : '#726b5c',
                        borderColor: isActive ? m.color : '#e3dac9',
                      }}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </Link>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
