import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Compass, LogOut, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import NotificationsBell from './NotificationsBell'

const navItem = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
  }`

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-semibold text-lg text-navy-900">
          <span className="w-8 h-8 rounded-lg bg-pilot-gradient grid place-items-center">
            <Compass size={18} className="text-white" />
          </span>
          JobPilot <span className="text-indigo-600">AI</span>
        </Link>

        {isAuthenticated ? (
          <nav className="flex items-center gap-1">
            <NavLink to="/dashboard" className={navItem}>Dashboard</NavLink>
            <NavLink to="/jobs" className={navItem}>Jobs</NavLink>
            <NavLink to="/saved" className={navItem}>Saved</NavLink>
            <NavLink to="/applications" className={navItem}>Applications</NavLink>
            <NavLink to="/resume" className={navItem}>Resume</NavLink>
            <NavLink to="/preferences" className={navItem}>Agent</NavLink>
            <div className="w-px h-6 bg-slate-200 mx-2" />
            <NotificationsBell />
            <div className="flex items-center gap-2 pl-1 pr-2 py-1.5 rounded-lg text-sm text-slate-600">
              <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center">
                <User size={14} />
              </span>
              <span className="hidden md:inline">{user?.full_name || user?.email}</span>
            </div>
            <button
              onClick={() => { logout(); navigate('/') }}
              className="p-2 rounded-lg text-slate-500 hover:text-coral-400 hover:bg-slate-100"
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          </nav>
        ) : (
          <nav className="flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-navy-900">
              Log in
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-semibold text-white bg-pilot-gradient rounded-lg shadow-glow hover:opacity-90 transition-opacity"
            >
              Get started
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
