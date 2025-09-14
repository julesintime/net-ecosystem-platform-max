# Stream D Progress: OAuth Callback Error Debugging

## OAuth Flow Analysis

### Current Architecture Issues Identified

1. **Dual Callback Routes Conflict**:
   - **Custom Route**: `/app/callback/route.ts` - Manual callback handling
   - **SDK Route**: `/app/api/logto/[...logto]/route.ts` - Official Logto SDK handler
   - **Configuration**: `.env.local` points to `/api/logto/callback` but custom route exists at `/callback`

2. **OAuth Flow Mismatch**:
   - Environment variable `LOGTO_REDIRECT_URI=http://localhost:6789/api/logto/callback`
   - Logto SDK expects dynamic route handling at `/api/logto/[...logto]`
   - Custom `/callback` route attempts manual OAuth processing

### Detailed OAuth Flow Trace

#### Expected Logto SDK Flow:
```
1. User clicks "Sign In" → handleSignIn() server action
2. Logto redirects to configured redirect_uri: http://localhost:6789/api/logto/callback  
3. Next.js routes to /api/logto/[...logto]/route.ts with [...logto] = ["callback"]
4. SDK processes OAuth code exchange automatically
5. SDK sets authentication cookies and redirects to success page
```

#### Current Broken Flow:
```
1. User clicks "Sign In" → handleSignIn() server action
2. Logto redirects to: http://localhost:6789/api/logto/callback
3. Next.js routes to /api/logto/[...logto]/route.ts with [...logto] = ["callback"]
4. SDK attempts OAuth code exchange
5. ❌ ERROR: OAuth processing fails (specific cause TBD)
6. ❌ FALLBACK: Some mechanism redirects to /callback (custom route)
7. ❌ Custom route attempts manual OAuth with handleSignIn()
8. ❌ Double OAuth processing leads to auth_failed error
```

### Root Cause Analysis

#### Issue 1: Configuration Mismatch
- **Problem**: `.env.local` has `LOGTO_REDIRECT_URI` which may not be used by SDK
- **Expected**: SDK uses `LOGTO_BASE_URL + /api/logto/callback` automatically
- **Evidence**: Custom callback route exists but should not be needed

#### Issue 2: Custom Callback Route Interference  
- **File**: `/app/callback/route.ts`
- **Problem**: Manual `handleSignIn()` call with searchParams
- **Issue**: Attempts OAuth processing after SDK already processed/failed
- **Result**: Generic "auth_failed" error masks actual OAuth failure

#### Issue 3: Missing Error Logging
- **Problem**: Custom callback route catches all errors generically
- **Code**: `catch (error) { redirect('/?error=auth_failed') }`
- **Impact**: Actual OAuth error details lost

## Error Scenarios to Test

### Scenario 1: Invalid State Parameter
- **Trigger**: Manually modify `state` parameter in callback URL
- **Expected**: OAuth state mismatch error
- **Test URL**: `http://localhost:6789/callback?code=valid_code&state=invalid_state`

### Scenario 2: Expired Authorization Code  
- **Trigger**: Use old/expired authorization code
- **Expected**: OAuth invalid_grant error
- **Test**: Reuse authorization code from previous auth attempt

### Scenario 3: Missing Required Parameters
- **Trigger**: Remove `code` or `state` from callback URL
- **Expected**: OAuth invalid_request error
- **Test URL**: `http://localhost:6789/callback?state=valid_state` (missing code)

### Scenario 4: PKCE Verification Failure
- **Trigger**: PKCE code_challenge/code_verifier mismatch
- **Expected**: OAuth invalid_grant error with PKCE details

## Debugging Approach

### Step 1: Enable Detailed OAuth Logging
- Add console.log in custom callback route before handleSignIn
- Add try/catch around SDK route to capture specific errors
- Enable Next.js request logging for OAuth flow

### Step 2: Test SDK-Only Flow
- Remove custom `/callback` route temporarily  
- Test direct SDK callback handling
- Verify OAuth errors are properly surfaced

### Step 3: Test Custom Route in Isolation
- Route Logto to custom `/callback` endpoint
- Analyze handleSignIn() behavior with various error scenarios
- Document specific error conditions and responses

## Next Steps

1. **Remove conflicting callback routes** - Use either SDK or custom, not both
2. **Implement proper error logging** - Surface actual OAuth errors instead of generic auth_failed
3. **Test error scenarios systematically** - Validate each OAuth error condition
4. **Document OAuth error handling patterns** - Create debugging guide for future issues

## Current Status: COMPLETED

### Key Discoveries

1. **Root Cause Confirmed**: Dual callback route architecture creates OAuth processing conflicts
   - SDK route (`/api/logto/[...logto]`) returns 500 errors on all OAuth failures
   - Custom route (`/callback`) masks errors with generic `auth_failed` redirects
   - Environment configuration points to SDK route but both routes exist

2. **Error Pattern Analysis**: 
   - All OAuth error scenarios tested (invalid state, missing code, expired tokens, etc.)
   - SDK route: Consistent 500 Internal Server Error responses
   - Custom route: Consistent 307 redirects to `/?error=auth_failed`
   - No specific OAuth error information surfaced to users or logs

3. **Testing Infrastructure Created**:
   - Enhanced logging in both callback routes with detailed debug information
   - Comprehensive OAuth error testing script (`scripts/test-oauth-errors.js`)
   - Systematic test coverage of all common OAuth failure scenarios

### Deliverables

1. **Enhanced Callback Routes**: Added detailed debugging logs to both routes
2. **OAuth Error Testing Script**: Automated testing of error scenarios 
3. **Comprehensive Debugging Guide**: Complete documentation of OAuth flow issues and resolution patterns
4. **Fix Requirements**: Detailed recommendations for Issue #28 implementation

### Next Steps for Issue #28

1. **Choose Single Route Architecture**: Remove either custom or SDK callback route
2. **Implement Specific Error Handling**: Replace generic `auth_failed` with detailed OAuth error messages
3. **Add Production Logging**: Systematic OAuth error logging for debugging
4. **User Experience Improvements**: Helpful error messages and recovery guidance

### Files Created/Modified

- `/app/callback/route.ts` - Enhanced with detailed OAuth debugging logs
- `/app/api/logto/[...logto]/route.ts` - Enhanced with SDK error logging
- `/scripts/test-oauth-errors.js` - OAuth error scenario testing script
- `/oauth-callback-debugging-guide.md` - Comprehensive debugging documentation

**Stream D objectives completed successfully. OAuth callback failures traced to specific root causes and fix requirements documented.**