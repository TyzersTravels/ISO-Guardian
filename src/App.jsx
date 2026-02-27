import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import LandingPage from './pages/LandingPage'
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
import Analytics from './pages/Analytics'
import ActivityTrail from './pages/ActivityTrail'
import CompanySettings from './pages/CompanySettings'
import PasswordRecovery from './pages/PasswordRecovery'
import ResetPassword from './pages/ResetPassword'
import ResellerDashboard from './pages/ResellerDashboard'
import ClientOnboarding from './pages/ClientOnboarding'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/password-recovery" element={<PasswordRecovery />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/popia" element={<POPIACompliance />} />
          <Route path="/privacy" element={<POPIACompliance />} />
          <Route path="/terms" element={<TermsOfService />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
          <Route path="/ncrs" element={<ProtectedRoute><NCRs /></ProtectedRoute>} />
          <Route path="/compliance" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
          <Route path="/audits" element={<ProtectedRoute><Audits /></ProtectedRoute>} />
          <Route path="/management-reviews" element={<ProtectedRoute><ManagementReviews /></ProtectedRoute>} />
          <Route path="/data-export" element={<ProtectedRoute><DataExport /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/activity-trail" element={<ProtectedRoute><ActivityTrail /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><CompanySettings /></ProtectedRoute>} />
          <Route path="/reseller" element={<ProtectedRoute><ResellerDashboard /></ProtectedRoute>} />
          <Route path="/client-onboarding" element={<ProtectedRoute><ClientOnboarding /></ProtectedRoute>} />

          {/* Landing */}
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
