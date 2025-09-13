# Authentication Testing Guide
# Issue #10 - Stream B: Authentication & Sign-in Experience

## Overview
This document provides comprehensive testing procedures for validating all authentication flows, organization management, and JWT token functionality for the Net Ecosystem Platform.

## Pre-Testing Setup

### 1. Environment Preparation

Ensure the following are configured:
- [ ] Logto instance is running and accessible
- [ ] Development server is running on port 6789
- [ ] Environment variables are properly set
- [ ] Database/storage is properly configured

```bash
# Start the development environment
npm run dev

# Verify Logto endpoint accessibility
curl -s https://z3zlta.logto.app/.well-known/openid-configuration
```

### 2. Test User Accounts

Create test accounts for different scenarios:
- **Admin User**: Full organization management permissions
- **Member User**: Standard user permissions
- **Guest User**: Limited read-only access
- **Social Login User**: Account created via social providers

## Authentication Flow Testing

### 1. Email/Password Registration

#### Test Case: New User Registration
```bash
# Test Steps:
1. Navigate to http://localhost:6789
2. Click "Get Started" or "Sign Up"
3. Enter valid email address
4. Create password meeting policy requirements
5. Complete registration form
6. Verify email verification is sent
7. Click verification link
8. Confirm successful registration
```

**Expected Results:**
- [ ] Registration form validates input properly
- [ ] Password policy is enforced
- [ ] Email verification email is sent
- [ ] Verification link works correctly
- [ ] User is redirected to dashboard after verification
- [ ] User profile is properly created

#### Test Case: Existing User Sign-in
```bash
# Test Steps:
1. Navigate to http://localhost:6789
2. Click "Sign In"
3. Enter existing email and password
4. Submit sign-in form
5. Verify successful authentication
```

**Expected Results:**
- [ ] Sign-in form accepts valid credentials
- [ ] Invalid credentials show appropriate error
- [ ] Successful sign-in redirects to dashboard
- [ ] User session is properly established

### 2. Social Provider Authentication

#### Test Case: Google OAuth
```bash
# Test Steps:
1. Navigate to sign-in page
2. Click "Continue with Google"
3. Complete Google OAuth flow
4. Verify user data synchronization
5. Check dashboard access
```

**Expected Results:**
- [ ] Google OAuth redirects properly
- [ ] User profile data is synced (name, email, avatar)
- [ ] New users are automatically registered
- [ ] Existing users are properly authenticated

#### Test Case: GitHub OAuth
```bash
# Test Steps:
1. Navigate to sign-in page
2. Click "Continue with GitHub"
3. Complete GitHub OAuth flow
4. Verify user data synchronization
5. Check dashboard access
```

**Expected Results:**
- [ ] GitHub OAuth redirects properly
- [ ] User profile data is synced correctly
- [ ] Email address is properly retrieved
- [ ] Authentication flow completes successfully

### 3. Password Reset Flow

#### Test Case: Password Reset
```bash
# Test Steps:
1. Navigate to sign-in page
2. Click "Forgot Password?"
3. Enter email address
4. Check for password reset email
5. Click reset link
6. Set new password
7. Sign in with new password
```

**Expected Results:**
- [ ] Password reset email is sent
- [ ] Reset link is valid and secure
- [ ] New password meets policy requirements
- [ ] Old password is properly invalidated
- [ ] Sign-in works with new password

## Organization Management Testing

### 1. Organization Creation

#### Test Case: Create New Organization
```bash
# API Test:
curl -X POST http://localhost:6789/api/organizations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Organization",
    "description": "Test organization for validation"
  }'
```

**Expected Results:**
- [ ] Organization is created successfully
- [ ] Creator is assigned admin role automatically
- [ ] Organization template is applied correctly
- [ ] Organization appears in user's organization list

### 2. Organization Invitation Flow

#### Test Case: Invite User to Organization
```bash
# Test Steps:
1. Sign in as organization admin
2. Navigate to organization settings
3. Click "Invite Members"
4. Enter invitee email and select role
5. Send invitation
6. Check invitation email delivery
7. Test invitation acceptance flow
```

**Expected Results:**
- [ ] Invitation email is sent with correct template
- [ ] Invitation link is valid and secure
- [ ] Role assignment works correctly
- [ ] Invitee gains proper organization access
- [ ] Organization member list is updated

