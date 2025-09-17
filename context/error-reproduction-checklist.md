# Error Reproduction Checklist - Issue #26

## Prerequisites
- Development server running on `http://localhost:6789`
- Browser with developer tools open
- M2M credentials validated (✅ COMPLETE)

## Error 1: Sign-out OIDC Failure 

### Reproduction Steps
1. Start development server: `npm run dev`
2. Navigate to `http://localhost:6789`
3. Click "Sign In" button
4. Complete Logto authentication flow
5. Once signed in, click "Sign Out" 
6. **Expected Error**: Browser redirected to Logto error page showing:
   ```
   {"code":"oidc.invalid_request","error_description":"post_logout_redirect_uri not registered"}
   ```

### Error URL Pattern
```
https://z3zlta.logto.app/oidc/session/end?client_id=m07bzoq8ltp8fswv7m2y8&post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A6789
```

### Root Cause Confirmed ✅
- **Missing Configuration**: SPA application has NO post-logout redirect URIs configured
- **Required URI**: `http://localhost:6789` must be added to post-logout redirect URIs

### Debugging Data to Collect
- [ ] Screenshot of error page
- [ ] Network tab showing the redirect request
- [ ] Console logs during sign-out attempt

## Error 2: Organization API Authentication

### Reproduction Steps
1. Complete sign-in flow (may partially fail due to Error 3)
2. Navigate to any organization-related page (e.g., `/profile/organization`)
3. Open browser developer console
4. **Expected Error**: 
   ```
   Failed to fetch organizations
   GET /api/organizations 401 in 226ms
   ```

### Error Location
- **File**: `components/providers/organization-provider.tsx:54:15`
- **API Route**: `/api/organizations` 
- **Status**: 401 Unauthorized

### Root Cause Analysis Required
- [ ] Check if organization provider includes authentication headers
- [ ] Verify API route authentication middleware
- [ ] Test token presence and validity in API calls

### Debugging Data to Collect  
- [ ] Network request headers for `/api/organizations`
- [ ] Response body and headers
- [ ] Browser application storage (tokens, cookies)
- [ ] Console error stack trace

## Error 3: OAuth Callback Failure

### Reproduction Steps
1. Start development server: `npm run dev`
2. Navigate to `http://localhost:6789`
3. Click "Sign In" button 
4. Complete Logto authentication (enter credentials, authorize)
5. **Expected Error**: Redirect to `http://localhost:6789/?error=auth_failed`

### Error Flow
```
User Sign In → Logto Auth → Callback Processing → 307 Redirect → /?error=auth_failed
```

### Root Cause Analysis Required  
- [ ] Check callback route error handling in `app/callback/route.ts`
- [ ] Verify OAuth code/state parameter processing
- [ ] Test with missing redirect URI configuration impact

### Debugging Data to Collect
- [ ] Network tab showing full OAuth flow
- [ ] Callback route processing logs
- [ ] URL parameters in callback request
- [ ] Server-side error logs during callback

## Environment Validation ✅ COMPLETE

### M2M Configuration Status
- ✅ M2M credentials working with resource: `https://z3zlta.logto.app/api`
- ✅ Management API access verified
- ✅ Environment variables correctly configured
- ✅ Configuration backup created: `logto-config-backup-2025-09-13.json`

### SPA Application Configuration Issues
- ❌ **No redirect URIs configured** → Causes Error #3
- ❌ **No post-logout redirect URIs configured** → Causes Error #1
- ⚠️  **CORS settings not visible** → Potential cause of API errors

## Development Environment Setup

### Browser Configuration
- [ ] Chrome/Firefox with developer tools
- [ ] Network tab monitoring enabled
- [ ] Console logging enabled 
- [ ] Application storage inspection available

### Server Configuration
- [ ] Next.js dev server running on port 6789
- [ ] Environment variables loaded from `.env.local`
- [ ] Error logging enabled in callback routes

## Next Steps for Stream Coordination

### For Stream B (Sign-out Error)
- Root cause confirmed: Missing post-logout redirect URI
- Configuration backup available for reference
- Ready for systematic reproduction and fix verification

### For Stream C (Organization API Error)
- API routes and middleware need analysis
- Token flow tracing required
- Authentication header investigation needed

### For Stream D (OAuth Callback Error)
- Callback route error handling needs deep analysis  
- Missing redirect URI likely contributes to failures
- OAuth state/code parameter validation required

## Success Criteria for Error Reproduction

### All Errors Must Be
- [ ] Consistently reproducible with documented steps
- [ ] Captured with network traces and console logs
- [ ] Root causes identified and documented
- [ ] Ready for systematic fixing in subsequent issues

---

**Status**: Environment validated, root causes partially identified
**Next**: Proceed with systematic error reproduction across all streams
**Priority**: Fix missing redirect URIs to enable proper OAuth flow testing