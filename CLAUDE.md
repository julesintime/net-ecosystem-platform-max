# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Think carefully and implement the most concise solution that changes as little code as possible.

## SUB-AGENT USAGE FOR CONTEXT OPTIMIZATION

### Always use specialized sub-agents when appropriate:
- **file-analyzer** sub-agent for reading files, especially logs and verbose outputs
- **code-analyzer** sub-agent for code analysis, bug research, and logic tracing  
- **test-runner** sub-agent for executing and analyzing test results

## ABSOLUTE RULES

- **NO PARTIAL IMPLEMENTATION** - Complete all functionality in one go
- **NO SIMPLIFICATION** - No "//This is simplified for now" comments
- **NO CODE DUPLICATION** - Check existing codebase before writing new functions
- **NO DEAD CODE** - Either use or delete completely
- **IMPLEMENT TESTS FOR EVERY FUNCTION** - Verbose tests that reveal flaws
- **NO INCONSISTENT NAMING** - Follow existing codebase patterns
- **NO OVER-ENGINEERING** - Simple functions over unnecessary abstractions
- **NO MIXED CONCERNS** - Proper separation of validation, API, UI logic
- **NO RESOURCE LEAKS** - Always clean up connections, timeouts, listeners

## Project Overview

This is a **Net Ecosystem Platform** - a multi-tenant SaaS application built with Next.js 15, shadcn/ui, and Logto for authentication and organization-based identity management. The project serves as a foundation for building production-ready organization-aware platform applications.

## Commands

### Development
```bash
# Start development server with Turbopack
npm run dev

# Build the project with Turbopack  
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint
```

### Package Management
Uses `pnpm` as the package manager (evidenced by `pnpm-lock.yaml`).

### Testing Philosophy
- Always use the **test-runner** sub-agent to execute tests
- **NO MOCK SERVICES** - Use real services for testing
- Don't move to next test until current test completes
- If test fails, check test structure before refactoring code
- Write **verbose tests** for debugging purposes

### Error Handling Philosophy
- **Fail fast** for critical configuration (missing models)
- **Log and continue** for optional features
- **Graceful degradation** when external services unavailable
- **User-friendly messages** through resilience layer

## Architecture Overview

### Core Technology Stack
- **Framework**: Next.js 15 with App Router and Turbopack
- **UI**: shadcn/ui (New York style) with Radix UI primitives
- **Authentication**: Logto with organization-based multi-tenancy
- **Styling**: Tailwind CSS v4 with CSS variables
- **TypeScript**: Strict mode with path aliases (`@/*`)
- **Icons**: Lucide React and Tabler Icons
- **Forms**: React Hook Form with Zod validation

### Application Structure

The platform follows a universal app pattern with four main sections accessible via the UniversalAppBar:
- **Inbox** (`/inbox`) - Communication and notification hub
- **Library** (`/library`) - Template and asset management
- **Catalog** (`/catalog`) - App marketplace and discovery
- **Profile** (`/profile`) - User and organization management

### Multi-tenancy Architecture

Based on Logto organizations for true multi-tenant SaaS architecture:

**Organization Context**: 
- Users belong to organizations with role-based access control
- Organization-scoped authentication tokens and API calls
- Permission-based routing and feature access

**Authentication Patterns** (from example implementation):
- **Never create custom login/register pages** - redirect to Logto's hosted sign-in experience
- `getOrganizationToken(organizationId)` for organization-scoped API calls
- `getUserOrganizationScopes(organizationId)` for permission checking
- JWT audience format: `"urn:logto:organization:{orgId}"` for organization context
- Separate handling for user-level vs organization-level authentication

**API Integration**:
- Organization-aware API calls: `fetchWithToken(endpoint, options, organizationId)`
- Token validation and scope verification
- Multi-tenant data isolation at the organization level

### Component Architecture

- **Universal App Bar**: Responsive navigation (desktop sidebar, mobile bottom bar)
- **shadcn/ui Integration**: New York style with CSS variables for theming
- **Data Tables**: Advanced table components with sorting, filtering, and pagination
- **Form System**: React Hook Form with Zod schemas for validation
- **Drag & Drop**: @dnd-kit for sortable interfaces

