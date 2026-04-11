import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import RoleProtectedRoute from './components/RoleProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import CookieConsent from './components/CookieConsent'
import { initGA } from './lib/analytics'
import { initSentry } from './lib/sentry'

// Eagerly loaded (public, first-paint critical)
import Login from './pages/Login'
import LandingPage from './pages/LandingPage'
import Signup from './pages/Signup'
import NotFound from './pages/NotFound'

// Lazy-loaded pages (split into separate chunks)
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Documents = lazy(() => import('./pages/Documents'))
const NCRs = lazy(() => import('./pages/NCRs'))
const Compliance = lazy(() => import('./pages/Compliance'))
const Audits = lazy(() => import('./pages/Audits'))
const ManagementReviews = lazy(() => import('./pages/ManagementReviews'))
const POPIACompliance = lazy(() => import('./pages/POPIACompliance'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const DataExport = lazy(() => import('./pages/DataExport'))
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'))
const Analytics = lazy(() => import('./pages/Analytics'))
const ActivityTrail = lazy(() => import('./pages/ActivityTrail'))
const CompanySettings = lazy(() => import('./pages/CompanySettings'))
const PasswordRecovery = lazy(() => import('./pages/PasswordRecovery'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const ResellerDashboard = lazy(() => import('./pages/ResellerDashboard'))
const ClientOnboarding = lazy(() => import('./pages/ClientOnboarding'))
const UserManagement = lazy(() => import('./pages/UserManagement'))
const NotificationPreferences = lazy(() => import('./pages/NotificationPreferences'))
const CreateCompany = lazy(() => import('./pages/CreateCompany'))
const UserProfile = lazy(() => import('./pages/UserProfile'))
// const AICopilot = lazy(() => import('./pages/AICopilot')) // Hidden until launch
const AuditorInvite = lazy(() => import('./pages/AuditorInvite'))
const AuditorWorkspace = lazy(() => import('./pages/AuditorWorkspace'))
const Templates = lazy(() => import('./pages/Templates'))
const ResellerProgramme = lazy(() => import('./pages/ResellerProgramme'))
const AffiliateProgramme = lazy(() => import('./pages/AffiliateProgramme'))
const Consultation = lazy(() => import('./pages/Consultation'))
const FinancialDashboard = lazy(() => import('./pages/FinancialDashboard'))
const TemplateEditor = lazy(() => import('./pages/TemplateEditor'))
const AuditSimulator = lazy(() => import('./pages/AuditSimulator'))
const RiskRegister = lazy(() => import('./pages/RiskRegister'))
const QualityObjectives = lazy(() => import('./pages/QualityObjectives'))
const TrainingMatrix = lazy(() => import('./pages/TrainingMatrix'))
const InterestedParties = lazy(() => import('./pages/InterestedParties'))
const SupplierRegister = lazy(() => import('./pages/SupplierRegister'))
const CustomerFeedback = lazy(() => import('./pages/CustomerFeedback'))
const ImprovementRegister = lazy(() => import('./pages/ImprovementRegister'))
const CommunicationRegister = lazy(() => import('./pages/CommunicationRegister'))
const ProcessRegister = lazy(() => import('./pages/ProcessRegister'))
// const StandardsNews = lazy(() => import('./pages/StandardsNews')) // Hidden until AI credits loaded
// const ArticleDetail = lazy(() => import('./pages/ArticleDetail')) // Hidden until AI credits loaded

// Loading fallback for lazy-loaded routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0015] via-[#1a0a2e] to-[#0a001a]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-white/50 text-sm">Loading...</p>
    </div>
  </div>
)

function App() {
  useEffect(() => { initGA(); initSentry() }, [])

  return (
    <ErrorBoundary>
    <BrowserRouter>
      <ToastProvider>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/password-recovery" element={<PasswordRecovery />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/popia" element={<POPIACompliance />} />
          <Route path="/privacy" element={<POPIACompliance />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/auditor" element={<AuditorWorkspace />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reseller-programme" element={<ResellerProgramme />} />
          <Route path="/affiliate" element={<AffiliateProgramme />} />
          <Route path="/consultation" element={<Consultation />} />
          {/* Standards news pages — hidden until AI credits loaded
          <Route path="/standards" element={<StandardsNews />} />
          <Route path="/standards/iso-9001" element={<StandardsNews standard="ISO 9001" />} />
          <Route path="/standards/iso-14001" element={<StandardsNews standard="ISO 14001" />} />
          <Route path="/standards/iso-45001" element={<StandardsNews standard="ISO 45001" />} />
          <Route path="/standards/article/:slug" element={<ArticleDetail />} />
          */}

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
          {/* <Route path="/ai-copilot" element={<ProtectedRoute><AICopilot /></ProtectedRoute>} /> */}{/* Hidden until launch */}
          <Route path="/audit-connect" element={<RoleProtectedRoute allowedRoles={['super_admin', 'admin', 'lead_auditor']}><AuditorInvite /></RoleProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
          <Route path="/audit-simulator" element={<ProtectedRoute><AuditSimulator /></ProtectedRoute>} />
          <Route path="/risk-register" element={<ProtectedRoute><RiskRegister /></ProtectedRoute>} />
          <Route path="/quality-objectives" element={<ProtectedRoute><QualityObjectives /></ProtectedRoute>} />
          <Route path="/training-matrix" element={<ProtectedRoute><TrainingMatrix /></ProtectedRoute>} />
          <Route path="/interested-parties" element={<ProtectedRoute><InterestedParties /></ProtectedRoute>} />
          <Route path="/suppliers" element={<ProtectedRoute><SupplierRegister /></ProtectedRoute>} />
          <Route path="/customer-feedback" element={<ProtectedRoute><CustomerFeedback /></ProtectedRoute>} />
          <Route path="/improvements" element={<ProtectedRoute><ImprovementRegister /></ProtectedRoute>} />
          <Route path="/communications" element={<ProtectedRoute><CommunicationRegister /></ProtectedRoute>} />
          <Route path="/processes" element={<ProtectedRoute><ProcessRegister /></ProtectedRoute>} />
          <Route path="/editor/new" element={<ProtectedRoute><TemplateEditor /></ProtectedRoute>} />
          <Route path="/editor/:instanceId" element={<ProtectedRoute><TemplateEditor /></ProtectedRoute>} />
          <Route path="/finance" element={<RoleProtectedRoute allowedRoles={['super_admin']}><FinancialDashboard /></RoleProtectedRoute>} />

          {/* Landing */}
          <Route path="/" element={<LandingPage />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
    <CookieConsent />
    </ErrorBoundary>
  )
}

export default App
