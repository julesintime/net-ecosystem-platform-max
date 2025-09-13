import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Basic health check
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      auth: {
        logto: {
          endpoint: !!process.env.LOGTO_ENDPOINT,
          appId: !!process.env.LOGTO_APP_ID,
          appSecret: !!process.env.LOGTO_APP_SECRET,
          configured: !!(process.env.LOGTO_ENDPOINT && process.env.LOGTO_APP_ID && process.env.LOGTO_APP_SECRET)
        }
      }
    }

    // Test critical auth configuration
    if (!healthStatus.auth.logto.configured) {
      return NextResponse.json(
        {
          ...healthStatus,
          status: 'degraded',
          warnings: ['Logto authentication not fully configured']
        },
        { status: 200 }
      )
    }

    return NextResponse.json(healthStatus, { status: 200 })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
}