import { getLogtoContext } from '@logto/next/server-actions'
import { NextRequest, NextResponse } from 'next/server'
import { logtoConfig } from '@/lib/auth/logto-config'

interface CreateOrganizationRequest {
  name: string
  description?: string
}

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user context
    const context = await getLogtoContext(logtoConfig)
    
    if (!context.isAuthenticated || !context.claims?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = context.claims.sub
    const body: CreateOrganizationRequest = await request.json()
    
    // Validate input
    if (!body.name || body.name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Organization name must be at least 2 characters long' },
        { status: 400 }
      )
    }
    
    console.log(`📝 Creating organization: ${body.name} for user: ${userId}`)
    
    // Create organization via Logto Management API
    const managementApiUrl = process.env.LOGTO_MANAGEMENT_API_RESOURCE!
    const m2mToken = await getM2MToken()
    
    const createOrgResponse = await fetch(`${managementApiUrl}/organizations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${m2mToken}`,
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
    
    // Add user to organization with admin role
    const addUserResponse = await fetch(
      `${managementApiUrl}/organizations/${organization.id}/users`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${m2mToken}`,
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
          'Authorization': `Bearer ${m2mToken}`,
        }
      })
      throw new Error('Failed to add user to organization')
    }
    
    // Assign admin role to the user
    const assignRoleResponse = await fetch(
      `${managementApiUrl}/organizations/${organization.id}/users/${userId}/roles`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${m2mToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationRoleNames: ['admin']
        })
      }
    )
    
    if (!assignRoleResponse.ok) {
      console.warn('⚠️ Failed to assign admin role to user')
    }
    
    console.log(`✅ User ${userId} added to organization ${organization.id} as admin`)
    
    return NextResponse.json({
      organization,
      success: true
    })
  } catch (error) {
    console.error('❌ Error creating organization:', error)
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    )
  }
}

// Helper function to get M2M token
async function getM2MToken(): Promise<string> {
  const tokenUrl = `${process.env.LOGTO_ENDPOINT}/oidc/token`
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.LOGTO_M2M_APP_ID!,
    client_secret: process.env.LOGTO_M2M_APP_SECRET!,
    resource: process.env.LOGTO_MANAGEMENT_API_RESOURCE!,
    scope: 'all'
  })
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString()
  })
  
  if (!response.ok) {
    throw new Error('Failed to get M2M access token')
  }
  
  const tokenData = await response.json()
  return tokenData.access_token
}