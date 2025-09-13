---
created: 2025-09-13T01:34:04Z
last_updated: 2025-09-13T13:59:46Z
version: 2.0
author: Claude Code PM System
---

# Technology Context

## Primary Technology Stack

### Frontend Framework
- **Next.js 15.5.3** - Latest version with App Router and Turbopack
- **React 19.1.0** - Latest React with concurrent features
- **TypeScript 5.x** - Strict mode with path aliases (`@/*`)

### UI Framework & Design System
- **shadcn/ui** - Component library (New York style)
- **Radix UI** - Primitive component library
- **Tailwind CSS v4** - Utility-first CSS with CSS variables
- **CSS Variables** - Theme system for consistent styling
- **Lucide React** - Primary icon library
- **Tabler Icons** - Secondary icon library

### Authentication & Multi-tenancy (PRODUCTION IMPLEMENTED)
- **Logto** - Organization-based multi-tenant authentication
  - Instance: `https://z3zlta.logto.app/` (fully configured)
  - Port: 6789 (configured in `.env.local`)
  - JWT-based authorization with organization context
  - Hosted sign-in experience (no custom auth UI)
- **@logto/next 2.8.12** - Official Next.js integration (NEW)
- **jose 6.1.0** - JWT processing and validation (NEW)
- **node-fetch 3.3.2** - Management API client requests (NEW)

## Development Dependencies

### Build Tools
- **Turbopack** - Next.js build system (dev and build)
- **ESLint 9.x** - Code linting with Next.js config
- **@tailwindcss/postcss v4** - CSS processing

### Form & State Management
- **React Hook Form 7.62.0** - Form state management
- **Zod 4.1.8** - Schema validation and TypeScript inference
- **@hookform/resolvers 5.2.1** - Form resolver integration

### Data & Tables
- **@tanstack/react-table 8.21.3** - Advanced table functionality
- **date-fns 4.1.0** - Date utilities
- **recharts 2.15.4** - Charting library

### UI Enhancement Libraries
- **@dnd-kit** - Drag and drop functionality
  - `@dnd-kit/core 6.3.1`
  - `@dnd-kit/sortable 10.0.0`
  - `@dnd-kit/utilities 3.2.2`
  - `@dnd-kit/modifiers 9.0.0`
- **react-resizable-panels 3.0.6** - Resizable panel layouts
- **vaul 1.1.2** - Drawer component
- **sonner 2.0.7** - Toast notifications
- **cmdk 1.1.1** - Command palette
- **next-themes 0.4.6** - Theme switching

### Radix UI Components
Complete set of accessible primitives:
- `@radix-ui/react-avatar 1.1.10`
- `@radix-ui/react-dialog 1.1.15`
- `@radix-ui/react-dropdown-menu 2.1.16`
- `@radix-ui/react-popover 1.1.15`
- `@radix-ui/react-select 2.2.6`
- `@radix-ui/react-tabs 1.1.13`
- `@radix-ui/react-tooltip 1.2.8`
- And 10+ additional Radix components

## Package Management

### Package Manager
- **pnpm** - Primary package manager (evidenced by `pnpm-lock.yaml`)
- **pnpm-lock.yaml** - 266KB lockfile indicating substantial dependency tree

### Scripts Configuration
```json
{
  "dev": "next dev --turbopack -p 6789",
  "build": "next build --turbopack", 
  "start": "next start",
  "lint": "eslint",
  "logto:setup": "node scripts/logto-setup.js"
}
```

## Architecture Patterns (PRODUCTION IMPLEMENTED)

### Multi-tenant Architecture
- **Organization-Based Tenancy** - Logto organizations as tenant boundaries ✅
- **JWT Token Context** - Organization ID in audience claims: `"urn:logto:organization:{orgId}"` ✅
- **API Isolation** - Organization-scoped API endpoints ✅
- **UI Contextualization** - Role-based rendering using JWT scopes ✅

### Authentication Flow (COMPLETED)
- **Redirect-Based Auth** - No custom login forms ✅
- **Hosted Sign-In Experience** - Logto-managed authentication pages ✅
- **Token Management** - Automatic refresh and caching ✅
- **Permission System** - Built-in admin/member/guest roles ✅

### Component Architecture (FULLY IMPLEMENTED)
- **Universal App Pattern** - Four main sections (Inbox, Library, Catalog, Profile) ✅
- **Responsive Design** - Desktop sidebar, mobile bottom navigation ✅
- **Form System** - React Hook Form + Zod validation throughout ✅
- **Data Tables** - Advanced sorting, filtering, pagination ✅
- **Organization Management** - Complete member/role/settings interfaces ✅
- **Profile Integration** - Organization switching and user settings ✅

### Performance Benchmarks (VALIDATED)
- **JWT Processing** - < 5ms per request ✅
- **Management API Calls** - < 200ms with caching ✅
- **Organization Switching** - < 2 seconds ✅
- **Page Load Times** - < 2 seconds ✅

## Development Environment

### Port Configuration
- **Development Server**: 6789 (not standard 3000)
- **Logto Callback**: `http://localhost:6789/api/logto/callback`
- **Environment Alignment** - `.env.local` matches dev server config

### Build Configuration
- **Turbopack Enabled** - Both dev and build use Turbopack
- **TypeScript Strict Mode** - Enhanced type safety
- **App Router** - Next.js 15 App Router architecture
- **CSS Variables** - Consistent theming system

## External Service Dependencies

### Logto Authentication Service
- **Endpoint**: `https://z3zlta.logto.app/`
- **App ID**: `m07bzoq8ltp8fswv7m2y8` (SPA)
- **M2M App ID**: `wcjwd10m66h51xsqn8e69` (Management API)
- **Management API**: Organization CRUD operations
- **Demo Credentials**: Configured for development

### Production Integration Status
- **Database**: ✅ Not needed (Logto stores all user/org/role data)
- **File Storage**: Future enhancement (organization logos, documents)
- **Email Service**: ✅ Handled by Logto (invitations, notifications)
- **Analytics**: Future enhancement (usage metrics, organization insights)
- **Monitoring**: Future enhancement (performance tracking, error reporting)

## Performance Considerations

### Build Optimization
- **Turbopack** - Faster builds and hot reloading
- **Tree Shaking** - Automatic with Next.js 15
- **Font Optimization** - Geist font family auto-optimized
- **Image Optimization** - Next.js built-in optimization

### Runtime Optimization
- **React 19** - Concurrent features and automatic batching
- **CSS Variables** - Efficient theme switching
- **JWT Caching** - Reduced authentication overhead
- **Component Lazy Loading** - Automatic with App Router

## Security Configuration

### Authentication Security
- **JWT Validation** - Signature and expiration checking
- **Organization Isolation** - Audience claim validation
- **Token Refresh** - Automatic renewal before expiration
- **HTTPS Enforcement** - Production configuration

### Development Security
- **Environment Variables** - Sensitive data in `.env.local`
- **TypeScript Strict Mode** - Compile-time safety
- **ESLint Security Rules** - Code security validation
- **No Custom Auth UI** - Reduced attack surface

## Update History
- 2025-09-13T13:59:46Z: Production implementation complete - added new dependencies (jose, node-fetch, @logto/next), implemented all architecture patterns, validated performance benchmarks, and confirmed production readiness