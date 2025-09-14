import { NextRequest, NextResponse } from 'next/server'
import { getLogtoContext } from '@logto/next/server-actions'
import { logtoConfig } from '@/lib/auth/logto-config'

export async function GET(request: NextRequest) {
  try {
    // Check authentication using getLogtoContext
    const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)
    
    if (!isAuthenticated || !claims?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated:', claims.sub)

    // Organizations are included in the user's ID token claims
    // No need for M2M API - they're already available in the token
    const organizations = claims.organizations || []
    
    console.log('✅ Organizations from token claims:', organizations.length)

    // Return organization data in expected format
    // For now, return minimal org data with just IDs
    // In a full implementation, you'd get org details via getOrganizationToken
    const organizationData = organizations.map(orgId => ({
      id: orgId,
      name: `Organization ${orgId}`, // Placeholder - would get real name from token
      description: '',
      branding: {}
    }))
    
    return NextResponse.json({ data: organizationData })
  } catch (error) {
    console.error('❌ Organizations API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

