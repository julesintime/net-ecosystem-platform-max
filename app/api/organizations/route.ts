import { NextRequest, NextResponse } from 'next/server'
import { getLogtoContext } from '@logto/next/server-actions'
import { logtoConfig } from '@/lib/auth/logto-config'

const MANAGEMENT_API_BASE = process.env.LOGTO_MANAGEMENT_API_ENDPOINT || `${process.env.LOGTO_ENDPOINT}/api`

/**
 * Get management API access token using M2M credentials
 */
async function getManagementApiToken(): Promise<string> {
  const clientId = process.env.LOGTO_M2M_APP_ID
  const clientSecret = process.env.LOGTO_M2M_APP_SECRET
  const tokenEndpoint = `${process.env.LOGTO_ENDPOINT}/oidc/token`

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      resource: process.env.LOGTO_MANAGEMENT_API_RESOURCE!,
      scope: 'all'
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to get M2M token: ${response.status}`)
  }

  const data = await response.json()
  return data.access_token
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication using getLogtoContext (not JWT middleware)
    const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)
    
    if (!isAuthenticated || !claims?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated:', claims.sub)

    // Get M2M token for Management API
    const token = await getManagementApiToken()

    // Fetch organizations for the authenticated user
    const response = await fetch(`${MANAGEMENT_API_BASE}/users/${claims.sub}/organizations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('Management API error:', response.status, await response.text())
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: response.status })
    }

    const organizations = await response.json()
    console.log('✅ Organizations fetched:', organizations.length)

    return NextResponse.json(organizations)
  } catch (error) {
    console.error('❌ Organizations API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)
    
    if (!isAuthenticated || !claims?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const token = await getManagementApiToken()

    // Create organization via Management API
    const response = await fetch(`${MANAGEMENT_API_BASE}/organizations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to create organization' }, { status: response.status })
    }

    const organization = await response.json()
    return NextResponse.json(organization, { status: 201 })
  } catch (error) {
    console.error('❌ Create organization error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}