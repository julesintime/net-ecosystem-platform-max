import { NextRequest, NextResponse } from 'next/server'
import { getLogtoContext } from '@logto/next/server-actions'
import { logtoConfig } from '@/lib/auth/logto-config'
import { ecosystemAccessManager } from './ecosystem-access-manager'

export interface EcosystemMiddlewareOptions {
  applicationId: string
  requiredScopes?: string[]
  redirectOnDenied?: string
}

/**
 * Middleware to check if a user has access to a specific ecosystem application
 * This extends the basic authentication middleware to include ecosystem app access checks
 */
export async function requireEcosystemAccess(
  request: NextRequest,
  options: EcosystemMiddlewareOptions
): Promise<NextResponse | null> {
  try {
    // First check if user is authenticated
    const context = await getLogtoContext(logtoConfig)
    
    if (!context.isAuthenticated) {
      const signInUrl = new URL('/', request.url)
      signInUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }

    const userId = context.claims?.sub
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 400 }
      )
    }

    // Check if user has access to the specific application
    const hasAccess = await ecosystemAccessManager.checkUserAppAccess(userId, options.applicationId)
    
    if (!hasAccess) {
      if (options.redirectOnDenied) {
        const deniedUrl = new URL(options.redirectOnDenied, request.url)
        deniedUrl.searchParams.set('reason', 'app_access_denied')
        deniedUrl.searchParams.set('app_id', options.applicationId)
        return NextResponse.redirect(deniedUrl)
      }
      
      return NextResponse.json(
        { 
          error: 'Application access denied',
          applicationId: options.applicationId,
          userId 
        },
        { status: 403 }
      )
    }

    // User has access, allow the request to continue
    return null

  } catch (error) {
    console.error('Ecosystem middleware error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Higher-order function to create ecosystem middleware for specific applications
 */
export function createEcosystemMiddleware(options: EcosystemMiddlewareOptions) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    return requireEcosystemAccess(request, options)
  }
}

/**
 * Express-style middleware wrapper for ecosystem access
 */
export function withEcosystemAccess(options: EcosystemMiddlewareOptions) {
  return async function middleware(
    request: NextRequest,
    response: NextResponse,
    next: () => void
  ) {
    const result = await requireEcosystemAccess(request, options)
    
    if (result) {
      // Access denied or error occurred
      return result
    }
    
    // Access granted, continue
    next()
  }
}