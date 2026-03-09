import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import RoleProtectedRoute from './components/RoleProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
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
import UserManagement from './pages/UserManagement'
import NotificationPreferences from './pages/NotificationPreferences'
import CreateCompany from './pages/CreateCompany'
import UserProfile from './pages/UserProfile'
import NotFound from './pages/NotFound'
import AICopilot from './pages/AICopilot'
import AuditorInvite from './pages/AuditorInvite'
import AuditorWorkspace from './pages/AuditorWorkspace'
import CookieConsent from './components/CookieConsent'

function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <ToastProvider>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/password-recovery" element={<PasswordRecovery />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/popia" element={<POPIACompliance />} />
          <Route path="/privacy" element={<POPIACompliance />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/auditor" element={<AuditorWorkspace />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
          <Route path="/ncrs" element={<ProtectedRoute><NCRs /></ProtectedRoute>} />
          <Route path="/compliance" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
          <Route path="/audits" element={<ProtectedRoute><Audits /></ProtectedRoute>} />
          <Route path="/management-reviews" element={<ProtectedRoute><ManagementReviews /></ProtectedRoute>} />
          <Route path="/data-export" element={<ProtectedRoute><DataExport /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationPreferences /></ProtectedRoute>} />
          <Route path="/activity-trail" element={<ProtectedRoute><ActivityTrail /></ProtectedRoute>} />
          <Route path="/admin" element={<RoleProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></RoleProtectedRoute>} />
          <Route path="/analytics" element={<RoleProtectedRoute allowedRoles={['super_admin', 'admin']}><Analytics /></RoleProtectedRoute>} />
          <Route path="/settings" element={<RoleProtectedRoute allowedRoles={['super_admin', 'admin']}><CompanySettings /></RoleProtectedRoute>} />
          <Route path="/reseller" element={<RoleProtectedRoute requireReseller><ResellerDashboard /></RoleProtectedRoute>} />
          <Route path="/client-onboarding" element={<RoleProtectedRoute requireReseller><ClientOnboarding /></RoleProtectedRoute>} />
          <Route path="/users" element={<RoleProtectedRoute allowedRoles={['super_admin', 'admin']}><UserManagement /></RoleProtectedRoute>} />
          <Route path="/create-company" element={<RoleProtectedRoute allowedRoles={['super_admin']}><CreateCompany /></RoleProtectedRoute>} />
          <Route path="/ai-copilot" element={<ProtectedRoute><AICopilot /></ProtectedRoute>} />
          <Route path="/audit-connect" element={<RoleProtectedRoute allowedRoles={['super_admin', 'admin', 'lead_auditor']}><AuditorInvite /></RoleProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />

          {/* Landing */}
          <Route path="/" element={<LandingPage />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
    <CookieConsent />
    </ErrorBoundary>
  )
}

export default App
