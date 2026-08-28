import { useEffect, useState, useRef } from 'react'
import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const ref = useRef(null)

  const load = () => {
    api.get('/notifications').then(({ data }) => setNotifications(data)).catch(() => {})
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 60000) // poll every minute
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all')
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch {
      // non-critical
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
        title="Notifications"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-coral-400 text-white text-[10px] font-semibold grid place-items-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-navy-900">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-indigo-600 font-medium">Mark all read</button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {notifications.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No notifications yet.</p>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <div key={n.id} className={`px-4 py-3 border-b border-slate-50 text-sm ${!n.is_read ? 'bg-indigo-50/40' : ''}`}>
                  <p className="font-medium text-navy-900">{n.title}</p>
                  {n.message && <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>}
                </div>
              ))
            )}
          </div>
          <div className="px-4 py-2.5 border-t border-slate-100 text-center">
            <Link to="/preferences" onClick={() => setOpen(false)} className="text-xs text-indigo-600 font-medium">
              Configure daily agent
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
