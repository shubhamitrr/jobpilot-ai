/**
 * The signature visual element of JobPilot AI — a radial "match ring" used
 * on job cards, the job detail page, and the dashboard to make the resume
 * <-> job match score instantly scannable at a glance.
 */
export default function MatchRing({ value = 0, size = 64, thickness = 6, label }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  const color =
    pct >= 85 ? '#17C7CB' : pct >= 65 ? '#5B5FEF' : pct >= 45 ? '#F5B95B' : '#FF7A6B'

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="match-ring"
        style={{
          '--ring-size': `${size}px`,
          '--ring-thickness': `${thickness}px`,
          '--ring-pct': pct,
          '--ring-color': color,
        }}
      >
        <span style={{ fontSize: size * 0.26, color: '#0F172A' }}>{pct}%</span>
      </div>
      {label && <span className="text-xs text-slate-500 font-medium">{label}</span>}
    </div>
  )
}
