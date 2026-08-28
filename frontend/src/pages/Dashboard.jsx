import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Target, Bookmark, ClipboardList, ArrowRight, FileText } from 'lucide-react'
import api, { getErrorMessage } from '../services/api'
import MatchRing from '../components/MatchRing'
import { CardSkeleton } from '../components/UI'
import { useToast } from '../context/ToastContext'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { notify } = useToast()

  useEffect(() => {
    api.get('/dashboard')
      .then(({ data }) => setData(data))
      .catch((err) => notify(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="max-w-6xl mx-auto px-6 py-12 space-y-4"><CardSkeleton /><CardSkeleton /></div>
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="font-display font-semibold text-3xl text-navy-900 mb-1">Your job-search dashboard</h1>
      <p className="text-slate-500 mb-8">A daily snapshot of your search progress.</p>

      <div className="grid md:grid-cols-4 gap-5 mb-8">
        <StatTile icon={<Briefcase size={17} />} label="Total jobs found" value={data?.total_jobs_found ?? 0} />
        <StatTile icon={<Target size={17} />} label="Highly matched" value={data?.highly_matched ?? 0} tone="cyan" />
        <StatTile icon={<Bookmark size={17} />} label="Saved jobs" value={data?.saved_count ?? 0} tone="indigo" />
        <StatTile icon={<ClipboardList size={17} />} label="Applications" value={
          Object.values(data?.applications_by_status || {}).reduce((a, b) => a + b, 0)
        } tone="emerald" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Resume score */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center gap-6">
          {data?.resume_score != null ? (
            <>
              <MatchRing value={data.resume_score} size={80} thickness={7} />
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-1">Resume ATS score</p>
                <p className="font-display font-semibold text-xl text-navy-900 mb-2">{data.resume_score}/100</p>
                <Link to="/resume/analysis" className="text-sm text-indigo-600 font-medium flex items-center gap-1">
                  View full analysis <ArrowRight size={13} />
                </Link>
              </div>
            </>
          ) : (
            <div className="flex-1 text-center py-4">
              <FileText size={22} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500 mb-3">No resume analyzed yet.</p>
              <Link to="/resume" className="text-sm font-semibold text-white bg-pilot-gradient px-4 py-2 rounded-lg">Upload resume</Link>
            </div>
          )}
        </div>

        {/* Application status breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-4">Applications by status</p>
          <div className="space-y-2.5">
            {Object.entries(data?.applications_by_status || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="text-navy-700">{status}</span>
                <span className="font-mono font-semibold text-navy-900">{count}</span>
              </div>
            ))}
          </div>
          <Link to="/applications" className="text-sm text-indigo-600 font-medium flex items-center gap-1 mt-4">
            Go to tracker <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <Link to="/jobs" className="px-5 py-2.5 rounded-lg font-semibold text-white bg-pilot-gradient hover:opacity-90 transition-opacity">
          Search for more jobs
        </Link>
        <Link to="/saved" className="px-5 py-2.5 rounded-lg font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors">
          View saved jobs
        </Link>
      </div>
    </div>
  )
}

function StatTile({ icon, label, value, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    cyan: 'bg-cyan-50 text-cyan-500',
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  }
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className={`w-9 h-9 rounded-lg grid place-items-center mb-3 ${tones[tone]}`}>{icon}</div>
      <p className="font-display font-semibold text-2xl text-navy-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}
