import { useNavigate } from 'react-router-dom'

export default function UnauthorizedPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center px-4">
        <div
          className="text-9xl font-black leading-none select-none"
          style={{ color: '#e2e8f0' }}
          aria-hidden="true"
        >
          403
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mt-2">Access Denied</h1>
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
