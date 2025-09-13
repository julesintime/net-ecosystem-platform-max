// Logto Management API type definitions for organization operations

export interface LogtoOrganization {
  id: string
  name: string
  description?: string
  customData?: Record<string, unknown>
  createdAt: number
  isMfaRequired?: boolean
}

export interface LogtoOrganizationRole {
  id: string
  name: string
  description?: string
}

export interface LogtoOrganizationScope {
  id: string
  name: string
  description?: string
  resourceId: string
}

export interface LogtoUser {
  id: string
  username?: string
  primaryEmail?: string
  primaryPhone?: string
  name?: string
  avatar?: string
  customData?: Record<string, unknown>
  identities: Record<string, unknown>
  lastSignInAt?: number
  createdAt: number
  updatedAt: number
  profile: {
    familyName?: string
    givenName?: string
    middleName?: string
    nickname?: string
    preferredUsername?: string
    profile?: string
    website?: string
    gender?: string
    birthdate?: string
    zoneinfo?: string
    locale?: string
    picture?: string
  }
  applicationId?: string
  isSuspended: boolean
  hasPassword: boolean
  ssoIdentities: Array<{
    id: string
    userId: string
    issuer: string
    identityId: string
    detail: Record<string, unknown>
    createdAt: number
  }>
}

export interface LogtoOrganizationUser {
  id: string
  userId: string
  organizationId: string
  organizationRoles: LogtoOrganizationRole[]
}

export interface LogtoOrganizationMember extends LogtoUser {
  organizationRoles: LogtoOrganizationRole[]
}

export interface LogtoOrganizationInvitation {
  id: string
  inviterId: string
  invitee: string
  organizationId: string
  status: 'Pending' | 'Accepted' | 'Expired' | 'Revoked'
  createdAt: number
  updatedAt: number
  expiresAt: number
  organizationRoleIds: string[]
  messagePayload?: Record<string, unknown>
}

// API Request/Response types
export interface CreateOrganizationRequest {
  name: string
  description?: string
  customData?: Record<string, unknown>
  isMfaRequired?: boolean
}

export interface UpdateOrganizationRequest {
  name?: string
  description?: string
  customData?: Record<string, unknown>
  isMfaRequired?: boolean
}

export interface AddOrganizationMemberRequest {
  userIds: string[]
  organizationRoleIds?: string[]
}

export interface UpdateOrganizationMemberRequest {
  organizationRoleIds: string[]
}

export interface CreateOrganizationInvitationRequest {
  invitee: string // email or phone
  organizationRoleIds?: string[]
  messagePayload?: Record<string, unknown>
  expiresAt?: number // Unix timestamp
}

export interface OrganizationListParams {
  page?: number
  page_size?: number
  q?: string // search query
}

export interface OrganizationMemberListParams {
  page?: number
  page_size?: number
  q?: string // search query
}

export interface OrganizationInvitationListParams {
  page?: number
  page_size?: number
  q?: string // search query
}

// API Response wrappers
export interface PaginatedResponse<T> {
  data: T[]
  totalCount: number
}

export interface ManagementApiResponse<T = unknown> {
  data?: T
  error?: string
  status: number
}

// Error types
export interface ManagementApiError {
  code: string
  message: string
  data?: Record<string, unknown>
}

// Common API operation types
export type OrganizationOperation = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'list'
  | 'add_member'
  | 'remove_member'
  | 'update_member'
  | 'list_members'
  | 'create_invitation'
  | 'revoke_invitation'
  | 'list_invitations'

export interface ApiValidationError {
  field: string
  message: string
}

export interface ApiErrorResponse {
  error: string
  details?: ApiValidationError[]
  status: number
}