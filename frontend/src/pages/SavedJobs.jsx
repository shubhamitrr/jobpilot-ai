import { useEffect, useState } from 'react'
import { Bookmark } from 'lucide-react'
import api, { getErrorMessage } from '../services/api'
import JobCard from '../components/JobCard'
import { CardSkeleton, EmptyState } from '../components/UI'
import { useToast } from '../context/ToastContext'

export default function SavedJobs() {
  const [saved, setSaved] = useState([])
  const [loading, setLoading] = useState(true)
  const { notify } = useToast()

  const load = () => {
    setLoading(true)
    api.get('/saved-jobs')
      .then(({ data }) => setSaved(data))
      .catch((err) => notify(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="font-display font-semibold text-3xl text-navy-900 mb-1">Saved jobs</h1>
      <p className="text-slate-500 mb-8">Roles you've bookmarked to revisit or apply to later.</p>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-5"><CardSkeleton /><CardSkeleton /></div>
      ) : saved.length === 0 ? (
        <EmptyState
          icon={<Bookmark size={22} />}
          title="No saved jobs yet"
          description="Save jobs from the Jobs dashboard to keep track of the ones you like."
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {saved.map((s) => <JobCard key={s.id} job={s.job} />)}
        </div>
      )}
    </div>
  )
}
