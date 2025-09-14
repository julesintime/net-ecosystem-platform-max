---
created: 2025-09-13T01:34:04Z
last_updated: 2025-09-14T19:54:43Z
version: 2.1
author: Claude Code PM System
---

# Project Structure

## Root Directory Layout

```
net-ecosystem-platform-max/
├── .claude/                     # Claude Code project management
│   ├── commands/               # Command definitions for PM system
│   ├── epics/                  # Epic and task documentation
│   ├── context/                # Project context files
│   ├── rules/                  # Development rules and guidelines
│   └── scripts/                # PM automation scripts
├── app/                        # Next.js 15 App Router pages
│   ├── api/                   # API routes (NEW)
│   │   ├── logto/            # Logto authentication callbacks
│   │   ├── organizations/    # Organization CRUD endpoints
│   │   └── profile/          # Profile and settings endpoints
│   ├── layout.tsx             # Root layout with UniversalAppBar
│   ├── page.tsx               # Homepage
│   ├── inbox/                 # Communication hub pages
│   ├── library/               # Template management pages
│   ├── catalog/               # App marketplace pages
│   └── profile/               # User/org management pages (EXPANDED)
│       ├── organization/     # Organization management pages (NEW)
│       └── settings/         # User settings pages (NEW)
├── components/                 # Reusable React components
│   ├── ui/                    # shadcn/ui components (New York style)
│   ├── forms/                 # Form components with validation
│   ├── data-table/            # Advanced table components
│   ├── organization/          # Organization management components (NEW)
│   ├── profile/               # Profile and user settings (NEW)
│   ├── navigation/            # Navigation components (NEW)
│   ├── providers/             # React context providers (NEW)
│   └── universal-app-bar.tsx  # Main navigation component
├── lib/                       # Utilities and shared logic
│   ├── auth/                  # Authentication utilities (NEW)
│   ├── contexts/              # React contexts (NEW)
│   ├── types/                 # TypeScript type definitions (NEW)
│   ├── utils/                 # Utility functions (EXPANDED)
│   └── utils.ts              # Tailwind merge utilities
├── hooks/                     # Custom React hooks (EXPANDED)
│   ├── use-organization*.ts   # Organization management hooks (NEW)
│   ├── use-members.ts         # Member management (NEW)
│   ├── use-invitations.ts     # Invitation system (NEW)
│   └── use-profile*.ts        # Profile management hooks (NEW)
├── docs/                      # Project documentation
│   └── dashboard/            # Setup and architecture guides
├── example/                   # Reference implementation
│   └── multi-tenant-saas-sample/  # Working example code
├── tests/                     # E2E and integration testing (NEW)
│   ├── e2e/                  # Playwright E2E tests (NEW)
│   └── staging/              # Staging environment tests (NEW)
├── test-results/             # Playwright test artifacts (NEW)
├── playwright-report/        # Test reports with video recordings (NEW)
├── playwright.config.ts      # Playwright configuration (NEW)
└── public/                    # Static assets
```

## Key Directory Patterns

### Application Structure (Universal App Pattern)
The app follows a universal app pattern with four main sections:

- **`app/inbox/`** - Communication and notification hub
- **`app/library/`** - Template and asset management  
- **`app/catalog/`** - App marketplace and discovery
- **`app/profile/`** - User and organization management

### Component Organization
- **`components/ui/`** - Contains shadcn/ui components (New York style)
- **`components/forms/`** - Form components with React Hook Form + Zod
- **`components/data-table/`** - Advanced table components with sorting/filtering
- **`components/universal-app-bar.tsx`** - Responsive navigation (sidebar/bottom bar)

### Project Management Structure
The `.claude/` directory contains comprehensive project management:

- **`epics/ecosystem-net-platform-max/`** - Current epic with 7 tasks
- **`commands/pm/`** - Project management command definitions
- **`rules/`** - Development rules and patterns
- **`scripts/pm/`** - Automation scripts for PM workflows

## File Naming Conventions

### Component Files
- **PascalCase** for React components: `UniversalAppBar.tsx`
- **kebab-case** for page routes: `app/user-profile/page.tsx`
- **camelCase** for utility files: `lib/authUtils.ts`

