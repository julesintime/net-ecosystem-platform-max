import { NextRequest, NextResponse } from 'next/server'
import { getLogtoContext } from '@logto/next/server-actions'
import { logtoConfig } from '@/lib/auth/logto-config'

// Define protected route patterns
const protectedRoutes = [
  '/profile',
  '/inbox', 
  '/library',
  '/catalog',
  '/dashboard'
]

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/api/logto',
  '/favicon.ico',
  '/_next'
]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Allow public routes and API routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  try {
    // Get authentication context from Logto
    const context = await getLogtoContext(logtoConfig, request)
    
    if (!context.isAuthenticated) {
      // Redirect to sign in if not authenticated
      const signInUrl = new URL('/', request.url)
      signInUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(signInUrl)
    }

    // User is authenticated, allow access
    return NextResponse.next()
  } catch (error) {
    console.error('Middleware authentication error:', error)
    
    // On error, redirect to home page
    const homeUrl = new URL('/', request.url)
    homeUrl.searchParams.set('error', 'auth_error')
    return NextResponse.redirect(homeUrl)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}