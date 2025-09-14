import { handleSignIn } from '@logto/next/server-actions'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'
import { logtoConfig } from '@/lib/auth/logto-config'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  console.log('🔄 Processing OAuth callback with params:', Object.fromEntries(searchParams.entries()))
  
  try {
    // Handle the OAuth callback
    await handleSignIn(logtoConfig, searchParams)
    
    console.log('✅ Authentication successful, redirecting to home')
    // Redirect to home page after successful authentication
    redirect('/')
  } catch (error) {
    console.error('❌ Authentication callback failed:', error)
    // Redirect to home with error parameter
    redirect('/?error=auth_failed')
  }
}