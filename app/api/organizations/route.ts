import { NextRequest } from 'next/server'
import { withAuth, AuthContext } from '@/lib/middleware/api-auth'
import { 
  LogtoOrganization, 
  CreateOrganizationRequest, 
  OrganizationListParams,
  ManagementApiResponse,
  PaginatedResponse
} from '@/lib/types/management-api'

const MANAGEMENT_API_BASE = process.env.LOGTO_MANAGEMENT_API_ENDPOINT || `${process.env.LOGTO_ENDPOINT}/api`
const MANAGEMENT_API_RESOURCE = process.env.LOGTO_MANAGEMENT_API_RESOURCE

/**
 * Get management API access token
 */
async function getManagementApiToken(): Promise<string> {
  const clientId = process.env.LOGTO_M2M_APP_ID
  const clientSecret = process.env.LOGTO_M2M_APP_SECRET
  const tokenEndpoint = `${process.env.LOGTO_ENDPOINT}/oidc/token`

  if (!clientId || !clientSecret || !MANAGEMENT_API_RESOURCE) {
    throw new Error('Missing Management API configuration')
  }

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      resource: MANAGEMENT_API_RESOURCE,
      scope: 'all'
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to get management API token: ${response.statusText}`)
  }

  const tokenData = await response.json()
  return tokenData.access_token
}

/**
 * Make authenticated request to Management API
 */
async function callManagementApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getManagementApiToken()
  
  const response = await fetch(`${MANAGEMENT_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(`Management API error: ${errorData.error || errorData.message || response.statusText}`)
  }

  return response.json()
}

/**
 * GET /api/organizations - List organizations
 * Returns paginated list of organizations
 */
async function handleGet(
  request: NextRequest,
  _context: AuthContext
): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url)
    const params: OrganizationListParams = {
      page: parseInt(searchParams.get('page') || '1'),
      page_size: parseInt(searchParams.get('page_size') || '20'),
      q: searchParams.get('q') || undefined
    }

    // Validate pagination parameters
    if (params.page && params.page < 1) {
      return new Response(
        JSON.stringify({ error: 'Page must be >= 1' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (params.page_size && (params.page_size < 1 || params.page_size > 100)) {
      return new Response(
        JSON.stringify({ error: 'Page size must be between 1 and 100' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Build query parameters for Management API
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.set('page', params.page.toString())
    if (params.page_size) queryParams.set('page_size', params.page_size.toString())
    if (params.q) queryParams.set('q', params.q)

    const endpoint = `/organizations?${queryParams.toString()}`
    const data = await callManagementApi<LogtoOrganization[]>(endpoint)

    // Get total count for pagination (this might require a separate API call)
    // For now, we'll return the data as-is since Logto's pagination structure may vary
    const response: ManagementApiResponse<PaginatedResponse<LogtoOrganization>> = {
      data: {
        data: Array.isArray(data) ? data : [],
        totalCount: Array.isArray(data) ? data.length : 0
      },
      status: 200
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error listing organizations:', error)
    
    const response: ManagementApiResponse = {
      error: error instanceof Error ? error.message : 'Failed to list organizations',
      status: 500
    }

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

/**
 * POST /api/organizations - Create new organization
 */
async function handlePost(
  request: NextRequest,
  _context: AuthContext
): Promise<Response> {
  try {
    const body: CreateOrganizationRequest = await request.json()

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Organization name is required',
          details: [{ field: 'name', message: 'Name must be a non-empty string' }]
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate name length
    if (body.name.length > 128) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: [{ field: 'name', message: 'Name must be 128 characters or less' }]
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate description if provided
    if (body.description && body.description.length > 512) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: [{ field: 'description', message: 'Description must be 512 characters or less' }]
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const organization = await callManagementApi<LogtoOrganization>('/organizations', {
      method: 'POST',
      body: JSON.stringify(body)
    })

    const response: ManagementApiResponse<LogtoOrganization> = {
      data: organization,
      status: 201
    }

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error creating organization:', error)
    
    const response: ManagementApiResponse = {
      error: error instanceof Error ? error.message : 'Failed to create organization',
      status: 500
    }

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Export handlers with authentication middleware
export const GET = withAuth(handleGet, {
  requiredScopes: ['read:organizations']
})

export const POST = withAuth(handlePost, {
  requiredScopes: ['create:organizations']
})