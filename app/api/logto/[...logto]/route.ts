import { handleSignIn } from '@logto/next/server-actions'
import { logtoConfig } from '@/lib/auth/logto-config'
import { NextRequest } from 'next/server'

// Create a wrapper to add debugging
async function debugHandleSignIn(request: NextRequest) {
  const url = request.url
  const searchParams = request.nextUrl.searchParams
  const logtoPath = request.nextUrl.pathname.replace('/api/logto/', '')
  
  console.log('\n=== LOGTO SDK CALLBACK DEBUG ===')
  console.log('Request URL:', url)
  console.log('Logto Path:', logtoPath)
  console.log('Search Params:', Object.fromEntries(searchParams.entries()))
  console.log('Headers:', Object.fromEntries(request.headers.entries()))
  
  try {
    console.log('Calling Logto SDK handleSignIn...')
    const handler = handleSignIn(logtoConfig)
    const response = await handler(request)
    console.log('✅ Logto SDK response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    return response
  } catch (error) {
    console.error('❌ Logto SDK error details:')
    console.error('Error type:', error?.constructor?.name)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    if (error instanceof Error) {
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
    }
    
    throw error // Re-throw to maintain original behavior
  }
}

export const GET = debugHandleSignIn