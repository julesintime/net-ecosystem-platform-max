# Stream B Progress: Sign-out Error Reproduction
**Issue #26 - Environment Setup and Error Reproduction**
**Stream**: Sign-out OIDC Flow Analysis  
**Date**: 2025-09-13  
**Status**: COMPLETED ✅

## Executive Summary

Successfully reproduced and analyzed the sign-out OIDC error. **Root cause confirmed**: The Logto SPA application configuration is missing `http://localhost:6789` in the post-logout redirect URIs list.

## Tasks Completed

### ✅ Task 1: Error Reproduction via Direct Testing
**Method**: Direct curl request to failing OIDC endpoint
```bash
curl -v "https://z3zlta.logto.app/oidc/session/end?client_id=m07bzoq8ltp8fswv7m2y8&post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A6789"
```

**Result**: 
- HTTP 400 Bad Request
- Error: `{"code":"oidc.invalid_request","error_description":"post_logout_redirect_uri not registered"}`
- **Confirmed**: Error consistently reproducible

### ✅ Task 2: Sign-out Implementation Analysis
**File**: `/Users/xoojulian/Downloads/net-ecosystem-platform-max/lib/auth/actions.ts`

**Key Findings**:
- Uses `@logto/next/server-actions` SDK v4.2.6
- Simple implementation: `await signOut(logtoConfig)`
- SDK uses `logtoConfig.baseUrl` (`http://localhost:6789`) as post-logout redirect URI
- **No custom redirect logic** - relies on SDK default behavior

**UI Trigger Points**:
- `components/auth/auth-button.tsx` - Universal auth button
- `components/profile/profile-dropdown.tsx` - Profile menu sign-out option

### ✅ Task 3: Redirect URI Pattern Analysis
**Current Configuration**:
- `LOGTO_BASE_URL`: `http://localhost:6789` (used for post-logout redirect)
- `LOGTO_REDIRECT_URI`: `http://localhost:6789/api/logto/callback` (sign-in callback)

**Testing Results**:
- Sign-in callback URI: ✅ Likely working (no sign-in errors reported)
- Post-logout redirect URI: ❌ **Missing from Logto configuration**

**Documentation**: Created `/Users/xoojulian/Downloads/net-ecosystem-platform-max/redirect-uri-analysis.md`

### ✅ Task 4: Fix Verification Procedure
**Created**: `/Users/xoojulian/Downloads/net-ecosystem-platform-max/signout-fix-verification.md`

**Includes**:
- Pre-fix error reproduction steps
- Post-fix verification tests  
- End-to-end sign-out flow validation
- Success criteria checklist
- Rollback plan

## Root Cause Analysis

### Technical Root Cause
The Logto SPA application (ID: `m07bzoq8ltp8fswv7m2y8`) is missing the required post-logout redirect URI configuration.

### Required Fix
Add `http://localhost:6789` to the Logto application's **post-logout redirect URIs** list in the Logto admin console.

### Why This Happens
1. Logto SDK constructs logout URL using `baseUrl` from config
2. OIDC specification requires post-logout redirect URIs to be pre-registered
3. Logto validates the `post_logout_redirect_uri` parameter against registered URIs
4. Since `http://localhost:6789` is not in the allowlist, request is rejected

## Fix Requirements for Issue #27

### Logto Configuration Changes Needed
```json
{
  "app_type": "SPA",
  "app_id": "m07bzoq8ltp8fswv7m2y8", 
  "post_logout_redirect_uris": [
    "http://localhost:6789"  // ← ADD THIS URI
  ]
}
```

### Application Code Changes
**None required** for basic fix. The existing implementation will work once the URI is registered.

## Testing Evidence

### Error Reproduction ✅
- Direct API test confirms exact error from task requirements
- Error consistently reproducible with expected parameters
- HTTP 400 response with correct OIDC error codes

### Implementation Analysis ✅  
- Sign-out flow traced through codebase
- SDK behavior documented and understood
- No complex custom logic - straightforward SDK usage

### Fix Requirements ✅
- Specific configuration changes identified
- Verification procedure established
- Rollback plan documented

## Deliverables

1. **Error Analysis**: `/Users/xoojulian/Downloads/net-ecosystem-platform-max/redirect-uri-analysis.md`
2. **Test Procedure**: `/Users/xoojulian/Downloads/net-ecosystem-platform-max/signout-fix-verification.md`
3. **Working Environment**: Development server running on port 6789
4. **Reproducible Error**: Confirmed OIDC invalid_request consistently triggered

## Handoff to Issue #27

**Priority**: HIGH - Blocking all sign-out functionality

**Required Action**: Add `http://localhost:6789` to Logto post-logout redirect URIs

**Verification**: Use test procedure in `signout-fix-verification.md`

**Risk**: LOW - Configuration change only, no code modification required

---
**Stream B Status**: COMPLETED ✅  
**Next**: Ready for Logto configuration fix in Issue #27