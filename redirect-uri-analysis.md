# Redirect URI Analysis for Sign-out Error
**Issue #26 - Stream B: Sign-out Error Reproduction**

## Current Configuration Analysis

### Environment Variables
- `LOGTO_BASE_URL`: `http://localhost:6789`
- `LOGTO_REDIRECT_URI`: `http://localhost:6789/api/logto/callback`
- `LOGTO_APP_ID`: `m07bzoq8ltp8fswv7m2y8`

### Error Details
**URL**: `https://z3zlta.logto.app/oidc/session/end?client_id=m07bzoq8ltp8fswv7m2y8&post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A6789`

**Response**: 
```json
{
  "code": "oidc.invalid_request",
  "message": "Request is invalid.",
  "error": "invalid_request", 
  "error_description": "post_logout_redirect_uri not registered"
}
```

**HTTP Status**: 400 Bad Request

## Analysis of Logto SDK Behavior

### Sign-out Flow Analysis
1. **Trigger**: `handleSignOut()` from `@logto/next/server-actions`
2. **Configuration**: Uses `logtoConfig.baseUrl` as post-logout redirect URI
3. **Expected URL**: `http://localhost:6789`
4. **Problem**: This URL is not registered in Logto SPA application

### Required Logto App Configuration

Based on the error and SDK behavior, the Logto SPA application needs:

#### Redirect URIs (for sign-in)
- `http://localhost:6789/api/logto/callback` ✅ (likely already configured)

#### Post-logout Redirect URIs (for sign-out) 
- `http://localhost:6789` ❌ (MISSING - this is the root cause)

## Testing Different URI Patterns

### Pattern 1: Root Domain (Current Failing)
```
URI: http://localhost:6789
Status: ❌ Not registered 
Error: post_logout_redirect_uri not registered
```

### Pattern 2: Callback Endpoint (Likely Incorrect)
```
URI: http://localhost:6789/api/logto/callback
Status: 🤔 Would work if configured, but incorrect for logout
Note: This is for sign-in callbacks, not sign-out redirects
```

### Pattern 3: Explicit Logout Endpoint (Best Practice)
```
URI: http://localhost:6789/logout
Status: 🤔 Would work if implemented
Note: Dedicated logout landing page - recommended approach
```

### Pattern 4: Custom Logout Callback
```
URI: http://localhost:6789/api/logto/logout-callback  
Status: 🤔 Would work if implemented
Note: API endpoint for post-logout processing
```

## SDK Configuration Analysis

### Current logto-config.ts
```typescript
export const logtoConfig: LogtoNextConfig = {
  baseUrl: process.env.LOGTO_BASE_URL!, // http://localhost:6789
  // ... other config
}
```

The Logto Next.js SDK uses `baseUrl` as the post-logout redirect URI by default.

### Configuration Options

1. **Keep Current Pattern**: Add `http://localhost:6789` to Logto post-logout URIs
2. **Use Dedicated Endpoint**: Create `/logout` page and configure accordingly
3. **Custom Redirect**: Override SDK default behavior

## Recommended Fix Approach

### Option 1: Simple Configuration Fix (Recommended)
1. Add `http://localhost:6789` to Logto app's post-logout redirect URIs
2. No code changes required
3. Fastest resolution

### Option 2: Best Practice Implementation  
1. Create dedicated `/logout` page
2. Add `http://localhost:6789/logout` to Logto post-logout URIs
3. Update `baseUrl` to point to logout page, or override SDK behavior

## Verification Checklist

To verify fix:
1. Sign in to application at `http://localhost:6789`
2. Click sign-out button/link
3. Monitor network requests for OIDC session/end
4. Should redirect to `http://localhost:6789` without error
5. Should complete sign-out flow successfully

## Next Steps for Issue #27 (Configuration Fixes)

1. **Immediate**: Add `http://localhost:6789` to Logto post-logout redirect URIs
2. **Optional**: Implement dedicated logout page for better UX
3. **Testing**: Verify sign-out flow works end-to-end