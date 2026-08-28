import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ResumeUpload from './pages/ResumeUpload'
import ResumeAnalysis from './pages/ResumeAnalysis'
import JobsDashboard from './pages/JobsDashboard'
import JobDetails from './pages/JobDetails'
import SavedJobs from './pages/SavedJobs'
import Applications from './pages/Applications'
import Dashboard from './pages/Dashboard'
import Preferences from './pages/Preferences'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/resume" element={<ProtectedRoute><ResumeUpload /></ProtectedRoute>} />
          <Route path="/resume/analysis" element={<ProtectedRoute><ResumeAnalysis /></ProtectedRoute>} />

          <Route path="/jobs" element={<ProtectedRoute><JobsDashboard /></ProtectedRoute>} />
          <Route path="/jobs/:id" element={<ProtectedRoute><JobDetails /></ProtectedRoute>} />

          <Route path="/saved" element={<ProtectedRoute><SavedJobs /></ProtectedRoute>} />
          <Route path="/applications" element={<ProtectedRoute><Applications /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/preferences" element={<ProtectedRoute><Preferences /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  )
}
