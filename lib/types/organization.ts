import { 
  LogtoOrganization, 
  LogtoOrganizationMember, 
  LogtoOrganizationRole,
  LogtoOrganizationInvitation,
  LogtoUser
} from './management-api'

// Extended types for UI components
export interface OrganizationWithStats extends LogtoOrganization {
  memberCount: number
  pendingInvitations: number
  createdAtDate: Date
  lastActivity?: Date
}

export interface OrganizationMemberWithUser extends LogtoOrganizationMember {
  user: LogtoUser
  joinedAt: Date
  lastActivity?: Date
  status: 'active' | 'pending' | 'suspended'
}

export interface InvitationWithDetails extends LogtoOrganizationInvitation {
  inviterName?: string
  inviterEmail?: string
  roleName?: string
  createdAtDate: Date
  expiresAtDate: Date
  updatedAtDate: Date
}

// Role types with permission descriptions
export interface OrganizationRoleWithDetails extends LogtoOrganizationRole {
  permissions: string[]
  memberCount: number
  isBuiltIn: boolean
  canManageMembers: boolean
  canManageRoles: boolean
  canDeleteOrganization: boolean
}

// Form schemas and validation types
export interface InviteMemberFormData {
  email: string
  roleIds: string[]
  message?: string
  sendEmail: boolean
}

export interface BulkInviteFormData {
  emails: string[]
  roleIds: string[]
  message?: string
  sendEmail: boolean
}

export interface UpdateMemberFormData {
  roleIds: string[]
}

export interface OrganizationProfileFormData {
  name: string
  description?: string
  isPublic: boolean
  allowPublicJoin: boolean
  isMfaRequired: boolean
  customData?: Record<string, unknown>
}

export interface OrganizationBrandingFormData {
  logo?: string
  primaryColor?: string
  secondaryColor?: string
  customCss?: string
}

// Component state types
export interface MemberTableFilters {
  role?: string
  status?: string
  search?: string
}

export interface InvitationTableFilters {
  status?: string
  role?: string
  search?: string
}

export interface OrganizationStats {
  totalMembers: number
  activeMembers: number
  pendingInvitations: number
  totalRoles: number
  storageUsed: number
  storageLimit: number
  apiCallsThisMonth: number
  apiCallsLimit: number
}

// API operation types for UI feedback
export type MemberOperation = 
  | 'invite'
  | 'bulk-invite'
  | 'update-role'
  | 'remove'
  | 'bulk-remove'
  | 'resend-invitation'
  | 'revoke-invitation'

export type OrganizationOperation = 
  | 'update-profile'
  | 'update-branding'
  | 'transfer-ownership'
  | 'delete'
  | 'leave'

// Loading and error states
export interface OperationState {
  isLoading: boolean
  error?: string | null
  operation?: string
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export interface SortState {
  field: string
  direction: 'asc' | 'desc'
}

// Context types
export interface OrganizationContextValue {
  // Current organization
  organization?: OrganizationWithStats
  
  // Members
  members: OrganizationMemberWithUser[]
  membersLoading: boolean
  membersError?: string
  
  // Invitations
  invitations: InvitationWithDetails[]
  invitationsLoading: boolean
  invitationsError?: string
  
  // Roles
  roles: OrganizationRoleWithDetails[]
  rolesLoading: boolean
  rolesError?: string
  
  // Stats
  stats?: OrganizationStats
  statsLoading: boolean
  
  // Operations
  operationState: OperationState
  
  // Actions
  inviteMember: (data: InviteMemberFormData) => Promise<void>
  bulkInviteMembers: (data: BulkInviteFormData) => Promise<void>
  updateMemberRoles: (memberId: string, roleIds: string[]) => Promise<void>
  removeMember: (memberId: string) => Promise<void>
  resendInvitation: (invitationId: string) => Promise<void>
  revokeInvitation: (invitationId: string) => Promise<void>
  updateOrganization: (data: OrganizationProfileFormData) => Promise<void>
  deleteOrganization: () => Promise<void>
  leaveOrganization: () => Promise<void>
  refreshData: () => Promise<void>
}

// Table column types for data-table integration
export interface MemberTableColumn {
  id: keyof OrganizationMemberWithUser | 'actions'
  label: string
  sortable?: boolean
  filterable?: boolean
  width?: string
}

export interface InvitationTableColumn {
  id: keyof InvitationWithDetails | 'actions'
  label: string
  sortable?: boolean
  filterable?: boolean
  width?: string
}

// Permission constants
export const ORGANIZATION_PERMISSIONS = {
  MANAGE_MEMBERS: 'manage:members',
  MANAGE_ROLES: 'manage:roles',
  MANAGE_SETTINGS: 'manage:settings',
  MANAGE_BILLING: 'manage:billing',
  DELETE_ORGANIZATION: 'delete:organization',
  VIEW_ANALYTICS: 'view:analytics',
} as const

export type OrganizationPermission = typeof ORGANIZATION_PERMISSIONS[keyof typeof ORGANIZATION_PERMISSIONS]

// Role constants based on Logto organization template
export const BUILT_IN_ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member', 
  GUEST: 'guest',
} as const

export type BuiltInRole = typeof BUILT_IN_ROLES[keyof typeof BUILT_IN_ROLES]

// Status constants
export const MEMBER_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
} as const

export const INVITATION_STATUS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  EXPIRED: 'Expired',
  REVOKED: 'Revoked',
} as const

// Validation helpers
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidOrganizationName(name: string): boolean {
  return name.length >= 2 && name.length <= 128 && /^[a-zA-Z0-9\s\-_.]+$/.test(name)
}

// Utility functions
export function formatMemberRole(roles: LogtoOrganizationRole[]): string {
  if (!roles.length) return 'No roles'
  if (roles.length === 1) return roles[0].name
  return `${roles[0].name} +${roles.length - 1} more`
}

export function getMemberPermissions(roles: OrganizationRoleWithDetails[]): Set<OrganizationPermission> {
  const permissions = new Set<OrganizationPermission>()
  roles.forEach(role => {
    role.permissions.forEach(permission => {
      if (Object.values(ORGANIZATION_PERMISSIONS).includes(permission as OrganizationPermission)) {
        permissions.add(permission as OrganizationPermission)
      }
    })
  })
  return permissions
}

export function canPerformOperation(
  userRoles: OrganizationRoleWithDetails[],
  requiredPermission: OrganizationPermission
): boolean {
  const userPermissions = getMemberPermissions(userRoles)
  return userPermissions.has(requiredPermission)
}

export function formatInvitationStatus(status: string): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  switch (status) {
    case INVITATION_STATUS.PENDING:
      return { label: 'Pending', variant: 'secondary' }
    case INVITATION_STATUS.ACCEPTED:
      return { label: 'Accepted', variant: 'default' }
    case INVITATION_STATUS.EXPIRED:
      return { label: 'Expired', variant: 'outline' }
    case INVITATION_STATUS.REVOKED:
      return { label: 'Revoked', variant: 'destructive' }
    default:
      return { label: status, variant: 'outline' }
  }
}

export function formatMemberStatus(status: string): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  switch (status) {
    case MEMBER_STATUS.ACTIVE:
      return { label: 'Active', variant: 'default' }
    case MEMBER_STATUS.PENDING:
      return { label: 'Pending', variant: 'secondary' }
    case MEMBER_STATUS.SUSPENDED:
      return { label: 'Suspended', variant: 'destructive' }
    default:
      return { label: status, variant: 'outline' }
  }
}