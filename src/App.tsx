import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import TimeTracker from './pages/TimeTracker'
import Reports from './pages/Reports'
import TaskManagement from './pages/ProjectManagement'
import Auth from './pages/Auth'

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { currentUser } = useAuth()

  // If no user is authenticated, show auth page
  if (!currentUser) {
    return <Auth />
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/tracker" element={
              <ProtectedRoute>
                <TimeTracker />
              </ProtectedRoute>
            } />
            <Route path="/projects" element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/management" element={
              <ProtectedRoute>
                <TaskManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
                  <p className="text-gray-600">Admin functionality will be implemented here.</p>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Settings</h1>
                  <p className="text-gray-600">Settings functionality will be implemented here.</p>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/auth" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App