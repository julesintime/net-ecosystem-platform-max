---
name: ecosystem-net-platform-max
status: backlog
created: 2025-09-13T00:37:29Z
progress: 0%
prd: .claude/prds/ecosystem-net-platform-max.md
github: [Will be updated when synced to GitHub]
---

# Epic: Ecosystem Net Platform Max

## Overview

Transform the existing Next.js 15 foundation into a production-ready multi-tenant SaaS platform by implementing **Logto-hosted authentication** with **organization template-based RBAC**. The platform leverages Logto's hosted sign-in experience (never custom login pages), Management API for organization data, and JWT-based permissions system with minimal custom implementation.

## Architecture Decisions

**Logto-Hosted Authentication**: Never create custom login/register pages - redirect to Logto's sign-in experience
- **Sign-In Flow**: App → Redirect to Logto hosted UI → User authenticates → Redirect back with tokens
- **No Custom Auth UI**: Use Logto's production-ready authentication pages (like Google OAuth flow)
- **Social/Enterprise SSO**: Handled entirely by Logto's sign-in experience configuration
- **MFA/Security**: All advanced features managed through Logto admin console

**Organization Template RBAC**: Use Logto's predefined organization roles and permissions
- **Built-in Roles**: `admin` (full access), `member` (data access), `guest` (read-only)
- **Granular Permissions**: `manage:members`, `manage:settings`, `read:resources`, `create:resources`, etc.
- **Role Assignment**: Via Management API `/api/organizations/{id}/users/{userId}/roles`
- **Permission Scoping**: Organization-specific permissions from JWT audience claims

**JWT-Based Authorization**: Organization context and permissions embedded in tokens
- **Organization Context**: JWT audience format `"urn:logto:organization:{orgId}"`
- **Permission Claims**: User's organization roles and scopes in JWT payload
- **Stateless Authorization**: No database lookups needed for permission checks
- **Token-Scoped APIs**: Organization isolation through JWT validation

**Management API Integration**: Logto as primary data store for all multi-tenant features
- **Organization CRUD**: Direct API calls to `/api/organizations/*` endpoints
- **Member Management**: User invitation, role assignment via Management API
- **Data Isolation**: Organization-scoped queries using JWT organization context
- **Zero Database Schema**: No custom tables for users, organizations, roles, permissions

## Technical Approach

### Frontend Components
- **Authentication Buttons**: Simple redirect triggers to Logto sign-in experience
- **Organization Context**: Extract organization data from JWT claims in React Context
- **Role-Based UI**: Dynamic component rendering based on JWT permission scopes
- **Management UI**: Organization and member management using existing shadcn/ui components
- **No Custom Auth Forms**: All authentication handled by Logto's hosted pages

### Backend Services
- **Callback Handlers**: Process Logto redirects and extract JWT tokens
- **Management API Proxy**: Cached wrapper around Logto's organization endpoints
- **JWT Middleware**: Organization context extraction and permission validation
- **Organization-Scoped APIs**: Custom business logic APIs with organization isolation
- **Token Management**: Secure handling and caching of Management API tokens

### Infrastructure
- **Zero Authentication Database**: All user/org/role data stored in Logto
- **JWT-Only Authorization**: Organization context from token claims
- **Management API Cache**: Redis/memory cache for organization data
- **Stateless Architecture**: No session storage, purely token-based

## Implementation Strategy

**Redirect-First Authentication**: Never build custom login forms
- **Use Logto Sign-In Experience**: Configure authentication methods in Logto admin console
- **Redirect Implementation**: Simple `window.location.href` to Logto authorization endpoint
- **Callback Processing**: Handle authorization codes and token exchange

**Organization Template Configuration**: Leverage predefined RBAC system
- **Use Built-in Roles**: Map application needs to Logto's `admin`/`member`/`guest` roles
- **Custom Permissions**: Define application-specific scopes in Logto organization template
- **Role Assignment UI**: Build member management that calls Management API endpoints

**JWT-First Authorization**: Extract all context from tokens
- **Organization Extraction**: Parse organization ID from JWT audience claim
- **Permission Checking**: Validate scopes from JWT payload
- **API Middleware**: Organization-scoped request validation

## Task Summary

### Task 001: Logto SDK Integration and Authentication Setup (4h)
**Status**: `pending` | **Priority**: `high` | **Dependencies**: None
- Install @logto/next SDK and configure redirect-based authentication
- Replace any existing auth UI with redirect triggers to Logto sign-in experience
- Set up callback handlers and session management
- Ensure port alignment between .env.local (6789) and development server

