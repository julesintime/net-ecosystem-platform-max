# Sign-out Fix Verification Procedure
**Issue #26 - Stream B: Sign-out Error Reproduction**

## Pre-Fix Verification (Reproduce Error)

### Step 1: Environment Validation
```bash
# Verify development server is running
curl -s http://localhost:6789 | head -n 1

# Verify environment variables
echo "LOGTO_BASE_URL: $LOGTO_BASE_URL"
echo "LOGTO_APP_ID: $LOGTO_APP_ID"
```

### Step 2: Direct Error Reproduction
```bash
# Test the exact failing URL
curl -v "https://z3zlta.logto.app/oidc/session/end?client_id=m07bzoq8ltp8fswv7m2y8&post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A6789"
```

**Expected Result**: 
- HTTP 400 Bad Request
- Error: `"post_logout_redirect_uri not registered"`

### Step 3: Application Sign-out Test
1. Open `http://localhost:6789` in browser
2. Sign in using Logto (if not already authenticated)
3. Locate sign-out button:
   - In UniversalAppBar auth button
   - In ProfileDropdown menu ("Sign out")
4. Click sign-out button
5. Monitor browser Developer Tools → Network tab
6. Look for request to `z3zlta.logto.app/oidc/session/end`

**Expected Error Flow**:
- Browser makes GET request to OIDC session end endpoint
- URL contains: `post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A6789`
- Response: HTTP 400 with OIDC invalid_request error
- User may see error page or remain on current page

## Fix Configuration Requirements

### Logto Application Configuration Needed:
1. **App Type**: SPA (Single Page Application)
2. **App ID**: `m07bzoq8ltp8fswv7m2y8`
3. **Redirect URIs** (sign-in): 
   - `http://localhost:6789/api/logto/callback` ✅
4. **Post-logout Redirect URIs** (sign-out):
   - `http://localhost:6789` ❌ **NEEDS TO BE ADDED**

## Post-Fix Verification

### Step 1: Configuration Validation
```bash
# Test the previously failing URL after Logto config update
curl -v "https://z3zlta.logto.app/oidc/session/end?client_id=m07bzoq8ltp8fswv7m2y8&post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A6789"
```

**Expected Result After Fix**:
- HTTP 302 Redirect (or similar success response)
- No OIDC invalid_request error
- Redirect to `http://localhost:6789`

### Step 2: End-to-End Sign-out Flow Test
1. Open `http://localhost:6789` in fresh browser session
2. Sign in completely through Logto flow
3. Verify authenticated state (user profile visible)
4. Click sign-out button
5. Monitor network requests in Developer Tools

**Expected Success Flow**:
- GET request to OIDC session end endpoint
- HTTP 302 redirect response (not 400 error)
- Browser redirects to `http://localhost:6789`
- User is signed out (auth state cleared)
- Application shows unauthenticated state

### Step 3: Authentication State Verification
After successful sign-out:
- [ ] No user profile information displayed
- [ ] Sign-in button/link appears instead of sign-out
- [ ] Application returns to unauthenticated state
- [ ] No authentication tokens in browser storage
- [ ] Attempting to access protected routes requires re-authentication

## Additional Test Cases

### Test Case 1: Multiple Sign-out Attempts
1. Sign out → Should work
2. Click sign-out again when already signed out → Should handle gracefully

### Test Case 2: Different Browser/Incognito
1. Test sign-out flow in private/incognito browser
2. Verify consistent behavior across browser contexts

### Test Case 3: Network Error Handling
1. Temporarily block network to `z3zlta.logto.app`
2. Attempt sign-out
3. Verify application handles network errors gracefully

## Success Criteria Checklist

- [ ] Direct curl test of OIDC session end URL returns success (not 400 error)
- [ ] Application sign-out button completes successfully
- [ ] User is redirected to homepage after sign-out
- [ ] Authentication state is cleared properly
- [ ] No console errors during sign-out flow
- [ ] Sign-out works consistently across browser sessions

## Rollback Plan

If fix causes issues:
1. Remove `http://localhost:6789` from Logto post-logout redirect URIs
2. Application will return to previous error state
3. Alternative: Implement dedicated logout page approach

## Documentation for Issue #27

Required Logto configuration changes:
```json
{
  "app_type": "SPA",
  "app_id": "m07bzoq8ltp8fswv7m2y8",
  "redirect_uris": [
    "http://localhost:6789/api/logto/callback"
  ],
  "post_logout_redirect_uris": [
    "http://localhost:6789"  // ← ADD THIS
  ]
}
```

No application code changes required for basic fix.