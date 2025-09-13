---
created: 2025-09-13T01:34:04Z
last_updated: 2025-09-13T01:34:04Z
version: 1.0
author: Claude Code PM System
---

# System Patterns and Architecture

## Core Architectural Patterns

### Multi-Tenant SaaS Pattern
**Organization-Based Tenancy** with complete data isolation:
- **Tenant Boundary**: Logto organizations serve as tenant boundaries
- **Data Isolation**: Organization-scoped API calls and JWT validation
- **User Context**: Users belong to organizations with role-based access
- **Scalable Architecture**: No shared data between organizations

### Authentication Architecture Pattern
**Redirect-First Authentication** - Zero custom auth UI:
```
App → Redirect to Logto → User Auth → Redirect Back with JWT
```
- **Hosted Sign-In**: Logto manages all authentication UX
- **JWT Context**: Organization ID embedded in audience claims
- **Stateless Authorization**: No database queries for auth decisions
- **Token Management**: Automatic refresh and secure caching

## Frontend Architecture Patterns

### Universal App Pattern
**Four-Section Navigation** with responsive adaptation:
```
Desktop: Sidebar Navigation     Mobile: Bottom Tab Bar
├── Inbox (Communication)      ├── Inbox
├── Library (Templates)        ├── Library  
├── Catalog (Marketplace)      ├── Catalog
└── Profile (Settings)         └── Profile
```

### Component Composition Pattern
**shadcn/ui + Radix Primitives** for consistent UX:
- **Base Layer**: Radix UI primitives for accessibility
- **Design Layer**: shadcn/ui New York style components
- **Custom Layer**: Application-specific compositions
- **Theme Layer**: CSS variables for consistent theming

### Form Handling Pattern
**React Hook Form + Zod Schema Validation**:
```typescript
const schema = z.object({
  // Zod schema definition
});

const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema)
});
```
- **Validation**: Client-side with Zod schemas
- **Type Safety**: Automatic TypeScript inference
- **Error Handling**: Integrated error states
- **Submission**: Optimistic updates with loading states

## Backend Integration Patterns

### Organization-Scoped API Pattern
**JWT-First Authorization** with organization context:
```typescript
// Extract organization from JWT audience
const orgId = extractOrganizationFromJWT(token);
// All API calls include organization context
await fetchWithOrganizationContext(endpoint, orgId);
```

### Management API Proxy Pattern
**Cached Wrapper** around Logto Management API:
- **Token Caching**: Reduce API calls with intelligent caching
- **Rate Limiting**: Prevent quota exhaustion
- **Error Handling**: Graceful degradation for API failures
- **Organization CRUD**: Direct calls to Logto endpoints

### Stateless Authorization Pattern
**Zero Database Auth Queries**:
- **JWT Validation**: Parse organization and permissions from token
- **Permission Checking**: Validate scopes from JWT payload
- **Context Enrichment**: Build organization context from token claims
- **Performance**: < 5ms authorization overhead per request

## Data Flow Patterns

### Client-Side Data Flow
```
User Action → Form Validation → API Call → JWT Context → Organization-Scoped Request
```

### Server-Side Data Flow  
```
Request → JWT Middleware → Organization Extraction → Permission Check → API Response
```

### Authentication Flow
```
Login Trigger → Logto Redirect → User Auth → Callback → JWT Storage → Context Ready
```

## UI/UX Patterns

### Responsive Design Pattern
**Mobile-First with Progressive Enhancement**:
- **Mobile**: Bottom navigation, collapsible content
- **Tablet**: Hybrid navigation, optimized layouts  
- **Desktop**: Sidebar navigation, full feature access

### Data Table Pattern
**Advanced Table Functionality** with shadcn/ui:
- **Sorting**: Column-based ascending/descending
- **Filtering**: Multi-column filter capabilities
- **Pagination**: Server-side with loading states
- **Selection**: Multi-row selection with actions

### Loading State Pattern
**Optimistic UI Updates** with fallback handling:
- **Skeleton Loading**: Content placeholders during fetch
- **Progressive Loading**: Load critical content first
- **Error Boundaries**: Graceful error handling
- **Retry Mechanisms**: User-controlled retry options

## Security Patterns

### Token Security Pattern
**Secure JWT Handling** throughout application:
- **Storage**: Secure cookie storage (httpOnly, secure)
- **Transmission**: HTTPS-only token transmission
- **Validation**: Signature and expiration checking
- **Refresh**: Automatic renewal before expiration

### Organization Isolation Pattern
**Multi-Tenant Security** at every layer:
- **API Level**: Organization ID validation on every request
- **UI Level**: Organization-scoped data display
- **Token Level**: Audience claim validation
- **Database Level**: Organization-scoped queries (future)

### Permission-Based Rendering Pattern
**Role-Based UI Components**:
```typescript
{hasPermission('manage:members') && <MemberManagementUI />}
{isRole('admin') && <AdminDashboard />}
```

## Development Patterns

### Component Development Pattern
**Composition Over Inheritance**:
- **Base Components**: shadcn/ui primitives
- **Composite Components**: Business logic compositions
- **Page Components**: Feature-specific assemblies
- **Layout Components**: Structural organization

### Testing Pattern (Planned)
**Test-Driven Development** with real services:
- **No Mocking**: Use real Logto instance for testing
- **Verbose Tests**: Detailed assertions for debugging
- **Integration Tests**: End-to-end user flows
- **Performance Tests**: JWT processing and API response times

### Error Handling Pattern
**Graceful Degradation Strategy**:
- **Fail Fast**: Critical configuration errors
- **Log and Continue**: Optional feature failures
- **User-Friendly Messages**: Clear error communication
- **Retry Logic**: Automatic and manual retry options

## Integration Patterns

### Third-Party Service Pattern
**Logto-First Integration**:
- **Single Source of Truth**: Logto for all user/org data
- **API Proxy**: Local endpoints that wrap Logto APIs
- **Caching Strategy**: Intelligent caching with TTL
- **Fallback Handling**: Graceful service degradation

### Development Workflow Pattern
**GitHub Issue Integration**:
- **Epic Structure**: Main epic with linked sub-issues
- **Task Tracking**: GitHub issues as single source of truth
- **Progress Monitoring**: Issue status reflects actual progress
- **Documentation Sync**: Keep local files aligned with GitHub

## Performance Patterns

### Caching Strategy
**Multi-Layer Caching**:
- **Token Caching**: JWT and Management API tokens
- **API Response Caching**: Organization data with TTL
- **UI Caching**: Component state and form data
- **Build Caching**: Turbopack optimization

### Optimization Patterns
**Performance-First Development**:
- **JWT Processing**: < 5ms per request target
- **API Response**: < 200ms for cached calls
- **UI Rendering**: Lazy loading and code splitting
- **Bundle Size**: Tree shaking and selective imports