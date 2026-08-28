import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  MapPin, Building2, ExternalLink, Bookmark, CheckCircle2, Sparkles,
  Loader2, ClipboardCheck,
} from 'lucide-react'
import api, { getErrorMessage } from '../services/api'
import MatchRing from '../components/MatchRing'
import { Badge, DemoBadge, CardSkeleton } from '../components/UI'
import { useToast } from '../context/ToastContext'

const ASSISTANT_KINDS = [
  { key: 'intro', label: 'Intro' },
  { key: 'why_hire', label: 'Why hire you' },
  { key: 'why_job', label: 'Why this job' },
  { key: 'cover_letter', label: 'Cover letter' },
  { key: 'summary', label: 'Resume summary' },
]

export default function JobDetails() {
  const { id } = useParams()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [improve, setImprove] = useState(null)
  const [improving, setImproving] = useState(false)
  const [assistantKind, setAssistantKind] = useState('intro')
  const [assistantContent, setAssistantContent] = useState('')
  const [generating, setGenerating] = useState(false)
  const { notify } = useToast()

  useEffect(() => {
    api.get(`/jobs/${id}`)
      .then(({ data }) => setJob(data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [id])

  const saveJob = async () => {
    try {
      await api.post(`/jobs/${id}/save`)
      notify('Job saved.', 'success')
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    }
  }

  const markApplied = async () => {
    try {
      await api.post('/applications', { job_id: id, status: 'Applied' })
      notify('Marked as applied.', 'success')
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    }
  }

  const runImprove = async () => {
    setImproving(true)
    try {
      const { data } = await api.post('/resume/improve', { job_id: id })
      setImprove(data)
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setImproving(false)
    }
  }

  const runAssistant = async (kind) => {
    setAssistantKind(kind)
    setGenerating(true)
    setAssistantContent('')
    try {
      const { data } = await api.post('/assistant/generate', { job_id: id, kind })
      setAssistantContent(data.content)
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto px-6 py-12"><CardSkeleton /></div>
  }
  if (error || !job) {
    return <div className="max-w-4xl mx-auto px-6 py-12 text-coral-400">{error || 'Job not found.'}</div>
  }

  const match = job.match

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-7 mb-6">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h1 className="font-display font-semibold text-2xl text-navy-900">{job.title}</h1>
              {job.is_demo && <DemoBadge />}
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
              <span className="flex items-center gap-1"><Building2 size={14} /> {job.company}</span>
              <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
              {job.salary && <span>{job.salary}</span>}
              {job.work_mode && <Badge tone="indigo">{job.work_mode}</Badge>}
              {job.experience_required && <Badge>{job.experience_required}</Badge>}
            </div>
          </div>
          {match && <MatchRing value={match.overall_match} size={84} thickness={7} />}
        </div>

        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-slate-100">
          {job.application_url && (
            <a
              href={job.application_url} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white bg-pilot-gradient hover:opacity-90 transition-opacity"
            >
              Apply on original website <ExternalLink size={14} />
            </a>
          )}
          <button onClick={saveJob} className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors">
            <Bookmark size={15} /> Save job
          </button>
          <button onClick={markApplied} className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors">
            <CheckCircle2 size={15} /> Mark as applied
          </button>
        </div>
      </div>

      {/* Match breakdown */}
      {match && (
        <div className="bg-white border border-slate-200 rounded-2xl p-7 mb-6">
          <h2 className="font-display font-semibold text-navy-900 mb-1">Match breakdown</h2>
          <p className="text-sm mb-5">
            <Badge tone={match.overall_match >= 85 ? 'cyan' : match.overall_match >= 65 ? 'indigo' : 'coral'}>
              {match.recommendation}
            </Badge>
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {[
              ['Skills', match.skills_match],
              ['Experience', match.experience_match],
              ['Education', match.education_match],
              ['Location', match.location_match],
              ['Role', match.role_match],
            ].map(([label, val]) => (
              <div key={label} className="text-center">
                <MatchRing value={val} size={56} />
                <p className="text-xs text-slate-500 mt-1.5">{label}</p>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-2">Matched skills</p>
              <div className="flex flex-wrap gap-1.5">
                {match.matched_skills.length ? match.matched_skills.map((s) => <Badge key={s} tone="emerald">✓ {s}</Badge>) : <span className="text-sm text-slate-400">None</span>}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-2">Missing skills</p>
              <div className="flex flex-wrap gap-1.5">
                {match.missing_skills.length ? match.missing_skills.map((s) => <Badge key={s} tone="coral">✗ {s}</Badge>) : <span className="text-sm text-slate-400">None</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      <div className="bg-white border border-slate-200 rounded-2xl p-7 mb-6">
        <h2 className="font-display font-semibold text-navy-900 mb-3">Job description</h2>
        <p className="text-sm text-navy-800 whitespace-pre-line leading-relaxed">{job.description || 'No description provided.'}</p>
        {job.required_skills?.length > 0 && (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-2">Required skills</p>
            <div className="flex flex-wrap gap-1.5">
              {job.required_skills.map((s) => <Badge key={s}>{s}</Badge>)}
            </div>
          </div>
        )}
      </div>

      {/* Resume improvement */}
      <div className="bg-white border border-slate-200 rounded-2xl p-7 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 font-display font-semibold text-navy-900">
            <Sparkles size={17} className="text-indigo-500" /> Improve resume for this job
          </h2>
          <button
            onClick={runImprove}
            disabled={improving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-pilot-gradient hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {improving && <Loader2 size={14} className="animate-spin" />} Generate suggestions
          </button>
        </div>
        {improve && (
          <div className="grid md:grid-cols-2 gap-5 text-sm">
            <ImproveBlock title="Missing keywords" items={improve.missing_keywords} />
            <ImproveBlock title="Skills to highlight" items={improve.skills_to_highlight} />
            <ImproveBlock title="Project suggestions" items={improve.project_suggestions} />
            <ImproveBlock title="Bullet improvements" items={improve.bullet_improvements} />
            <ImproveBlock title="Skills to learn" items={improve.skills_to_learn} />
          </div>
        )}
      </div>

      {/* Application assistant */}
      <div className="bg-white border border-slate-200 rounded-2xl p-7 mb-10">
        <h2 className="flex items-center gap-2 font-display font-semibold text-navy-900 mb-4">
          <ClipboardCheck size={17} className="text-indigo-500" /> Application assistant
        </h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {ASSISTANT_KINDS.map((k) => (
            <button
              key={k.key}
              onClick={() => runAssistant(k.key)}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                assistantKind === k.key ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
        <div className="bg-slate-50 rounded-xl p-5 min-h-[120px] text-sm text-navy-800 whitespace-pre-line leading-relaxed">
          {generating ? (
            <span className="flex items-center gap-2 text-slate-400"><Loader2 size={14} className="animate-spin" /> Generating…</span>
          ) : assistantContent || <span className="text-slate-400">Click a content type above to generate it, grounded in your actual resume.</span>}
        </div>
      </div>
    </div>
  )
}

function ImproveBlock({ title, items }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-2">{title}</p>
      {items?.length ? (
        <ul className="space-y-1.5">
          {items.map((i) => <li key={i} className="flex gap-2"><span className="text-indigo-400">•</span><span>{i}</span></li>)}
        </ul>
      ) : <span className="text-slate-400">None suggested.</span>}
    </div>
  )
}
