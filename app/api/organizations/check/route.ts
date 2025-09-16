import { getLogtoContext } from '@logto/next/server-actions'
import { NextResponse } from 'next/server'
import { logtoConfig } from '@/lib/auth/logto-config'
import { logtoManagementClient } from '@/lib/auth/logto-management-client'

export async function GET() {
  try {
    // Get the authenticated user context
    const context = await getLogtoContext(logtoConfig)
    
    if (!context.isAuthenticated || !context.claims?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = context.claims.sub
    
    console.log(`🔍 Checking organizations for user: ${userId}`)
    
    // Get all organizations
    const organizations = await logtoManagementClient.getOrganizations()
    
    // Check which organizations the user belongs to
    const userOrganizations = []
    for (const org of organizations) {
      const isMember = await logtoManagementClient.isUserInOrganization(org.id, userId)
      if (isMember) {
        userOrganizations.push(org)
      }
    }
    
    console.log(`✅ User ${userId} belongs to ${userOrganizations.length} organization(s)`)
    
    return NextResponse.json({ 
      organizations: userOrganizations,
      hasOrganizations: userOrganizations.length > 0,
      userId 
    })
  } catch (error) {
    console.error('❌ Error checking user organizations:', error)
    return NextResponse.json(
      { error: 'Failed to check organizations' },
      { status: 500 }
    )
  }
}