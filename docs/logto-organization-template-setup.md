# Logto Organization Template Configuration

## Overview

This document provides step-by-step instructions for configuring the organization template in Logto admin console with the required role hierarchy and permissions for the Net Ecosystem Platform.

## Access Information

- **Logto Instance**: `https://z3zlta.logto.app/`
- **Admin Console**: `https://z3zlta.logto.app/admin`
- **Demo Credentials**: 
  - Username: `user`
  - Password: `RtIoJ1Mc`

## Organization Template Configuration

### Step 1: Access Organizations Section

1. Navigate to `https://z3zlta.logto.app/admin`
2. Sign in using the demo credentials
3. Go to **Organizations** section in the sidebar
4. Click on **Organization Templates** or **Templates**

### Step 2: Create Organization Template

1. Click **Create Template** or **New Template**
2. Configure the template:
   - **Name**: `Net Ecosystem Platform Template`
   - **Description**: `Default template for Net Ecosystem Platform organizations with admin, member, and guest roles`
   - **Set as Default**: Enable this option
3. Save the template

### Step 3: Define Business Logic Permissions

Create the following organization-scoped permissions in the template:

#### Inbox Permissions
- **inbox:read**: Access to communication hub and messages
- **inbox:write**: Create and respond to messages, manage conversations

#### Library Permissions  
- **library:read**: View templates, assets, and library content
- **library:write**: Create, modify, and manage templates and assets

#### Catalog Permissions
- **catalog:browse**: Browse app marketplace and discovery features
- **catalog:install**: Install and manage marketplace applications

#### Profile Permissions
- **profile:read**: View organization profiles and member information
- **profile:manage**: Manage organization settings, member profiles, and configurations

### Step 4: Create Role Hierarchy

#### Admin Role
- **Name**: `admin`
- **Description**: `Full administrative access with organization management capabilities`
- **Permissions**:
  - `inbox:read`
  - `inbox:write`
  - `library:read`
  - `library:write`
  - `catalog:browse`
  - `catalog:install`
  - `profile:read`
  - `profile:manage`
  - Organization management (built-in):
    - Invite/remove users
    - Assign/modify roles
    - Organization settings management
    - Application access control

#### Member Role
- **Name**: `member`
- **Description**: `Standard user with read/write access to core features`
- **Permissions**:
  - `inbox:read`
  - `inbox:write`
  - `library:read`
  - `library:write`
  - `catalog:browse`
  - `catalog:install`
  - `profile:read`

#### Guest Role
- **Name**: `guest`
- **Description**: `Limited read-only access to organization resources`
- **Permissions**:
  - `inbox:read`
  - `library:read`
  - `catalog:browse`
  - `profile:read` (limited scope)

## Permission Matrix

| Permission | Admin | Member | Guest |
|------------|-------|--------|-------|
| inbox:read | ✅ | ✅ | ✅ |
| inbox:write | ✅ | ✅ | ❌ |
| library:read | ✅ | ✅ | ✅ |
| library:write | ✅ | ✅ | ❌ |
| catalog:browse | ✅ | ✅ | ✅ |
| catalog:install | ✅ | ✅ | ❌ |
| profile:read | ✅ | ✅ | ✅ (limited) |
| profile:manage | ✅ | ❌ | ❌ |
| Organization Management | ✅ | ❌ | ❌ |

## Implementation Steps in Logto Admin Console

### 1. Create Permissions

Navigate to **Organization Templates** → **[Your Template]** → **Permissions**:

1. Click **Add Permission**
2. Add each permission with the following structure:
   - **Name**: `inbox:read`
   - **Description**: `Access to communication hub and messages`
   - **Resource**: `inbox`
   - **Action**: `read`
3. Repeat for all permissions listed above

### 2. Create Roles

Navigate to **Organization Templates** → **[Your Template]** → **Roles**:

