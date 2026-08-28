import { useEffect, useState } from 'react'
import { Settings2, Loader2, Mail } from 'lucide-react'
import api, { getErrorMessage } from '../services/api'
import { useToast } from '../context/ToastContext'

export default function Preferences() {
  const [form, setForm] = useState({
    target_role: '',
    location: '',
    experience_level: '',
    work_mode: '',
    minimum_match: 70,
    daily_agent_enabled: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { notify } = useToast()

  useEffect(() => {
    api.get('/preferences')
      .then(({ data }) => setForm(data))
      .catch(() => {}) // no preferences set yet — defaults are fine
      .finally(() => setLoading(false))
  }, [])

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.put('/preferences', form)
      setForm(data)
      notify('Preferences saved.', 'success')
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="flex items-center gap-2 mb-1">
        <Settings2 size={22} className="text-indigo-500" />
        <h1 className="font-display font-semibold text-3xl text-navy-900">Daily job agent</h1>
      </div>
      <p className="text-slate-500 mb-8">
        Configure your target search — JobPilot can scan for new matches daily and notify you.
      </p>

      <form onSubmit={save} className="bg-white border border-slate-200 rounded-2xl p-7 space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Target role</label>
            <input
              value={form.target_role || ''}
              onChange={(e) => setForm({ ...form, target_role: e.target.value })}
              placeholder="e.g. Data Analyst"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
            <input
              value={form.location || ''}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. India"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Experience level</label>
            <input
              value={form.experience_level || ''}
              onChange={(e) => setForm({ ...form, experience_level: e.target.value })}
              placeholder="e.g. Fresher"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Work mode</label>
            <select
              value={form.work_mode || ''}
              onChange={(e) => setForm({ ...form, work_mode: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
            >
              <option value="">Any</option>
              <option value="Remote">Remote</option>
              <option value="Onsite">Onsite</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>
        </div>

        <div>
          <label className="flex items-center justify-between text-sm font-medium text-slate-700 mb-1.5">
            Minimum match to notify
            <span className="font-mono text-indigo-600">{form.minimum_match}%</span>
          </label>
          <input
            type="range" min="0" max="100" step="5"
            value={form.minimum_match}
            onChange={(e) => setForm({ ...form, minimum_match: Number(e.target.value) })}
            className="w-full accent-indigo-600"
          />
        </div>

        <label className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 cursor-pointer">
          <input
            type="checkbox"
            checked={form.daily_agent_enabled}
            onChange={(e) => setForm({ ...form, daily_agent_enabled: e.target.checked })}
            className="w-4 h-4 accent-indigo-600"
          />
          <div>
            <p className="text-sm font-medium text-navy-900">Enable daily job agent</p>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Mail size={12} /> Scans daily and emails a report if SMTP is configured — otherwise just shows in-app notifications.
            </p>
          </div>
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-white bg-pilot-gradient hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          Save preferences
        </button>
      </form>
    </div>
  )
}
