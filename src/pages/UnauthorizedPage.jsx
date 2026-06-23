import { useNavigate } from 'react-router-dom'

export default function UnauthorizedPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center px-4">
        <div
          className="leading-none select-none"
          style={{ color: 'var(--line)', fontFamily: "'Fraunces', Georgia, serif", fontSize: '120px', fontWeight: 600 }}
          aria-hidden="true"
        >
          403
        </div>
        <h1 className="text-2xl mt-2" style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.02em' }}>Access Denied</h1>
        <p className="text-slate-500 mt-2 max-w-xs mx-auto">
          You don&apos;t have permission to view this page.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="btn-primary mt-6"
        >
          Go Back
        </button>
      </div>
    </div>
  )
}
