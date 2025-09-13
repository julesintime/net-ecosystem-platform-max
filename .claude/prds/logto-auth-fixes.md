---
name: logto-auth-fixes
description: Critical authentication system repairs for Logto OAuth integration failures
status: backlog
created: 2025-09-13T20:21:57Z
---

# PRD: Logto Authentication Fixes

## Executive Summary

The Net Ecosystem Platform's Logto authentication integration is experiencing complete system failure across three critical areas: sign-out functionality, organization API authentication, and OAuth callback handling. This PRD outlines the immediate fixes required to restore full authentication functionality and establish reliable testing to prevent future regressions.

**Business Impact**: Authentication is completely broken, blocking all user access to the platform and preventing new user registration.

## Problem Statement

### Primary Issues
The authentication system has three critical failures that make the platform unusable:

1. **Sign-out Failure**: Users cannot sign out due to unregistered `post_logout_redirect_uri`
   - Error: `{"code":"oidc.invalid_request","message":"Request is invalid.","error":"invalid_request","error_description":"post_logout_redirect_uri not registered"}`
   - URL: `https://z3zlta.logto.app/oidc/session/end?client_id=m07bzoq8ltp8fswv7m2y8&post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A6789`

2. **Organization API Authentication Failure**: 401 Unauthorized responses prevent organization data retrieval
   - Error in `components/providers/organization-provider.tsx:54:15`
   - API endpoint `/api/organizations` returns 401 instead of organization data
   - Breaks organization context and multi-tenant functionality

3. **OAuth Callback Handler Broken**: Authentication flow fails after successful Logto authentication
   - OAuth callback URL: `/callback?code=...&state=...&iss=https://z3zlta.logto.app/oidc`
   - Results in 307 redirect to `/?error=auth_failed`
   - Users cannot complete sign-in process

### Root Cause Analysis
- **Configuration Gap**: Logto SPA application missing required redirect URI registrations
- **Authentication Middleware**: API routes not properly validating Logto session tokens
- **Session Management**: OAuth callback handler not correctly processing Logto authentication response

### Why Now?
This is a **critical production blocker** - no users can authenticate, making the entire platform non-functional.

## User Stories

### Primary User Persona: Platform Users
**As a platform user**, I need to be able to sign in, access my organization data, and sign out securely.

### User Journey - Critical Path
1. **User visits platform** → Should reach sign-in page
2. **User clicks "Sign In"** → Should redirect to Logto authentication
3. **User completes Logto auth** → Should return to platform successfully (NOT `/?error=auth_failed`)
4. **User accesses organization features** → Should fetch organization data (NOT 401 error)
5. **User clicks "Sign Out"** → Should sign out cleanly (NOT OIDC error)

### Acceptance Criteria
- [ ] User can complete full sign-in flow without errors
- [ ] Organization API returns 200 with user's organization data  
- [ ] Sign-out completes without OIDC error messages
- [ ] No authentication-related console errors
- [ ] Session persistence works across browser refresh

## Requirements

### Functional Requirements

#### F1: Sign-Out Configuration Fix
- Register `http://localhost:6789` as valid `post_logout_redirect_uri` in Logto console
- Use M2M credentials to programmatically configure redirect URIs
- Validate sign-out flow completes successfully
- Support both development (`localhost:6789`) and production domains

#### F2: Organization API Authentication Repair
- Fix authentication middleware in `/api/organizations` endpoint
- Implement proper Logto session token validation
- Ensure organization context retrieval works for authenticated users
- Return appropriate error responses for unauthenticated requests

#### F3: OAuth Callback Handler Fix
- Debug and repair `/callback` route OAuth processing
- Ensure proper handling of `code`, `state`, and `iss` parameters
- Implement proper error handling and user feedback
- Redirect authenticated users to intended destination (not error page)

#### F4: End-to-End Validation
- Create manual testing checklist for complete authentication flow
- Implement basic E2E test to verify authentication works
- Document each step of successful authentication journey

### Non-Functional Requirements

#### Performance
- Authentication flow should complete in <3 seconds
- API responses should return in <500ms
- No authentication-related memory leaks or resource issues

#### Security
- All authentication tokens handled securely
- No credentials exposed in logs or error messages
- Proper session timeout and cleanup
- CSRF protection maintained

