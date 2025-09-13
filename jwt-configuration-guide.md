# JWT Token Configuration Guide
# Issue #10 - Stream B: Authentication & Sign-in Experience

## Overview
This document provides comprehensive instructions for configuring JWT tokens to include organization context and proper claims for the Net Ecosystem Platform.

## JWT Token Structure Requirements

### Standard Claims
The JWT tokens should include the following standard claims:
- `iss` (issuer): The Logto endpoint
- `aud` (audience): The API resource identifier
- `sub` (subject): User ID
- `iat` (issued at): Token creation timestamp
- `exp` (expires at): Token expiration timestamp
- `scope`: Granted scopes

### Custom Claims for Organization Context
- `email`: User's email address
- `name`: User's display name
- `picture`: User's avatar URL
- `org_id`: Current organization ID (when in organization context)
- `org_roles`: Array of organization roles
- `permissions`: Array of organization-scoped permissions

## API Resource Configuration

### 1. Update API Resource Settings

In Logto Admin Console → **API Resources** → **Net Ecosystem Platform API**:

#### Basic Information
```json
{
  "name": "Net Ecosystem Platform API",
  "identifier": "https://api.ecosystem-platform.dev",
  "description": "API resource for the Net Ecosystem Platform with organization support"
}
```

#### Token Settings
```json
{
  "tokenExpirationInSeconds": 3600,
  "refreshTokenTtlInDays": 14,
  "includeUserInfoInAccessToken": true
}
```

### 2. Configure Token Claims

#### Custom Claims Mapping
Add the following custom claims configuration:

```json
{
  "customClaims": {
    "email": {
      "source": "user.primaryEmail",
      "required": true
    },
    "name": {
      "source": "user.name",
      "fallback": "user.username"
    },
    "picture": {
      "source": "user.avatar",
      "required": false
    },
    "org_id": {
      "source": "organization.id",
      "contextDependent": true
    },
    "org_name": {
      "source": "organization.name",
      "contextDependent": true
    },
    "org_roles": {
      "source": "organization.userRoles",
      "contextDependent": true,
      "type": "array"
    },
    "permissions": {
      "source": "organization.userPermissions",
      "contextDependent": true,
      "type": "array"
    }
  }
}
```

## Organization-Scoped Token Configuration

### 1. Organization Context Token Request

When requesting organization-scoped tokens, use the following configuration:

```javascript
// Example token request with organization context
const organizationToken = await getOrganizationToken(organizationId, {
  audience: 'https://api.ecosystem-platform.dev',
  scopes: [
    'read:organizations',
    'manage:organizations',
    'inbox:read',
    'inbox:write',
    'library:read',
    'library:write',
    'catalog:browse',
    'catalog:install',
    'profile:read',
    'profile:manage'
  ]
});
```

### 2. Token Validation Middleware

Create token validation middleware for the application:

```typescript
// lib/jwt-validation.ts
import { jwtVerify, createRemoteJWKSet } from 'jose';

interface OrganizationClaims {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  org_id?: string;
  org_name?: string;
  org_roles?: string[];
  permissions?: string[];
}

const JWKS = createRemoteJWKSet(new URL(`${process.env.LOGTO_ENDPOINT}/oidc/jwks`));

export async function validateOrganizationToken(token: string): Promise<OrganizationClaims> {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `${process.env.LOGTO_ENDPOINT}/oidc`,
      audience: 'https://api.ecosystem-platform.dev',
    });

    return {
      sub: payload.sub!,
      email: payload.email as string,
      name: payload.name as string,
      picture: payload.picture as string,
      org_id: payload.org_id as string,
      org_name: payload.org_name as string,
      org_roles: payload.org_roles as string[] || [],
      permissions: payload.permissions as string[] || [],
    };
  } catch (error) {
    throw new Error(`Invalid token: ${error.message}`);
  }
}

export function hasPermission(claims: OrganizationClaims, permission: string): boolean {
  return claims.permissions?.includes(permission) || 
         claims.permissions?.includes('*') || 
         claims.org_roles?.includes('admin');
}

export function hasRole(claims: OrganizationClaims, role: string): boolean {
  return claims.org_roles?.includes(role) || false;
}

export function requirePermission(permission: string) {
  return (claims: OrganizationClaims) => {
    if (!hasPermission(claims, permission)) {
      throw new Error(`Missing required permission: ${permission}`);
    }
  };
}
```

