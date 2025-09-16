import { NextRequest, NextResponse } from 'next/server'
import { getLogtoContext } from '@logto/next/server-actions'
import { logtoConfig } from '@/lib/auth/logto-config'
import { ecosystemAccessManager } from '@/lib/auth/ecosystem-access-manager'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
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

    const { action } = await request.json()
    const resolvedParams = await params
    const { id: applicationId } = resolvedParams

    if (!action || !['grant', 'revoke'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "grant" or "revoke"' },
        { status: 400 }
      )
    }

    console.log(`🎫 User ${userId} has ${userOrganizations.length} organizations in token:`, userOrganizations)

    // Use real Logto Management API calls
    if (action === 'grant') {
      await ecosystemAccessManager.grantUserAppAccess(userId, applicationId, userOrganizations)
    } else {
      await ecosystemAccessManager.revokeUserAppAccess(userId, applicationId)
    }

    return NextResponse.json({
      success: true,
      action,
      applicationId,
      userId,
      message: `Access ${action === 'grant' ? 'granted' : 'revoked'} successfully`
    })

  } catch (error) {
    console.error('Error updating application access:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}