import { type NextRequest } from 'next/server'
import LogtoClient from '@logto/next'
import { logtoConfig } from '@/lib/auth/logto-config'

// Create Logto client once
const client = new LogtoClient(logtoConfig)

// For Next.js App Router, we need to handle each route explicitly
export async function GET(request: NextRequest, context: { params: { logto: string[] } }) {
  try {
    const { logto } = context.params
    const action = logto[0] // sign-in, sign-out, callback, etc.
    
    console.log('Logto route action:', action, 'Full path:', logto.join('/'))
    
    // Use the client's handleAuthRoutes but with proper Next.js App Router integration
    const handler = client.handleAuthRoutes()
    return await handler(request)
  } catch (error) {
    console.error('Logto route error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

export async function POST(request: NextRequest, context: { params: { logto: string[] } }) {
  try {
    const { logto } = context.params
    const action = logto[0]
    
    console.log('Logto POST route action:', action, 'Full path:', logto.join('/'))
    
    const handler = client.handleAuthRoutes()
    return await handler(request)
  } catch (error) {
    console.error('Logto POST route error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}