## Application Integration

### 1. Update Environment Configuration

Ensure the following environment variables are properly configured:

```bash
# .env.local

# JWT Configuration
LOGTO_ENDPOINT=https://z3zlta.logto.app/
LOGTO_APP_ID=m07bzoq8ltp8fswv7m2y8
LOGTO_APP_SECRET=pqyrOcUHJhrfgGxcqWjCPD6Xh2CVnj5E
LOGTO_COOKIE_SECRET=AVIQPKjYKjzaRiKNOwOGaGGcqk72O805
LOGTO_BASE_URL=http://localhost:6789

# API Resource Configuration
API_RESOURCE_IDENTIFIER=https://api.ecosystem-platform.dev
LOGTO_MANAGEMENT_API_RESOURCE=https://z3zlta.logto.app/

# M2M Configuration for Management API
LOGTO_M2M_APP_ID=wcjwd10m66h51xsqn8e69
LOGTO_M2M_APP_SECRET=Uga94IsYrPMIjpL2Gjgs8apQNgrFsXY8
```

### 2. Update Logto Configuration

Update the Logto configuration file to include organization scopes:

```typescript
// lib/logto.ts
import { LogtoConfig } from '@logto/next';
import { UserScope } from '@logto/client';

export const logtoConfig: LogtoConfig = {
  endpoint: process.env.LOGTO_ENDPOINT!,
  appId: process.env.LOGTO_APP_ID!,
  appSecret: process.env.LOGTO_APP_SECRET!,
  baseUrl: process.env.LOGTO_BASE_URL!,
  cookieSecret: process.env.LOGTO_COOKIE_SECRET!,
  cookieSecure: process.env.NODE_ENV === 'production',
  scopes: [
    UserScope.Email,
    UserScope.Profile,
    UserScope.Organizations,
    UserScope.OrganizationRoles,
    'read:organizations',
    'manage:organizations',
    'inbox:read',
    'inbox:write',
    'library:read',
    'library:write',
    'catalog:browse',
    'catalog:install',
    'profile:read',
    'profile:manage',
  ],
  resources: [
    process.env.API_RESOURCE_IDENTIFIER!,
  ],
};
```

## Token Management Utilities

### 1. Organization Token Helper

```typescript
// lib/organization-token.ts
import { getLogtoContext, GetContextParameters } from '@logto/next/server-actions';
import { logtoConfig } from './logto';

export async function getOrganizationTokenClaims(organizationId?: string) {
  const context = await getLogtoContext(logtoConfig, {
    organizationId,
    getOrganizationToken: true,
  } as GetContextParameters);

  if (!context.isAuthenticated) {
    throw new Error('User not authenticated');
  }

  return {
    isAuthenticated: context.isAuthenticated,
    claims: context.claims,
    organizationToken: context.organizationToken,
    scopes: context.scopes,
  };
}

export async function getUserOrganizations() {
  const context = await getLogtoContext(logtoConfig);
  
  if (!context.isAuthenticated) {
    return [];
  }

  // Extract organizations from user claims
  return context.claims?.organizations || [];
}

export function extractOrganizationFromToken(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      orgId: payload.org_id,
      orgName: payload.org_name,
      roles: payload.org_roles || [],
      permissions: payload.permissions || [],
    };
  } catch (error) {
    throw new Error('Invalid token format');
  }
}
```

### 2. API Route Protection with Organization Context

