import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Compass, LogOut, User, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import NotificationsBell from './NotificationsBell'

const navItem = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
  }`

const mobileNavItem = ({ isActive }) =>
  `block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
  }`

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const links = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/jobs', label: 'Jobs' },
    { to: '/saved', label: 'Saved' },
    { to: '/applications', label: 'Applications' },
    { to: '/resume', label: 'Resume' },
    { to: '/preferences', label: 'Agent' },
  ]

  const handleLogout = () => {
    logout()
    setMobileOpen(false)
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-semibold text-lg text-navy-900 shrink-0">
          <span className="w-8 h-8 rounded-lg bg-pilot-gradient grid place-items-center">
            <Compass size={18} className="text-white" />
          </span>
          <span className="hidden sm:inline">JobPilot <span className="text-indigo-600">AI</span></span>
        </Link>

        {isAuthenticated ? (
          <>
            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} className={navItem}>{l.label}</NavLink>
              ))}
              <div className="w-px h-6 bg-slate-200 mx-2" />
              <NotificationsBell />
              <div className="flex items-center gap-2 pl-1 pr-2 py-1.5 rounded-lg text-sm text-slate-600">
                <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center">
                  <User size={14} />
                </span>
                <span className="hidden xl:inline">{user?.full_name || user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-slate-500 hover:text-coral-400 hover:bg-slate-100"
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </nav>

            {/* Mobile: bell + hamburger */}
            <div className="flex items-center gap-1 lg:hidden">
              <NotificationsBell />
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </>
        ) : (
          <>
            <nav className="hidden sm:flex items-center gap-3">
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
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 sm:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </>
        )}
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {isAuthenticated ? (
            <>
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} className={mobileNavItem} onClick={() => setMobileOpen(false)}>
                  {l.label}
                </NavLink>
              ))}
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500 border-t border-slate-100 mt-2 pt-3">
                <User size={14} /> {user?.full_name || user?.email}
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-base font-medium text-coral-400 hover:bg-slate-100"
              >
                <LogOut size={16} /> Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={mobileNavItem({ isActive: false })} onClick={() => setMobileOpen(false)}>
                Log in
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="block mx-4 mt-2 px-4 py-3 rounded-lg text-center font-semibold text-white bg-pilot-gradient"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}