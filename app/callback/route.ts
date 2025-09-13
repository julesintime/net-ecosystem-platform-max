import { handleSignIn } from '@logto/next/server-actions'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'
import { logtoConfig } from '@/lib/auth/logto-config'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  try {
    await handleSignIn(logtoConfig, searchParams)
    // Redirect to profile page after successful authentication
    redirect('/profile')
  } catch (error) {
    console.error('Authentication callback error:', error)
    // Redirect to home with error parameter for user feedback
    redirect('/?error=auth_failed')
  }
}