#### Admin Role Configuration
1. Click **Add Role**
2. **Name**: `admin`
3. **Description**: `Full administrative access with organization management capabilities`
4. **Permissions**: Select all permissions created above
5. **Organization Management**: Enable all organization management capabilities
6. Save the role

#### Member Role Configuration
1. Click **Add Role**
2. **Name**: `member`
3. **Description**: `Standard user with read/write access to core features`
4. **Permissions**: Select:
   - `inbox:read`, `inbox:write`
   - `library:read`, `library:write`
   - `catalog:browse`, `catalog:install`
   - `profile:read`
5. Save the role

#### Guest Role Configuration
1. Click **Add Role**
2. **Name**: `guest`
3. **Description**: `Limited read-only access to organization resources`
4. **Permissions**: Select:
   - `inbox:read`
   - `library:read`
   - `catalog:browse`
   - `profile:read`
5. Save the role

### 3. Set Default Role Assignment

1. Go to **Organization Templates** → **[Your Template]** → **Settings**
2. Set **Default Role for New Members**: `member`
3. Set **Default Role for Organization Creator**: `admin`
4. Save settings

## JWT Token Configuration

Ensure the organization template is configured to include the following claims in JWT tokens:

```json
{
  "sub": "user_id",
  "org_id": "organization_id",
  "org_roles": ["admin"],
  "permissions": [
    "inbox:read",
    "inbox:write",
    "library:read",
    "library:write",
    "catalog:browse",
    "catalog:install",
    "profile:read",
    "profile:manage"
  ],
  "aud": "urn:logto:organization:{org_id}"
}
```

## Application Integration Settings

Navigate to **Applications** → **[Your SPA App]** → **Settings**:

1. **Redirect URIs**:
   - `http://localhost:6789/api/logto/callback`
   - Add production URLs as needed

2. **Post-logout Redirect URIs**:
   - `http://localhost:6789`
   - Add production URLs as needed

3. **CORS Allowed Origins**:
   - `http://localhost:6789`
   - Add production domains as needed

4. **Token Settings**:
   - Access Token TTL: 3600 seconds (1 hour)
   - Refresh Token TTL: 1209600 seconds (14 days)
   - Include organization context in tokens: Enable

## Testing and Validation

### 1. Create Test Organization

1. Use the Logto Management API or admin console to create a test organization
2. Verify it uses the configured template
3. Check that default roles are properly assigned

### 2. Test Role Assignments

1. Create test users with different roles
2. Verify each role has the correct permissions
3. Test permission validation in application context

### 3. Validate JWT Tokens

Use the application's authentication flow to obtain JWT tokens and verify:
- Organization context is included
- Role information is present
- Permissions are correctly mapped
- Token audience includes organization ID

## Security Considerations

1. **Least Privilege**: Guest role has minimal read-only access
2. **Role Separation**: Clear distinction between admin, member, and guest capabilities
3. **Organization Isolation**: Ensure permissions are scoped to specific organizations
4. **Token Security**: Proper token expiration and refresh policies

## Troubleshooting

### Common Issues

1. **Permissions not appearing in tokens**:
   - Verify permission is assigned to role
   - Check organization template configuration
   - Ensure user has been assigned the role

2. **Role assignment failures**:
   - Verify organization template is set as default
   - Check user exists in organization
   - Confirm role exists in template

3. **Token validation errors**:
   - Verify JWT audience includes organization context
   - Check token expiration times
   - Ensure proper JWKS configuration

## Next Steps

After completing this configuration:

1. **Stream B**: Authentication setup can proceed with role-based route protection
2. **Stream C**: Testing can validate the complete authentication and authorization flow
3. **Development Team**: Can implement permission-based UI rendering and API protection

## Support Information

- **Logto Documentation**: https://docs.logto.io/
- **Organization Management**: https://docs.logto.io/recipes/organizations/
- **Role-Based Access Control**: https://docs.logto.io/recipes/rbac/

---

**Configuration Status**: Ready for implementation
**Last Updated**: 2025-09-13
**Version**: 1.0