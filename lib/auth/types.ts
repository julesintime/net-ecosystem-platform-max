import { UserInfoResponse, IdTokenClaims } from '@logto/next'
import { JWTPayload } from 'jose'

export interface LogtoUser extends UserInfoResponse {
  id: string
  username?: string
  email?: string
  name?: string
  picture?: string
}

export interface AuthContext {
  isAuthenticated: boolean
  claims: IdTokenClaims | null
}

export interface AuthButtonProps {
  onSignIn?: () => Promise<void>
  onSignOut?: () => Promise<void>
}

/**
 * Core organization context extracted from JWT tokens
 * This interface provides comprehensive organization-scoped authentication data
 */
export interface OrganizationContext {
  /** Organization ID extracted from JWT audience claim */
  organizationId: string
  /** User ID from JWT subject claim */
  userId: string
  /** User permissions within the organization */
  permissions: string[]
  /** OAuth2 scopes granted to the user */
  scopes: string[]
  /** User roles within the organization */
  roles: string[]
  /** Token expiration timestamp (Unix timestamp) */
  tokenExpiry: number
  /** Token issued at timestamp (Unix timestamp) */
  issuedAt: number
  /** User's email address if available */
  email?: string
  /** User's name if available */
  name?: string
  /** Organization name if available in token */
  organizationName?: string
}

/**
 * Enhanced authentication context with organization data
 */
export interface EnrichedAuthContext {
  /** Organization context if token is organization-scoped */
  organization?: OrganizationContext
  /** Raw JWT payload for advanced use cases */
  jwtPayload: JWTPayload
  /** Original access token */
  accessToken: string
  /** Whether the token is organization-scoped */
  isOrganizationScoped: boolean
  /** Token validation timestamp */
  validatedAt: number
}

/**
 * Permission check result with context
 */
export interface PermissionCheckResult {
  /** Whether the permission check passed */
  granted: boolean
  /** Specific permissions that were checked */
  checkedPermissions: string[]
  /** User's actual permissions */
  userPermissions: string[]
  /** Missing permissions if check failed */
  missingPermissions?: string[]
  /** Organization context used for the check */
  organizationId: string
}

/**
 * Role validation result
 */
export interface RoleValidationResult {
  /** Whether the role validation passed */
  valid: boolean
  /** Required roles for the operation */
  requiredRoles: string[]
  /** User's actual roles */
  userRoles: string[]
  /** Whether user has admin role */
  isAdmin: boolean
  /** Whether user has member role */
  isMember: boolean
  /** Whether user has guest role */
  isGuest: boolean
}

/**
 * Context enrichment options
 */
export interface ContextEnrichmentOptions {
  /** Whether to include user profile information */
  includeProfile?: boolean
  /** Whether to include organization metadata */
  includeOrganizationMetadata?: boolean
  /** Whether to validate permissions immediately */
  validatePermissions?: string[]
  /** Whether to validate roles immediately */
  validateRoles?: string[]
}

/**
 * JWT parsing error with context
 */
export interface JWTParsingError {
  /** Error message */
  message: string
  /** Error code for categorization */
  code: 'INVALID_FORMAT' | 'EXPIRED_TOKEN' | 'INVALID_SIGNATURE' | 'MISSING_CLAIMS' | 'INVALID_AUDIENCE'
  /** Additional context about the error */
  context?: Record<string, unknown>
}