import { JWTPayload } from 'jose'
import {
  extractOrganizationId,
  parseScopes,
  parsePermissions,
  parseRoles,
  validateJWTPayload,
  buildOrganizationContext,
  createEnrichedAuthContext,
  checkPermissions,
  validateRoles,
  isAdmin,
  isMemberOrHigher,
  isTokenNearExpiry,
  validateAccess,
  createTestOrganizationContext
} from '../organization-context'

describe('Organization Context Builder', () => {
  const mockJWTPayload: JWTPayload = {
    sub: 'user_123',
    aud: ['urn:logto:organization:org_456', 'api_resource'],
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    scope: 'read write admin',
    permissions: ['documents:read', 'documents:write', 'users:read'],
    roles: ['admin', 'member'],
    email: 'user@example.com',
    name: 'Test User'
  }

  describe('extractOrganizationId', () => {
    test('extracts organization ID from audience array', () => {
      const audiences = ['urn:logto:organization:org_123', 'api_resource']
      expect(extractOrganizationId(audiences)).toBe('org_123')
    })

    test('extracts organization ID from single audience string', () => {
      const audience = 'urn:logto:organization:org_456'
      expect(extractOrganizationId(audience)).toBe('org_456')
    })

    test('returns null when no organization audience found', () => {
      const audiences = ['api_resource', 'another_resource']
      expect(extractOrganizationId(audiences)).toBeNull()
    })

    test('handles empty audience', () => {
      expect(extractOrganizationId([])).toBeNull()
      expect(extractOrganizationId('')).toBeNull()
    })
  })

  describe('parseScopes', () => {
    test('parses space-separated scope string', () => {
      const scopes = parseScopes('read write admin')
      expect(scopes).toEqual(['read', 'write', 'admin'])
    })

    test('parses scope array', () => {
      const scopes = parseScopes(['read', 'write', 'admin'])
      expect(scopes).toEqual(['read', 'write', 'admin'])
    })

    test('handles empty scopes', () => {
      expect(parseScopes('')).toEqual([])
      expect(parseScopes(undefined)).toEqual([])
      expect(parseScopes([])).toEqual([])
    })

    test('filters empty strings', () => {
      const scopes = parseScopes('read  write   admin')
      expect(scopes).toEqual(['read', 'write', 'admin'])
    })
  })

  describe('parsePermissions', () => {
    test('parses permissions from standard claim', () => {
      const payload = { permissions: ['documents:read', 'users:write'] }
      expect(parsePermissions(payload)).toEqual(['documents:read', 'users:write'])
    })

    test('tries multiple permission claim formats', () => {
      const payload = { 'https://logto.dev/permissions': ['documents:read'] }
      expect(parsePermissions(payload)).toEqual(['documents:read'])
    })

    test('returns empty array when no permissions found', () => {
      const payload = {}
      expect(parsePermissions(payload)).toEqual([])
    })
  })

  describe('parseRoles', () => {
    test('parses roles from array claim', () => {
      const payload = { roles: ['admin', 'member'] }
      expect(parseRoles(payload)).toEqual(['admin', 'member'])
    })

    test('parses single role string', () => {
      const payload = { role: 'admin' }
      expect(parseRoles(payload)).toEqual(['admin'])
    })

    test('returns empty array when no roles found', () => {
      const payload = {}
      expect(parseRoles(payload)).toEqual([])
    })
  })

  describe('validateJWTPayload', () => {
    test('validates correct JWT payload', () => {
      const result = validateJWTPayload(mockJWTPayload)
      expect(result).toBeNull()
    })

    test('fails validation for missing subject', () => {
      const payload = { ...mockJWTPayload, sub: undefined }
      const result = validateJWTPayload(payload)
      expect(result).toEqual({
        message: 'Missing or invalid subject claim',
        code: 'MISSING_CLAIMS',
        context: { claim: 'sub', value: undefined }
      })
    })

    test('fails validation for expired token', () => {
      const expiredPayload = {
        ...mockJWTPayload,
        exp: Math.floor(Date.now() / 1000) - 100
      }
      const result = validateJWTPayload(expiredPayload)
      expect(result?.code).toBe('EXPIRED_TOKEN')
    })
  })

  describe('buildOrganizationContext', () => {
    test('builds complete organization context', () => {
      const context = buildOrganizationContext(mockJWTPayload, 'test-token')
      
      expect(context).toEqual({
        organizationId: 'org_456',
        userId: 'user_123',
        permissions: ['documents:read', 'documents:write', 'users:read'],
        scopes: ['read', 'write', 'admin'],
        roles: ['admin', 'member'],
        tokenExpiry: mockJWTPayload.exp,
        issuedAt: mockJWTPayload.iat
      })
    })

    test('includes profile information when requested', () => {
      const context = buildOrganizationContext(
        mockJWTPayload, 
        'test-token', 
        { includeProfile: true }
      )
      
      expect(context?.email).toBe('user@example.com')
      expect(context?.name).toBe('Test User')
    })

    test('returns null for non-organization token', () => {
      const payload = { ...mockJWTPayload, aud: ['api_resource'] }
      const context = buildOrganizationContext(payload, 'test-token')
      expect(context).toBeNull()
    })
  })

  describe('createEnrichedAuthContext', () => {
    test('creates enriched context with organization data', () => {
      const enriched = createEnrichedAuthContext(mockJWTPayload, 'test-token')
      
      expect(enriched.isOrganizationScoped).toBe(true)
      expect(enriched.organization).toBeDefined()
      expect(enriched.organization?.organizationId).toBe('org_456')
      expect(enriched.accessToken).toBe('test-token')
      expect(enriched.jwtPayload).toBe(mockJWTPayload)
    })
  })

  describe('checkPermissions', () => {
    const testContext = createTestOrganizationContext(
      'org_123',
      'user_456',
      ['member'],
      ['documents:read', 'documents:write']
    )

    test('grants access when user has required permissions', () => {
      const result = checkPermissions(testContext, ['documents:read'])
      expect(result.granted).toBe(true)
      expect(result.missingPermissions).toBeUndefined()
    })

    test('denies access when user lacks required permissions', () => {
      const result = checkPermissions(testContext, ['admin:delete'])
      expect(result.granted).toBe(false)
      expect(result.missingPermissions).toEqual(['admin:delete'])
    })

    test('grants access when no permissions required', () => {
      const result = checkPermissions(testContext, [])
      expect(result.granted).toBe(true)
    })
  })

  describe('validateRoles', () => {
    const adminContext = createTestOrganizationContext('org_123', 'user_456', ['admin'])
    const memberContext = createTestOrganizationContext('org_123', 'user_456', ['member'])
    const guestContext = createTestOrganizationContext('org_123', 'user_456', ['guest'])

    test('validates admin role hierarchy', () => {
      const result = validateRoles(adminContext, ['member'])
      expect(result.valid).toBe(true) // Admin can access member resources
      expect(result.isAdmin).toBe(true)
    })

    test('validates member role cannot access admin resources', () => {
      const result = validateRoles(memberContext, ['admin'])
      expect(result.valid).toBe(false)
      expect(result.isMember).toBe(true)
      expect(result.isAdmin).toBe(false)
    })

    test('validates guest role access', () => {
      const result = validateRoles(guestContext, ['guest'])
      expect(result.valid).toBe(true)
      expect(result.isGuest).toBe(true)
    })
  })

  describe('utility functions', () => {
    const adminContext = createTestOrganizationContext('org_123', 'user_456', ['admin'])
    const memberContext = createTestOrganizationContext('org_123', 'user_456', ['member'])
    const guestContext = createTestOrganizationContext('org_123', 'user_456', ['guest'])

    test('isAdmin correctly identifies admin users', () => {
      expect(isAdmin(adminContext)).toBe(true)
      expect(isAdmin(memberContext)).toBe(false)
      expect(isAdmin(guestContext)).toBe(false)
    })

    test('isMemberOrHigher correctly identifies member+ users', () => {
      expect(isMemberOrHigher(adminContext)).toBe(true)
      expect(isMemberOrHigher(memberContext)).toBe(true)
      expect(isMemberOrHigher(guestContext)).toBe(false)
    })

    test('isTokenNearExpiry detects expiring tokens', () => {
      const nearExpiryContext = {
        ...adminContext,
        tokenExpiry: Math.floor(Date.now() / 1000) + 200 // 200 seconds from now
      }
      expect(isTokenNearExpiry(nearExpiryContext)).toBe(true)
      expect(isTokenNearExpiry(adminContext)).toBe(false) // 1 hour from now
    })
  })

  describe('validateAccess', () => {
    const context = createTestOrganizationContext(
      'org_123',
      'user_456',
      ['member'],
      ['documents:read', 'documents:write']
    )

    test('validates combined permission and role access', () => {
      const result = validateAccess(
        context, 
        ['documents:read'], 
        ['member']
      )
      expect(result.granted).toBe(true)
      expect(result.permissionResult.granted).toBe(true)
      expect(result.roleResult.valid).toBe(true)
    })

    test('denies access when permissions insufficient', () => {
      const result = validateAccess(
        context, 
        ['admin:delete'], 
        ['member']
      )
      expect(result.granted).toBe(false)
      expect(result.permissionResult.granted).toBe(false)
      expect(result.roleResult.valid).toBe(true)
    })
  })
})