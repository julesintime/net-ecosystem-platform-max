---
created: 2025-09-13T01:34:04Z
last_updated: 2025-09-13T01:34:04Z
version: 1.0
author: Claude Code PM System
---

# Project Style Guide

## Code Style Standards

### TypeScript Standards

#### Type Definitions
```typescript
// Use interface for object shapes
interface OrganizationContext {
  organizationId: string;
  userId: string;
  permissions: string[];
  scopes: string[];
}

// Use type for unions and computed types
type UserRole = 'admin' | 'member' | 'guest';
type OrganizationPermission = `${string}:${string}`;
```

#### Strict Mode Requirements
- **No `any` types** - Use proper type definitions or `unknown`
- **Explicit return types** for all functions and components
- **No implicit returns** - Always specify return type
- **Null safety** - Use optional chaining and nullish coalescing

#### Import Organization
```typescript
// External dependencies first
import { useState, useEffect } from 'react';
import { z } from 'zod';

// Internal utilities
import { cn } from '@/lib/utils';

// Components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Local imports last
import { OrganizationContext } from './types';
```

### React Component Standards

#### Component Structure
```typescript
// Component definition with explicit types
interface ComponentNameProps {
  children?: React.ReactNode;
  className?: string;
  // ... other props
}

export function ComponentName({ 
  children, 
  className, 
  ...props 
}: ComponentNameProps) {
  // Hooks first
  const [state, setState] = useState<StateType>(initialValue);
  
  // Event handlers
  const handleAction = (event: React.MouseEvent) => {
    // Implementation
  };
  
  // Render
  return (
    <div className={cn("default-classes", className)} {...props}>
      {children}
    </div>
  );
}
```

#### Naming Conventions
- **Components**: PascalCase (`UserProfile`, `OrganizationSettings`)
- **Props interfaces**: ComponentName + Props (`UserProfileProps`)
- **Hooks**: camelCase with `use` prefix (`useOrganizationContext`)
- **Event handlers**: `handle` + Action (`handleSubmit`, `handleRoleChange`)

### File Naming Conventions

#### Directory Structure
```
components/
├── ui/                    # shadcn/ui components (kebab-case)
│   ├── button.tsx
│   ├── form.tsx
│   └── data-table.tsx
├── forms/                 # Business logic forms (kebab-case)
│   ├── organization-form.tsx
│   └── member-invitation-form.tsx
└── universal-app-bar.tsx  # Main components (kebab-case)
```

#### File Extensions
- **`.tsx`** - React components with JSX
- **`.ts`** - TypeScript utilities and types
- **`.md`** - Documentation files
- **`.json`** - Configuration files

### CSS and Styling Standards

#### Tailwind CSS Patterns
```typescript
// Use cn() utility for conditional classes
const buttonVariants = cn(
  "base-button-classes",
  {
    "variant-classes": variant === 'primary',
    "state-classes": isDisabled,
  },
  className
);

// Responsive design patterns
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Consistent spacing scale
className="p-4 gap-4 mb-6" // Use 4, 6, 8, 12, 16, 24 scale
```

#### CSS Variables Usage
```css
/* Use CSS variables for theming */
.component {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  border-color: hsl(var(--border));
}
```

#### Component Class Structure
```typescript
// Order classes by category
className={cn(
  // Layout
  "flex flex-col",
  // Spacing
  "p-4 gap-2",
  // Sizing
  "w-full h-auto",
  // Visual
  "bg-background border border-border rounded-lg",
  // States
  "hover:bg-accent focus:ring-2",
  // Custom
  className
)}
```

## Form Handling Standards

### React Hook Form + Zod Pattern
```typescript
// Schema definition
const organizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  description: z.string().optional(),
  settings: z.object({
    isPublic: z.boolean().default(false),
  }),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

// Form component
export function OrganizationForm() {
  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      description: "",
      settings: { isPublic: false },
    },
  });

  const onSubmit = async (data: OrganizationFormData) => {
    // Handle submission
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  );
}
```

### Error Handling Pattern
```typescript
// Consistent error handling
try {
  const result = await organizationApi.create(data);
  toast.success("Organization created successfully");
  return result;
} catch (error) {
  const message = error instanceof Error 
    ? error.message 
    : "An unexpected error occurred";
  toast.error(message);
  throw error;
}
```

## API and Data Standards

