# OAuth Callback Error Debugging Guide

## Overview

This guide documents the OAuth callback error handling patterns discovered during Stream D analysis of Issue #26. It provides systematic approaches for debugging OAuth authentication failures in the Net Ecosystem Platform.

## OAuth Flow Architecture

### Current Dual Route Setup (Problematic)

The application currently has two competing callback routes:

1. **Logto SDK Route**: `/app/api/logto/[...logto]/route.ts`
   - **Purpose**: Official Logto Next.js SDK callback handler
   - **Configuration**: Handles dynamic routes like `/api/logto/callback`
   - **Behavior**: Processes OAuth code exchange automatically
   - **Error Response**: 500 Internal Server Error on any OAuth failure

2. **Custom Route**: `/app/callback/route.ts` 
   - **Purpose**: Manual OAuth callback handling
   - **Configuration**: Direct route at `/callback`
   - **Behavior**: Attempts manual `handleSignIn()` call
   - **Error Response**: 307 redirect to `/?error=auth_failed`

### Configuration Analysis

```bash
# Environment Configuration
LOGTO_REDIRECT_URI=http://localhost:6789/api/logto/callback  # Points to SDK route
LOGTO_BASE_URL=http://localhost:6789                        # Base URL for redirects
```

**Key Issue**: The environment points to the SDK route, but both routes exist, causing potential conflicts.

## Error Scenarios and Responses

### Test Results Summary

| Error Scenario | SDK Route Response | Custom Route Response |
|---|---|---|
| Invalid State | 500 Internal Server Error | 307 → `/?error=auth_failed` |
| Missing Code | 500 Internal Server Error | 307 → `/?error=auth_failed` |  
| Missing State | 500 Internal Server Error | 307 → `/?error=auth_failed` |
| Expired Code | 500 Internal Server Error | 307 → `/?error=auth_failed` |
| Malformed Params | 500 Internal Server Error | 307 → `/?error=auth_failed` |

### Analysis

1. **SDK Route Failures**: All OAuth errors result in 500 errors, indicating unhandled exceptions within the Logto SDK
2. **Custom Route Masking**: Generic error handling hides specific OAuth failure reasons
3. **Error Information Loss**: Detailed OAuth error context is lost in both routes

## Root Cause Analysis

### Primary Issue: Route Configuration Mismatch

The OAuth flow fails because:

1. **Logto Configuration**: Points to `/api/logto/callback` (SDK route)
2. **SDK Processing**: Attempts OAuth code exchange but encounters errors
3. **Error Handling**: SDK returns 500 errors without proper error handling
4. **Fallback Behavior**: Some mechanism redirects failed requests to `/callback` (custom route)
5. **Double Processing**: Custom route attempts OAuth processing again, leading to auth_failed

### Secondary Issues

1. **Missing Error Context**: Neither route surfaces specific OAuth error details
2. **Generic Error Responses**: Users receive unhelpful "auth_failed" messages
3. **No Logging Strategy**: OAuth failures are not systematically logged for debugging

## Debugging Methodology

### Step 1: Enable Detailed Logging

Enhanced both callback routes with comprehensive debugging:

```typescript
// Custom Route Enhancement
console.log('\n=== CUSTOM CALLBACK ROUTE DEBUG ===')
console.log('Request URL:', url)
console.log('Search Params:', Object.fromEntries(searchParams.entries()))
console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)))

// SDK Route Enhancement  
console.log('\n=== LOGTO SDK CALLBACK DEBUG ===')
console.log('Logto Path:', logtoPath)
console.log('✅ Logto SDK response status:', response.status)
```

### Step 2: Systematic Error Testing

Created comprehensive test script (`scripts/test-oauth-errors.js`) that tests:

- Invalid state parameters
- Missing authorization codes
- Expired/invalid codes
- Malformed parameters
- Parameter injection attempts

### Step 3: Response Pattern Analysis

```bash
# Test various error scenarios
node scripts/test-oauth-errors.js

# Results show consistent patterns:
# SDK Route: Always 500 errors
# Custom Route: Always 307 redirects to auth_failed
```

## Proper Error Handling Patterns

### Recommended Architecture

**Single Route Approach**: Use either SDK route OR custom route, not both.

#### Option A: SDK-Only Route (Recommended)

