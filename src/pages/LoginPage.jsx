import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import api from '../app/axios'

const schema = z.object({ email: z.string().email('Invalid email'), password: z.string().min(1, 'Required') })

export default function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()

  // If already authenticated, redirect to the correct dashboard immediately
  if (user) {
    const roles = (user.roles || []).map(r => r.toUpperCase())
    if (roles.some(r => r.includes('ADMIN')))   return <Navigate to="/admin"   replace />
    if (roles.some(r => r.includes('TEACHER'))) return <Navigate to="/teacher" replace />
    if (roles.some(r => r.includes('STUDENT'))) return <Navigate to="/student" replace />
    if (roles.some(r => r.includes('PARENT')))  return <Navigate to="/parent"  replace />
  }
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: data => api.post('/auth/login', data).then(r => r.data),
    onSuccess: res => {
      login(res.data.token, res.data)
      const roles = (res.data.roles || []).map(r => r.toUpperCase())
      if (roles.some(r => r.includes('ADMIN'))) navigate('/admin')
      else if (roles.some(r => r.includes('TEACHER'))) navigate('/teacher')
      else if (roles.some(r => r.includes('STUDENT'))) navigate('/student')
      else if (roles.some(r => r.includes('PARENT'))) navigate('/parent')
      else navigate('/')
    }
  })

  return (
    <div className="min-h-screen w-full flex" style={{background:'linear-gradient(135deg,#1e293b 0%,#0f172a 100%)'}}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 text-white">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-lg">S</div>
          <span className="text-xl font-semibold">School SMS</span>
        </div>
        <h1 className="text-4xl font-bold leading-tight mb-4">Manage your school<br/>in one place</h1>
        <p className="text-slate-400 text-lg max-w-md">Attendance, academics, exams, reports — everything connected and consistent across every role.</p>
        <div className="mt-12 grid grid-cols-2 gap-4 max-w-sm">
          {[['Students','Track progress & attendance'],['Teachers','Manage classes & marks'],['Parents','View reports anytime'],['Admin','Full school oversight']].map(([t,d])=>(
            <div key={t} className="p-4 rounded-xl" style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)'}}>
              <p className="font-medium text-sm">{t}</p>
              <p className="text-slate-400 text-xs mt-1">{d}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Right panel */}
      <div className="flex-1 lg:flex-none lg:w-[420px] flex items-center justify-center p-8" style={{background:'#fff'}}>
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Sign in</h2>
            <p className="text-slate-500 text-sm mt-1">Enter your credentials to continue</p>
          </div>
          <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input type="email" {...register('email')} placeholder="you@school.edu"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input type="password" {...register('password')} placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            {mutation.isError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                <p className="text-red-600 text-sm">{mutation.error?.response?.data?.message || 'Invalid email or password'}</p>
              </div>
            )}
            <button type="submit" disabled={mutation.isPending}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed mt-2">
              {mutation.isPending ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
