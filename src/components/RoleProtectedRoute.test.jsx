import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import RoleProtectedRoute from './RoleProtectedRoute'

// Mock AuthContext
const mockAuth = {
  user: null,
  userProfile: null,
  loading: false,
  isReseller: false,
}

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
}))

const renderWithProviders = (ui) => {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </HelmetProvider>
  )
}

describe('RoleProtectedRoute', () => {
  it('shows loading spinner when auth is loading', () => {
    mockAuth.loading = true
    mockAuth.user = null
    mockAuth.userProfile = null

    renderWithProviders(
      <RoleProtectedRoute allowedRoles={['admin']}>
        <div>Protected Content</div>
      </RoleProtectedRoute>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    mockAuth.loading = false
  })

  it('redirects to /login when not authenticated', () => {
    mockAuth.user = null
    mockAuth.userProfile = null

    const { container } = renderWithProviders(
      <RoleProtectedRoute allowedRoles={['admin']}>
        <div>Protected Content</div>
      </RoleProtectedRoute>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders children when user has the correct role', () => {
    mockAuth.user = { id: '123' }
    mockAuth.userProfile = { role: 'super_admin', company_id: 'abc' }

    renderWithProviders(
      <RoleProtectedRoute allowedRoles={['super_admin']}>
        <div>Protected Content</div>
      </RoleProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('blocks user with wrong role', () => {
    mockAuth.user = { id: '123' }
    mockAuth.userProfile = { role: 'user', company_id: 'abc' }

    renderWithProviders(
      <RoleProtectedRoute allowedRoles={['super_admin', 'admin']}>
        <div>Admin Content</div>
      </RoleProtectedRoute>
    )

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })

  it('allows super_admin to access reseller routes', () => {
    mockAuth.user = { id: '123' }
    mockAuth.userProfile = { role: 'super_admin', company_id: 'abc' }
    mockAuth.isReseller = false

    renderWithProviders(
      <RoleProtectedRoute requireReseller>
        <div>Reseller Content</div>
      </RoleProtectedRoute>
    )

    expect(screen.getByText('Reseller Content')).toBeInTheDocument()
  })

  it('blocks non-reseller non-admin from reseller routes', () => {
    mockAuth.user = { id: '123' }
    mockAuth.userProfile = { role: 'user', company_id: 'abc' }
    mockAuth.isReseller = false

    renderWithProviders(
      <RoleProtectedRoute requireReseller>
        <div>Reseller Content</div>
      </RoleProtectedRoute>
    )

    expect(screen.queryByText('Reseller Content')).not.toBeInTheDocument()
  })

  it('allows reseller to access reseller routes', () => {
    mockAuth.user = { id: '123' }
    mockAuth.userProfile = { role: 'user', company_id: 'abc' }
    mockAuth.isReseller = true

    renderWithProviders(
      <RoleProtectedRoute requireReseller>
        <div>Reseller Content</div>
      </RoleProtectedRoute>
    )

    expect(screen.getByText('Reseller Content')).toBeInTheDocument()
  })
})
