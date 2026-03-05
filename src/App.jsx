import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import RoleProtectedRoute from './components/RoleProtectedRoute'
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

function App() {
  return (
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

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
          <Route path="/ncrs" element={<ProtectedRoute><NCRs /></ProtectedRoute>} />
          <Route path="/compliance" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
          <Route path="/audits" element={<ProtectedRoute><Audits /></ProtectedRoute>} />
          <Route path="/management-reviews" element={<ProtectedRoute><ManagementReviews /></ProtectedRoute>} />
          <Route path="/data-export" element={<ProtectedRoute><DataExport /></ProtectedRoute>} />
          <Route path="/admin" element={<RoleProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></RoleProtectedRoute>} />
          <Route path="/analytics" element={<RoleProtectedRoute allowedRoles={['super_admin', 'admin']}><Analytics /></RoleProtectedRoute>} />
          <Route path="/activity-trail" element={<RoleProtectedRoute allowedRoles={['super_admin', 'admin']}><ActivityTrail /></RoleProtectedRoute>} />
          <Route path="/settings" element={<RoleProtectedRoute allowedRoles={['super_admin', 'admin']}><CompanySettings /></RoleProtectedRoute>} />
          <Route path="/reseller" element={<RoleProtectedRoute requireReseller><ResellerDashboard /></RoleProtectedRoute>} />
          <Route path="/client-onboarding" element={<RoleProtectedRoute requireReseller><ClientOnboarding /></RoleProtectedRoute>} />
          <Route path="/users" element={<RoleProtectedRoute allowedRoles={['super_admin', 'admin']}><UserManagement /></RoleProtectedRoute>} />

          {/* Landing */}
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
