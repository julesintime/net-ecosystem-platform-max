---
created: 2025-09-13T01:34:04Z
last_updated: 2025-09-13T01:34:04Z
version: 1.0
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
│   ├── layout.tsx             # Root layout with UniversalAppBar
│   ├── page.tsx               # Homepage
│   ├── inbox/                 # Communication hub pages
│   ├── library/               # Template management pages
│   ├── catalog/               # App marketplace pages
│   └── profile/               # User/org management pages
├── components/                 # Reusable React components
│   ├── ui/                    # shadcn/ui components (New York style)
│   ├── forms/                 # Form components with validation
│   ├── data-table/            # Advanced table components
│   └── universal-app-bar.tsx  # Main navigation component
├── lib/                       # Utilities and shared logic
│   ├── utils.ts              # Tailwind merge utilities
│   └── [data].ts             # Mock data and schemas
├── hooks/                     # Custom React hooks
├── docs/                      # Project documentation
│   └── dashboard/            # Setup and architecture guides
├── example/                   # Reference implementation
│   └── multi-tenant-saas-sample/  # Working example code
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

### Authentication Architecture
```
lib/auth/
├── jwt-validator.ts           # JWT parsing and validation
├── organization-context.ts    # Organization context builder
├── permissions.ts             # Role and permission utilities
└── middleware-utils.ts        # Middleware helper functions
```

### API Structure  
```
app/api/
├── auth/                      # Authentication endpoints
├── organizations/             # Organization CRUD operations
│   ├── route.ts              # Main organization operations
│   └── [orgId]/              # Single organization operations
└── management/                # Management API proxies
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

### Epic Documentation (`/.claude/epics/ecosystem-net-platform-max/`)
- **`epic.md`** - Main epic documentation
- **`9.md` - `15.md`** - Individual task files (GitHub issue IDs)
- **`github-mapping.md`** - Issue mapping and sync information

### Project Documentation
- **`CLAUDE.md`** - Primary development guidance
- **`README.md`** - Basic project information
- **`docs/dashboard/`** - Setup and architecture guides
- **`example/`** - Reference implementation patterns