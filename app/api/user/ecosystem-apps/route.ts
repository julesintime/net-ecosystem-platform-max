import { NextRequest, NextResponse } from 'next/server'
import { getLogtoContext } from '@logto/next/server-actions'
import { logtoConfig } from '@/lib/auth/logto-config'
import { ecosystemAccessManager } from '@/lib/auth/ecosystem-access-manager'

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user context
    const context = await getLogtoContext(logtoConfig)
    
    if (!context.isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = context.claims?.sub
    const userOrganizations = context.claims?.organizations || []
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in claims' },
        { status: 400 }
      )
    }

    console.log(`🎫 User ${userId} organizations from token:`, userOrganizations)

    // Fetch real ecosystem apps using Logto Management API
    const [userApps, stats] = await Promise.all([
      ecosystemAccessManager.getUserEcosystemApps(userId, userOrganizations),
      ecosystemAccessManager.getUserAccessStats(userId)
    ])

    return NextResponse.json({
      apps: userApps,
      totalCount: stats.totalApps,
      activeCount: stats.activeAccess,
      organizationCount: stats.organizationCount
    })

  } catch (error) {
    console.error('Error fetching user ecosystem apps:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}