#### Test Case: Invitation Expiration
```bash
# Test Steps:
1. Create invitation with short expiration
2. Wait for expiration time
3. Attempt to accept expired invitation
4. Verify proper error handling
```

**Expected Results:**
- [ ] Expired invitations are properly rejected
- [ ] Clear error message is displayed
- [ ] No unauthorized access is granted

### 3. Role-Based Access Control

#### Test Case: Admin Role Permissions
```bash
# Test admin-only endpoints:
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:6789/api/organizations/[org-id]/members

curl -H "Authorization: Bearer ADMIN_TOKEN" \
  -X POST http://localhost:6789/api/organizations/[org-id]/invitations
```

**Expected Results:**
- [ ] Admin can access all organization endpoints
- [ ] Admin can invite/manage members
- [ ] Admin can modify organization settings
- [ ] Admin permissions are properly validated

#### Test Case: Member Role Permissions
```bash
# Test member endpoints:
curl -H "Authorization: Bearer MEMBER_TOKEN" \
  http://localhost:6789/api/inbox

curl -H "Authorization: Bearer MEMBER_TOKEN" \
  http://localhost:6789/api/library
```

**Expected Results:**
- [ ] Member can access allowed resources
- [ ] Member cannot access admin-only features
- [ ] Permission validation works correctly
- [ ] Proper error responses for unauthorized access

#### Test Case: Guest Role Permissions
```bash
# Test guest endpoints:
curl -H "Authorization: Bearer GUEST_TOKEN" \
  http://localhost:6789/api/library

curl -H "Authorization: Bearer GUEST_TOKEN" \
  -X POST http://localhost:6789/api/library
```

**Expected Results:**
- [ ] Guest has read-only access to allowed resources
- [ ] Guest cannot create/modify content
- [ ] Write operations are properly rejected
- [ ] Read operations work correctly

## JWT Token Testing

### 1. Token Structure Validation

#### Test Case: Standard Claims
```javascript
// Test script: scripts/test-jwt-structure.js
import jwt from 'jsonwebtoken';

function testTokenStructure(token) {
  const decoded = jwt.decode(token);
  
  console.log('Testing JWT structure...');
  
  // Test standard claims
  assert(decoded.iss, 'Missing issuer claim');
  assert(decoded.aud, 'Missing audience claim');
  assert(decoded.sub, 'Missing subject claim');
  assert(decoded.exp, 'Missing expiration claim');
  assert(decoded.iat, 'Missing issued at claim');
  
  console.log('✅ Standard claims validated');
}
```

#### Test Case: Organization Context Claims
```javascript
function testOrganizationClaims(token) {
  const decoded = jwt.decode(token);
  
  console.log('Testing organization claims...');
  
  // Test organization-specific claims
  if (decoded.org_id) {
    assert(decoded.org_roles, 'Missing organization roles');
    assert(Array.isArray(decoded.org_roles), 'Organization roles should be array');
    assert(decoded.permissions, 'Missing permissions');
    assert(Array.isArray(decoded.permissions), 'Permissions should be array');
  }
  
  console.log('✅ Organization claims validated');
}
```

### 2. Token Expiration Testing

#### Test Case: Access Token Expiration
```bash
# Test Steps:
1. Obtain access token
2. Wait for token expiration (or modify expiration time)
3. Attempt API call with expired token
4. Verify proper rejection
```

**Expected Results:**
- [ ] Expired tokens are rejected
- [ ] Proper HTTP 401 status is returned
- [ ] Clear error message indicates token expiration

#### Test Case: Refresh Token Flow
```bash
# Test Steps:
1. Use refresh token to obtain new access token
2. Verify new token has updated expiration
3. Test that old token is invalidated
4. Verify new token works for API calls
```

**Expected Results:**
- [ ] Refresh token generates new access token
- [ ] New token has proper expiration time
- [ ] Old token is properly invalidated
- [ ] Token refresh works seamlessly

## API Endpoint Testing

### 1. Authentication Middleware Testing

#### Test Case: Protected Endpoints
```bash
# Test without token
curl -X GET http://localhost:6789/api/organizations
# Expected: 401 Unauthorized

# Test with invalid token
curl -H "Authorization: Bearer invalid_token" \
  http://localhost:6789/api/organizations
# Expected: 401 Unauthorized

# Test with valid token
curl -H "Authorization: Bearer VALID_TOKEN" \
  http://localhost:6789/api/organizations
# Expected: 200 OK with data
```

