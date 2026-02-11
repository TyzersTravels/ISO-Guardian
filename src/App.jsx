import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Documents from './pages/Documents'
import NCRs from './pages/NCRs'
import Compliance from './pages/Compliance'
import Audits from './pages/Audits'
import ManagementReviews from './pages/ManagementReviews'
import POPIACompliance from './pages/POPIACompliance'
import TermsOfService from './pages/TermsOfService'
import DataExport from './pages/DataExport'
import SuperAdminDashboard from './pages/SuperAdminDashboard'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/popia" element={<POPIACompliance />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedRoute>
                <Documents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ncrs"
            element={
              <ProtectedRoute>
                <NCRs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/compliance"
            element={
              <ProtectedRoute>
                <Compliance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audits"
            element={
              <ProtectedRoute>
                <Audits />
              </ProtectedRoute>
            }
          />
          <Route
            path="/management-reviews"
            element={
              <ProtectedRoute>
                <ManagementReviews />
              </ProtectedRoute>
            }
          />
          <Route
            path="/data-export"
            element={
              <ProtectedRoute>
                <DataExport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
