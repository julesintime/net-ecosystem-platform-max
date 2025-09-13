---
created: 2025-09-13T01:34:04Z
last_updated: 2025-09-13T01:34:04Z
version: 1.0
author: Claude Code PM System
---

# Project Brief

## Project Identity

**Name**: Net Ecosystem Platform Max  
**Type**: Multi-tenant SaaS Application Foundation  
**Status**: In Development (Planning Phase Complete)  
**Repository**: https://github.com/julesintime/net-ecosystem-platform-max

## What It Is

A **production-ready foundation** for building multi-tenant SaaS applications with modern authentication patterns. The platform combines Next.js 15, shadcn/ui components, and Logto organization-based identity management to provide a complete starting point for B2B SaaS development.

## What It Does

### Core Functionality
- **Multi-Tenant Authentication**: Organization-based user management with Logto
- **Universal App Navigation**: Four-section app pattern (Inbox, Library, Catalog, Profile)  
- **Organization Management**: Complete member invitation and role management
- **UI Component Library**: Production-ready components with shadcn/ui
- **Reference Implementation**: Working example of multi-tenant patterns

### Key Capabilities
- **Zero Custom Auth UI**: Redirect-based authentication using Logto's hosted experience
- **JWT-Based Authorization**: Stateless permission checking with organization context
- **Role-Based Access Control**: Built-in admin/member/guest roles with custom permissions
- **Responsive Design**: Desktop sidebar and mobile bottom navigation
- **Developer Experience**: TypeScript strict mode, Turbopack, comprehensive documentation

## Why It Exists

### Problem Statement
Building multi-tenant SaaS applications requires solving the same complex problems repeatedly:
- **Authentication Complexity**: Custom auth UI, session management, security vulnerabilities
- **Organization Management**: User invitations, role assignment, permission isolation  
- **UI Consistency**: Accessible components, responsive design, theme management
- **Architecture Decisions**: Multi-tenancy patterns, data isolation, scalability planning

### Solution Approach
Instead of solving these problems from scratch for each project, this platform provides:
- **Battle-Tested Patterns**: Proven multi-tenant architecture with security best practices
- **Modern Tech Stack**: Latest React/Next.js patterns with production-ready tooling
- **Complete Implementation**: End-to-end working example, not just documentation
- **Developer Productivity**: Skip 3-4 weeks of foundation development

## Project Scope

### In Scope
- ✅ **Authentication Foundation**: Logto integration with organization-based multi-tenancy
- ✅ **UI Component System**: Complete shadcn/ui integration with responsive patterns
- ✅ **Organization Management**: Member invitation, role assignment, permission checking
- ✅ **Universal App Architecture**: Four-section navigation with mobile responsiveness
- ✅ **Developer Experience**: TypeScript, Turbopack, ESLint, comprehensive documentation
- ✅ **Reference Implementation**: Working example demonstrating all patterns

### Out of Scope
- ❌ **Custom Database Implementation**: Logto serves as the primary data store
- ❌ **Payment Integration**: Focus on authentication and organization management
- ❌ **Domain-Specific Business Logic**: Platform provides foundation, not specific features
- ❌ **Custom Authentication UI**: Leverages Logto's hosted sign-in experience
- ❌ **Email Service Integration**: Logto handles authentication-related emails

## Success Criteria

### Technical Success
- [ ] **Authentication**: Users redirect to Logto (no custom login forms)
- [ ] **Organization Context**: JWT tokens contain organization ID and permissions
- [ ] **Management API**: Organization CRUD operations working through Logto APIs
- [ ] **UI Components**: Complete responsive interface using shadcn/ui
- [ ] **Performance**: JWT processing < 5ms, API calls < 200ms (cached)

### Business Success
- [ ] **Development Time**: Reduce multi-tenant setup from weeks to days
- [ ] **Code Quality**: TypeScript strict mode, ESLint compliance, test coverage
- [ ] **Documentation**: Complete setup guides and architecture documentation
- [ ] **Reference Value**: Serve as template for future multi-tenant projects
- [ ] **Community Adoption**: Clear patterns for other developers to follow

### User Experience Success
- [ ] **Navigation**: Intuitive universal app pattern across device types
- [ ] **Accessibility**: WCAG compliance through Radix UI primitives
- [ ] **Mobile Experience**: Full functionality on mobile devices
- [ ] **Error Handling**: Graceful degradation with user-friendly messages
- [ ] **Performance**: Fast page loads and responsive interactions

## Key Objectives

### Primary Objectives
1. **Establish Multi-Tenant Foundation**: Complete Logto integration with organization management
2. **Implement Universal App Pattern**: Responsive navigation and component architecture
3. **Create Reference Implementation**: Working example demonstrating all key patterns
4. **Document Architecture**: Comprehensive guides for future development

### Secondary Objectives  
5. **Performance Optimization**: Fast JWT processing and API response times
6. **Developer Experience**: Modern tooling and development workflow
7. **Security Implementation**: Production-ready security patterns and validation
8. **Testing Strategy**: Comprehensive test coverage with real service integration

## Project Constraints

### Technical Constraints
- **Port Configuration**: Must use port 6789 (configured in Logto)
- **Authentication Provider**: Must use Logto (no custom auth implementation)
- **UI Framework**: Must use shadcn/ui New York style for consistency
- **Framework**: Must use Next.js 15 with App Router architecture

### Resource Constraints
- **Development Time**: 4 development days (32 hours estimated)
- **Team Size**: Single full-stack developer with Claude Code assistance  
- **External Dependencies**: Logto instance and GitHub for project management
- **Infrastructure**: Development environment only (production deployment guides)

### Scope Constraints
- **Focus**: Multi-tenant SaaS foundation only
- **Complexity**: Balance comprehensiveness with maintainability
- **Documentation**: Essential patterns only, avoid over-documentation
- **Testing**: Focus on integration tests over unit test coverage

## Project Stakeholders

### Development Team
- **Primary Developer**: julesintime (GitHub user)
- **AI Assistant**: Claude Code for implementation support
- **Project Management**: GitHub issues with epic/sub-issue structure

### Target Audience
- **SaaS Founders**: Need rapid multi-tenant MVP development  
- **Full-Stack Developers**: Want modern authentication patterns
- **Product Teams**: Require organization management features
- **Development Agencies**: Need template for client projects