import { NextRequest, NextResponse } from 'next/server'
import { signIn, signOut, handleSignIn } from '@logto/next/server-actions'
import { logtoConfig } from '@/lib/auth/logto-config'

export const runtime = 'nodejs'

export async function GET(request: NextRequest, { params }: { params: { logto: string[] } }) {
  const action = params.logto[0]
  const url = new URL(request.url)
  
  console.log('📥 Logto GET action:', action, 'URL:', request.url)
  
  try {
    switch (action) {
      case 'sign-in':
        // Redirect to Logto sign-in page
        console.log('🔄 Calling signIn...')
        return await signIn(logtoConfig)
        
      case 'sign-out':
        // Handle sign-out and redirect
        console.log('🔄 Calling signOut...')
        return await signOut(logtoConfig)
        
      case 'callback':
        // Handle OAuth callback
        console.log('🔄 Calling handleSignIn with params:', Object.fromEntries(url.searchParams.entries()))
        return await handleSignIn(logtoConfig, url.searchParams)
        
      default:
        console.log('❌ Unknown Logto action:', action)
        return NextResponse.json({ error: 'Unknown action' }, { status: 404 })
    }
  } catch (error) {
    // Check if this is a Next.js redirect (which is normal)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      console.log('✅ Next.js redirect triggered')
      throw error // Re-throw redirect errors to let Next.js handle them
    }
    
    console.error('❌ Logto GET error:', error)
    return NextResponse.json({ error: `Logto error: ${error}` }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { logto: string[] } }) {
  try {
    const action = params.logto[0]
    console.log('📥 Logto POST action:', action)
    
    // Most Logto actions are GET, but handle POST if needed
    switch (action) {
      case 'callback':
        // Some OAuth callbacks use POST
        const formData = await request.formData()
        const searchParams = new URLSearchParams()
        formData.forEach((value, key) => {
          searchParams.append(key, value.toString())
        })
        return await handleSignIn(logtoConfig, searchParams)
        
      default:
        return NextResponse.json({ error: 'POST not supported for this action' }, { status: 405 })
    }
  } catch (error) {
    console.error('❌ Logto POST error:', error)
    return NextResponse.json({ error: `Logto error: ${error}` }, { status: 500 })
  }
}