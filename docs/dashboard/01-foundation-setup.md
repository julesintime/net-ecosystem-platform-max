# Foundation Setup: Next.js 15 + Shadcn/UI + Logto Integration

## Overview

This guide provides a comprehensive setup for building a production-ready multi-tenant SaaS application using the latest versions of Next.js 15, shadcn/ui, and Logto authentication with organization support.

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **UI Library**: shadcn/ui with latest CLI and registry system
- **Authentication**: Logto with organization-based multi-tenancy
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with CSS variables
- **Deployment**: Docker + Kubernetes ready

## Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- Git
- Docker (for Logto local development)

## Step 1: Project Initialization

### Create Next.js 15 Project

```bash
# Create Next.js 15 project with latest features
npx create-next-app@latest ecosystem-platform \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd ecosystem-platform
```

### Install Core Dependencies

```bash
# Logto authentication
npm install @logto/next @logto/client

# Additional utilities
npm install zod @hookform/react-hook-form
npm install @radix-ui/react-slot
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react

# Development dependencies
npm install -D @types/node
```

## Step 2: Latest Shadcn/UI Setup

### Initialize Shadcn/UI

```bash
# Initialize with latest CLI
npx shadcn@latest init
```

When prompted, use these settings:
```
✔ Which style would you like to use? › New York
✔ Which color would you like to use as base color? › Zinc
✔ Would you like to use CSS variables for colors? › yes
```

### Install Core Components

```bash
# Essential UI components for authentication flows
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add form
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add sheet
npx shadcn@latest add dropdown-menu
npx shadcn@latest add avatar
npx shadcn@latest add badge
npx shadcn@latest add separator
npx shadcn@latest add toast
npx shadcn@latest add table
npx shadcn@latest add tabs
npx shadcn@latest add select
npx shadcn@latest add switch
```

### Advanced Registry Configuration

Update `components.json` for custom registries:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  },
  "registries": {
    "@ecosystem": "https://registry.ecosystem-platform.dev/{name}.json",
    "@logto": "https://registry.logto.io/shadcn/{name}.json"
  }
}
```

## Step 3: Project Structure Setup

### Create Directory Structure

```bash
mkdir -p src/{components,lib,hooks,types,constants}
mkdir -p src/components/{ui,auth,dashboard,organization,layout}
mkdir -p src/app/{api,auth,dashboard,onboarding}
mkdir -p src/app/api/{auth,organizations,users,applications}
mkdir -p config/{logto,database,docker}
```

### TypeScript Configuration

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Step 4: Environment Configuration

### Create Environment Files

```bash
# Development environment
cp .env.example .env.local
```

Create `.env.example`:

```env
# Logto Configuration
LOGTO_ENDPOINT=http://localhost:3001
LOGTO_APP_ID=your_app_id
LOGTO_APP_SECRET=your_app_secret
LOGTO_BASE_URL=http://localhost:3000
LOGTO_COOKIE_SECRET=your_32_character_secret

# M2M Application for Management API
LOGTO_M2M_APP_ID=your_m2m_app_id
LOGTO_M2M_APP_SECRET=your_m2m_app_secret

# API Resource
API_RESOURCE_IDENTIFIER=https://api.ecosystem-platform.dev

# Database (for production)
DATABASE_URL=postgresql://user:password@localhost:5432/ecosystem_platform

# External Services
RESEND_API_KEY=your_resend_key
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id
```

### Next.js Configuration

Update `next.config.ts`:

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@logto/next']
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          }
        ]
      }
    ]
  }
}

export default nextConfig
```

## Step 5: Core Utilities Setup

### Create Utility Functions

Create `src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
```

### Create Type Definitions

Create `src/types/auth.ts`:

```typescript
export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  logoUrl?: string
  createdAt: string
  updatedAt: string
}

export interface OrganizationMember {
  id: string
  userId: string
  organizationId: string
  role: OrganizationRole
  user: User
  joinedAt: string
}

export type OrganizationRole = 'owner' | 'admin' | 'developer' | 'member' | 'viewer'

export interface LogtoJWTPayload {
  sub: string // User ID
  org_id?: string // Organization ID
  roles?: string[] // User roles
  permissions?: string[] // User permissions
  email: string
  name?: string
  picture?: string
  iat: number
  exp: number
  aud: string
  iss: string
}

export interface TenantContext {
  user: User
  organization?: Organization
  role?: OrganizationRole
  permissions: string[]
}
```

