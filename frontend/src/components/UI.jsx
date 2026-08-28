export function Badge({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    indigo: 'bg-indigo-50 text-indigo-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    coral: 'bg-red-50 text-coral-400',
    cyan: 'bg-cyan-50 text-cyan-500',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
      DEMO DATA
    </span>
  )
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
      {icon && <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 grid place-items-center mb-4">{icon}</div>}
      <h3 className="font-display font-semibold text-lg text-navy-900 mb-1.5">{title}</h3>
      <p className="text-slate-500 text-sm max-w-sm mb-5">{description}</p>
      {action}
    </div>
  )
}

export function Spinner({ size = 20 }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
      <div className="h-4 w-1/3 bg-slate-200 rounded mb-3" />
      <div className="h-3 w-1/2 bg-slate-100 rounded mb-5" />
      <div className="h-3 w-full bg-slate-100 rounded mb-2" />
      <div className="h-3 w-2/3 bg-slate-100 rounded" />
    </div>
  )
}