#### Test Case: Permission-Based Endpoints
```bash
# Test insufficient permissions
curl -H "Authorization: Bearer GUEST_TOKEN" \
  -X POST http://localhost:6789/api/organizations
# Expected: 403 Forbidden

# Test sufficient permissions
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  -X POST http://localhost:6789/api/organizations
# Expected: 200 OK or 201 Created
```

### 2. Organization Context Testing

#### Test Case: Organization Isolation
```bash
# Test Steps:
1. Create organization A with admin user
2. Create organization B with different admin user
3. Attempt to access organization A data with organization B token
4. Verify access is properly denied
```

**Expected Results:**
- [ ] Cross-organization access is prevented
- [ ] Proper error responses are returned
- [ ] Data isolation is maintained
- [ ] No unauthorized data leakage occurs

## Performance Testing

### 1. Authentication Performance

#### Test Case: Login Response Time
```bash
# Use tools like Apache Bench or curl
time curl -X POST http://localhost:6789/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

**Expected Results:**
- [ ] Login completes within acceptable time (< 2 seconds)
- [ ] Token generation is efficient
- [ ] Database queries are optimized

#### Test Case: JWT Validation Performance
```bash
# Test multiple concurrent requests
ab -n 100 -c 10 -H "Authorization: Bearer TOKEN" \
  http://localhost:6789/api/organizations
```

**Expected Results:**
- [ ] JWT validation is efficient
- [ ] No significant performance degradation
- [ ] Concurrent requests handled properly

## Security Testing

### 1. Authentication Security

#### Test Case: Brute Force Protection
```bash
# Test Steps:
1. Attempt multiple failed login attempts
2. Verify rate limiting is applied
3. Check for account lockout mechanisms
4. Test legitimate access after lockout period
```

**Expected Results:**
- [ ] Rate limiting prevents brute force attacks
- [ ] Account lockout mechanisms work properly
- [ ] Legitimate users can access after lockout period
- [ ] Security events are properly logged

#### Test Case: Token Security
```bash
# Test Steps:
1. Attempt to use token with modified payload
2. Test token replay attacks
3. Verify token signature validation
4. Test token with wrong audience
```

**Expected Results:**
- [ ] Modified tokens are rejected
- [ ] Token signatures are properly validated
- [ ] Audience validation works correctly
- [ ] No token replay vulnerabilities exist

### 2. Organization Security

#### Test Case: Privilege Escalation
```bash
# Test Steps:
1. Attempt to modify own role through API
2. Try to access admin endpoints as member
3. Test organization creation without proper permissions
4. Verify proper authorization checks
```

**Expected Results:**
- [ ] Users cannot escalate their own privileges
- [ ] Role-based access control is enforced
- [ ] Unauthorized actions are properly blocked
- [ ] Security boundaries are maintained

## Testing Automation

### 1. Automated Test Suite

Create automated tests for all flows:

```javascript
// tests/auth.test.js
describe('Authentication Flows', () => {
  test('should register new user successfully', async () => {
    // Test implementation
  });
  
  test('should authenticate existing user', async () => {
    // Test implementation
  });
  
  test('should reject invalid credentials', async () => {
    // Test implementation
  });
});

describe('Organization Management', () => {
  test('should create organization with proper role assignment', async () => {
    // Test implementation
  });
  
  test('should invite user to organization', async () => {
    // Test implementation
  });
});
```

### 2. Continuous Integration Testing

Add CI/CD pipeline tests:

```yaml
# .github/workflows/auth-tests.yml
name: Authentication Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:auth
      - run: npm run test:integration
```

## Test Report Template

After completing all tests, document results:

```markdown
# Authentication Testing Report

## Test Summary
- Total Tests: [number]
- Passed: [number]
- Failed: [number]
- Skipped: [number]

## Test Results by Category

### Authentication Flows
- Email/Password Registration: ✅ PASS
- Social Provider Login: ✅ PASS
- Password Reset: ✅ PASS

### Organization Management
- Organization Creation: ✅ PASS
- Invitation Flow: ✅ PASS
- Role Assignment: ✅ PASS

### Security Testing
- JWT Validation: ✅ PASS
- Permission Enforcement: ✅ PASS
- Cross-Organization Access: ✅ PASS

## Issues Identified
- [List any issues found during testing]

## Recommendations
- [List improvements or fixes needed]
```

This comprehensive testing guide ensures all authentication and organization management features work correctly and securely in the Net Ecosystem Platform.