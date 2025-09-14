import LogtoClient from '@logto/next'
import { NextRequest } from 'next/server'
import { logtoConfig } from '@/lib/auth/logto-config'

export const runtime = 'nodejs'

// Create Logto client
const logtoClient = new LogtoClient(logtoConfig)

// Handle all auth routes (sign-in, sign-out, callback)
export async function GET(request: NextRequest) {
  return logtoClient.handleAuthRoutes()(request)
}

export async function POST(request: NextRequest) {
  return logtoClient.handleAuthRoutes()(request)
}