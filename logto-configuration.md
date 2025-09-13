# Logto Admin Console Configuration Guide
# Issue #10 - Stream B: Authentication & Sign-in Experience

## Overview
This document provides step-by-step instructions for configuring the Logto admin console for the Net Ecosystem Platform with organization-based multi-tenancy.

## Logto Instance Details
- **URL**: https://z3zlta.logto.app/
- **Admin Access**: Use demo credentials from .env.local
- **Development Port**: 6789

## Configuration Tasks

### 1. Organization Template Setup

Navigate to **Organizations** → **Templates** in the Logto admin console:

#### Create Organization Template
- **Name**: `Net Ecosystem Platform Template`
- **Description**: `Default template for Net Ecosystem Platform organizations with admin, member, and guest roles`
- **Set as Default**: Yes

### 2. Role Configuration

Create the following roles in the organization template:

#### Admin Role
- **Name**: `admin`
- **Description**: `Full organization management permissions`
- **Permissions**:
  - `inbox:read` - Access communication hub
  - `inbox:write` - Create and respond to messages
  - `library:read` - View templates and assets
  - `library:write` - Create and modify templates
  - `catalog:browse` - Browse app marketplace
  - `catalog:install` - Install marketplace apps
  - `profile:read` - View organization profiles
  - `profile:manage` - Manage organization settings
  - `organization:manage` - Full organization administration
  - `users:invite` - Invite users to organization
  - `users:manage` - Manage user roles and permissions

#### Member Role (Default)
- **Name**: `member`
- **Description**: `Standard user permissions with read/write access`
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
- **Description**: `Limited read-only access for external users`
- **Permissions**:
  - `inbox:read`
  - `library:read`
  - `catalog:browse`
  - `profile:read` (limited)

### 3. Application Configuration

Update the existing SPA application (ID: m07bzoq8ltp8fswv7m2y8):

#### Redirect URIs
```
http://localhost:6789/api/logto/callback
http://localhost:6789/auth/callback
https://yourdomain.com/api/logto/callback
```

#### Post-logout Redirect URIs
```
http://localhost:6789
https://yourdomain.com
```

#### CORS Allowed Origins
```
http://localhost:6789
https://yourdomain.com
```

#### Required Scopes
- `openid`
- `profile`
- `email`
- `organizations`
- `organization_roles`
- Custom scopes for API resource

### 4. Social Provider Configuration

#### Google OAuth
1. Navigate to **Sign-in Experience** → **Social**
2. Add Google provider:
   - **Client ID**: (To be configured with Google Console)
   - **Client Secret**: (To be configured with Google Console)
   - **Scopes**: `openid profile email`

#### GitHub OAuth
1. Add GitHub provider:
   - **Client ID**: (To be configured with GitHub Apps)
   - **Client Secret**: (To be configured with GitHub Apps)
   - **Scopes**: `user:email`

#### Microsoft OAuth (Optional)
1. Add Microsoft provider:
   - **Client ID**: (To be configured with Azure AD)
   - **Client Secret**: (To be configured with Azure AD)
   - **Scopes**: `openid profile email`

### 5. Email/Password Authentication

Navigate to **Sign-in Experience** → **Password**:

#### Password Policy
- **Minimum Length**: 8 characters
- **Require Uppercase**: Yes
- **Require Lowercase**: Yes
- **Require Numbers**: Yes
- **Require Special Characters**: Yes

#### Email Verification
- **Verification Required**: Yes
- **Verification Method**: Email link
- **Link Expiration**: 24 hours

### 6. Sign-in Page Customization

Navigate to **Sign-in Experience** → **Branding**:

#### Branding Settings
- **Application Name**: `Net Ecosystem Platform`
- **Logo URL**: (Upload platform logo)
- **Primary Color**: `#000000` (or brand primary color)
- **Corner Radius**: `8px`
- **Font Family**: `Inter, system-ui, sans-serif`

