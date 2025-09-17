# Modern Logto Integration: Multi-Tenant Authentication with Organizations

## Overview

This guide implements modern Logto authentication patterns using Next.js 15 App Router server actions, organization-based multi-tenancy, and production-ready JWT validation middleware.

## Prerequisites

- Completed **01-foundation-setup.md**
- Running Logto instance (local via Docker or cloud)
- Basic understanding of Next.js App Router patterns

## Step 1: Logto Configuration & Setup

### Access Logto Admin Console

1. Start your Logto instance:
```bash
npm run dev:docker
```

2. Access admin console at `http://localhost:3002`
3. Create your first admin account if needed

### Configure Applications in Logto

#### Create SPA Application

1. Go to **Applications** → **Create Application**
2. Select **Single Page App**
3. Configure:
   - **Name**: `Ecosystem Platform SPA`
   - **Description**: `Next.js frontend application`

4. Set redirect URIs:
```
http://localhost:3000/auth/callback
http://localhost:3000/callback
https://yourdomain.com/auth/callback
```

5. Set post-logout redirect URIs:
```
http://localhost:3000
https://yourdomain.com
```

6. Set CORS allowed origins:
```
http://localhost:3000
https://yourdomain.com
```

#### Create M2M Application

1. Go to **Applications** → **Create Application**
2. Select **Machine to Machine**
3. Configure:
   - **Name**: `Ecosystem Platform M2M`
   - **Description**: `Backend API access`

4. Assign scopes:
   - `all` (Management API access)

### Configure API Resource

1. Go to **API Resources** → **Create API Resource**
2. Configure:
   - **Name**: `Ecosystem Platform API`
   - **Identifier**: `https://api.ecosystem-platform.dev`

3. Add scopes:
```
read:organizations
create:organizations
manage:organizations
read:users
manage:users
read:resources
create:resources
update:resources
delete:resources
manage:members
manage:applications
admin:platform
```

### Setup Organization Template

Create organization template with these roles:

#### Owner Role
- **Name**: `owner`
- **Description**: `Full administrative access`
- **Permissions**: `*` (all permissions)

#### Admin Role  
- **Name**: `admin`
- **Description**: `Administrative access with management capabilities`
- **Permissions**:
  - `manage:members`
  - `manage:settings`
  - `manage:applications`
  - `read:analytics`
  - `read:audit_logs`

#### Developer Role
- **Name**: `developer`
- **Description**: `Developer access with application management`
- **Permissions**:
  - `read:resources`
  - `create:resources`
  - `update:resources`
  - `manage:applications`
  - `read:api_keys`
  - `create:api_keys`

#### Member Role (Default)
- **Name**: `member`
- **Description**: `Standard member access`
- **Permissions**:
  - `read:resources`
  - `create:content`
  - `update:own_content`
  - `read:applications`
  - `use:applications`

#### Viewer Role
- **Name**: `viewer`
- **Description**: `Read-only access`
- **Permissions**:
  - `read:resources`
  - `read:applications`

## Step 2: Modern Logto SDK Integration

### Create Logto Configuration

Create `src/lib/logto.ts`:

```typescript
import { LogtoConfig } from '@logto/next'
import { UserScope } from '@logto/client'

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
    'create:organizations',
    'manage:organizations',
  ],
  resources: [
    process.env.API_RESOURCE_IDENTIFIER!,
  ],
}

// M2M Configuration for Management API
export const m2mConfig = {
  endpoint: process.env.LOGTO_ENDPOINT!,
  appId: process.env.LOGTO_M2M_APP_ID!,
  appSecret: process.env.LOGTO_M2M_APP_SECRET!,
  scopes: ['all'], // Management API scopes
}
```

### Create Management API Client

Create `src/lib/management-api.ts`:

