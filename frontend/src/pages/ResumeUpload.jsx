import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { UploadCloud, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import api, { getErrorMessage } from '../services/api'
import { useToast } from '../context/ToastContext'

export default function ResumeUpload() {
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [uploadedResume, setUploadedResume] = useState(null)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const { notify } = useToast()

  const validExt = (name) => /\.(pdf|docx)$/i.test(name)

  const handleFile = (f) => {
    setError('')
    if (!f) return
    if (!validExt(f.name)) {
      setError('Only PDF and DOCX files are supported.')
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('File is too large. Max size is 5MB.')
      return
    }
    setFile(f)
    setUploadedResume(null)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  const doUpload = async () => {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setUploadedResume(data)
      notify('Resume uploaded successfully.', 'success')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  const doAnalyze = async () => {
    if (!uploadedResume) return
    setAnalyzing(true)
    setError('')
    try {
      await api.post(`/resume/analyze?resume_id=${uploadedResume.id}`)
      notify('Resume analyzed.', 'success')
      navigate('/resume/analysis')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <h1 className="font-display font-semibold text-3xl text-navy-900 mb-2">Upload your resume</h1>
        <p className="text-slate-500">PDF or DOCX. We'll extract the text and build your candidate profile.</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
          dragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-white hover:border-indigo-300'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-500 grid place-items-center mb-4">
          <UploadCloud size={24} />
        </div>
        <p className="font-medium text-navy-900 mb-1">Drag & drop your resume here</p>
        <p className="text-sm text-slate-400">or click to browse — PDF or DOCX, up to 5MB</p>
      </div>

      {file && !uploadedResume && (
        <div className="mt-5 flex items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <FileText size={20} className="text-indigo-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-navy-900 truncate">{file.name}</p>
              <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
          </div>
          <button
            onClick={doUpload}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white bg-pilot-gradient hover:opacity-90 transition-opacity disabled:opacity-60 shrink-0"
          >
            {uploading && <Loader2 size={14} className="animate-spin" />}
            Upload
          </button>
        </div>
      )}

      {uploadedResume && (
        <div className="mt-5 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-5 text-center">
          <CheckCircle2 size={28} className="text-emerald-500 mx-auto mb-2" />
          <p className="font-medium text-navy-900 mb-4">Resume uploaded successfully</p>
          <button
            onClick={doAnalyze}
            disabled={analyzing}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white bg-pilot-gradient hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {analyzing && <Loader2 size={16} className="animate-spin" />}
            Analyze resume
          </button>
        </div>
      )}

      {error && (
        <div className="mt-5 flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-coral-400">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