## Step 6: Development Environment with Docker

### Create Docker Setup for Logto

Create `docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: logto-postgres
    environment:
      POSTGRES_DB: logto
      POSTGRES_USER: logto
      POSTGRES_PASSWORD: logto_password
    ports:
      - "5433:5432"
    volumes:
      - logto_postgres_data:/var/lib/postgresql/data
    networks:
      - logto-network

  redis:
    image: redis:7-alpine
    container_name: logto-redis
    ports:
      - "6380:6379"
    networks:
      - logto-network

  logto:
    image: svhd/logto:latest
    container_name: logto-core
    depends_on:
      - postgres
      - redis
    environment:
      TRUST_PROXY_HEADER: 1
      DB_URL: postgresql://logto:logto_password@postgres:5432/logto
      REDIS_URL: redis://redis:6379
      ENDPOINT: http://localhost:3001
      ADMIN_ENDPOINT: http://localhost:3002
    ports:
      - "3001:3001"
      - "3002:3002"
    networks:
      - logto-network

volumes:
  logto_postgres_data:

networks:
  logto-network:
    driver: bridge
```

### Development Scripts

Update `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "dev:docker": "docker-compose -f docker-compose.dev.yml up -d",
    "dev:docker:down": "docker-compose -f docker-compose.dev.yml down",
    "dev:logs": "docker-compose -f docker-compose.dev.yml logs -f logto",
    "dev:reset": "docker-compose -f docker-compose.dev.yml down -v && docker-compose -f docker-compose.dev.yml up -d"
  }
}
```

## Step 7: Basic Layout Components

### Create Root Layout

Update `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cn } from '@/lib/utils'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ecosystem Platform',
  description: 'Multi-tenant SaaS platform with Logto authentication',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, 'min-h-screen bg-background antialiased')}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

### Create Loading Components

Create `src/components/ui/loading.tsx`:

```tsx
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
        {
          'h-4 w-4': size === 'sm',
          'h-6 w-6': size === 'md',
          'h-8 w-8': size === 'lg',
        },
        className
      )}
    />
  )
}

export function LoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
```

## Step 8: Validation & Testing Setup

### Setup Validation

Install and configure Zod:

```bash
npm install zod
```

Create `src/lib/validations/auth.ts`:

```typescript
import { z } from 'zod'

export const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  slug: z.string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
})

export const inviteMemberSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['admin', 'developer', 'member', 'viewer']),
})

export type CreateOrganizationData = z.infer<typeof createOrganizationSchema>
export type InviteMemberData = z.infer<typeof inviteMemberSchema>
```

### Setup Testing

Install testing dependencies:

```bash
npm install -D jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

Create `jest.config.js`:

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
```

Create `jest.setup.js`:

```javascript
import '@testing-library/jest-dom'
```

## Step 9: Quick Verification

### Create Basic Pages

Create `src/app/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Ecosystem Platform
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Multi-tenant SaaS with Logto authentication
        </p>
      </div>
    </div>
  )
}
```

### Start Development Environment

```bash
# Start Logto and supporting services
npm run dev:docker

# Wait for services to be ready (check with)
npm run dev:logs

# In another terminal, start Next.js
npm run dev
```

Visit `http://localhost:3000` to verify the setup works, and `http://localhost:3002` to access Logto admin console.

## Next Steps

With the foundation in place, you're ready to proceed to:

1. **Logto Integration** - Configure authentication flows and organization support
2. **Multi-tenant Architecture** - Implement organization-based tenant isolation  
3. **Production Features** - Add advanced features like member management and OAuth
4. **Deployment** - Configure Docker and Kubernetes for production

## Troubleshooting

### Common Issues

1. **Docker services not starting**: Check if ports 3001, 3002, 5433, 6380 are available
2. **TypeScript errors**: Run `npm run type-check` to identify issues
3. **Shadcn components not styling correctly**: Verify Tailwind CSS configuration

### Useful Commands

```bash
# Reset everything
npm run dev:reset

# Check Docker services
docker-compose -f docker-compose.dev.yml ps

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Check TypeScript
npm run type-check

# Lint code
npm run lint
```

This foundation provides a solid, modern base for building a multi-tenant SaaS application with the latest Next.js 15, shadcn/ui, and Logto integration patterns.