### Task 002: Organization Template Configuration in Logto Admin (3h)  
**Status**: `pending` | **Priority**: `high` | **Dependencies**: Task 001
- Configure organization template with predefined roles (admin, member, guest)
- Set up organization-scoped permissions for business logic
- Configure sign-in experience with social/email providers
- Validate role/permission mapping for application requirements

### Task 003: Management API Client and Token Caching (6h)
**Status**: `pending` | **Priority**: `high` | **Dependencies**: Task 002
- Create comprehensive Management API client with intelligent token caching
- Implement rate limiting strategy and cached organization endpoints
- Build proxy endpoints for organization CRUD operations
- Add comprehensive error handling and retry logic

### Task 004: JWT Authorization Middleware and Organization Context (4h)
**Status**: `pending` | **Priority**: `high` | **Dependencies**: Task 003
- Implement JWT middleware for organization context extraction
- Parse organization ID from audience claim format "urn:logto:organization:{orgId}"
- Extract user permissions and scopes from JWT payload
- Create stateless organization-scoped request validation system

### Task 005: Organization Management UI Components (6h)
**Status**: `pending` | **Priority**: `high` | **Dependencies**: Task 004
- Build member invitation and role assignment interfaces using shadcn/ui
- Create organization settings management components
- Implement user management dashboard with CRUD operations
- Add role-based UI rendering and permission guards

### Task 006: Profile Section Integration and Organization Switching (4h)
**Status**: `pending` | **Priority**: `high` | **Dependencies**: Task 005  
- Integrate organization switching into Profile section
- Enhance Universal App Bar with organization context
- Create organization selection and switching interface
- Add organization-scoped user profile management

### Task 007: Integration Testing and Documentation (5h)
**Status**: `pending` | **Priority**: `high` | **Dependencies**: Task 006
- Comprehensive end-to-end testing of multi-tenant flows
- Performance validation and load testing
- API documentation and deployment guides
- Security testing and production readiness validation

**Total Estimated Effort**: 32 hours (4 development days)

## Dependencies

### External Service Dependencies
- **Logto Instance**: Already configured at https://z3zlta.logto.app/ with working credentials
- **Organization Template**: Must configure predefined roles (admin, member, guest) with permissions
- **Sign-In Experience**: Configure authentication methods (social, email, etc.) in Logto admin

### Internal Team Dependencies
- **Port Alignment**: Ensure .env.local (6789) matches development server configuration
- **Role Mapping**: Map application requirements to Logto's organization role structure
- **Permission Design**: Define organization-scoped permissions for business logic

## Success Criteria (Technical)

**Authentication Flow**
- Users redirected to Logto hosted sign-in experience (no custom login forms)
- JWT tokens contain correct organization context and permission scopes
- Callback handling processes authorization codes and extracts user/org data

**Organization Management**
- Organizations created/managed entirely through Management API calls
- Member invitations and role assignments work via Logto endpoints
- Role-based UI rendering using JWT permission scopes

**Authorization System**
- All API endpoints validate organization context from JWT claims
- Permission checks use JWT scopes without database queries
- Organization data isolation enforced through token validation

**Performance Benchmarks**
- JWT organization extraction < 5ms per request
- Management API calls cached with < 200ms response times
- No database queries for authentication or authorization

**Security Requirements**
- All authentication handled by Logto's security-hardened sign-in experience
- Organization isolation enforced through JWT audience claims
- Management API tokens cached securely with automatic refresh

## Estimated Effort

**Overall Timeline**: 3-4 development days (significantly reduced due to hosted authentication)
- **Phase 1**: Logto SDK Integration and Redirect Setup (1 day)
- **Phase 2**: Organization Template Configuration and Management API (1 day)
- **Phase 3**: JWT Middleware and Organization Context (1 day)
- **Phase 4**: Member Management UI and Role Assignment (1 day)

**Resource Requirements**
- 1 full-stack developer (primary)
- Logto instance access for organization template configuration
- No custom authentication or database infrastructure

**Critical Path Items**
1. Configure organization template with proper roles and permissions in Logto
2. Implement redirect-based authentication (no custom login forms)
3. JWT organization context extraction and validation middleware
4. Management API integration for organization operations

**Risk Mitigation**
- Port configuration alignment between .env.local and development server
- Organization template role/permission mapping validation
- JWT token validation and refresh error handling
- Management API rate limiting and caching strategy