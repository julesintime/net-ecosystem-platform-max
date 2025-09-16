import { handleSignIn } from '@logto/next/server-actions'
import { getLogtoContext } from '@logto/next/server-actions'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'
import { logtoConfig } from '@/lib/auth/logto-config'
import { logtoManagementClient } from '@/lib/auth/logto-management-client'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  console.log('🔄 Processing OAuth callback with params:', Object.fromEntries(searchParams.entries()))
  
  await handleSignIn(logtoConfig, searchParams)
  
  console.log('✅ Authentication successful, checking organizations')
  
  // Get the authenticated user context
  const context = await getLogtoContext(logtoConfig)
  
  if (context.isAuthenticated && context.claims?.sub) {
    const userId = context.claims.sub
    
    try {
      // Check if user has any organizations
      const organizations = await logtoManagementClient.getOrganizations()
      let hasOrganization = false
      
      for (const org of organizations) {
        const isMember = await logtoManagementClient.isUserInOrganization(org.id, userId)
        if (isMember) {
          hasOrganization = true
          break
        }
      }
      
      if (!hasOrganization) {
        console.log('👤 New user without organization, redirecting to onboarding')
        redirect('/onboarding')
      }
    } catch (error) {
      console.error('Error checking user organizations:', error)
      // Continue to home page on error
    }
  }
  
  console.log('✅ User has organization, redirecting to home')
  redirect('/')
}