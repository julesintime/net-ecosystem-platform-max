---
issue: 29
epic: logto-auth-fixes
created: 2025-09-14T14:45:00Z
streams: 1
approach: sequential
---

# Issue #29 Analysis: Organization API Authentication Middleware Repair

## Problem Statement

Organization API endpoint `/api/organizations` returns 401 Unauthorized responses, preventing authenticated users from accessing organization data and causing errors in the organization provider.

## Root Cause Analysis (from Issue #26)

**Identified Issue**: Architecture mismatch between server-side authentication and client-side API calls
- Authentication middleware not properly validating Logto sessions
- Client-side API calls failing due to 401 responses  
- Organization provider unable to load organization context

## Implementation Strategy

**Single Sequential Stream**: This issue requires focused API authentication debugging and cannot be parallelized due to the interconnected nature of authentication middleware and API endpoints.

### Stream A: Organization API Authentication Investigation and Repair

**Scope**: Complete organization API authentication debugging and middleware implementation

**Files to Analyze**:
- `app/api/organizations/route.ts` - Organization API endpoint
- `lib/middleware/api-auth.ts` - Authentication middleware (if exists)
- `components/providers/organization-provider.tsx` - Client organization context
- `lib/auth/actions.ts` - Server-side auth utilities
- `lib/auth/logto-config.ts` - Authentication configuration

**Implementation Steps**:

1. **Current API Implementation Analysis**
   - Examine existing `/api/organizations` route implementation
   - Identify current authentication method (JWT headers, cookies, etc.)
   - Document the authentication failure points

2. **Authentication Method Selection**
   - Evaluate server-side `getLogtoContext()` vs client-side JWT approaches
   - Choose proper authentication method for API routes
   - Ensure consistency with Logto Next.js integration patterns

3. **Middleware Authentication Implementation**
   - Implement proper Logto session validation in API middleware
   - Replace any JWT header validation with server-side session context
   - Ensure proper error handling for unauthenticated requests

4. **Organization Data Source Configuration**
   - Determine organization data source (user claims vs Management API)
   - Implement proper organization fetching for authenticated users
   - Handle both new and existing user scenarios

5. **Client-Side Integration Fix**
   - Update organization provider to handle API authentication properly
   - Implement proper error handling and loading states
   - Remove console errors from organization context loading

6. **Testing and Validation**
   - Test organization API with authenticated sessions
   - Verify organization provider loads without errors
   - Test both user-level and organization-level contexts

**Expected Outcome**: Organization API returns proper data for authenticated users, no 401 errors, organization provider works correctly

## Dependencies

- ✅ Issue #26: Error reproduction and M2M setup (completed)
- ✅ Issue #27: Logto configuration fixes (completed)  
- ✅ Issue #28: OAuth callback fixes (completed)

## Verification Plan

1. **API Testing**
   - Test `/api/organizations` with authenticated sessions
   - Verify proper 200 responses with organization data
   - Test error responses for unauthenticated requests

2. **Integration Testing**
   - Verify organization provider loads without console errors
   - Test organization context across the application
   - Confirm multi-tenant organization switching works

## Files to be Modified

- `app/api/organizations/route.ts` - Organization API implementation
- `lib/middleware/api-auth.ts` - Authentication middleware (create if needed)
- `components/providers/organization-provider.tsx` - Error handling improvements
- `lib/auth/actions.ts` - Authentication utilities (if needed)

## Estimated Completion

**Single Stream A**: 4-6 hours of focused API authentication debugging and implementation

This approach ensures thorough investigation and implementation without the complexity of coordinating multiple streams for authentication middleware work that requires sequential testing and validation.