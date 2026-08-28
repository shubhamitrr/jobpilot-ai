import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  UploadCloud, ScanSearch, Target, ListChecks, ArrowRight, Sparkles,
  FileText, Radar, Send,
} from 'lucide-react'
import MatchRing from '../components/MatchRing'

const steps = [
  { icon: UploadCloud, title: 'Upload your resume', copy: 'Drop in a PDF or DOCX. JobPilot reads it in seconds — no manual data entry.' },
  { icon: ScanSearch, title: 'AI builds your profile', copy: 'Skills, education, experience, and target roles are extracted and scored for ATS-readiness.' },
  { icon: Radar, title: 'Agent finds real jobs', copy: 'JobPilot searches configured job sources for roles that fit your actual profile.' },
  { icon: Target, title: 'Get a transparent match score', copy: 'Every job is scored on skills, experience, education, location, and role fit — no black box.' },
]

const features = [
  { icon: FileText, title: 'ATS resume scoring', copy: 'See exactly how your resume reads to applicant tracking systems, with concrete fixes.' },
  { icon: ListChecks, title: 'Skill gap breakdown', copy: 'Know exactly which skills you match and which ones to learn next, per job.' },
  { icon: Send, title: 'Application assistant', copy: 'Draft cover letters and intros grounded strictly in your real experience — nothing invented.' },
  { icon: Sparkles, title: 'Daily job agent', copy: 'Opt in to a daily scan for new roles above your minimum match threshold.' },
]

export default function Landing() {
  const { isAuthenticated } = useAuth()
  const primaryTarget = isAuthenticated ? '/resume' : '/register'

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-900">
        <div className="absolute inset-0 bg-pilot-gradient opacity-[0.15]" />
        <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-indigo-500 blur-[120px] opacity-30" />
        <div className="absolute -bottom-32 -left-24 w-[420px] h-[420px] rounded-full bg-cyan-400 blur-[130px] opacity-20" />

        <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-28 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-cyan-400 text-xs font-semibold tracking-wide mb-6">
              <Sparkles size={13} /> AI RESUME ANALYZER + JOB SEARCH AGENT
            </span>
            <h1 className="font-display font-semibold text-4xl md:text-5xl text-white leading-[1.1] mb-6">
              Your resume, matched to real jobs — with the math shown.
            </h1>
            <p className="text-slate-300 text-lg mb-9 max-w-lg">
              JobPilot AI reads your resume, builds a candidate profile, and scores every job against it
              on skills, experience, education, location, and role fit. No guessing. No auto-apply without you.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to={primaryTarget}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-navy-900 bg-white hover:bg-slate-100 transition-colors"
              >
                Analyze my resume <ArrowRight size={16} />
              </Link>
              <Link
                to={isAuthenticated ? '/jobs' : '/register'}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white border border-white/20 hover:bg-white/10 transition-colors"
              >
                Find my jobs
              </Link>
            </div>
          </div>

          {/* Signature visual: match ring cluster mimicking a job feed */}
          <div className="relative">
            <div className="bg-white rounded-3xl shadow-2xl p-6 space-y-3 rotate-[1.5deg]">
              {[
                { title: 'Junior Data Analyst', company: 'Acme Analytics', score: 94 },
                { title: 'Business Intelligence Analyst', company: 'Northwind Corp', score: 78 },
                { title: 'Data Science Intern', company: 'Fieldstone Labs', score: 61 },
              ].map((job) => (
                <div key={job.title} className="flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="font-semibold text-navy-900 text-sm truncate">{job.title}</p>
                    <p className="text-xs text-slate-400">{job.company}</p>
                  </div>
                  <MatchRing value={job.score} size={48} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-xl mx-auto mb-14">
          <h2 className="font-display font-semibold text-3xl text-navy-900 mb-3">How the agent works</h2>
          <p className="text-slate-500">Four steps from resume to ranked, explainable job matches.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={s.title} className="relative bg-white rounded-2xl border border-slate-200 p-6">
              <span className="font-mono text-xs text-indigo-400 font-semibold">{String(i + 1).padStart(2, '0')}</span>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center my-3">
                <s.icon size={18} />
              </div>
              <h3 className="font-semibold text-navy-900 mb-1.5">{s.title}</h3>
              <p className="text-sm text-slate-500">{s.copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="font-display font-semibold text-3xl text-navy-900 mb-3">Built for the actual job hunt</h2>
            <p className="text-slate-500">Not a demo. A working analyzer, matcher, and tracker.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f) => (
              <div key={f.title} className="flex gap-4 p-6 rounded-2xl hover:bg-slate-50 transition-colors">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-pilot-gradient text-white grid place-items-center">
                  <f.icon size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-navy-900 mb-1">{f.title}</h3>
                  <p className="text-sm text-slate-500">{f.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <h2 className="font-display font-semibold text-3xl text-navy-900 mb-4">
          Stop guessing which jobs fit you.
        </h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Upload your resume and get a ranked, explainable list of matching roles in minutes.
        </p>
        <Link
          to={primaryTarget}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white bg-pilot-gradient shadow-glow hover:opacity-90 transition-opacity"
        >
          Get started free <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  )
}
