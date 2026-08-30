import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Compass, Loader2, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Login() {
  const { login, loading } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const res = await login(form)
    if (res.success) {
      notify('Welcome back!', 'success')
      navigate('/dashboard')
    } else {
      setError(res.error)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-16 bg-slate-50">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-card p-8">
        <div className="flex items-center gap-2 mb-8">
          <span className="w-9 h-9 rounded-lg bg-pilot-gradient grid place-items-center">
            <Compass size={18} className="text-white" />
          </span>
          <span className="font-display font-semibold text-lg">JobPilot AI</span>
        </div>

        <h1 className="font-display font-semibold text-2xl text-navy-900 mb-1">Welcome back</h1>
        <p className="text-sm text-slate-500 mb-6">Log in to see your job matches and applications.</p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-coral-400 text-sm">{error}</div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2.5 pr-11 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-white bg-pilot-gradient hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Log in
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-6 text-center">
          Don't have an account? <Link to="/register" className="text-indigo-600 font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  )
}