import { getLogtoContext } from '@logto/next/server-actions'
import { signOut } from '@logto/next/server-actions'
import { NextRequest, NextResponse } from 'next/server'
import { logtoConfig } from '@/lib/auth/logto-config'

export async function DELETE(request: NextRequest) {
  try {
    // Get the authenticated user context
    const context = await getLogtoContext(logtoConfig)
    
    if (!context.isAuthenticated || !context.claims?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = context.claims.sub
    
    console.log(`🗑️ User ${userId} requested account deletion`)
    
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
    
    // Delete user via Logto Management API
    const managementApiUrl = process.env.LOGTO_MANAGEMENT_API_RESOURCE!
    const deleteResponse = await fetch(`${managementApiUrl}/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${access_token}`,
      }
    })
    
    if (!deleteResponse.ok) {
      const error = await deleteResponse.text()
      console.error('❌ Failed to delete user:', error)
      
      // Check if it's a self-deletion error
      if (deleteResponse.status === 400) {
        return NextResponse.json(
          { error: 'Cannot delete your own account while logged in as admin' },
          { status: 400 }
        )
      }
      
      throw new Error('Failed to delete user account')
    }
    
    console.log(`✅ User ${userId} deleted successfully from Logto`)
    
    // Clear local session
    try {
      await signOut(logtoConfig, { redirectUri: '/' })
    } catch (error) {
      console.log('Session already cleared')
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    })
    
  } catch (error) {
    console.error('❌ Error deleting user account:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}

// Endpoint to verify deletion (for testing)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }
    
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
    
    // Check if user exists
    const managementApiUrl = process.env.LOGTO_MANAGEMENT_API_RESOURCE!
    const userResponse = await fetch(`${managementApiUrl}/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      }
    })
    
    if (userResponse.status === 404) {
      return NextResponse.json({
        exists: false,
        message: 'User not found'
      })
    }
    
    if (!userResponse.ok) {
      throw new Error('Failed to check user existence')
    }
    
    const userData = await userResponse.json()
    
    return NextResponse.json({
      exists: true,
      user: {
        id: userData.id,
        username: userData.username,
        primaryEmail: userData.primaryEmail
      }
    })
    
  } catch (error) {
    console.error('❌ Error checking user:', error)
    return NextResponse.json(
      { error: 'Failed to check user' },
      { status: 500 }
    )
  }
}