import { handleSignIn } from '@logto/next/server-actions'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'
import { logtoConfig } from '@/lib/auth/logto-config'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = request.url
  
  console.log('\n=== CUSTOM CALLBACK ROUTE DEBUG ===')
  console.log('Request URL:', url)
  console.log('Search Params:', Object.fromEntries(searchParams.entries()))
  console.log('Headers:', Object.fromEntries(request.headers.entries()))
  
  try {
    console.log('Attempting handleSignIn with Logto config...')
    await handleSignIn(logtoConfig, searchParams)
    console.log('✅ handleSignIn succeeded, redirecting to /profile')
    redirect('/profile')
  } catch (error) {
    console.error('❌ Authentication callback error details:')
    console.error('Error type:', error?.constructor?.name)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    if (error instanceof Error) {
      // Try to extract more details from Logto errors
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
    }
    
    // Redirect to home with error parameter for user feedback
    redirect('/?error=auth_failed')
  }
}