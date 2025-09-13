import { NextRequest } from 'next/server'
import { withOrganizationAuth, AuthContext } from '@/lib/middleware/api-auth'
import { 
  LogtoOrganizationMember,
  AddOrganizationMemberRequest,
  OrganizationMemberListParams,
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
    
    if (response.status === 404) {
      throw new Error('Organization or member not found')
    }
    
    throw new Error(`Management API error: ${errorData.error || errorData.message || response.statusText}`)
  }

  return response.json()
}

/**
 * Validate organization ID format
 */
function validateOrganizationId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id) && id.length >= 3 && id.length <= 128
}

/**
 * Validate user ID format
 */
function validateUserId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id) && id.length >= 3 && id.length <= 128
}

/**
 * Check if current user has permission to manage organization members
 */
function validateOrganizationAccess(context: AuthContext, organizationId: string): boolean {
  // Check if the authenticated user has access to this organization
  // This depends on your organization access control setup
  return context.user.organizationId === organizationId || 
         context.user.scopes.includes('manage:all_organizations')
}

/**
 * GET /api/organizations/[id]/members - List organization members
 */
async function handleGet(
  request: NextRequest,
  context: AuthContext,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id: organizationId } = await params

    if (!validateOrganizationId(organizationId)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid organization ID format',
          status: 400
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate organization access
    if (!validateOrganizationAccess(context, organizationId)) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient permissions to access this organization',
          status: 403
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { searchParams } = new URL(request.url)
    const params_query: OrganizationMemberListParams = {
      page: parseInt(searchParams.get('page') || '1'),
      page_size: parseInt(searchParams.get('page_size') || '20'),
      q: searchParams.get('q') || undefined
    }

    // Validate pagination parameters
    if (params_query.page && params_query.page < 1) {
      return new Response(
        JSON.stringify({ error: 'Page must be >= 1' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (params_query.page_size && (params_query.page_size < 1 || params_query.page_size > 100)) {
      return new Response(
        JSON.stringify({ error: 'Page size must be between 1 and 100' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Build query parameters for Management API
    const queryParams = new URLSearchParams()
    if (params_query.page) queryParams.set('page', params_query.page.toString())
    if (params_query.page_size) queryParams.set('page_size', params_query.page_size.toString())
    if (params_query.q) queryParams.set('q', params_query.q)

    const endpoint = `/organizations/${organizationId}/users?${queryParams.toString()}`
    const data = await callManagementApi<LogtoOrganizationMember[]>(endpoint)

    const response: ManagementApiResponse<PaginatedResponse<LogtoOrganizationMember>> = {
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
    console.error('Error listing organization members:', error)
    
    const message = error instanceof Error ? error.message : 'Failed to list organization members'
    const status = message.includes('not found') ? 404 : 500
    
    const response: ManagementApiResponse = {
      error: message,
      status
    }

    return new Response(JSON.stringify(response), {
      status,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

/**
 * POST /api/organizations/[id]/members - Add members to organization
 */
async function handlePost(
  request: NextRequest,
  context: AuthContext,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id: organizationId } = await params

    if (!validateOrganizationId(organizationId)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid organization ID format',
          status: 400
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate organization access
    if (!validateOrganizationAccess(context, organizationId)) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient permissions to manage this organization',
          status: 403
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body: AddOrganizationMemberRequest = await request.json()

    // Validate request body
    if (!body.userIds || !Array.isArray(body.userIds) || body.userIds.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: [{ field: 'userIds', message: 'userIds must be a non-empty array' }]
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate user IDs
    const invalidUserIds = body.userIds.filter(id => !validateUserId(id))
    if (invalidUserIds.length > 0) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: [{ field: 'userIds', message: `Invalid user IDs: ${invalidUserIds.join(', ')}` }]
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Add each user to the organization
    const results = []
    for (const userId of body.userIds) {
      try {
        const memberData = {
          organizationRoleIds: body.organizationRoleIds || []
        }

        await callManagementApi(`/organizations/${organizationId}/users/${userId}`, {
          method: 'PUT',
          body: JSON.stringify(memberData)
        })

        results.push({ userId, success: true })
      } catch (error) {
        console.error(`Error adding user ${userId} to organization:`, error)
        results.push({ 
          userId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const response: ManagementApiResponse<typeof results> = {
      data: results,
      status: 200
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error adding organization members:', error)
    
    const response: ManagementApiResponse = {
      error: error instanceof Error ? error.message : 'Failed to add organization members',
      status: 500
    }

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

/**
 * DELETE /api/organizations/[id]/members - Remove member from organization
 */
async function handleDelete(
  request: NextRequest,
  context: AuthContext,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id: organizationId } = await params

    if (!validateOrganizationId(organizationId)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid organization ID format',
          status: 400
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate organization access
    if (!validateOrganizationAccess(context, organizationId)) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient permissions to manage this organization',
          status: 403
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId || !validateUserId(userId)) {
      return new Response(
        JSON.stringify({ 
          error: 'Valid userId parameter is required',
          status: 400
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    await callManagementApi(`/organizations/${organizationId}/users/${userId}`, {
      method: 'DELETE'
    })

    const response: ManagementApiResponse<Record<string, never>> = {
      data: {},
      status: 204
    }

    return new Response(JSON.stringify(response), {
      status: 204,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error removing organization member:', error)
    
    const message = error instanceof Error ? error.message : 'Failed to remove organization member'
    const status = message.includes('not found') ? 404 : 500
    
    const response: ManagementApiResponse = {
      error: message,
      status
    }

    return new Response(JSON.stringify(response), {
      status,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Export handlers with organization-scoped authentication
export const GET = withOrganizationAuth(handleGet, ['read:organization_members'])

export const POST = withOrganizationAuth(handlePost, ['create:organization_members'])

export const DELETE = withOrganizationAuth(handleDelete, ['delete:organization_members'])