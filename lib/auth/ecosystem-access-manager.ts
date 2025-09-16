import { logtoManagementClient } from './logto-management-client'
import { ecosystemCache } from './cache-manager'

export interface EcosystemApp {
  id: string
  name: string
  description: string
  url?: string
  iconUrl?: string
  organizationId: string
  organizationName: string
  hasAccess: boolean
  lastAccessed?: Date
  permissions: string[]
  appType: 'first-party' | 'third-party'
  logtoType: string // 'Traditional', 'SPA', 'Native', 'MachineToMachine'
}

export interface EcosystemAccessStats {
  totalApps: number
  activeAccess: number
  organizationCount: number
}

export class EcosystemAccessManager {
  // Get all ecosystem applications that the user can potentially access
  async getUserEcosystemApps(userId: string, userOrganizations?: string[]): Promise<EcosystemApp[]> {
    // Check cache first
    const cacheKey = `user:${userId}:ecosystem-apps`
    const cached = ecosystemCache.get<EcosystemApp[]>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      // Get all applications from Logto
      console.log(`🔍 Fetching applications for user: ${userId}`)
      console.log(`👤 User organizations from token:`, userOrganizations || 'Not provided')
      const allApplications = await logtoManagementClient.getApplications()
      console.log(`📱 Found ${allApplications.length} total applications`)
      
      // Log ALL applications to debug missing app hxhsijeu0xy3bplqr79v9
      console.log(`🔎 ALL APPLICATIONS DEBUG:`)
      allApplications.forEach(app => {
        console.log(`   - ID: ${app.id}, Name: ${app.name}, Type: ${app.type}, IsThirdParty: ${app.isThirdParty}`)
        if (app.id === 'hxhsijeu0xy3bplqr79v9') {
          console.log(`   🎯 FOUND TARGET APP! Details:`, app)
        }
      })
      
      // Check specifically for the target app
      const targetApp = allApplications.find(app => app.id === 'hxhsijeu0xy3bplqr79v9')
      if (targetApp) {
        console.log(`✅ Target app hxhsijeu0xy3bplqr79v9 EXISTS in response:`, {
          id: targetApp.id,
          name: targetApp.name,
          type: targetApp.type,
          isThirdParty: targetApp.isThirdParty
        })
      } else {
        console.log(`❌ Target app hxhsijeu0xy3bplqr79v9 NOT FOUND in API response!`)
      }
      
      // Separate first-party and third-party apps
      const firstPartyApps = allApplications.filter(app => 
        (app.type === 'Traditional' || app.type === 'SPA' || app.type === 'Native') && !app.isThirdParty
      )
      const thirdPartyApps = allApplications.filter(app => app.isThirdParty)
      
      console.log(`🏠 Found ${firstPartyApps.length} first-party applications:`, firstPartyApps.map(app => ({ id: app.id, name: app.name, type: app.type })))
      console.log(`🌐 Found ${thirdPartyApps.length} third-party applications:`, thirdPartyApps.map(app => ({ id: app.id, name: app.name, type: app.type })))
      
      // Check specifically for fumadocs
      const fumadocs = firstPartyApps.find(app => app.id === 'hxhsijeu0xy3bplqr79v9')
      if (fumadocs) {
        console.log(`✅ FOUND FUMADOCS:`, fumadocs)
      } else {
        console.log(`❌ FUMADOCS NOT FOUND in first-party apps`)
      }
      
      // Combine all ecosystem apps
      const allEcosystemApps = [...firstPartyApps, ...thirdPartyApps]
      console.log(`🔗 Total ecosystem applications: ${allEcosystemApps.length}`)
      
      // Get all organizations
      const allOrganizations = await logtoManagementClient.getOrganizations()
      console.log(`🏢 Found ${allOrganizations.length} organizations:`, allOrganizations.map(org => ({ id: org.id, name: org.name })))
      
      const userEcosystemApps: EcosystemApp[] = []
      
      // For each ecosystem application, check user's access properly
      for (const app of allEcosystemApps) {
        try {
          console.log(`🔐 Processing app: ${app.name} (${app.id}) - Type: ${app.type}, Third-party: ${app.isThirdParty}`)
          
          let hasAccess = false
          let organizationId = 'standalone'
          let organizationName = 'Global Applications'
          
          if (app.isThirdParty) {
            // Third-party apps require user consent
            console.log(`🌐 Third-party app ${app.name} - checking user consent`)
            const userConsentOrgs = await logtoManagementClient.getUserConsentOrganizations(app.id, userId)
            hasAccess = userConsentOrgs.length > 0
            console.log(`✅ User has consented to ${userConsentOrgs.length} organizations for ${app.name}`)
            
            if (userConsentOrgs.length > 0) {
              // Use the first consented organization
              organizationId = userConsentOrgs[0].id
              organizationName = userConsentOrgs[0].name
            }
          } else {
            // First-party apps - check if they're in user's organizations OR if user has explicit access
            console.log(`🏠 First-party app ${app.name} - checking organization membership`)
            
            let foundInOrg = false
            
            // Check if app is in any of the user's organizations (from token)
            if (userOrganizations && userOrganizations.length > 0) {
              for (const orgId of userOrganizations) {
                try {
                  const org = allOrganizations.find(o => o.id === orgId)
                  if (!org) {
                    console.log(`⚠️ Organization ${orgId} not found in available organizations`)
                    continue
                  }
                  
                  // Check if app is in this organization
                  const orgApps = await logtoManagementClient.getOrganizationApplications(org.id)
                  if (orgApps.some(orgApp => orgApp.id === app.id)) {
                    console.log(`✅ App ${app.name} found in user's organization: ${org.name}`)
                    hasAccess = true
                    organizationId = org.id
                    organizationName = org.name
                    foundInOrg = true
                    break
                  }
                } catch (error) {
                  console.log(`❌ Can't check organization apps for ${orgId}:`, error)
                  continue
                }
              }
            } else {
              console.log(`⚠️ User has no organizations in token - checking all organizations`)
              // Fallback to checking all organizations if no token organizations provided
              for (const org of allOrganizations) {
                try {
                  const orgApps = await logtoManagementClient.getOrganizationApplications(org.id)
                  if (orgApps.some(orgApp => orgApp.id === app.id)) {
                    console.log(`✅ App ${app.name} found in organization: ${org.name} (fallback check)`)
                    hasAccess = true
                    organizationId = org.id
                    organizationName = org.name
                    foundInOrg = true
                    break
                  }
                } catch (error) {
                  console.log(`❌ Can't check organization ${org.name}:`, error)
                  continue
                }
              }
            }
            
            if (!foundInOrg) {
              console.log(`🌍 First-party app ${app.name} not found in user's organizations - checking if globally accessible`)
              
              // For apps like the current platform itself, check if they should be globally accessible
              // Apps that aren't in any organization might be platform-wide (like the current ecosystem platform)
              const isCurrentPlatform = app.name.includes('ecosystem') || app.name.includes('platform')
              
              // If user is in at least one organization, allow access to standalone first-party apps
              const userInOrganization = userOrganizations && userOrganizations.length > 0
              
              if (isCurrentPlatform) {
                console.log(`🌐 App ${app.name} appears to be the current platform - granting access`)
                hasAccess = true
                organizationName = 'Platform Access'
              } else if (userInOrganization) {
                console.log(`✅ App ${app.name} - user is organization member, granting access to standalone app`)
                hasAccess = true
                organizationName = 'Organization Member Access'
              } else {
                console.log(`❌ App ${app.name} not accessible - no organization membership`)
                hasAccess = false
                organizationName = 'No Access'
              }
            }
          }
          
          const url = this.extractAppUrl(app)
          
          userEcosystemApps.push({
            id: app.id,
            name: app.name,
            description: app.description || '',
            url,
            iconUrl: undefined,
            organizationId,
            organizationName,
            hasAccess,
            lastAccessed: undefined,
            permissions: [],
            appType: app.isThirdParty ? 'third-party' : 'first-party',
            logtoType: app.type
          })
          
          console.log(`📝 Added ${app.name} - hasAccess: ${hasAccess}, org: ${organizationName}`)
          
        } catch (error) {
          console.error(`❌ Error processing app ${app.id}:`, error)
          // Continue with other apps
        }
      }
      
      // Cache the result for 5 minutes
      ecosystemCache.set(cacheKey, userEcosystemApps, 300)
      
      return userEcosystemApps
    } catch (error) {
      console.error('Error fetching user ecosystem apps:', error)
      throw new Error('Failed to fetch ecosystem applications')
    }
  }

  // Grant user access to an application
  async grantUserAppAccess(userId: string, applicationId: string, userOrganizations?: string[]): Promise<void> {
    try {
      console.log(`🎯 Granting access for user ${userId} to app ${applicationId}`)
      console.log(`👤 User organizations from token:`, userOrganizations || 'Not provided')
      
      // First get the application details to understand if it's third-party
      const app = await logtoManagementClient.getApplication(applicationId)
      console.log(`📱 App details: ${app.name} - Type: ${app.type}, Third-party: ${app.isThirdParty}`)
      
      if (app.isThirdParty) {
        // For third-party apps, we need to grant consent to user's organizations
        console.log(`🌐 Third-party app - granting consent to user's organizations`)
        
        // Use organizations from user token if available
        if (userOrganizations && userOrganizations.length > 0) {
          console.log(`🎫 Using ${userOrganizations.length} organizations from user token`)
          
          // Grant consent to user's organizations from token
          await logtoManagementClient.grantUserConsentOrganizations(
            applicationId,
            userId,
            userOrganizations
          )
          
          console.log(`✅ Granted consent for third-party app ${app.name} to ${userOrganizations.length} organizations`)
        } else {
          // Fallback: get all available organizations
          console.log(`⚠️ No organizations in user token - using fallback approach`)
          const organizations = await logtoManagementClient.getOrganizations()
          
          if (organizations.length === 0) {
            throw new Error('No organizations available. Contact your administrator to create an organization.')
          }
          
          // Grant consent to all available organizations (admin approval may be required)
          const allOrgIds = organizations.map(org => org.id)
          await logtoManagementClient.grantUserConsentOrganizations(
            applicationId,
            userId,
            allOrgIds
          )
          
          console.log(`✅ Granted consent request for third-party app ${app.name} to ${allOrgIds.length} organizations (pending admin approval)`)
        }
        
      } else {
        // For first-party apps, check if user should get access
        console.log(`🏠 First-party app - checking if access can be granted`)
        
        // Check if this app should be globally accessible (platform apps)
        const isCurrentPlatform = app.name.includes('ecosystem') || app.name.includes('platform')
        
        if (isCurrentPlatform) {
          console.log(`✅ First-party app ${app.name} is a platform app - access granted globally`)
        } else {
          // Check if user is member of any organization
          const organizations = await logtoManagementClient.getOrganizations()
          let userIsInOrganization = false
          let appFoundInOrg = false
          
          for (const org of organizations) {
            try {
              const isUserInOrg = await logtoManagementClient.isUserInOrganization(org.id, userId)
              if (isUserInOrg) {
                userIsInOrganization = true
                console.log(`✅ User is member of organization ${org.name}`)
                
                const orgApps = await logtoManagementClient.getOrganizationApplications(org.id)
                if (orgApps.some(orgApp => orgApp.id === applicationId)) {
                  appFoundInOrg = true
                  console.log(`✅ App ${app.name} found in organization ${org.name}`)
                  break
                }
              }
            } catch (error) {
              console.log(`❌ Error checking organization access:`, error)
              continue
            }
          }
          
          if (!userIsInOrganization) {
            throw new Error(`You must be a member of at least one organization to access applications. Please contact your administrator.`)
          }
          
          // For first-party apps not in any organization, grant access if user is in an organization
          if (!appFoundInOrg) {
            console.log(`⚠️ First-party app ${app.name} not found in any organization, but user is organization member - granting access`)
          }
        }
        
        console.log(`✅ First-party app ${app.name} access confirmed`)
      }

      // Invalidate cache
      ecosystemCache.delete(`user:${userId}:ecosystem-apps`)
    } catch (error) {
      console.error('Error granting user app access:', error)
      throw new Error(`Failed to grant application access: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Revoke user access to an application
  async revokeUserAppAccess(userId: string, applicationId: string): Promise<void> {
    try {
      // Get current consent organizations for this app
      const consentOrganizations = await logtoManagementClient.getUserConsentOrganizations(
        applicationId,
        userId
      )
      
      // Revoke consent for each organization
      for (const org of consentOrganizations) {
        await logtoManagementClient.revokeUserConsentOrganization(
          applicationId,
          userId,
          org.id
        )
      }

      // Invalidate cache
      ecosystemCache.delete(`user:${userId}:ecosystem-apps`)
    } catch (error) {
      console.error('Error revoking user app access:', error)
      throw new Error('Failed to revoke application access')
    }
  }

  // Check if user has access to a specific application
  async checkUserAppAccess(userId: string, applicationId: string): Promise<boolean> {
    try {
      const consentOrganizations = await logtoManagementClient.getUserConsentOrganizations(
        applicationId,
        userId
      )
      return consentOrganizations.length > 0
    } catch (error) {
      console.error('Error checking user app access:', error)
      return false
    }
  }

  // Get access statistics for a user
  async getUserAccessStats(userId: string): Promise<EcosystemAccessStats> {
    try {
      const apps = await this.getUserEcosystemApps(userId)
      
      return {
        totalApps: apps.length,
        activeAccess: apps.filter(app => app.hasAccess).length,
        organizationCount: new Set(apps.map(app => app.organizationId)).size
      }
    } catch (error) {
      console.error('Error getting user access stats:', error)
      return {
        totalApps: 0,
        activeAccess: 0,
        organizationCount: 0
      }
    }
  }

  // Helper method to extract app URL from redirect URIs
  private extractAppUrl(app: any): string | undefined {
    const redirectUris = app.oidcClientMetadata?.redirectUris || []
    if (redirectUris.length === 0) return undefined
    
    // Try to extract base URL from the first redirect URI
    try {
      const url = new URL(redirectUris[0])
      return `${url.protocol}//${url.host}`
    } catch (error) {
      return undefined
    }
  }
}

// Singleton instance
export const ecosystemAccessManager = new EcosystemAccessManager()