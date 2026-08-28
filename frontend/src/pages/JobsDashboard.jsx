import { useEffect, useState } from 'react'
import { Search, SlidersHorizontal, Briefcase, AlertTriangle } from 'lucide-react'
import api, { getErrorMessage } from '../services/api'
import JobCard from '../components/JobCard'
import { CardSkeleton, EmptyState } from '../components/UI'
import { useToast } from '../context/ToastContext'

export default function JobsDashboard() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [sort, setSort] = useState('match')
  const [minMatch, setMinMatch] = useState(0)
  const [form, setForm] = useState({ title: '', location: '' })
  const { notify } = useToast()

  const loadJobs = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/jobs', { params: { sort, min_match: minMatch || undefined } })
      setJobs(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadJobs() }, [sort, minMatch])

  const runSearch = async (e) => {
    e?.preventDefault()
    setSearching(true)
    setError('')
    try {
      const { data } = await api.post('/jobs/search', {
        title: form.title || null,
        location: form.location || null,
        use_demo_if_unconfigured: true,
      })
      setJobs(data)
      const demoCount = data.filter((j) => j.is_demo).length
      if (demoCount > 0) {
        notify(`Showing ${demoCount} demo listing(s) — no live job source is configured/reachable. Configure ADZUNA_APP_ID/KEY for real jobs.`, 'info')
      } else {
        notify(`Found ${data.length} jobs.`, 'success')
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSearching(false)
    }
  }

  const saveJob = async (job) => {
    try {
      await api.post(`/jobs/${job.id}/save`)
      notify(`Saved "${job.title}"`, 'success')
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    }
  }

  const highly = jobs.filter((j) => j.match?.overall_match >= 85).length
  const good = jobs.filter((j) => j.match?.overall_match >= 65 && j.match?.overall_match < 85).length
  const low = jobs.filter((j) => j.match && j.match.overall_match < 65).length

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display font-semibold text-3xl text-navy-900 mb-1">Job matches</h1>
        <p className="text-slate-500">Search live sources and see explainable match scores against your resume.</p>
      </div>

      {/* Search form */}
      <form onSubmit={runSearch} className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Job title / role</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Data Analyst"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Location</label>
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. India, Remote"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white bg-pilot-gradient hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          <Search size={16} /> {searching ? 'Searching…' : 'Search jobs'}
        </button>
      </form>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total jobs" value={jobs.length} tone="indigo" />
        <StatCard label="Highly matched" value={highly} tone="cyan" />
        <StatCard label="Good matches" value={good} tone="emerald" />
        <StatCard label="Low matches" value={low} tone="coral" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <SlidersHorizontal size={15} /> Sort by
        </div>
        {['match', 'latest', 'location'].map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              sort === s ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {s}
          </button>
        ))}
        <div className="w-px h-5 bg-slate-200 mx-1" />
        <label className="text-sm text-slate-500">Min match:</label>
        <input
          type="range" min="0" max="100" step="5"
          value={minMatch}
          onChange={(e) => setMinMatch(Number(e.target.value))}
          className="w-32 accent-indigo-600"
        />
        <span className="text-sm font-mono text-navy-800 w-10">{minMatch}%</span>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 mb-6">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid md:grid-cols-2 gap-5">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={22} />}
          title="No jobs yet"
          description="Search above to find roles matched against your resume."
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {jobs.map((job) => <JobCard key={job.id} job={job} onSave={saveJob} />)}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, tone }) {
  const tones = {
    indigo: 'text-indigo-600',
    cyan: 'text-cyan-500',
    emerald: 'text-emerald-500',
    coral: 'text-coral-400',
  }
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-1">{label}</p>
      <p className={`font-display font-semibold text-2xl ${tones[tone]}`}>{value}</p>
    </div>
  )
}
