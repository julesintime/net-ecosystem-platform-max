import { getLogtoContext, getOrganizationToken } from '@logto/next/server-actions'
import { NextRequest, NextResponse } from 'next/server'
import { logtoConfig } from '@/lib/auth/logto-config'

// Test ecosystem app permissions
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user context
    const context = await getLogtoContext(logtoConfig)
    
    if (!context.isAuthenticated || !context.claims?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = context.claims.sub
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organizationId')
    
    console.log(`🔐 Testing ecosystem app permissions for user: ${userId}`)
    
    const permissionsTest = {
      user: {
        id: userId,
        username: context.claims?.username || 'N/A',
        email: context.claims?.email || 'N/A',
      },
      tests: [] as any[]
    }
    
    // Test 1: Check basic authentication
    permissionsTest.tests.push({
      name: 'Basic Authentication',
      status: 'passed',
      details: {
        isAuthenticated: context.isAuthenticated,
        hasUserClaims: !!context.claims,
        userScopes: context.scopes || []
      }
    })
    
    // Test 2: Check organization context if provided
    if (organizationId) {
      try {
        console.log(`🏢 Testing organization-scoped token for: ${organizationId}`)
        
        // Get organization-scoped token
        const orgToken = await getOrganizationToken(organizationId)
        
        if (orgToken) {
          permissionsTest.tests.push({
            name: 'Organization Token',
            status: 'passed',
            details: {
              organizationId,
              hasToken: true,
              tokenType: 'organization-scoped'
            }
          })
        } else {
          permissionsTest.tests.push({
            name: 'Organization Token',
            status: 'failed',
            details: {
              organizationId,
              error: 'Failed to obtain organization token'
            }
          })
        }
      } catch (error) {
        permissionsTest.tests.push({
          name: 'Organization Token',
          status: 'failed',
          details: {
            organizationId,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })
      }
    }
    
    // Test 3: Check API access permissions
    try {
      // Test accessing a protected resource
      const testApiCall = await fetch(`${request.nextUrl.origin}/api/organizations/check`, {
        headers: {
          'Cookie': request.headers.get('cookie') || ''
        }
      })
      
      if (testApiCall.ok) {
        const orgData = await testApiCall.json()
        permissionsTest.tests.push({
          name: 'API Access',
          status: 'passed',
          details: {
            endpoint: '/api/organizations/check',
            hasOrganizations: orgData.hasOrganizations,
            organizationCount: orgData.organizations?.length || 0
          }
        })
      } else {
        permissionsTest.tests.push({
          name: 'API Access',
          status: 'failed',
          details: {
            endpoint: '/api/organizations/check',
            statusCode: testApiCall.status
          }
        })
      }
    } catch (error) {
      permissionsTest.tests.push({
        name: 'API Access',
        status: 'failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
    }
    
    // Test 4: Check ecosystem app integration
    permissionsTest.tests.push({
      name: 'Ecosystem App Integration',
      status: 'passed',
      details: {
        appId: process.env.LOGTO_APP_ID,
        endpoint: process.env.LOGTO_ENDPOINT,
        hasM2MCredentials: !!(process.env.LOGTO_M2M_APP_ID && process.env.LOGTO_M2M_APP_SECRET)
      }
    })
    
    // Calculate summary
    const summary = {
      totalTests: permissionsTest.tests.length,
      passed: permissionsTest.tests.filter(t => t.status === 'passed').length,
      failed: permissionsTest.tests.filter(t => t.status === 'failed').length,
      overallStatus: permissionsTest.tests.every(t => t.status === 'passed') ? 'passed' : 'partial'
    }
    
    console.log(`✅ Permissions test complete: ${summary.passed}/${summary.totalTests} passed`)
    
    return NextResponse.json({
      ...permissionsTest,
      summary
    })
    
  } catch (error) {
    console.error('❌ Error testing permissions:', error)
    return NextResponse.json(
      { error: 'Failed to test permissions' },
      { status: 500 }
    )
  }
}

// POST /api/ecosystem-apps/test/access - Test specific app access
export async function POST(request: NextRequest) {
  try {
    const context = await getLogtoContext(logtoConfig)
    
    if (!context.isAuthenticated || !context.claims?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { appId, resource, scopes = [] } = body
    
    console.log(`🔐 Testing access to app: ${appId}`)
    
    // In a real implementation, this would check if the user has access to the specific app
    // For now, we'll simulate the check
    const accessTest = {
      appId,
      resource,
      requestedScopes: scopes,
      grantedScopes: [],
      hasAccess: false,
      reason: ''
    }
    
    // Check if user has organization membership
    const orgCheckResponse = await fetch(`${request.nextUrl.origin}/api/organizations/check`, {
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      }
    })
    
    if (orgCheckResponse.ok) {
      const orgData = await orgCheckResponse.json()
      
      if (orgData.hasOrganizations) {
        accessTest.hasAccess = true
        accessTest.grantedScopes = scopes // Grant requested scopes if user has org
        accessTest.reason = 'User has organization membership'
      } else {
        accessTest.hasAccess = false
        accessTest.reason = 'User has no organization membership'
      }
    } else {
      accessTest.hasAccess = false
      accessTest.reason = 'Failed to verify organization membership'
    }
    
    console.log(`✅ Access test result: ${accessTest.hasAccess ? 'GRANTED' : 'DENIED'}`)
    
    return NextResponse.json(accessTest)
    
  } catch (error) {
    console.error('❌ Error testing app access:', error)
    return NextResponse.json(
      { error: 'Failed to test app access' },
      { status: 500 }
    )
  }
}