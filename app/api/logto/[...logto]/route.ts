import { NextRequest, NextResponse } from 'next/server'
import { handleSignIn } from '@logto/next/server-actions'
import { logtoConfig } from '@/lib/auth/logto-config'

export const GET = async (request: NextRequest) => {
  const url = new URL(request.url)
  const searchParams = url.searchParams
  
  try {
    // Handle the callback
    await handleSignIn(logtoConfig, searchParams)
    
    // Redirect to home page after successful authentication
    return NextResponse.redirect(new URL('/', request.url))
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
  }
}

export const POST = GET