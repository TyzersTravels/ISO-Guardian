import { Navigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../contexts/AuthContext'

/**
 * Route guard that checks both authentication AND role-based access.
 * @param {string[]} allowedRoles - Roles allowed to access this route
 * @param {boolean} requireReseller - If true, user must be a reseller
 */
const RoleProtectedRoute = ({ children, allowedRoles = [], requireReseller = false }) => {
  const { user, userProfile, loading, isReseller } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          Loading...
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Wait for profile to load before checking roles
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          Loading...
        </div>
      </div>
    )
  }

  // Check reseller requirement
  if (requireReseller && !isReseller && userProfile.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(userProfile.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      {children}
    </>
  )
}

export default RoleProtectedRoute