#### Custom CSS
```css
.logto-container {
  font-family: 'Inter', system-ui, sans-serif;
}

.logto-header {
  margin-bottom: 2rem;
}

.logto-button {
  border-radius: 8px;
  font-weight: 500;
}
```

### 7. Organization Invitation Flow

Navigate to **Organizations** → **Invitations**:

#### Invitation Settings
- **Invitation Expiration**: 7 days
- **Default Role**: `member`
- **Allow Role Override**: Yes (for admins)

#### Email Template Configuration
```html
<!DOCTYPE html>
<html>
<head>
    <title>Organization Invitation - Net Ecosystem Platform</title>
</head>
<body>
    <div style="max-width: 600px; margin: 0 auto; font-family: system-ui, sans-serif;">
        <h1>You're invited to join {{organization_name}}</h1>
        <p>Hi there,</p>
        <p>{{inviter_name}} has invited you to join <strong>{{organization_name}}</strong> on the Net Ecosystem Platform.</p>
        <p>Click the button below to accept your invitation:</p>
        <a href="{{invitation_link}}" style="display: inline-block; background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Accept Invitation</a>
        <p>This invitation will expire in 7 days.</p>
        <p>If you have any questions, please contact the organization administrator.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">Net Ecosystem Platform</p>
    </div>
</body>
</html>
```

### 8. JWT Token Configuration

Navigate to **API Resources** → **Net Ecosystem Platform API**:

#### Token Claims
Ensure the following claims are included in organization-scoped tokens:
- `sub` (user ID)
- `email`
- `name`
- `picture`
- `org_id` (organization ID)
- `org_roles` (organization roles)
- `permissions` (organization-scoped permissions)

#### Token Expiration
- **Access Token**: 1 hour
- **Refresh Token**: 14 days
- **ID Token**: 1 hour

### 9. API Resource Configuration

Update the API resource configuration:

#### Resource Details
- **Name**: `Net Ecosystem Platform API`
- **Identifier**: `https://api.ecosystem-platform.dev`

#### Scopes
```
read:organizations
create:organizations
manage:organizations
inbox:read
inbox:write
library:read
library:write
catalog:browse
catalog:install
profile:read
profile:manage
```

## Testing Checklist

After completing the configuration:

1. **Test Registration Flow**:
   - Navigate to http://localhost:6789
   - Click "Get Started"
   - Complete registration with email/password
   - Verify email verification process

2. **Test Social Login**:
   - Test Google OAuth flow
   - Test GitHub OAuth flow
   - Verify user data is properly synced

3. **Test Organization Creation**:
   - Create a new organization
   - Verify default role assignment
   - Test organization switching

4. **Test Invitation Flow**:
   - Invite a user to organization
   - Verify invitation email
   - Test invitation acceptance

5. **Test Permission Validation**:
   - Verify JWT tokens contain organization context
   - Test role-based access control
   - Validate permission inheritance

## Configuration Validation

Run the following commands to validate the configuration:

```bash
# Test authentication endpoint
curl -X GET "http://localhost:6789/api/auth/me" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test organization endpoint
curl -X GET "http://localhost:6789/api/organizations" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**:
   - Ensure all redirect URIs include port 6789
   - Check for trailing slashes

2. **CORS Errors**:
   - Verify CORS origins include localhost:6789
   - Check for protocol mismatches (http vs https)

3. **Token Validation Failures**:
   - Verify JWT audience matches API resource identifier
   - Check token expiration settings

4. **Social Provider Issues**:
   - Verify client IDs and secrets are correct
   - Check callback URLs in provider consoles

## Security Considerations

1. **Environment Variables**:
   - Never commit secrets to version control
   - Use different secrets for production

2. **Token Security**:
   - Use HTTPS in production
   - Implement proper token refresh logic
   - Set appropriate CORS policies

3. **Organization Isolation**:
   - Verify organization-scoped permissions
   - Test cross-organization access restrictions
   - Validate invitation security

This configuration establishes a robust multi-tenant authentication system with proper organization isolation and role-based access control.