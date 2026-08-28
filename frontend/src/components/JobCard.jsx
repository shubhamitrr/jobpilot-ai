import { Link } from 'react-router-dom'
import { MapPin, Building2, Bookmark, ExternalLink } from 'lucide-react'
import MatchRing from './MatchRing'
import { Badge, DemoBadge } from './UI'

export default function JobCard({ job, onSave, onApply }) {
  const match = job.match
  const matchedSkills = match?.matched_skills?.slice(0, 4) || []
  const missingSkills = match?.missing_skills?.slice(0, 3) || []

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card hover:shadow-glow hover:border-indigo-200 transition-all p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-display font-semibold text-navy-900 truncate">{job.title}</h3>
            {job.is_demo && <DemoBadge />}
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="flex items-center gap-1"><Building2 size={14} /> {job.company || 'Unknown company'}</span>
            <span className="flex items-center gap-1"><MapPin size={14} /> {job.location || 'Not specified'}</span>
          </div>
        </div>
        {match && <MatchRing value={match.overall_match} size={56} />}
      </div>

      {(matchedSkills.length > 0 || missingSkills.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {matchedSkills.map((s) => <Badge key={s} tone="emerald">✓ {s}</Badge>)}
          {missingSkills.map((s) => <Badge key={s} tone="coral">✗ {s}</Badge>)}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {job.salary && <span>{job.salary}</span>}
          {job.work_mode && <span className="capitalize">{job.work_mode}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSave?.(job)}
            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Save job"
          >
            <Bookmark size={16} />
          </button>
          <Link
            to={`/jobs/${job.id}`}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
          >
            View details
          </Link>
          {job.application_url && (
            <a
              href={job.application_url}
              target="_blank"
              rel="noreferrer"
              onClick={() => onApply?.(job)}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-pilot-gradient hover:opacity-90 transition-opacity flex items-center gap-1"
            >
              Apply <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