### API Route Structure
```typescript
// app/api/organizations/route.ts
export async function GET(request: Request) {
  try {
    const organizationContext = await extractOrganizationContext(request);
    const organizations = await getOrganizations(organizationContext);
    
    return Response.json({ organizations });
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}
```

### JWT Processing Pattern
```typescript
// Extract organization context from JWT
function extractOrganizationContext(token: string): OrganizationContext {
  const payload = jwt.decode(token);
  
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid token');
  }
  
  // Extract organization from audience claim
  const orgAudience = payload.aud?.find(
    (aud: string) => aud.startsWith('urn:logto:organization:')
  );
  
  if (!orgAudience) {
    throw new Error('No organization context in token');
  }
  
  const organizationId = orgAudience.replace('urn:logto:organization:', '');
  
  return {
    organizationId,
    userId: payload.sub,
    permissions: payload.permissions || [],
    scopes: payload.scope?.split(' ') || [],
  };
}
```

## Documentation Standards

### Code Comments
```typescript
/**
 * Extracts organization context from JWT token audience claims.
 * 
 * @param token - JWT token containing organization context
 * @returns Organization context with ID, user, permissions, and scopes
 * @throws Error if token is invalid or missing organization context
 */
function extractOrganizationContext(token: string): OrganizationContext {
  // Implementation details with inline comments for complex logic
}
```

### README and Documentation
- **Clear Purpose**: What the component/function does
- **Usage Examples**: Code examples for common use cases
- **Props/Parameters**: Complete type information
- **Dependencies**: Required packages and configuration

### File Headers
```typescript
/**
 * Organization Management UI Components
 * 
 * Provides complete organization management interface including:
 * - Member invitation and role assignment
 * - Organization settings management
 * - Permission-based rendering
 * 
 * @requires @logto/next for authentication context
 * @requires react-hook-form and zod for form handling
 */
```

## Testing Standards

### Test File Structure
```typescript
// components/__tests__/organization-form.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { OrganizationForm } from '../organization-form';

describe('OrganizationForm', () => {
  it('renders with default values', () => {
    render(<OrganizationForm />);
    expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<OrganizationForm />);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    expect(await screen.findByText(/organization name is required/i))
      .toBeInTheDocument();
  });
});
```

### Test Naming
- **Test files**: `component-name.test.tsx`
- **Test descriptions**: Clear behavior descriptions
- **Mock names**: `mockFunctionName` or `mockServiceName`

## Git and Project Management Standards

### Commit Message Format
```
feat: Add organization management UI components

- Implement member invitation dialog with role selection
- Add organization settings form with validation
- Include permission-based rendering for admin features

Closes #13
```

### Branch Naming
- **Feature branches**: `feature/organization-management`
- **Bug fixes**: `fix/jwt-validation-error`
- **Epic branches**: `epic/ecosystem-net-platform-max`

### PR and Issue Standards
- **Clear titles**: Describe what changed or what needs to be done
- **Detailed descriptions**: Include context and acceptance criteria
- **Labels**: Use appropriate labels for categorization
- **Linked issues**: Reference related issues and close automatically

## Error Handling Standards

### User-Facing Errors
```typescript
// Provide helpful error messages
if (!organizationId) {
  throw new Error(
    "Organization context is required. Please ensure you're logged in and have access to an organization."
  );
}

// Use toast notifications for user feedback
toast.error("Failed to invite member. Please check the email address and try again.");
```

### Development Errors
```typescript
// Provide detailed information for debugging
if (process.env.NODE_ENV === 'development') {
  console.error('JWT validation failed:', {
    token: token.substring(0, 20) + '...',
    error: error.message,
    audience: payload?.aud,
  });
}
```

## Performance Standards

### Component Optimization
```typescript
// Use React.memo for expensive components
export const OrganizationTable = React.memo(function OrganizationTable({
  organizations,
  onUpdate,
}: OrganizationTableProps) {
  // Component implementation
});

// Use useCallback for event handlers passed to children
const handleMemberInvite = useCallback((email: string, role: UserRole) => {
  // Handle invitation
}, []);
```

### Loading States
```typescript
// Always provide loading states
if (isLoading) {
  return <Skeleton className="h-48 w-full" />;
}

if (error) {
  return <ErrorMessage error={error} onRetry={refetch} />;
}

return <ComponentContent data={data} />;
```

These standards ensure consistency, maintainability, and quality across the entire codebase while following modern React and TypeScript best practices.