import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // This route exists to handle legacy callbacks or misconfigurations
  // The actual OAuth callback should go to /api/logto/callback
  
  const searchParams = request.nextUrl.searchParams
  const params = searchParams.toString()
  
  console.log('\n=== LEGACY CALLBACK ROUTE ===')
  console.log('Redirecting to Logto SDK callback handler')
  console.log('Parameters:', params)
  
  // Redirect to the correct Logto SDK callback route with all parameters
  const redirectUrl = `/api/logto/callback${params ? `?${params}` : ''}`
  console.log('Redirecting to:', redirectUrl)
  
  return NextResponse.redirect(new URL(redirectUrl, request.url))
}