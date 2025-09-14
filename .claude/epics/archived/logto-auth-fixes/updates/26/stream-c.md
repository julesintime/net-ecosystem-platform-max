# Stream C Progress: Organization API Error Analysis

## Initial Analysis Complete

### Root Cause Identified

**Problem**: The `OrganizationProvider` (client-side) makes unauthenticated API calls to `/api/organizations`.

**Evidence**:
- Organization provider at line 47-51 makes fetch requests without authentication headers
- API route `/api/organizations` expects Bearer tokens with proper scopes (line 216-218)
- Auth middleware correctly validates JWT tokens and returns 401 for missing auth headers

### Current Token Flow Analysis

**Expected Flow**:
1. Client gets organization token from `/api/organizations/[id]/token`
2. Client includes `Authorization: Bearer <token>` in API requests
3. Server validates JWT token with organization context
4. API returns organization data

**Actual Flow**:
1. Organization provider makes direct fetch to `/api/organizations` 
2. No authorization header included (lines 47-51)
3. Auth middleware returns 401 "Authorization header missing"
4. Provider logs "Failed to fetch organizations" error

### Code Pattern Inconsistency

**Main App Pattern** (WRONG):
```typescript
// components/providers/organization-provider.tsx:47-51
const response = await fetch('/api/organizations', {
  headers: {
    'Content-Type': 'application/json',
  },
})
```

**Example App Pattern** (CORRECT):
```typescript
// example/multi-tenant-saas-sample/frontend/src/api/base.ts:26-55
const fetchWithToken = async (endpoint, options, organizationId) => {
  let token = organizationId 
    ? await getOrganizationToken(organizationId)
    : await getAccessToken(RESOURCE_INDICATOR);
    
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
}
```

## Authentication Architecture Analysis

### Server-Side (Working Correctly)

1. **Auth Middleware** (`lib/middleware/api-auth.ts`):
   - Properly validates JWT tokens
   - Extracts organization context from audience
   - Verifies required scopes
   - Returns appropriate error responses

2. **Organizations Route** (`app/api/organizations/route.ts`):
   - Uses M2M credentials for Logto Management API
   - Wrapped with `withAuth` middleware requiring `read:organizations` scope
   - Correctly implements pagination and error handling

3. **Token Exchange Route** (`app/api/organizations/[id]/token/route.ts`):
   - Provides organization-scoped tokens
   - Requires server-side authentication context
   - Exchanges user tokens for organization tokens

### Client-Side (Missing Implementation)

1. **No Client-Side Logto Integration**:
   - Missing `useLogto` hook usage
   - No `getAccessToken` or `getOrganizationToken` calls
   - Direct fetch without authentication

2. **Organization Provider Flawed**:
   - Makes unauthenticated API calls
   - No token management
   - No integration with Logto client SDK

## Fix Requirements

### Immediate Fixes Needed (Issue #28 & #29)

1. **Client-Side Authentication Hook**:
   - Create authenticated fetch utility similar to example app
   - Integrate with Logto client SDK
   - Handle token refresh and organization context

2. **Organization Provider Updates**:
   - Replace direct fetch with authenticated API calls
   - Add proper error handling for 401/403 responses
   - Implement organization token flow

3. **Missing Client Dependencies**:
   - Verify `@logto/react` or equivalent is installed
   - Set up Logto client provider in app layout
   - Configure resource indicators for API access

## Technical Specifications

### Expected JWT Token Format
```
Header: {
  "alg": "RS256",
  "typ": "JWT"
}
Payload: {
  "sub": "user_id",
  "aud": "urn:logto:organization:org_id", // Organization context
  "scope": "read:organizations create:organizations",
  "iss": "https://z3zlta.logto.app/oidc",
  "exp": 1726266401
}
```

### Required API Call Pattern
```typescript
// GET /api/organizations with organization context
Authorization: Bearer <org_token>
Content-Type: application/json

// Response format
{
  "data": {
    "data": [LogtoOrganization[]],
    "totalCount": number
  },
  "status": 200
}
```

## Next Steps

1. **Issue #28**: Implement client-side authentication utilities
2. **Issue #29**: Update organization provider with proper token handling  
3. **Issue #30**: End-to-end testing with real authentication flow

## Test Verification

- ✅ API middleware correctly validates tokens
- ✅ API returns proper 401 for missing auth
- ✅ M2M token exchange route exists
- ❌ Client-side token integration missing
- ❌ Organization provider authentication missing

## Architecture Gap Analysis

### Server-Side vs Client-Side Authentication Pattern Mismatch

The app uses a **server-side only** authentication pattern with `@logto/next` v4.2.6, but the organization provider attempts to make **client-side API calls** without authentication context.

**Key Discovery**: The app loads for unauthenticated users but still instantiates `OrganizationProvider` which immediately tries to fetch organizations, causing the 401 error.

### Missing Client Integration Patterns

1. **No Client-Side Token Access**: 
   - Server uses `getLogtoContext()` for authentication
   - Client has no equivalent to get user tokens
   - No bridge between server auth context and client API calls

2. **Authentication State Checking**:
   - Organization provider runs regardless of auth status
   - Should conditionally fetch organizations only for authenticated users
   - Need auth state propagation from server to client

### Dependency Analysis

**Current**: Only `@logto/next` v4.2.6 (server-side)
**Missing**: Client-side integration packages or patterns

**Options for Client-Side Token Access**:
1. Add `@logto/react` for client hooks
2. Create server API routes that proxy organization calls
3. Use server-side rendering with auth context
4. Implement custom token bridge from server sessions

## Updated Fix Requirements

### Pattern 1: Server-Side Rendering (Recommended)
- Pass authenticated organization data via server components
- Remove client-side API calls from organization provider
- Use server actions for organization operations

### Pattern 2: Client-Side Integration
- Add `@logto/react` dependency
- Implement authenticated API client similar to example app
- Add client-side token management

### Pattern 3: Hybrid API Proxy
- Create authenticated server routes that proxy to Management API
- Client makes calls to internal API with session cookies
- Server handles all external authentication

## Status: ROOT CAUSE IDENTIFIED + SOLUTION PATTERNS DEFINED

The core issue is an **architecture mismatch** between server-side authentication and client-side API calls. The organization provider needs either:
1. Server-side data fetching with prop passing, OR  
2. Client-side authentication integration, OR
3. Authenticated API proxy pattern

**Recommended**: Pattern 1 (Server-side rendering) as it aligns with Next.js 15 App Router best practices and existing `@logto/next` setup.