### File Structure
```
app/                    # Next.js App Router pages
├── layout.tsx         # Root layout with UniversalAppBar
├── page.tsx           # Homepage
└── [routes]/          # Feature-specific pages

components/            # Reusable components
├── ui/               # shadcn/ui components
├── forms/            # Form components with validation
├── data-table/       # Advanced table components
└── universal-app-bar.tsx  # Main navigation

lib/                  # Utilities and shared logic
├── utils.ts          # Tailwind merge utilities
└── [data].ts         # Mock data and schemas

hooks/                # Custom React hooks
docs/dashboard/       # Architecture and setup documentation
example/              # Multi-tenant SaaS reference implementation
```

## Key Implementation Patterns

### Logto Integration (from docs/)

**Setup Requirements**:
- Next.js 15 App Router with Logto client
- Organization-enabled Logto instance
- Environment configuration for SPA and API resources

**Authentication Flow**:
1. SPA application for frontend authentication
2. Machine-to-Machine (M2M) for backend API
3. Organization-based token exchange
4. Role and permission validation

**Multi-tenant Patterns**:
- Organization-scoped API calls
- Cross-domain session management (for subdomain routing)
- Permission-based UI rendering
- Tenant data isolation

### Development Guidelines

**UI Development**:
- Use shadcn/ui components from `@/components/ui`
- Follow New York style conventions
- Implement responsive patterns (mobile-first)
- Use CSS variables for consistent theming

**State Management**:
- React Hook Form for form state
- Zod schemas for validation
- Client components for interactive features
- Server components for data fetching

**API Integration**:
- Organization-aware API patterns
- Token-based authentication
- Error handling with proper user feedback
- Loading states and optimistic updates

## Reference Implementation

The `example/multi-tenant-saas-sample/` directory contains a complete working example demonstrating:

**Frontend (React)**:
- Logto organization authentication
- Organization-scoped API calls
- Document management with proper authorization
- Role-based UI rendering

**Backend (Node.js)**:
- JWT validation middleware
- Organization-based data isolation
- API resource protection
- Document CRUD with multi-tenant support

**Key Patterns**:
- Environment configuration (`env.ts`)
- API base class with organization context
- Token management and refresh
- Error handling and user feedback

## Development Port Configuration

The application runs on **port 6789** in development (configured in `.env.local`):
- Development server: `http://localhost:6789`  
- Logto redirect URI: `http://localhost:6789/api/logto/callback`
- Ensure alignment between `.env.local` and dev server configuration

## Critical Implementation Notes

### Logto Integration
- **Logto Instance**: `https://z3zlta.logto.app/`
- **Organization Template RBAC**: Use built-in admin/member/guest roles
- **JWT-Based Authorization**: Stateless with organization context from tokens
- **Management API Integration**: Logto as primary data store for multi-tenancy

### Component Standards
- Use **shadcn/ui New York style** components exclusively
- **CSS Variables** for theming (configured in `components.json`)
- **Lucide React** for icons
- **React Hook Form + Zod** for all form handling

## Production Considerations

**Deployment**:
- Docker and Kubernetes ready
- Environment-based configuration
- Multi-domain support for organization subdomains
- Scalable authentication with Logto

**Security**:
- Organization-level data isolation
- Role-based access control (RBAC)
- JWT validation and token refresh
- CORS configuration for multi-domain setup

**Monitoring**:
- Structured logging for multi-tenant context
- Organization-scoped metrics and analytics
- Error tracking with tenant isolation
- Performance monitoring per organization

## Documentation

Comprehensive setup guides in `docs/dashboard/`:
- **01-foundation-setup.md**: Project initialization and dependencies
- **02-logto-integration.md**: Authentication setup and configuration
- **03-production-features.md**: Advanced features and optimization
- **04-deployment-operations.md**: Production deployment patterns

The documentation provides step-by-step implementation guidance for building production-ready multi-tenant SaaS applications with modern authentication patterns.

## Communication Style

- **Be concise and direct** - avoid unnecessary elaboration
- **Welcome criticism** - challenge approaches and suggest better alternatives
- **Be skeptical** - question implementations and standards
- **Ask questions** when intent is unclear - don't guess
- **No flattery** unless specifically requested
- **Short summaries preferred** unless working through detailed plans