### Epic and Task Files
- **Numeric naming**: `001.md`, `002.md` (original)
- **Issue IDs**: `9.md`, `10.md` (after GitHub sync)
- **Epic files**: `epic.md` (main epic documentation)

### Configuration Files
- **Standard names**: `package.json`, `components.json`, `.env.local`
- **Dot files**: `.gitignore`, `.eslintrc.json`

## Module Organization

### Authentication Architecture (IMPLEMENTED)
```
lib/auth/
├── actions.ts                 # Authentication actions
├── logto-config.ts           # Logto SDK configuration
├── organization-context.ts   # Organization context builder (NEW)
├── types.ts                  # Authentication type definitions
└── __tests__/                # Authentication test suite (NEW)
```

### API Structure (IMPLEMENTED)
```
app/api/
├── logto/                    # Logto authentication callbacks
│   └── [...logto]/route.ts   # OAuth callback handling
├── organizations/            # Organization CRUD operations (NEW)
│   ├── route.ts             # List/create organizations
│   └── [id]/                # Single organization operations
│       ├── route.ts         # Get/update/delete organization
│       ├── members/route.ts # Member management endpoints
│       └── token/route.ts   # Organization token generation
└── profile/                 # Profile management endpoints (NEW)
    └── settings/route.ts    # User settings management
```

### Multi-Tenant Component Architecture (NEW)
```
components/organization/
├── organization-context.tsx     # Organization context provider
├── member-management/           # Member management components
│   ├── members-list.tsx        # Data table for members
│   ├── invite-member-dialog.tsx # Member invitation form
│   ├── role-assignment.tsx     # Role selection interface
│   ├── member-actions.tsx      # Member action dropdown
│   └── bulk-operations.tsx     # Bulk member operations
└── settings/                   # Organization settings
    ├── organization-profile.tsx # Profile editing
    ├── organization-danger.tsx  # Danger zone operations
    └── usage-metrics.tsx       # Usage analytics
```

### Profile Integration Components (NEW)
```
components/profile/
├── profile-dropdown.tsx         # Enhanced profile menu
├── organization-selector.tsx    # Organization switcher
├── organization-quick-actions.tsx # Quick access actions
└── user-settings.tsx           # Personal settings interface
```

## Import Path Aliases

Configured in `tsconfig.json` and `components.json`:

- **`@/*`** - Root directory alias
- **`@/components`** - Components directory
- **`@/lib`** - Utilities and shared logic
- **`@/hooks`** - Custom React hooks
- **`@/ui`** - shadcn/ui components specifically

## Asset Organization

### Static Assets (`public/`)
- **Icons**: Lucide React (primary), Tabler Icons (secondary)
- **Images**: Organized by feature/section
- **Fonts**: Geist font family (auto-optimized by Next.js)

### Styling Architecture
- **Global styles**: `app/globals.css`
- **Component styles**: CSS-in-JS with Tailwind classes
- **Theme system**: CSS variables (configured in `components.json`)
- **Style guide**: New York style from shadcn/ui

## Development Infrastructure

### Configuration Files
- **`package.json`** - Node.js dependencies and scripts
- **`components.json`** - shadcn/ui configuration (New York style)
- **`.env.local`** - Logto authentication configuration (port 6789)
- **`next.config.ts`** - Next.js 15 configuration with Turbopack

### Development Tools
- **TypeScript** - Strict mode with path aliases
- **ESLint** - Code linting and formatting
- **Tailwind CSS v4** - Utility-first styling with CSS variables
- **React Hook Form + Zod** - Form handling and validation

## Documentation Structure

### Epic Documentation (COMPLETED & ARCHIVED)
- **`.claude/epics/archived/ecosystem-net-platform-max/`** - Completed epic (MOVED)
  - **`epic.md`** - Main epic documentation (status: completed)
  - **`9.md` - `15.md`** - Individual task files (all closed)
  - **`github-mapping.md`** - Issue mapping and sync information

### Project Documentation
- **`CLAUDE.md`** - Primary development guidance
- **`README.md`** - Basic project information
- **`docs/dashboard/`** - Setup and architecture guides
- **`example/`** - Reference implementation patterns

## Update History
- 2025-09-13T13:59:46Z: Major structural update - added complete multi-tenant SaaS implementation with organization management, API routes, profile integration, and comprehensive component architecture