```typescript
// /app/api/logto/[...logto]/route.ts
export const GET = handleSignIn(logtoConfig)
export const POST = handleSignIn(logtoConfig)
```

**Benefits**: 
- Official SDK support
- Automatic OAuth processing
- Built-in security handling

**Requirements**:
- Remove custom `/callback` route
- Enhance SDK error handling
- Add proper OAuth error logging

#### Option B: Custom Route Only

```typescript  
// /app/callback/route.ts
export async function GET(request: NextRequest) {
  try {
    await handleSignIn(logtoConfig, searchParams)
    redirect('/profile')
  } catch (error) {
    // Enhanced error handling with specific OAuth error detection
    const specificError = parseOAuthError(error)
    redirect(`/?error=${specificError.code}&message=${specificError.message}`)
  }
}
```

**Benefits**:
- Full control over error handling
- Custom error messages
- Detailed logging capability

**Requirements**:
- Update `LOGTO_REDIRECT_URI` to point to `/callback`
- Implement comprehensive OAuth error parsing
- Handle all OAuth edge cases manually

### Enhanced Error Handling Implementation

```typescript
interface OAuthError {
  code: string
  message: string
  details?: any
}

function parseOAuthError(error: unknown): OAuthError {
  // Parse specific OAuth error types
  if (error instanceof Error) {
    // Check for common OAuth error patterns
    if (error.message.includes('invalid_state')) {
      return { code: 'invalid_state', message: 'OAuth state validation failed' }
    }
    if (error.message.includes('invalid_grant')) {
      return { code: 'invalid_grant', message: 'Authorization code expired or invalid' }
    }
    if (error.message.includes('unauthorized_client')) {
      return { code: 'unauthorized_client', message: 'Client not authorized for this request' }
    }
  }
  
  return { code: 'oauth_error', message: 'Authentication failed' }
}
```

## Debugging Tools and Scripts

### OAuth Error Testing Script

```bash
# Test all OAuth error scenarios
node scripts/test-oauth-errors.js

# Test specific scenario
curl "http://localhost:6789/callback?code=invalid&state=test"
```

### Server Log Monitoring

```bash
# Monitor logs for OAuth debugging output
npm run dev | grep -E "(LOGTO SDK|CUSTOM CALLBACK|OAuth|auth)"

# Look for specific debug patterns:
# "=== LOGTO SDK CALLBACK DEBUG ==="
# "=== CUSTOM CALLBACK ROUTE DEBUG ==="
```

### Browser Developer Tools

1. **Network Tab**: Monitor OAuth callback requests and responses
2. **Console Tab**: Check for client-side authentication errors
3. **Application Tab**: Inspect authentication cookies and localStorage

## Resolution Recommendations

### Immediate Fixes (Issue #28)

1. **Choose Single Route Architecture**: Remove either custom or SDK route
2. **Implement Proper Error Handling**: Surface specific OAuth errors instead of generic messages
3. **Add Comprehensive Logging**: Log all OAuth errors with context for debugging
4. **Update Error Messages**: Provide user-friendly error messages based on specific OAuth failures

### Long-term Improvements

1. **Error Recovery**: Implement retry mechanisms for transient OAuth failures
2. **Monitoring Integration**: Add OAuth error metrics and alerting
3. **User Experience**: Provide clear error messages and recovery guidance
4. **Testing Suite**: Automated OAuth error scenario testing

## Testing Procedures

### Pre-deployment Verification

1. **Basic OAuth Flow**: Test successful authentication end-to-end
2. **Error Scenarios**: Verify all error conditions are properly handled
3. **User Experience**: Ensure error messages are helpful and actionable
4. **Security Validation**: Confirm no sensitive information is leaked in errors

### Monitoring in Production

1. **Error Rate Monitoring**: Track OAuth failure rates
2. **Error Pattern Analysis**: Identify common failure modes
3. **User Impact Assessment**: Monitor authentication success rates
4. **Performance Metrics**: Ensure error handling doesn't impact performance

## Conclusion

The OAuth callback error debugging revealed a fundamental architectural issue with dual competing routes. The recommended solution is to implement a single, well-designed callback route with proper error handling and comprehensive logging. This will resolve the current "auth_failed" generic errors and provide actionable debugging information for future OAuth issues.