# Permission Reference for Development Team

## Organization-Scoped Permissions

### Permission Definitions

| Permission | Resource | Action | Description |
|------------|----------|--------|-------------|
| `inbox:read` | inbox | read | Access to communication hub and messages |
| `inbox:write` | inbox | write | Create and respond to messages |
| `library:read` | library | read | View templates and assets |
| `library:write` | library | write | Create and modify templates |
| `catalog:browse` | catalog | browse | Browse app marketplace |
| `catalog:install` | catalog | install | Install marketplace apps |
| `profile:read` | profile | read | View organization profiles |
| `profile:manage` | profile | manage | Manage organization settings |

### Role-Permission Matrix

| Permission | Admin | Member | Guest |
|------------|-------|--------|-------|
| `inbox:read` | ✅ | ✅ | ✅ |
| `inbox:write` | ✅ | ✅ | ❌ |
| `library:read` | ✅ | ✅ | ✅ |
| `library:write` | ✅ | ✅ | ❌ |
| `catalog:browse` | ✅ | ✅ | ✅ |
| `catalog:install` | ✅ | ✅ | ❌ |
| `profile:read` | ✅ | ✅ | ✅ |
| `profile:manage` | ✅ | ❌ | ❌ |
| Organization Management | ✅ | ❌ | ❌ |

## JWT Token Structure

```typescript
interface LogtoJWTPayload {
  sub: string;                    // User ID
  org_id: string;                 // Organization ID
  org_roles: string[];            // ["admin"] | ["member"] | ["guest"]
  permissions: string[];          // Array of permissions
  aud: string;                    // "urn:logto:organization:{org_id}"
  email?: string;
  name?: string;
  picture?: string;
}
```

## Implementation Guide for Developers

### 1. Permission Checking in Components

```typescript
// Check if user has specific permission
function hasPermission(permissions: string[], requiredPermission: string): boolean {
  return permissions.includes(requiredPermission) || permissions.includes('*');
}

// Usage in components
const canWriteInbox = hasPermission(userPermissions, 'inbox:write');
const canManageProfile = hasPermission(userPermissions, 'profile:manage');
```

### 2. Route Protection

```typescript
// Middleware for API routes
export function requirePermission(permission: string) {
  return withAuth(async (request: NextRequest, context: TenantContext) => {
    if (!hasPermission(context.permissions, permission)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    // Continue with handler
  });
}
```

### 3. UI Conditional Rendering

```tsx
// Conditional rendering based on permissions
{hasPermission(permissions, 'inbox:write') && (
  <CreateMessageButton />
)}

{hasPermission(permissions, 'profile:manage') && (
  <OrganizationSettings />
)}
```

### 4. Role-Based Component Access

```tsx
// Role-based access
const isAdmin = userRoles.includes('admin');
const isMember = userRoles.includes('member');
const isGuest = userRoles.includes('guest');

// Admin-only features
{isAdmin && <AdminPanel />}

// Member and above
{(isAdmin || isMember) && <EditFeatures />}

// All roles
<ReadOnlyContent />
```

## API Endpoint Protection Examples

### Inbox Endpoints
- `GET /api/inbox` - Requires: `inbox:read`
- `POST /api/inbox/messages` - Requires: `inbox:write`
- `PUT /api/inbox/messages/:id` - Requires: `inbox:write`

### Library Endpoints
- `GET /api/library` - Requires: `library:read`
- `POST /api/library/templates` - Requires: `library:write`
- `PUT /api/library/templates/:id` - Requires: `library:write`
- `DELETE /api/library/templates/:id` - Requires: `library:write`

### Catalog Endpoints
- `GET /api/catalog` - Requires: `catalog:browse`
- `POST /api/catalog/install` - Requires: `catalog:install`
- `DELETE /api/catalog/uninstall` - Requires: `catalog:install`

### Profile Endpoints
- `GET /api/profile` - Requires: `profile:read`
- `PUT /api/profile/settings` - Requires: `profile:manage`
- `POST /api/profile/members/invite` - Requires: `profile:manage`

## Testing Permissions

### Test User Setup
Create test users with different roles to validate permissions:

```typescript
const testUsers = {
  admin: {
    roles: ['admin'],
    permissions: [
      'inbox:read', 'inbox:write',
      'library:read', 'library:write',
      'catalog:browse', 'catalog:install',
      'profile:read', 'profile:manage'
    ]
  },
  member: {
    roles: ['member'],
    permissions: [
      'inbox:read', 'inbox:write',
      'library:read', 'library:write',
      'catalog:browse', 'catalog:install',
      'profile:read'
    ]
  },
  guest: {
    roles: ['guest'],
    permissions: [
      'inbox:read',
      'library:read',
      'catalog:browse',
      'profile:read'
    ]
  }
};
```

### Permission Test Cases

1. **Admin Access**: Should have access to all features and organization management
2. **Member Access**: Should have read/write access to core features, but no org management
3. **Guest Access**: Should have read-only access to all content areas
4. **Unauthorized Access**: Should be denied access to features without proper permissions

---

**Quick Reference Version**: 1.0
**Last Updated**: 2025-09-13