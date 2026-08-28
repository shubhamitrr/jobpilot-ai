import { useEffect, useState } from 'react'
import { ClipboardList, ExternalLink } from 'lucide-react'
import api, { getErrorMessage } from '../services/api'
import { EmptyState, Badge } from '../components/UI'
import { useToast } from '../context/ToastContext'

const STATUSES = ['Saved', 'Applied', 'Assessment', 'Interview', 'Rejected', 'Selected']

const STATUS_TONE = {
  Saved: 'slate',
  Applied: 'indigo',
  Assessment: 'amber',
  Interview: 'cyan',
  Rejected: 'coral',
  Selected: 'emerald',
}

export default function Applications() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const { notify } = useToast()

  const load = () => {
    setLoading(true)
    api.get('/applications')
      .then(({ data }) => setApps(data))
      .catch((err) => notify(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (app, status) => {
    try {
      const { data } = await api.put(`/applications/${app.id}`, { status })
      setApps((prev) => prev.map((a) => (a.id === app.id ? data : a)))
      notify(`Status updated to ${status}.`, 'success')
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    }
  }

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = apps.filter((a) => a.status === s).length
    return acc
  }, {})

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="font-display font-semibold text-3xl text-navy-900 mb-1">Application tracker</h1>
      <p className="text-slate-500 mb-8">Track every application's status from saved to selected.</p>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
        {STATUSES.map((s) => (
          <div key={s} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
            <p className="font-display font-semibold text-xl text-navy-900">{counts[s]}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s}</p>
          </div>
        ))}
      </div>

      {loading ? null : apps.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={22} />}
          title="No applications yet"
          description="Mark jobs as applied from the job details page to track them here."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3 font-semibold">Job</th>
                <th className="text-left px-5 py-3 font-semibold">Company</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
                <th className="text-left px-5 py-3 font-semibold">Update</th>
                <th className="text-left px-5 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {apps.map((app) => (
                <tr key={app.id} className="border-t border-slate-100">
                  <td className="px-5 py-4 font-medium text-navy-900">{app.job.title}</td>
                  <td className="px-5 py-4 text-slate-500">{app.job.company}</td>
                  <td className="px-5 py-4"><Badge tone={STATUS_TONE[app.status]}>{app.status}</Badge></td>
                  <td className="px-5 py-4">
                    <select
                      value={app.status}
                      onChange={(e) => updateStatus(app, e.target.value)}
                      className="text-sm border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    {app.job.application_url && (
                      <a href={app.job.application_url} target="_blank" rel="noreferrer" className="text-indigo-600 flex items-center gap-1 text-sm">
                        View <ExternalLink size={13} />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
