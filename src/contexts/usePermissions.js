import { useAuth } from './AuthContext'

// Complete permissions system
export const usePermissions = () => {
  const { userProfile } = useAuth()
  
  if (!userProfile) return { canView: () => false, canEdit: () => false, canDelete: () => false }

  const role = userProfile.role

  // Define complete permissions by role
  const permissions = {
    Super_Admin: {
      documents: { view: true, create: true, edit: true, delete: true, archive: true },
      ncrs: { view: true, create: true, edit: true, delete: true, archive: true },
      audits: { view: true, create: true, edit: true, delete: true, archive: true },
      compliance: { view: true, create: true, edit: true, delete: false, archive: false },
      management_reviews: { view: true, create: true, edit: true, delete: true, archive: true },
      analytics: { view: true },
      users: { view: true, create: true, edit: true, delete: true },
      companies: { view: true, create: true, edit: true, delete: true },
      standards: ['ISO_9001', 'ISO_14001', 'ISO_45001']
    },
    
    Reseller: {
      documents: { view: true, create: true, edit: true, delete: false, archive: true },
      ncrs: { view: true, create: true, edit: true, delete: false, archive: false },
      audits: { view: true, create: true, edit: true, delete: false, archive: false },
      compliance: { view: true, create: true, edit: true, delete: false, archive: false },
      management_reviews: { view: true, create: true, edit: true, delete: false, archive: false },
      analytics: { view: true }, // Client analytics only
      users: { view: true, create: true, edit: true, delete: false },
      companies: { view: true, create: true, edit: true, delete: false },
      standards: ['ISO_9001', 'ISO_14001', 'ISO_45001']
    },
    
    Admin: { // MD - Managing Director
      documents: { view: true, create: true, edit: true, delete: true, archive: true },
      ncrs: { view: true, create: true, edit: true, delete: true, archive: true },
      audits: { view: true, create: true, edit: true, delete: true, archive: true },
      compliance: { view: true, create: true, edit: true, delete: false, archive: false },
      management_reviews: { view: true, create: true, edit: true, delete: true, archive: true },
      analytics: { view: false }, // NO analytics
      users: { view: true, create: true, edit: true, delete: false },
      companies: { view: true, create: false, edit: true, delete: false },
      standards: ['ISO_9001', 'ISO_14001', 'ISO_45001'] // ALL 3 standards
    },
    
    SHEQ_Rep: { // SHEQ Representative
      documents: { view: true, create: true, edit: true, delete: false, archive: false },
      ncrs: { view: true, create: true, edit: true, delete: false, archive: false },
      audits: { view: true, create: true, edit: true, delete: false, archive: false },
      compliance: { view: true, create: true, edit: true, delete: false, archive: false },
      management_reviews: { view: true, create: true, edit: true, delete: false, archive: false },
      analytics: { view: false }, // NO analytics
      users: { view: true, create: false, edit: false, delete: false },
      companies: { view: true, create: false, edit: false, delete: false },
      standards: ['ISO_9001', 'ISO_14001', 'ISO_45001'] // ALL 3 standards
    },
    
    Quality_Rep: { // Quality Representative - ISO 9001 ONLY
      documents: { view: true, create: true, edit: true, delete: false, archive: false },
      ncrs: { view: true, create: true, edit: true, delete: false, archive: false },
      audits: { view: true, create: true, edit: true, delete: false, archive: false },
      compliance: { view: true, create: true, edit: true, delete: false, archive: false },
      management_reviews: { view: true, create: true, edit: true, delete: false, archive: false },
      analytics: { view: false },
      users: { view: true, create: false, edit: false, delete: false },
      companies: { view: true, create: false, edit: false, delete: false },
      standards: ['ISO_9001'] // ISO 9001 ONLY
    },
    
    Auditor: { // Read-only
      documents: { view: true, create: false, edit: false, delete: false, archive: false },
      ncrs: { view: true, create: true, edit: false, delete: false, archive: false }, // Can create findings
      audits: { view: true, create: false, edit: false, delete: false, archive: false },
      compliance: { view: true, create: false, edit: false, delete: false, archive: false },
      management_reviews: { view: true, create: false, edit: false, delete: false, archive: false },
      analytics: { view: false },
      users: { view: false, create: false, edit: false, delete: false },
      companies: { view: true, create: false, edit: false, delete: false },
      standards: ['ISO_9001', 'ISO_14001', 'ISO_45001'] // Can view all
    }
  }

  const rolePerms = permissions[role] || permissions.Auditor // Default to most restrictive

  // Helper functions
  const canView = (resource) => rolePerms[resource]?.view || false
  const canCreate = (resource) => rolePerms[resource]?.create || false
  const canEdit = (resource) => rolePerms[resource]?.edit || false
  const canDelete = (resource) => rolePerms[resource]?.delete || false
  const canArchive = (resource) => rolePerms[resource]?.archive || false
  const canAccessStandard = (standard) => rolePerms.standards?.includes(standard) || false
  const getAccessibleStandards = () => rolePerms.standards || []

  const isReseller = role === 'Reseller'
  const isSuperAdmin = role === 'Super_Admin'
  const isAdmin = role === 'Admin'
  const isSHEQRep = role === 'SHEQ_Rep'
  const isQualityRep = role === 'Quality_Rep'
  const isAuditor = role === 'Auditor'

  return {
    canView,
    canCreate,
    canEdit,
    canDelete,
    canArchive,
    canAccessStandard,
    getAccessibleStandards,
    isReseller,
    isSuperAdmin,
    isAdmin,
    isSHEQRep,
    isQualityRep,
    isAuditor,
    role
  }
}
