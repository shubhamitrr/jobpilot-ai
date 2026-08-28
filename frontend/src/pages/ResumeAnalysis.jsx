import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  GraduationCap, Briefcase, Award, Target, TrendingUp, TrendingDown,
  Search, ArrowRight,
} from 'lucide-react'
import api, { getErrorMessage } from '../services/api'
import { CardSkeleton, EmptyState, Badge } from '../components/UI'
import MatchRing from '../components/MatchRing'

export default function ResumeAnalysis() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/resume/profile')
      .then(({ data }) => setProfile(data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-4">
        <CardSkeleton /><CardSkeleton />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <EmptyState
        icon={<Target size={22} />}
        title="No candidate profile yet"
        description={error || 'Upload and analyze a resume to see your profile here.'}
        action={<Link to="/resume" className="px-5 py-2.5 rounded-lg font-semibold text-white bg-pilot-gradient">Upload resume</Link>}
      />
    )
  }

  const skillGroups = [
    { label: 'Skills', items: profile.skills },
    { label: 'Programming languages', items: profile.programming_languages },
    { label: 'Tools', items: profile.tools },
  ]

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-display font-semibold text-3xl text-navy-900 mb-1">Candidate profile</h1>
          <p className="text-slate-500">{profile.name || 'Your resume, structured.'}</p>
        </div>
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white bg-pilot-gradient hover:opacity-90 transition-opacity"
        >
          <Search size={16} /> Find matching jobs <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* ATS Score card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5">
          <MatchRing value={profile.resume_score} size={80} thickness={7} />
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-1">ATS Score</p>
            <p className="font-display font-semibold text-2xl text-navy-900">{profile.resume_score}/100</p>
          </div>
        </div>

        <InfoCard icon={<GraduationCap size={16} />} label="Education" items={profile.education} />
        <InfoCard icon={<Briefcase size={16} />} label="Target roles" items={profile.target_roles} />
      </div>

      {/* Skills */}
      <Section title="Skills">
        <div className="grid md:grid-cols-3 gap-4">
          {skillGroups.map((g) => (
            <div key={g.label}>
              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-2">{g.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {g.items?.length ? g.items.map((s) => <Badge key={s} tone="indigo">{s}</Badge>) : <span className="text-sm text-slate-400">None listed</span>}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Strengths / Weaknesses */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Section title="Strengths" icon={<TrendingUp size={16} className="text-emerald-500" />}>
          <BulletList items={profile.strengths} empty="No standout strengths detected." />
        </Section>
        <Section title="Weaknesses" icon={<TrendingDown size={16} className="text-coral-400" />}>
          <BulletList items={profile.weaknesses} empty="No major weaknesses detected." />
        </Section>
      </div>

      <Section title="Missing keywords">
        <div className="flex flex-wrap gap-1.5">
          {profile.missing_keywords?.length
            ? profile.missing_keywords.map((k) => <Badge key={k} tone="amber">{k}</Badge>)
            : <span className="text-sm text-slate-400">None detected.</span>}
        </div>
      </Section>

      <Section title="Recommended roles">
        <div className="flex flex-wrap gap-1.5">
          {profile.recommended_roles?.length
            ? profile.recommended_roles.map((r) => <Badge key={r} tone="cyan">{r}</Badge>)
            : <span className="text-sm text-slate-400">None suggested.</span>}
        </div>
      </Section>

      <div className="grid md:grid-cols-2 gap-6">
        <Section title="Projects">
          <BulletList items={profile.projects} empty="No projects listed." />
        </Section>
        <Section title="Certifications" icon={<Award size={16} className="text-indigo-500" />}>
          <BulletList items={profile.certifications} empty="No certifications listed." />
        </Section>
      </div>
    </div>
  )
}

function InfoCard({ icon, label, items }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400 font-semibold mb-3">
        {icon} {label}
      </p>
      <div className="space-y-1">
        {items?.length ? items.slice(0, 3).map((i) => <p key={i} className="text-sm text-navy-800">{i}</p>) : <p className="text-sm text-slate-400">Not specified</p>}
      </div>
    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
      <h2 className="flex items-center gap-2 font-display font-semibold text-navy-900 mb-4">{icon}{title}</h2>
      {children}
    </div>
  )
}

function BulletList({ items, empty }) {
  if (!items?.length) return <p className="text-sm text-slate-400">{empty}</p>
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i} className="text-sm text-navy-800 flex gap-2">
          <span className="text-indigo-400 mt-1">•</span>
          <span>{i}</span>
        </li>
      ))}
    </ul>
  )
}
