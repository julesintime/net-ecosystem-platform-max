import { NextRequest, NextResponse } from 'next/server'
import { getLogtoContext } from '@logto/next/server-actions'
import { logtoConfig } from '@/lib/auth/logto-config'

// Mock storage - in production, use database
const userSettingsStore = new Map<string, Record<string, unknown>>()

export async function GET() {
  try {
    const context = await getLogtoContext(logtoConfig)
    
    if (!context.isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = context.claims?.sub
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 400 }
      )
    }

    // Get stored settings or return defaults
    const storedSettings = userSettingsStore.get(userId) || {}
    
    // Merge with user claims for basic info
    const settings = {
      displayName: context.claims?.name || '',
      email: context.claims?.email || '',
      ...storedSettings,
    }

    return NextResponse.json({
      settings,
    })
    
  } catch (error) {
    console.error('Profile settings GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const context = await getLogtoContext(logtoConfig)
    
    if (!context.isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = context.claims?.sub
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings data' },
        { status: 400 }
      )
    }

    // Store the settings (in production, save to database)
    userSettingsStore.set(userId, {
      ...userSettingsStore.get(userId) || {},
      ...settings,
      updatedAt: new Date().toISOString(),
    })

    // Return updated settings
    const updatedSettings = {
      displayName: context.claims?.name || '',
      email: context.claims?.email || '',
      ...userSettingsStore.get(userId),
    }

    return NextResponse.json({
      settings: updatedSettings,
      message: 'Settings updated successfully',
    })
    
  } catch (error) {
    console.error('Profile settings PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}