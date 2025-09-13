import { NextRequest } from 'next/server'
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose'

export interface AuthenticatedUser {
  id: string
  organizationId?: string
  scopes: string[]
}

export interface AuthContext {
  user: AuthenticatedUser
  token: string
}

export class AuthError extends Error {
  status: number

  constructor(message: string, status: number = 401) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}

const getTokenFromRequest = (request: NextRequest): string => {
  const authorization = request.headers.get('authorization')
  const bearerTokenIdentifier = 'Bearer'

  if (!authorization) {
    throw new AuthError('Authorization header missing')
  }

  if (!authorization.startsWith(bearerTokenIdentifier)) {
    throw new AuthError('Authorization token type not supported')
  }

  return authorization.slice(bearerTokenIdentifier.length + 1)
}

// Extract organization ID from JWT audience claim
// Format: "urn:logto:organization:<organization_id>"
const extractOrganizationId = (aud: string | string[]): string | undefined => {
  const audience = Array.isArray(aud) ? aud.find(a => a.startsWith('urn:logto:organization:')) : aud
  
  if (!audience || typeof audience !== 'string' || !audience.startsWith('urn:logto:organization:')) {
    return undefined
  }
  
  return audience.replace('urn:logto:organization:', '')
}

const decodeJwtPayload = (token: string): JWTPayload => {
  try {
    const [, payloadBase64] = token.split('.')
    if (!payloadBase64) {
      throw new Error('Invalid token format')
    }
    const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8')
    return JSON.parse(payloadJson)
  } catch {
    throw new AuthError('Failed to decode token payload')
  }
}

const hasRequiredScopes = (tokenScopes: string[], requiredScopes: string[]): boolean => {
  if (!requiredScopes || requiredScopes.length === 0) {
    return true
  }
  const scopeSet = new Set(tokenScopes)
  return requiredScopes.every((scope) => scopeSet.has(scope))
}

const verifyJwt = async (token: string, audience: string | string[]): Promise<JWTPayload> => {
  const JWKS_URL = process.env.LOGTO_JWKS_URL || `${process.env.LOGTO_ENDPOINT}/oidc/jwks`
  const ISSUER = process.env.LOGTO_ISSUER || `${process.env.LOGTO_ENDPOINT}/oidc`

  if (!JWKS_URL || !ISSUER) {
    throw new AuthError('Missing Logto configuration for JWT verification')
  }

  const JWKS = createRemoteJWKSet(new URL(JWKS_URL))
  
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: ISSUER,
      audience
    })
    return payload
  } catch {
    throw new AuthError('Invalid JWT token')
  }
}

export interface AuthOptions {
  requiredScopes?: string[]
  requireOrganization?: boolean
}

/**
 * Middleware for authenticating API requests with Logto JWT tokens
 */
export async function authenticateRequest(
  request: NextRequest,
  options: AuthOptions = {}
): Promise<AuthContext> {
  try {
    const token = getTokenFromRequest(request)
    const { requiredScopes = [], requireOrganization = false } = options

    // Decode payload to get audience
    const decodedPayload = decodeJwtPayload(token)
    if (!decodedPayload.aud) {
      throw new AuthError('Missing audience in token')
    }

    // Verify the token with the audience
    const payload = await verifyJwt(token, decodedPayload.aud)

    // Extract organization ID if present
    const organizationId = extractOrganizationId(payload.aud as string | string[])

    // Check if organization is required but missing
    if (requireOrganization && !organizationId) {
      throw new AuthError('Organization context required but not found in token', 403)
    }

    // Get scopes from the token
    const scopes = typeof payload.scope === 'string' ? payload.scope.split(' ') : []

    // Verify required scopes
    if (!hasRequiredScopes(scopes, requiredScopes)) {
      throw new AuthError('Insufficient permissions', 403)
    }

    return {
      user: {
        id: payload.sub as string,
        organizationId,
        scopes
      },
      token
    }
  } catch (error) {
    if (error instanceof AuthError) {
      throw error
    }
    throw new AuthError('Authentication failed')
  }
}

/**
 * Middleware specifically for organization-scoped operations
 */
export async function authenticateOrganizationRequest(
  request: NextRequest,
  requiredScopes: string[] = []
): Promise<AuthContext> {
  return authenticateRequest(request, {
    requiredScopes,
    requireOrganization: true
  })
}

/**
 * Helper to create standardized error responses
 */
export function createAuthErrorResponse(error: AuthError) {
  return new Response(
    JSON.stringify({ 
      error: error.message,
      status: error.status 
    }),
    {
      status: error.status,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}

/**
 * Wrapper function for API route handlers with authentication
 */
export function withAuth<T extends unknown[]>(
  handler: (request: NextRequest, context: AuthContext, ...args: T) => Promise<Response>,
  options: AuthOptions = {}
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      const authContext = await authenticateRequest(request, options)
      return await handler(request, authContext, ...args)
    } catch (error) {
      if (error instanceof AuthError) {
        return createAuthErrorResponse(error)
      }
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
}

/**
 * Wrapper function for organization-scoped API route handlers
 */
export function withOrganizationAuth<T extends unknown[]>(
  handler: (request: NextRequest, context: AuthContext, ...args: T) => Promise<Response>,
  requiredScopes: string[] = []
) {
  return withAuth(handler, {
    requiredScopes,
    requireOrganization: true
  })
}