---
issue: 26
streams: 4  
estimated_hours: 4
---

# Issue #26 Analysis: Environment Setup and Error Reproduction

## Current State Assessment

**Authentication Architecture**: Next.js 15 App Router with Logto SDK v4.2.6
- **Sign-in Flow**: Uses `handleSignIn()` from `@logto/next/server-actions`
- **Session Management**: Server-side sessions via `getLogtoContext()`
- **API Authentication**: Mixed patterns (JWT headers vs server sessions)
- **Organization Context**: Client-side provider fetching user organizations

**Environment Status**: 
- ✅ All required env vars configured in `.env.local`
- ✅ M2M credentials present for Management API access
- ✅ Development server runs on correct port (6789)
- ❌ Authentication flows failing at multiple points

## Error Reproduction Plan

### Error 1: Sign-out OIDC Failure
**Symptom**: `{"code":"oidc.invalid_request","error_description":"post_logout_redirect_uri not registered"}`
**Location**: `https://z3zlta.logto.app/oidc/session/end?client_id=m07bzoq8ltp8fswv7m2y8&post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A6789`
**Root Cause**: Logto SPA app config missing `http://localhost:6789` in post-logout redirect URIs

### Error 2: Organization API Authentication  
**Symptom**: `Failed to fetch organizations` at `organization-provider.tsx:54:15`
**Location**: `GET /api/organizations 401 in 226ms`
**Root Cause**: Organization provider makes unauthenticated API calls (no Bearer token)

### Error 3: OAuth Callback Failure
**Symptom**: `GET /callback?code=...&state=... 307` redirects to `/?error=auth_failed` 
**Root Cause**: Generic error handling in callback route masks specific OAuth failures

## Work Stream Breakdown

### Stream A: Environment Validation & M2M Setup (1 hour)
**Scope**: Validate development environment and test M2M credentials
- Verify all environment variables are correctly set
- Test M2M authentication against Logto Management API
- Document current Logto app configuration (backup)
- Set up debugging tools and browser dev environments
- Create error reproduction checklist template

**Key Files**: `.env.local`, M2M test scripts
**Success Criteria**: M2M API calls working, environment documented

### Stream B: Sign-out Error Reproduction (1 hour)  
**Scope**: Systematically reproduce and analyze sign-out OIDC error
- Trigger sign-out flow and capture full OIDC error response
- Analyze `lib/auth/actions.ts` sign-out implementation
- Test different redirect URI patterns and configurations
- Document exact Logto app configuration requirements
- Create fix verification test procedure

**Key Files**: `lib/auth/actions.ts`, sign-out UI components
**Success Criteria**: Error consistently reproducible with detailed logs

### Stream C: Organization API Error Analysis (1 hour)
**Scope**: Debug organization API authentication and token flow
- Trace organization provider authentication token handling
- Analyze `/api/organizations/route.ts` authentication middleware
- Test API calls with and without proper authentication headers
- Document expected vs actual token flow patterns
- Identify session vs JWT authentication inconsistencies

**Key Files**: `components/providers/organization-provider.tsx`, `app/api/organizations/route.ts`
**Success Criteria**: Root cause identified with specific fix requirements

### Stream D: OAuth Callback Error Debugging (1 hour)
**Scope**: Deep-dive OAuth callback processing and error handling
- Trace complete OAuth flow from Logto redirect to callback processing
- Analyze `app/callback/route.ts` error handling and logging
- Test various OAuth error scenarios (invalid state, expired code, etc.)
- Document proper callback error handling patterns
- Create detailed OAuth flow debugging guide

**Key Files**: `app/callback/route.ts`, OAuth flow middleware
**Success Criteria**: Callback failures traced to specific root causes

## Coordination Requirements

**Shared Resources**: 
- Development server must remain stable across all streams
- Browser developer tools sessions for error capture
- Logto admin console for configuration review (read-only during reproduction)

**Data Collection**:
- Each stream documents findings in shared error log
- Screen recordings of error reproductions for verification
- Console logs and network traces for all authentication attempts
- Environment configuration snapshots before any changes

## Success Criteria  

**Completion Requirements**:
- [ ] All three error scenarios consistently reproducible
- [ ] Root cause analysis documented for each error
- [ ] M2M API access validated and working
- [ ] Complete environment baseline documented
- [ ] Error reproduction procedures tested and verified

**Next Steps Enablement**:
- Provides foundation for Issue #27 (Logto Configuration Fixes)
- Enables parallel execution of Issues #28 & #29 (Code fixes)
- Establishes testing procedures for Issue #30 (E2E Validation)

**Risk Mitigation**:
- Backup all current configurations before any changes
- Document rollback procedures for any environment modifications
- Maintain development server stability throughout analysis process