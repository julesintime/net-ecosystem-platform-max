import { NextRequest } from 'next/server'
import { withAuth, AuthContext } from '@/lib/middleware/api-auth'
import { 
  LogtoOrganization, 
  UpdateOrganizationRequest,
  ManagementApiResponse 
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
    
    // Handle 404 specifically for organization not found
    if (response.status === 404) {
      throw new Error('Organization not found')
    }
    
    throw new Error(`Management API error: ${errorData.error || errorData.message || response.statusText}`)
  }

  return response.json()
}

/**
 * Validate organization ID format
 */
function validateOrganizationId(id: string): boolean {
  // Logto organization IDs are typically UUIDs or similar identifiers
  // This is a basic validation - adjust based on actual Logto ID format
  return /^[a-zA-Z0-9_-]+$/.test(id) && id.length >= 3 && id.length <= 128
}

/**
 * GET /api/organizations/[id] - Get single organization
 */
async function handleGet(
  request: NextRequest,
  context: AuthContext,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params

    if (!validateOrganizationId(id)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid organization ID format',
          status: 400
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const organization = await callManagementApi<LogtoOrganization>(`/organizations/${id}`)

    const response: ManagementApiResponse<LogtoOrganization> = {
      data: organization,
      status: 200
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error getting organization:', error)
    
    const message = error instanceof Error ? error.message : 'Failed to get organization'
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
 * PATCH /api/organizations/[id] - Update organization
 */
async function handlePatch(
  request: NextRequest,
  context: AuthContext,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params

    if (!validateOrganizationId(id)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid organization ID format',
          status: 400
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body: UpdateOrganizationRequest = await request.json()

    // Validate update data
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return new Response(
          JSON.stringify({
            error: 'Validation failed',
            details: [{ field: 'name', message: 'Name must be a non-empty string' }]
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      if (body.name.length > 128) {
        return new Response(
          JSON.stringify({
            error: 'Validation failed',
            details: [{ field: 'name', message: 'Name must be 128 characters or less' }]
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    if (body.description !== undefined && body.description.length > 512) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: [{ field: 'description', message: 'Description must be 512 characters or less' }]
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const organization = await callManagementApi<LogtoOrganization>(`/organizations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body)
    })

    const response: ManagementApiResponse<LogtoOrganization> = {
      data: organization,
      status: 200
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error updating organization:', error)
    
    const message = error instanceof Error ? error.message : 'Failed to update organization'
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
 * DELETE /api/organizations/[id] - Delete organization
 */
async function handleDelete(
  request: NextRequest,
  context: AuthContext,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params

    if (!validateOrganizationId(id)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid organization ID format',
          status: 400
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    await callManagementApi(`/organizations/${id}`, {
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
    console.error('Error deleting organization:', error)
    
    const message = error instanceof Error ? error.message : 'Failed to delete organization'
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

// Export handlers with authentication middleware
export const GET = withAuth(handleGet, {
  requiredScopes: ['read:organizations']
})

export const PATCH = withAuth(handlePatch, {
  requiredScopes: ['update:organizations']
})

export const DELETE = withAuth(handleDelete, {
  requiredScopes: ['delete:organizations']
})