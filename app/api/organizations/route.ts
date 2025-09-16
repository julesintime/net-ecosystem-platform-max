import { NextRequest, NextResponse } from 'next/server'
import { getLogtoContext } from '@logto/next/server-actions'
import { logtoConfig } from '@/lib/auth/logto-config'
import { logtoManagementClient } from '@/lib/auth/logto-management-client'

export async function GET(request: NextRequest) {
  try {
    // Check authentication using getLogtoContext
    const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)
    
    if (!isAuthenticated || !claims?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = claims.sub
    console.log('✅ User authenticated:', userId)

    // Get all organizations from Management API
    const allOrganizations = await logtoManagementClient.getOrganizations()
    
    // Filter organizations where user is a member
    const userOrganizations = []
    for (const org of allOrganizations) {
      const isMember = await logtoManagementClient.isUserInOrganization(org.id, userId)
      if (isMember) {
        userOrganizations.push(org)
      }
    }
    
    console.log(`✅ User ${userId} belongs to ${userOrganizations.length} organization(s)`)
    
    return NextResponse.json({ data: userOrganizations })
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
    
    const userId = claims.sub
    const body = await request.json()
    
    // Validate input
    if (!body.name || body.name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Organization name must be at least 2 characters long' },
        { status: 400 }
      )
    }
    
    console.log(`📝 Creating organization: ${body.name} for user: ${userId}`)
    
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
    
    // Create organization
    const managementApiUrl = process.env.LOGTO_MANAGEMENT_API_RESOURCE!
    const createOrgResponse = await fetch(`${managementApiUrl}/organizations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: body.name.trim(),
        description: body.description?.trim() || null,
        customData: {
          createdBy: userId,
          createdAt: new Date().toISOString()
        }
      })
    })
    
    if (!createOrgResponse.ok) {
      const error = await createOrgResponse.text()
      console.error('❌ Failed to create organization:', error)
      throw new Error('Failed to create organization')
    }
    
    const organization = await createOrgResponse.json()
    console.log(`✅ Created organization: ${organization.id}`)
    
    // Add user to organization
    const addUserResponse = await fetch(
      `${managementApiUrl}/organizations/${organization.id}/users`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: [userId]
        })
      }
    )
    
    if (!addUserResponse.ok) {
      console.error('❌ Failed to add user to organization')
      // Try to clean up by deleting the organization
      await fetch(`${managementApiUrl}/organizations/${organization.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${access_token}`,
        }
      })
      throw new Error('Failed to add user to organization')
    }
    
    // Try to assign admin role to the user
    try {
      await fetch(
        `${managementApiUrl}/organizations/${organization.id}/users/${userId}/roles`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            organizationRoleNames: ['admin']
          })
        }
      )
    } catch (roleError) {
      console.warn('⚠️ Failed to assign admin role, continuing without role assignment')
    }
    
    console.log(`✅ User ${userId} added to organization ${organization.id}`)
    
    return NextResponse.json({ data: organization })
  } catch (error) {
    console.error('❌ Error creating organization:', error)
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    )
  }
}

