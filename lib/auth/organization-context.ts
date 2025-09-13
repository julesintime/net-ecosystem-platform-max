import { JWTPayload } from 'jose'
import {
  OrganizationContext,
  EnrichedAuthContext,
  PermissionCheckResult,
  RoleValidationResult,
  ContextEnrichmentOptions,
  JWTParsingError
} from './types'

/**
 * Default roles hierarchy for Logto organization template
 */
const ROLE_HIERARCHY = {
  admin: ['admin', 'member', 'guest'],
  member: ['member', 'guest'],
  guest: ['guest']
} as const

/**
 * Extract organization ID from JWT audience claim
 * Supports format: "urn:logto:organization:{orgId}"
 */
export function extractOrganizationId(audience: string | string[]): string | null {
  const audiences = Array.isArray(audience) ? audience : [audience]
  
  for (const aud of audiences) {
    if (typeof aud === 'string' && aud.startsWith('urn:logto:organization:')) {
      const orgId = aud.replace('urn:logto:organization:', '')
      if (orgId && orgId.length > 0) {
        return orgId
      }
    }
  }
  
  return null
}

/**
 * Parse scopes from JWT scope claim
 * Handles both space-separated string and array formats
 */
export function parseScopes(scope: string | string[] | undefined): string[] {
  if (!scope) return []
  
  if (Array.isArray(scope)) {
    return scope.filter(s => typeof s === 'string' && s.length > 0)
  }
  
  if (typeof scope === 'string') {
    return scope.split(' ').filter(s => s.length > 0)
  }
  
  return []
}

/**
 * Parse permissions from JWT permissions claim
 * Supports various claim formats from Logto
 */
export function parsePermissions(payload: JWTPayload): string[] {
  // Try different permission claim formats
  const permissionsClaims = [
    payload.permissions,
    payload.perms,
    payload['custom:permissions'],
    payload['https://logto.dev/permissions']
  ]
  
  for (const claim of permissionsClaims) {
    if (Array.isArray(claim)) {
      return claim.filter(p => typeof p === 'string' && p.length > 0)
    }
    if (typeof claim === 'string') {
      return claim.split(' ').filter(p => p.length > 0)
    }
  }
  
  return []
}

/**
 * Parse roles from JWT roles claim
 * Supports various claim formats from Logto
 */
export function parseRoles(payload: JWTPayload): string[] {
  // Try different role claim formats
  const roleClaims = [
    payload.roles,
    payload.role,
    payload['custom:roles'],
    payload['https://logto.dev/roles']
  ]
  
  for (const claim of roleClaims) {
    if (Array.isArray(claim)) {
      return claim.filter(r => typeof r === 'string' && r.length > 0)
    }
    if (typeof claim === 'string') {
      return [claim].filter(r => r.length > 0)
    }
  }
  
  return []
}

/**
 * Validate JWT payload has required claims for organization context
 */
export function validateJWTPayload(payload: JWTPayload): JWTParsingError | null {
  if (!payload.sub || typeof payload.sub !== 'string') {
    return {
      message: 'Missing or invalid subject claim',
      code: 'MISSING_CLAIMS',
      context: { claim: 'sub', value: payload.sub }
    }
  }
  
  if (!payload.aud) {
    return {
      message: 'Missing audience claim',
      code: 'MISSING_CLAIMS',
      context: { claim: 'aud' }
    }
  }
  
  if (!payload.exp || typeof payload.exp !== 'number') {
    return {
      message: 'Missing or invalid expiration claim',
      code: 'MISSING_CLAIMS',
      context: { claim: 'exp', value: payload.exp }
    }
  }
  
  if (!payload.iat || typeof payload.iat !== 'number') {
    return {
      message: 'Missing or invalid issued at claim',
      code: 'MISSING_CLAIMS',
      context: { claim: 'iat', value: payload.iat }
    }
  }
  
  // Check if token is expired
  const now = Math.floor(Date.now() / 1000)
  if (payload.exp <= now) {
    return {
      message: 'Token has expired',
      code: 'EXPIRED_TOKEN',
      context: { exp: payload.exp, now }
    }
  }
  
  return null
}

/**
 * Build organization context from validated JWT payload
 */
