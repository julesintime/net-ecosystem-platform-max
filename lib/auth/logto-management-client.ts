interface LogtoM2MTokenResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  scope: string
}

interface LogtoOrganization {
  id: string
  name: string
  description: string | null
  customData: Record<string, unknown>
  isMfaRequired: boolean
  branding: {
    logoUrl?: string
    darkLogoUrl?: string
    favicon?: string
    darkFavicon?: string
  }
  createdAt: number
}

interface LogtoApplication {
  id: string
  name: string
  description: string | null
  type: string
  oidcClientMetadata: {
    redirectUris: string[]
    postLogoutRedirectUris: string[]
  }
  customClientMetadata: {
    corsAllowedOrigins: string[]
    idTokenTtl: number
    refreshTokenTtl: number
  }
  isThirdParty: boolean
  createdAt: number
}

interface LogtoUserConsentOrganization {
  id: string
  name: string
  description: string | null
  customData: Record<string, unknown>
  isMfaRequired: boolean
  branding: {
    logoUrl?: string
    darkLogoUrl?: string
    favicon?: string
    darkFavicon?: string
  }
  createdAt: number
}

export class LogtoManagementClient {
  private accessToken: string | null = null
  private tokenExpiry: number = 0
  private readonly baseUrl: string
  private readonly clientId: string
  private readonly clientSecret: string
  private readonly resource: string

  constructor() {
    this.baseUrl = process.env.LOGTO_ENDPOINT!
    this.clientId = process.env.LOGTO_M2M_APP_ID!
    this.clientSecret = process.env.LOGTO_M2M_APP_SECRET!
    this.resource = process.env.LOGTO_MANAGEMENT_API_RESOURCE!

    console.log(`🔐 LOGTO M2M CLIENT INITIALIZED:`)
    console.log(`   - Base URL: ${this.baseUrl}`)
    console.log(`   - Client ID: ${this.clientId}`)
    console.log(`   - Resource: ${this.resource}`)

    // Validate required environment variables
    if (!this.baseUrl || !this.clientId || !this.clientSecret || !this.resource) {
      throw new Error('Missing required Logto M2M environment variables')
    }
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    // Fetch new token using client_credentials flow
    const tokenUrl = `${this.baseUrl}/oidc/token`
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      resource: this.resource,
      scope: 'all'
    })

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    })

    if (!response.ok) {
      throw new Error(`Failed to get M2M access token: ${response.status} ${response.statusText}`)
    }

    const tokenData: LogtoM2MTokenResponse = await response.json()
    
    // Cache the token with a 5-minute buffer before expiry
    this.accessToken = tokenData.access_token
    this.tokenExpiry = Date.now() + (tokenData.expires_in - 300) * 1000

    return this.accessToken
  }

  private async makeApiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken()
    const url = `${this.resource}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Logto API request failed: ${response.status} ${response.statusText}. ${errorText}`)
    }

    // Some endpoints return plain text instead of JSON
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return response.json()
    } else {
      // For non-JSON responses (like "Created"), return the text
      const text = await response.text()
      return text || null
    }
  }

  // Get all applications in the system
  async getApplications(): Promise<LogtoApplication[]> {
    console.log(`📡 FETCHING APPLICATIONS from: ${this.resource}/applications`)
    const apps = await this.makeApiRequest<LogtoApplication[]>('/applications')
    console.log(`📱 LOGTO API RETURNED ${apps.length} APPLICATIONS`)
    console.log(`🔍 APPLICATION IDs:`, apps.map(app => ({ id: app.id, name: app.name, type: app.type })))
    return apps
  }

  // Get specific application details
  async getApplication(applicationId: string): Promise<LogtoApplication> {
    return this.makeApiRequest<LogtoApplication>(`/applications/${applicationId}`)
  }

  // Get all organizations
  async getOrganizations(): Promise<LogtoOrganization[]> {
    return this.makeApiRequest<LogtoOrganization[]>('/organizations')
  }

  // Get applications associated with an organization
  async getOrganizationApplications(organizationId: string): Promise<LogtoApplication[]> {
    return this.makeApiRequest<LogtoApplication[]>(`/organizations/${organizationId}/applications`)
  }

  // Get organizations that a user has consented to for a specific application
  async getUserConsentOrganizations(applicationId: string, userId: string): Promise<LogtoUserConsentOrganization[]> {
    const response = await this.makeApiRequest<{ organizations: LogtoUserConsentOrganization[] }>(
      `/applications/${applicationId}/users/${userId}/consent-organizations`
    )
    return response.organizations
  }

  // Grant user consent to organizations for an application
  async grantUserConsentOrganizations(
    applicationId: string, 
    userId: string, 
    organizationIds: string[]
  ): Promise<void> {
    await this.makeApiRequest(`/applications/${applicationId}/users/${userId}/consent-organizations`, {
      method: 'POST',
      body: JSON.stringify({ organizationIds })
    })
  }

  // Revoke user consent for a specific organization and application
  async revokeUserConsentOrganization(
    applicationId: string,
    userId: string,
    organizationId: string
  ): Promise<void> {
    await this.makeApiRequest(
      `/applications/${applicationId}/users/${userId}/consent-organizations/${organizationId}`,
      { method: 'DELETE' }
    )
  }

  // Replace all user consent organizations for an application
  async replaceUserConsentOrganizations(
    applicationId: string,
    userId: string,
    organizationIds: string[]
  ): Promise<void> {
    await this.makeApiRequest(`/applications/${applicationId}/users/${userId}/consent-organizations`, {
      method: 'PUT',
      body: JSON.stringify({ organizationIds })
    })
  }

  // Get users in an organization 
  async getOrganizationUsers(organizationId: string): Promise<any[]> {
    return this.makeApiRequest<any[]>(`/organizations/${organizationId}/users`)
  }

  // Check if user is member of organization
  async isUserInOrganization(organizationId: string, userId: string): Promise<boolean> {
    try {
      console.log(`🔍 Checking if user ${userId} is in organization ${organizationId}`)
      const users = await this.getOrganizationUsers(organizationId)
      console.log(`👥 Organization ${organizationId} has ${users.length} users:`, users.map(u => ({ id: u.id, name: u.name || u.username })))
      
      const isUserMember = users.some(user => user.id === userId)
      console.log(`🎯 User ${userId} found in organization: ${isUserMember}`)
      
      return isUserMember
    } catch (error) {
      console.log(`❌ Error checking user membership in organization ${organizationId}:`, error)
      // If we get a 404 or access error, assume user is not in org
      return false
    }
  }
}

// Singleton instance
export const logtoManagementClient = new LogtoManagementClient()