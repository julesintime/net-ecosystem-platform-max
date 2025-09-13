---
issue: 17
title: Configuration Fix - Redirect URI and Environment Validation
analyzed: 2025-09-13T15:09:09Z
estimated_hours: 4
parallelization_factor: 2.5
---

# Parallel Work Analysis: Issue #17

## Overview
Fix critical Logto OAuth authentication configuration issues that are blocking the entire authentication system. The primary issue is a redirect URI mismatch where Logto expects `/callback` but the application is configured for `/api/logto/callback`. Additionally, implement comprehensive environment variable validation to prevent configuration errors.

## Parallel Streams

### Stream A: OAuth Route Configuration
**Scope**: Fix the redirect URI mismatch and create proper OAuth callback handling
**Files**:
- `app/callback/route.ts` (create new App Router callback)
- `app/api/logto/[...logto]/route.ts` (analyze and potentially remove)
- `.env.local` (update redirect URI configuration)
**Agent Type**: fullstack-specialist
**Can Start**: immediately
**Estimated Hours**: 2
**Dependencies**: none

### Stream B: Environment Validation System
**Scope**: Create comprehensive environment variable validation and startup checks
**Files**:
- `lib/auth/env-validation.ts` (create new validation utility)
- `lib/auth/logto-config.ts` (enhance with validation calls)
- `app/layout.tsx` (add startup validation)
- `docs/environment-variables.md` (create documentation)
**Agent Type**: backend-specialist
**Can Start**: immediately
**Estimated Hours**: 2
**Dependencies**: none

## Coordination Points

### Shared Files
- `lib/auth/logto-config.ts` - Both streams need to modify this file
  - Stream A: Update redirect URI configuration
  - Stream B: Add validation calls and error handling

### Sequential Requirements
None - both streams can work completely independently and merge at the end.

## Conflict Risk Assessment
- **Low Risk**: Only one shared file (`logto-config.ts`) with different areas of modification
- Stream A focuses on OAuth endpoints and redirect configuration
- Stream B focuses on validation utilities and startup checks
- Minimal overlap, easy to merge

## Parallelization Strategy

**Recommended Approach**: parallel

Launch Streams A and B simultaneously. Both can work independently and their changes will complement each other. Stream A fixes the immediate OAuth issue while Stream B prevents future configuration problems.

## Expected Timeline

With parallel execution:
- Wall time: 2 hours (max of both streams)
- Total work: 4 hours
- Efficiency gain: 50%

Without parallel execution:
- Wall time: 4 hours

## Notes
- Stream A is critical path - OAuth fix unblocks all other authentication work
- Stream B provides infrastructure improvements that benefit the entire project
- Both streams should test their changes independently
- Final integration test should verify OAuth works with validation active
- Logto admin console access required for redirect URI update (external dependency)