```typescript
import { GetAccessToken } from '@logto/client'

interface TokenCache {
  token: string | null
  expiresAt: number
}

const tokenCache: TokenCache = {
  token: null,
  expiresAt: 0,
}

export async function getManagementApiToken(): Promise<string> {
  // Check if cached token is still valid (5 minute buffer)
  if (tokenCache.token && tokenCache.expiresAt > Date.now() + 5 * 60 * 1000) {
    return tokenCache.token
  }

  const { m2mConfig } = await import('./logto')
  
  const tokenResponse = await fetch(`${m2mConfig.endpoint}/oidc/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: m2mConfig.appId,
      client_secret: m2mConfig.appSecret,
      scope: 'all',
    }),
  })

  if (!tokenResponse.ok) {
    throw new Error('Failed to get management API token')
  }

  const tokenData = await tokenResponse.json()
  
  // Cache token with expiry time
  tokenCache.token = tokenData.access_token
  tokenCache.expiresAt = Date.now() + (tokenData.expires_in * 1000)

  return tokenData.access_token
}

export class ManagementApiClient {
  private baseUrl: string
  private getToken: () => Promise<string>

  constructor() {
    this.baseUrl = `${process.env.LOGTO_ENDPOINT!}/api`
    this.getToken = getManagementApiToken
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const token = await this.getToken()
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Management API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // Organization management
  async createOrganization(data: { name: string; description?: string }) {
    return this.request('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async addUserToOrganization(orgId: string, userId: string) {
    return this.request(`/organizations/${orgId}/users`, {
      method: 'POST',
      body: JSON.stringify({ userIds: [userId] }),
    })
  }

  async assignOrganizationRole(orgId: string, userId: string, roleId: string) {
    return this.request(`/organizations/${orgId}/users/${userId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ organizationRoleIds: [roleId] }),
    })
  }

  async getOrganizationRoles() {
    return this.request('/organization-roles')
  }

  // Application management
  async createApplication(data: any) {
    return this.request('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getUserApplications(userId: string) {
    return this.request(`/users/${userId}/applications`)
  }
}

export const managementApi = new ManagementApiClient()
```

## Step 3: Authentication Flow Implementation

### Create Authentication Callback Handler

Create `src/app/auth/callback/route.ts`:

```typescript
import { handleSignIn } from '@logto/next/server-actions'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'
import { logtoConfig } from '@/lib/logto'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  try {
    await handleSignIn(logtoConfig, searchParams)
    
    // Redirect to dashboard after successful authentication
    redirect('/dashboard')
  } catch (error) {
    console.error('Authentication callback error:', error)
    redirect('/?error=auth_failed')
  }
}
```

### Create Sign-out Handler

Create `src/app/auth/signout/route.ts`:

```typescript
import { handleSignOut } from '@logto/next/server-actions'
import { NextRequest } from 'next/server'
import { logtoConfig } from '@/lib/logto'

export async function GET(request: NextRequest) {
  return handleSignOut(logtoConfig)
}
```

### Create Authentication Components

Create `src/components/auth/signin-button.tsx`:

```tsx
'use client'

import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { useState } from 'react'

interface SignInButtonProps {
  onSignIn: () => Promise<void>
  variant?: 'default' | 'outline'
  children: React.ReactNode
}

export function SignInButton({ onSignIn, variant = 'default', children }: SignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      await onSignIn()
    } catch (error) {
      console.error('Sign in error:', error)
      setIsLoading(false)
    }
  }

  return (
    <Button 
      variant={variant} 
      onClick={handleClick} 
      disabled={isLoading}
      className="min-w-[120px]"
    >
      {isLoading ? <LoadingSpinner size="sm" /> : children}
    </Button>
  )
}
```

Create `src/components/auth/signout-button.tsx`:

```tsx
'use client'

import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { LogOut } from 'lucide-react'
import { useState } from 'react'

interface SignOutButtonProps {
  onSignOut: () => Promise<void>
  variant?: 'ghost' | 'outline'
}

export function SignOutButton({ onSignOut, variant = 'ghost' }: SignOutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      await onSignOut()
    } catch (error) {
      console.error('Sign out error:', error)
      setIsLoading(false)
    }
  }

  return (
    <Button 
      variant={variant} 
      onClick={handleClick} 
      disabled={isLoading}
      size="sm"
    >
      {isLoading ? (
        <LoadingSpinner size="sm" />
      ) : (
        <>
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </>
      )}
    </Button>
  )
}
```

## Step 4: Landing Page with Authentication

### Create Landing Page

Update `src/app/page.tsx`:

```tsx
import { getLogtoContext, signIn } from '@logto/next/server-actions'
import { SignInButton } from '@/components/auth/signin-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Shield, Users, Zap } from 'lucide-react'
import { redirect } from 'next/navigation'
import { logtoConfig } from '@/lib/logto'

export default async function HomePage() {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)

  // Redirect authenticated users to dashboard
  if (isAuthenticated) {
    redirect('/dashboard')
  }

  const handleSignIn = async () => {
    'use server'
    await signIn(logtoConfig, {
      redirectUri: `${process.env.LOGTO_BASE_URL}/auth/callback`,
    })
  }

  const handleRegister = async () => {
    'use server'
    await signIn(logtoConfig, {
      redirectUri: `${process.env.LOGTO_BASE_URL}/auth/callback`,
      extraParams: {
        screen: 'sign_up'
      }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Ecosystem Platform</span>
          </div>
          <div className="flex items-center space-x-4">
            <SignInButton onSignIn={handleSignIn} variant="outline">
              Sign In
            </SignInButton>
            <SignInButton onSignIn={handleRegister}>
              Get Started
            </SignInButton>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4">
            Multi-tenant SaaS Platform
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Build Your Next
            <span className="text-primary"> SaaS Product</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Complete multi-tenant platform with organization management, 
            role-based access control, and OAuth integrations. Built with 
            Next.js 15, Logto, and shadcn/ui.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <SignInButton onSignIn={handleRegister}>
              Start Building
              <ArrowRight className="h-4 w-4 ml-2" />
            </SignInButton>
            <Button variant="outline" size="lg">
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Complete authentication, organization management, and developer tools 
              to build your multi-tenant SaaS application.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Secure Authentication</CardTitle>
                <CardDescription>
                  Enterprise-grade authentication with Logto, including SSO, MFA, 
                  and social login support.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• JWT-based authentication</li>
                  <li>• Multi-factor authentication</li>
                  <li>• Social login providers</li>
                  <li>• Enterprise SSO</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Organization Management</CardTitle>
                <CardDescription>
                  Complete multi-tenant architecture with organization-based 
                  isolation and role-based access control.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Organization creation & management</li>
                  <li>• Member invitation system</li>
                  <li>• Role-based permissions</li>
                  <li>• Tenant data isolation</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Developer Platform</CardTitle>
                <CardDescription>
                  OAuth provider with third-party app support, API access, 
                  and comprehensive developer tools.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• OAuth 2.0 provider</li>
                  <li>• Third-party app management</li>
                  <li>• API rate limiting</li>
                  <li>• Webhook support</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
```

## Step 5: JWT Validation Middleware

### Create JWT Validation Utilities

Create `src/lib/auth.ts`:

```typescript
import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { LogtoJWTPayload, TenantContext } from '@/types/auth'

export async function validateJWT(token: string): Promise<LogtoJWTPayload> {
  try {
    // Get JWKS from Logto
    const jwksResponse = await fetch(`${process.env.LOGTO_ENDPOINT}/oidc/jwks`)
    const jwks = await jwksResponse.json()
    
    // Import the key (simplified - in production, cache and properly handle key rotation)
    const key = await import('jose').then(jose => 
      jose.importJWK(jwks.keys[0], jwks.keys[0].alg)
    )
    
    const { payload } = await jwtVerify(token, key, {
      issuer: `${process.env.LOGTO_ENDPOINT}/oidc`,
      audience: process.env.API_RESOURCE_IDENTIFIER,
    })

    return payload as LogtoJWTPayload
  } catch (error) {
    throw new Error('Invalid JWT token')
  }
}

export function extractTokenFromRequest(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  // Try cookies (for browser requests)
  const tokenCookie = request.cookies.get('logto:access_token')
  if (tokenCookie) {
    return tokenCookie.value
  }

  return null
}

export async function getTenantContextFromRequest(request: NextRequest): Promise<TenantContext | null> {
  try {
    const token = extractTokenFromRequest(request)
    if (!token) return null

    const payload = await validateJWT(token)
    
    return {
      user: {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        avatar: payload.picture,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      organization: payload.org_id ? {
        id: payload.org_id,
        name: '', // Will be populated from API
        slug: '',
        createdAt: '',
        updatedAt: '',
      } : undefined,
      permissions: payload.permissions || [],
    }
  } catch (error) {
    return null
  }
}
```

### Create API Route Protection

Create `src/lib/api-protection.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContextFromRequest } from './auth'
import { TenantContext } from '@/types/auth'

type APIHandler = (
  request: NextRequest,
  context: TenantContext
) => Promise<NextResponse> | NextResponse

export function withAuth(handler: APIHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const context = await getTenantContextFromRequest(request)
    
    if (!context) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return handler(request, context)
  }
}

export function withPermission(permission: string) {
  return function (handler: APIHandler) {
    return withAuth(async (request: NextRequest, context: TenantContext) => {
      if (!context.permissions.includes(permission) && !context.permissions.includes('*')) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      return handler(request, context)
    })
  }
}

export function withOrganization(handler: APIHandler) {
  return withAuth(async (request: NextRequest, context: TenantContext) => {
    if (!context.organization) {
      return NextResponse.json(
        { error: 'Organization context required' },
        { status: 400 }
      )
    }

    return handler(request, context)
  })
}
```

## Step 6: Organization API Implementation

### Create Organizations API

Create `src/app/api/organizations/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-protection'
import { managementApi } from '@/lib/management-api'
import { createOrganizationSchema } from '@/lib/validations/auth'

export const POST = withAuth(async (request: NextRequest, context) => {
  try {
    const body = await request.json()
    const validatedData = createOrganizationSchema.parse(body)

    // Create organization in Logto
    const organization = await managementApi.createOrganization({
      name: validatedData.name,
      description: validatedData.description,
    })

    // Add user to organization
    await managementApi.addUserToOrganization(organization.id, context.user.id)

    // Get owner role and assign it
    const roles = await managementApi.getOrganizationRoles()
    const ownerRole = roles.find((role: any) => role.name === 'owner')
    
    if (ownerRole) {
      await managementApi.assignOrganizationRole(
        organization.id,
        context.user.id,
        ownerRole.id
      )
    }

    return NextResponse.json({
      data: organization,
      message: 'Organization created successfully'
    })
  } catch (error) {
    console.error('Create organization error:', error)
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    )
  }
})

export const GET = withAuth(async (request: NextRequest, context) => {
  try {
    // Get user's organizations from JWT claims or API
    // This is simplified - in production, you'd fetch from Management API
    const organizations = [] // Fetch from Management API

    return NextResponse.json({ data: organizations })
  } catch (error) {
    console.error('Get organizations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    )
  }
})
```

## Step 7: Dashboard with Organization Context

### Create Dashboard Layout

Create `src/app/dashboard/layout.tsx`:

```tsx
import { getLogtoContext } from '@logto/next/server-actions'
import { redirect } from 'next/navigation'
import { logtoConfig } from '@/lib/logto'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { UserDropdown } from '@/components/dashboard/user-dropdown'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)

  if (!isAuthenticated) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="flex h-16 items-center px-6">
          <DashboardNav />
          <div className="ml-auto">
            <UserDropdown user={claims} />
          </div>
        </div>
      </header>
      <main className="p-6">
        {children}
      </main>
    </div>
  )
}
```

### Create Dashboard Navigation

Create `src/components/dashboard/dashboard-nav.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Home, Users, Settings, Zap } from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Organizations', href: '/dashboard/organizations', icon: Users },
  { name: 'Applications', href: '/dashboard/applications', icon: Zap },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="flex space-x-4">
      <Link href="/dashboard" className="flex items-center space-x-2">
        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-semibold">Ecosystem</span>
      </Link>
      <div className="hidden md:flex space-x-1 ml-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Button
              key={item.name}
              variant={isActive ? 'secondary' : 'ghost'}
              size="sm"
              asChild
            >
              <Link href={item.href} className="flex items-center space-x-2">
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            </Button>
          )
        })}
      </div>
    </nav>
  )
}
```

### Create User Dropdown

Create `src/components/dashboard/user-dropdown.tsx`:

```tsx
'use client'

import { signOut } from '@logto/next/server-actions'
import { SignOutButton } from '@/components/auth/signout-button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, Settings } from 'lucide-react'
import { logtoConfig } from '@/lib/logto'

interface UserDropdownProps {
  user: any // Logto claims
}

export function UserDropdown({ user }: UserDropdownProps) {
  const handleSignOut = async () => {
    'use server'
    await signOut(logtoConfig)
  }

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.picture} alt={user?.name || user?.email} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/dashboard/profile" className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            Profile
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/dashboard/settings" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <SignOutButton onSignOut={handleSignOut} variant="ghost" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

## Step 8: Dashboard Home Page

### Create Dashboard Home

Create `src/app/dashboard/page.tsx`:

```tsx
import { getLogtoContext } from '@logto/next/server-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Zap, Settings } from 'lucide-react'
import Link from 'next/link'
import { logtoConfig } from '@/lib/logto'

export default async function DashboardPage() {
  const { claims } = await getLogtoContext(logtoConfig)
  
  // Get user's organizations from claims
  const organizations = claims?.organizations || []
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {claims?.name || claims?.email}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Organizations
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizations.length}</div>
            <p className="text-xs text-muted-foreground">
              Active organizations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Applications
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Connected apps
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Organizations Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Organizations</h2>
          <Button asChild>
            <Link href="/dashboard/organizations/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Organization
            </Link>
          </Button>
        </div>

        {organizations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No organizations yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first organization to start building your multi-tenant application.
              </p>
              <Button asChild>
                <Link href="/dashboard/organizations/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Organization
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {organizations.map((org: any) => (
              <Card key={org.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{org.name}</CardTitle>
                    <Badge variant="secondary">{org.role}</Badge>
                  </div>
                  {org.description && (
                    <CardDescription>{org.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {org.memberCount || 1} member{(org.memberCount || 1) !== 1 ? 's' : ''}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/organizations/${org.id}`}>
                          View
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/organizations/${org.id}/settings`}>
                          <Settings className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

## Step 9: Testing the Integration

### Verify Authentication Flow

1. Start your development environment:
```bash
npm run dev:docker
npm run dev
```

2. Visit `http://localhost:3000`
3. Click "Sign In" or "Get Started"
4. Complete authentication in Logto
5. Verify redirect to dashboard

### Test API Endpoints

```bash
# Test protected endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/organizations
```

## Next Steps

With modern Logto integration complete, you're ready for:

1. **Organization Management** - Complete member invitation and role management
2. **OAuth Provider Setup** - Third-party application support
3. **Advanced Features** - Audit logging, webhooks, and analytics
4. **Production Deployment** - Security hardening and monitoring

## Troubleshooting

### Common Issues

1. **JWKS verification fails**: Ensure your Logto endpoint is accessible
2. **Organization data not showing**: Check JWT scopes include `UserScope.Organizations`
3. **Token caching issues**: Clear browser cookies and restart

### Debug JWT Tokens

Add this utility for debugging:

```typescript
// src/lib/debug.ts
export function debugJWT(token: string) {
  const parts = token.split('.')
  const payload = JSON.parse(atob(parts[1]))
  console.log('JWT Payload:', payload)
  return payload
}
```

This modern Logto integration provides a robust foundation for building multi-tenant SaaS applications with organization-based authentication and proper security practices.