```typescript
// lib/api-middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateOrganizationToken, hasPermission } from './jwt-validation';

export function withOrganizationAuth(requiredPermissions: string[] = []) {
  return function middleware(
    handler: (req: NextRequest, context: any) => Promise<NextResponse>
  ) {
    return async function (req: NextRequest): Promise<NextResponse> {
      try {
        // Extract token from Authorization header
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
        }

        const token = authHeader.slice(7);
        const claims = await validateOrganizationToken(token);

        // Check required permissions
        for (const permission of requiredPermissions) {
          if (!hasPermission(claims, permission)) {
            return NextResponse.json(
              { error: `Missing permission: ${permission}` }, 
              { status: 403 }
            );
          }
        }

        // Add claims to request context
        const context = {
          user: {
            id: claims.sub,
            email: claims.email,
            name: claims.name,
            picture: claims.picture,
          },
          organization: claims.org_id ? {
            id: claims.org_id,
            name: claims.org_name,
            roles: claims.org_roles,
            permissions: claims.permissions,
          } : null,
        };

        return handler(req, context);
      } catch (error) {
        return NextResponse.json(
          { error: 'Authentication failed' }, 
          { status: 401 }
        );
      }
    };
  };
}
```

## Testing JWT Configuration

### 1. Token Validation Test

Create a test script to validate JWT token structure:

```javascript
// scripts/test-jwt-tokens.js
import { validateOrganizationToken } from '../lib/jwt-validation.js';

async function testTokenValidation() {
  const testToken = process.env.TEST_JWT_TOKEN;
  
  if (!testToken) {
    console.error('Please set TEST_JWT_TOKEN environment variable');
    process.exit(1);
  }

  try {
    const claims = await validateOrganizationToken(testToken);
    
    console.log('✅ Token validation successful');
    console.log('Claims:', JSON.stringify(claims, null, 2));
    
    // Test permission checks
    console.log('\n📋 Permission Tests:');
    console.log('Has inbox:read:', hasPermission(claims, 'inbox:read'));
    console.log('Has profile:manage:', hasPermission(claims, 'profile:manage'));
    console.log('Has admin role:', hasRole(claims, 'admin'));
    
  } catch (error) {
    console.error('❌ Token validation failed:', error.message);
  }
}

testTokenValidation();
```

### 2. API Endpoint Test

Test an organization-scoped API endpoint:

```bash
# Test organization endpoint with JWT token
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     http://localhost:6789/api/organizations
```

## Security Considerations

### 1. Token Security Best Practices

- **Short Token Lifetime**: Keep access tokens short-lived (1 hour)
- **Secure Storage**: Store tokens securely on the client side
- **HTTPS Only**: Always use HTTPS in production
- **Token Rotation**: Implement proper refresh token rotation
- **Audience Validation**: Always validate the token audience

### 2. Organization Context Security

- **Organization Isolation**: Ensure tokens only provide access to authorized organizations
- **Permission Validation**: Always validate permissions on the server side
- **Role-based Access**: Implement proper role hierarchy
- **Audit Logging**: Log all organization context changes

### 3. Production Configuration

```typescript
// production-jwt.config.ts
export const productionJWTConfig = {
  tokenLifetime: 3600, // 1 hour
  refreshTokenLifetime: 1209600, // 14 days
  clockTolerance: 60, // 1 minute
  requireAudience: true,
  requireIssuer: true,
  jwksCache: true,
  jwksCacheMaxAge: 86400000, // 24 hours
};
```

## Troubleshooting

### Common Issues

1. **Token Validation Failures**:
   - Check JWKS endpoint accessibility
   - Verify audience and issuer configuration
   - Ensure clock synchronization

2. **Missing Organization Context**:
   - Verify organization-scoped token request
   - Check custom claims configuration
   - Validate organization membership

3. **Permission Errors**:
   - Verify role-permission mapping
   - Check organization template configuration
   - Validate token scopes

### Debug Tools

```typescript
// lib/jwt-debug.ts
export function debugJWTToken(token: string) {
  try {
    const [header, payload, signature] = token.split('.');
    
    console.log('JWT Header:', JSON.parse(atob(header)));
    console.log('JWT Payload:', JSON.parse(atob(payload)));
    console.log('Signature present:', !!signature);
    
    return JSON.parse(atob(payload));
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}
```

This JWT configuration ensures proper organization context and security for the Net Ecosystem Platform's multi-tenant authentication system.