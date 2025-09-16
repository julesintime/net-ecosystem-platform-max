import { getLogtoContext } from '@logto/next/server-actions'
import { NextRequest, NextResponse } from 'next/server'
import { logtoConfig } from '@/lib/auth/logto-config'

// GET /api/organizations/invitations - Check for pending invitations
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user context
    const context = await getLogtoContext(logtoConfig)
    
    if (!context.isAuthenticated || !context.claims?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = context.claims.sub
    const userEmail = context.claims?.email
    
    if (!userEmail) {
      return NextResponse.json({ 
        invitations: [],
        message: 'No email associated with account' 
      })
    }
    
    console.log(`🔍 Checking invitations for user: ${userId} (${userEmail})`)
    
    // Get M2M token for Management API
    const tokenUrl = `${process.env.LOGTO_ENDPOINT}/oidc/token`
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.LOGTO_M2M_APP_ID!,
      client_secret: process.env.LOGTO_M2M_APP_SECRET!,
      resource: process.env.LOGTO_MANAGEMENT_API_RESOURCE!,
      scope: 'all'
    })
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    })
    
    if (!tokenResponse.ok) {
      throw new Error('Failed to get M2M access token')
    }
    
    const { access_token } = await tokenResponse.json()
    
    // Query organization invitations for this user's email
    const managementApiUrl = process.env.LOGTO_MANAGEMENT_API_RESOURCE!
    const invitationsResponse = await fetch(
      `${managementApiUrl}/organization-invitations?invitee=${encodeURIComponent(userEmail)}`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        }
      }
    )
    
    if (!invitationsResponse.ok) {
      console.error('Failed to fetch invitations:', await invitationsResponse.text())
      return NextResponse.json({ 
        invitations: [],
        message: 'Failed to fetch invitations' 
      })
    }
    
    const invitations = await invitationsResponse.json()
    
    // Filter for pending invitations
    const pendingInvitations = invitations.filter(
      (inv: any) => inv.status === 'Pending' && inv.expiresAt > Date.now()
    )
    
    console.log(`✅ Found ${pendingInvitations.length} pending invitation(s)`)
    
    return NextResponse.json({ 
      invitations: pendingInvitations,
      hasInvitations: pendingInvitations.length > 0
    })
    
  } catch (error) {
    console.error('❌ Error checking invitations:', error)
    return NextResponse.json(
      { error: 'Failed to check invitations' },
      { status: 500 }
    )
  }
}

// POST /api/organizations/invitations/:id/accept - Accept an invitation
export async function POST(request: NextRequest) {
  try {
    const context = await getLogtoContext(logtoConfig)
    
    if (!context.isAuthenticated || !context.claims?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = context.claims.sub
    const body = await request.json()
    const { invitationId } = body
    
    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID required' },
        { status: 400 }
      )
    }
    
    console.log(`✅ Accepting invitation ${invitationId} for user ${userId}`)
    
    // Get M2M token
    const tokenUrl = `${process.env.LOGTO_ENDPOINT}/oidc/token`
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.LOGTO_M2M_APP_ID!,
      client_secret: process.env.LOGTO_M2M_APP_SECRET!,
      resource: process.env.LOGTO_MANAGEMENT_API_RESOURCE!,
      scope: 'all'
    })
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    })
    
    if (!tokenResponse.ok) {
      throw new Error('Failed to get M2M access token')
    }
    
    const { access_token } = await tokenResponse.json()
    
    // Accept the invitation
    const managementApiUrl = process.env.LOGTO_MANAGEMENT_API_RESOURCE!
    const acceptResponse = await fetch(
      `${managementApiUrl}/organization-invitations/${invitationId}/status`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'Accepted',
          acceptedUserId: userId
        })
      }
    )
    
    if (!acceptResponse.ok) {
      const error = await acceptResponse.text()
      console.error('Failed to accept invitation:', error)
      throw new Error('Failed to accept invitation')
    }
    
    console.log(`✅ Invitation ${invitationId} accepted successfully`)
    
    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully'
    })
    
  } catch (error) {
    console.error('❌ Error accepting invitation:', error)
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    )
  }
}