export function buildOrganizationContext(
  payload: JWTPayload,
  accessToken: string,
  options: ContextEnrichmentOptions = {}
): OrganizationContext | null {
  // Validate payload first
  const validationError = validateJWTPayload(payload)
  if (validationError) {
    throw new Error(`JWT validation failed: ${validationError.message}`)
  }
  
  // Extract organization ID
  const organizationId = extractOrganizationId(payload.aud as string | string[])
  if (!organizationId) {
    return null // Not an organization-scoped token
  }
  
  // Parse claims
  const scopes = parseScopes(payload.scope as string | string[])
  const permissions = parsePermissions(payload)
  const roles = parseRoles(payload)
  
  // Build organization context
  const context: OrganizationContext = {
    organizationId,
    userId: payload.sub as string,
    permissions,
    scopes,
    roles,
    tokenExpiry: payload.exp as number,
    issuedAt: payload.iat as number
  }
  
  // Add optional profile information
  if (options.includeProfile) {
    if (payload.email && typeof payload.email === 'string') {
      context.email = payload.email
    }
    if (payload.name && typeof payload.name === 'string') {
      context.name = payload.name
    }
  }
  
  // Add organization metadata if available
  if (options.includeOrganizationMetadata) {
    if (payload.org_name && typeof payload.org_name === 'string') {
      context.organizationName = payload.org_name
    }
  }
  
  return context
}

/**
 * Create enriched authentication context from JWT payload
 */
export function createEnrichedAuthContext(
  payload: JWTPayload,
  accessToken: string,
  options: ContextEnrichmentOptions = {}
): EnrichedAuthContext {
  const organizationContext = buildOrganizationContext(payload, accessToken, options)
  
  return {
    organization: organizationContext || undefined,
    jwtPayload: payload,
    accessToken,
    isOrganizationScoped: organizationContext !== null,
    validatedAt: Math.floor(Date.now() / 1000)
  }
}

/**
 * Check if user has required permissions
 */
export function checkPermissions(
  context: OrganizationContext,
  requiredPermissions: string[]
): PermissionCheckResult {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return {
      granted: true,
      checkedPermissions: [],
      userPermissions: context.permissions,
      organizationId: context.organizationId
    }
  }
  
  const userPermissionSet = new Set(context.permissions)
  const missingPermissions = requiredPermissions.filter(
    permission => !userPermissionSet.has(permission)
  )
  
  return {
    granted: missingPermissions.length === 0,
    checkedPermissions: requiredPermissions,
    userPermissions: context.permissions,
    missingPermissions: missingPermissions.length > 0 ? missingPermissions : undefined,
    organizationId: context.organizationId
  }
}

/**
 * Validate user roles with hierarchy support
 */
export function validateRoles(
  context: OrganizationContext,
  requiredRoles: string[]
): RoleValidationResult {
  const userRoles = context.roles
  const isAdmin = userRoles.includes('admin')
  const isMember = userRoles.includes('member')
  const isGuest = userRoles.includes('guest')
  
  let valid = false
  
  if (requiredRoles.length === 0) {
    valid = true
  } else {
    // Check if user has any of the required roles, considering hierarchy
    valid = requiredRoles.some(requiredRole => {
      return userRoles.some(userRole => {
        const allowedRoles = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] || [userRole]
        return allowedRoles.includes(requiredRole)
      })
    })
  }
  
  return {
    valid,
    requiredRoles,
    userRoles,
    isAdmin,
    isMember,
    isGuest
  }
}

/**
 * Check if user has admin role
 */
export function isAdmin(context: OrganizationContext): boolean {
  return context.roles.includes('admin')
}

/**
 * Check if user has member role or higher
 */
export function isMemberOrHigher(context: OrganizationContext): boolean {
  return context.roles.some(role => ['admin', 'member'].includes(role))
}

/**
 * Check if token is close to expiration (within 5 minutes)
 */
export function isTokenNearExpiry(context: OrganizationContext, bufferSeconds = 300): boolean {
  const now = Math.floor(Date.now() / 1000)
  return (context.tokenExpiry - now) <= bufferSeconds
}

/**
 * Get time remaining until token expiry in seconds
 */
export function getTokenTimeRemaining(context: OrganizationContext): number {
  const now = Math.floor(Date.now() / 1000)
  return Math.max(0, context.tokenExpiry - now)
}

/**
 * Combine permission and role validation
 */
export function validateAccess(
  context: OrganizationContext,
  requiredPermissions: string[] = [],
  requiredRoles: string[] = []
): { granted: boolean; permissionResult: PermissionCheckResult; roleResult: RoleValidationResult } {
  const permissionResult = checkPermissions(context, requiredPermissions)
  const roleResult = validateRoles(context, requiredRoles)
  
  return {
    granted: permissionResult.granted && roleResult.valid,
    permissionResult,
    roleResult
  }
}

/**
 * Create a minimal context for testing purposes
 */
export function createTestOrganizationContext(
  organizationId: string,
  userId: string,
  roles: string[] = ['member'],
  permissions: string[] = [],
  scopes: string[] = []
): OrganizationContext {
  const now = Math.floor(Date.now() / 1000)
  
  return {
    organizationId,
    userId,
    permissions,
    scopes,
    roles,
    tokenExpiry: now + 3600, // 1 hour from now
    issuedAt: now
  }
}