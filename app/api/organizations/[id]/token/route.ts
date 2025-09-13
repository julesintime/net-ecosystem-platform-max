import { NextRequest, NextResponse } from 'next/server'
import { getLogtoContext } from '@logto/next/server-actions'
import { logtoConfig } from '@/lib/auth/logto-config'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getLogtoContext(logtoConfig)
    
    if (!context.isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const organizationId = params.id
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Get organization-scoped token from Logto
    try {
      const tokenResponse = await fetch(`${process.env.LOGTO_ENDPOINT}/oidc/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${context.accessToken}`,
        },
        body: new URLSearchParams({
          grant_type: 'urn:logto:grant-type:organization-token',
          organization_id: organizationId,
          scope: 'all', // Request all available scopes for the organization
        }),
      })

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text()
        console.error('Failed to get organization token:', error)
        return NextResponse.json(
          { error: 'Failed to get organization token' },
          { status: 403 }
        )
      }

      const tokenData = await tokenResponse.json()
      
      return NextResponse.json({
        accessToken: tokenData.access_token,
        tokenType: tokenData.token_type || 'Bearer',
        expiresIn: tokenData.expires_in,
      })
      
    } catch (error) {
      console.error('Token request error:', error)
      return NextResponse.json(
        { error: 'Failed to request organization token' },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('Organization token error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}