#### Reliability
- Zero authentication failures in happy path scenarios
- Graceful error handling for edge cases
- Comprehensive logging for debugging authentication issues

## Success Criteria

### Measurable Outcomes
1. **Authentication Success Rate**: 100% for valid user credentials
2. **API Response Success**: `/api/organizations` returns 200 status for authenticated users  
3. **Sign-out Success**: 0 OIDC errors during logout process
4. **User Flow Completion**: Users can complete full sign-in → use platform → sign-out journey

### Key Metrics
- Zero `/?error=auth_failed` redirects
- Zero 401 responses from organization API for authenticated users
- Zero OIDC `invalid_request` errors during sign-out
- 100% test pass rate for authentication E2E tests

## Constraints & Assumptions

### Technical Constraints
- Must use existing Logto instance: `https://z3zlta.logto.app/`
- Cannot change core Next.js App Router authentication patterns
- Must maintain compatibility with existing organization multi-tenant architecture
- Limited to configuration changes and code fixes (no infrastructure changes)

### Timeline Constraints
- **Critical Priority**: Must be fixed within 1-2 days maximum
- Cannot wait for comprehensive test suite - need immediate working solution
- Manual testing acceptable for initial validation

### Resource Constraints
- Single developer working on fixes
- Must use existing M2M credentials for Logto configuration
- No budget for external authentication service changes

### Assumptions
- M2M credentials provide sufficient access to modify Logto app configuration
- Current codebase structure is fundamentally sound (configuration/implementation issue)
- Logto service (`z3zlta.logto.app`) is operational and responsive
- Development environment at `localhost:6789` matches production authentication patterns

## Out of Scope

### Explicitly NOT Building
- Complete authentication system redesign
- Migration to different authentication provider
- Advanced user management features
- Comprehensive audit logging system
- Multi-factor authentication (MFA) implementation
- Social login providers beyond Logto
- Password reset functionality (handled by Logto)
- User profile management (handled by Logto)

### Future Enhancements (Not This PRD)
- Performance optimization beyond basic functionality
- Advanced session management features
- Analytics and monitoring dashboards
- Automated testing infrastructure (beyond basic E2E validation)

## Dependencies

### External Dependencies
- **Logto Service Availability**: `https://z3zlta.logto.app/` must be operational
- **Logto Management API**: M2M access required for configuration changes
- **Browser Compatibility**: Modern browsers with cookie and localStorage support

### Internal Dependencies
- **M2M Credentials**: Valid Logto Management API credentials with configuration permissions
- **Development Environment**: Working Next.js development server on port 6789
- **Code Access**: Ability to modify authentication-related files and API routes

### Critical Path Dependencies
1. **Logto Console Access** → Required before any configuration fixes
2. **Authentication Code Review** → Must understand current implementation before fixes
3. **Manual Testing Setup** → Need working development environment for validation
4. **Error Reproduction** → Must be able to reproduce all three error scenarios

## Implementation Strategy

### Phase 1: Emergency Fixes (Day 1)
1. **Immediate Logto Configuration**: Add missing redirect URIs using M2M credentials
2. **API Authentication Fix**: Repair `/api/organizations` middleware authentication
3. **Callback Handler Repair**: Debug and fix OAuth callback processing

### Phase 2: Validation (Day 2)  
1. **Manual Testing**: Complete end-to-end authentication flow validation
2. **Basic E2E Test**: Single test to verify authentication works
3. **Error Monitoring**: Ensure no authentication errors in development environment

### Risk Mitigation
- **Configuration Backup**: Document current Logto settings before changes
- **Incremental Testing**: Test each fix individually before combining
- **Rollback Plan**: Ability to revert changes if fixes cause new issues
- **Manual Fallback**: Document manual workarounds if automated fixes fail

## Definition of Done

### Acceptance Criteria Checklist
- [ ] User can sign in through Logto and reach platform successfully
- [ ] `/api/organizations` returns 200 with organization data for authenticated users
- [ ] User can sign out without OIDC error messages  
- [ ] No `/?error=auth_failed` redirects during authentication flow
- [ ] All three original error scenarios are resolved
- [ ] Manual test covers complete authentication journey
- [ ] Basic E2E test passes consistently
- [ ] Development environment authentication is stable and reliable

**Success Definition**: A user can complete the full authentication journey (sign in → access organizations → sign out) without encountering any of the three critical errors described in this PRD.