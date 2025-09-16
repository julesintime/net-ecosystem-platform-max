# Net Ecosystem Platform

A **multi-tenant SaaS application** built with Next.js 15, shadcn/ui, and Logto for authentication and organization-based identity management. This project serves as a foundation for building production-ready organization-aware platform applications with **comprehensive E2E testing** and **Claude Code AI integration**.

## 🚀 Features

- **🔐 Multi-tenant Authentication**: Logto-based organization management with role-based access control
- **🎨 Modern UI**: shadcn/ui components with New York style and Tailwind CSS v4
- **📱 Responsive Design**: Universal app bar with desktop sidebar and mobile bottom navigation
- **🧪 Comprehensive Testing**: 20+ E2E tests covering full user lifecycle
- **🤖 AI Integration**: Claude Code GitHub Actions for automated code assistance
- **⚡ Performance**: Next.js 15 with Turbopack for fast development and builds

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router and Turbopack
- **UI**: shadcn/ui (New York style) with Radix UI primitives
- **Authentication**: Logto with organization-based multi-tenancy
- **Styling**: Tailwind CSS v4 with CSS variables
- **Testing**: Playwright E2E tests with comprehensive coverage
- **AI**: Claude Code integration for development assistance

### App Structure
The platform follows a universal app pattern with four main sections:
- **📥 Inbox** (`/inbox`) - Communication and notification hub
- **📚 Library** (`/library`) - Template and asset management
- **🏪 Catalog** (`/catalog`) - App marketplace and discovery
- **👤 Profile** (`/profile`) - User and organization management

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- pnpm (package manager)
- Logto instance (or use provided demo)

### Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd net-ecosystem-platform-max

# Install dependencies
pnpm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:6789`

### Available Commands

```bash
# Development
npm run dev          # Start dev server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Testing
npm run test:e2e     # Run comprehensive E2E tests
npm run test:e2e:ui  # Run E2E tests with UI

# Utilities
npm run cleanup:users # Clean up test users from Logto
```

## 🧪 Testing

### E2E Test Coverage (20/23 tests passing)

The project includes comprehensive end-to-end tests covering:

✅ **Authentication & Authorization**
- Demo user login flow
- Organization-based permissions
- Ecosystem app access validation

✅ **User Lifecycle Management**  
- Profile management and settings
- Delete account workflow with confirmations
- Organization switching and management

✅ **API Integration Testing**
- Organization APIs (check, list, permissions)
- Ecosystem app permission validation  
- Real Logto instance integration

✅ **UI Component Validation**
- Form interactions and validation
- Navigation and responsive design
- Dialog and confirmation workflows

### Test Configuration
- **Single Browser**: Chromium headless mode for efficiency
- **Video Recording**: Captures failures for debugging
- **Real Integration**: Tests against live Logto instance
- **Cleanup Mechanisms**: Prevents orphaned test data

## 🔐 Authentication Setup

The project uses **Logto** for multi-tenant authentication. Configuration is handled via environment variables:

```env
# Logto Configuration
LOGTO_ENDPOINT=https://your-logto-instance.logto.app/
LOGTO_APP_ID=your_spa_app_id
LOGTO_APP_SECRET=your_spa_secret
LOGTO_M2M_APP_ID=your_m2m_app_id  
LOGTO_M2M_APP_SECRET=your_m2m_secret
LOGTO_MANAGEMENT_API_RESOURCE=your_management_api_url

# Demo User (for testing)
LOGTO_DEMO_USERNAME=user
LOGTO_DEMO_PASSWORD=RtIoJ1Mc
```

## 🤖 Claude Code Integration

This project includes **GitHub Actions integration** with Claude Code for AI-powered development assistance:

### Features
- **@claude Mentions**: AI assistance on issues and PRs
- **Automated Issue Triage**: Smart labeling of new issues
- **PR Review Assistance**: AI-powered code review suggestions  
- **E2E Test Integration**: Automated testing on pull requests

### Setup
1. Add `ANTHROPIC_API_KEY` to repository secrets
2. Install the Claude GitHub app on your repository
3. GitHub Actions will automatically handle AI integration

### Usage
- Mention `@claude` in issues or PR comments for assistance
- Claude will automatically triage new issues
- PR reviews include AI-powered suggestions
- E2E tests run automatically on pull requests

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (organizations, users, etc.)
│   ├── profile/           # Profile management pages
│   ├── onboarding/        # User onboarding flow
│   └── layout.tsx         # Root layout with navigation
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components  
│   ├── forms/            # Form components with validation
│   └── universal-app-bar.tsx # Main navigation
├── lib/                  # Utilities and shared logic
├── tests/e2e/            # End-to-end tests
├── .github/workflows/    # GitHub Actions (Claude Code integration)
└── docs/                 # Documentation and guides
```

## 🌐 Multi-tenant Architecture

### Organization-based Tenancy
- Users belong to organizations with role-based access
- Organization-scoped authentication tokens
- Permission-based routing and feature access
- Tenant data isolation at the organization level

### Authentication Patterns
- Logto hosted sign-in experience (no custom login pages)
- `getOrganizationToken(organizationId)` for org-scoped API calls
- JWT audience format: `"urn:logto:organization:{orgId}"`
- Separate user-level vs organization-level authentication

## 📖 Documentation

Detailed documentation is available in the `docs/` directory:
- **Foundation Setup**: Project initialization and dependencies
- **Logto Integration**: Authentication setup and configuration  
- **Production Features**: Advanced features and optimization
- **Deployment**: Production deployment patterns

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** (Claude Code will assist with reviews)
4. **Run tests**: `npm run test:e2e`
5. **Commit changes**: `git commit -m 'feat: add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request** (mention `@claude` for AI assistance)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Anthropic Claude Code** - AI-powered development assistance
- **Logto** - Authentication and identity management
- **shadcn/ui** - Beautiful and accessible UI components
- **Next.js Team** - Amazing React framework
- **Playwright** - Reliable end-to-end testing

---

**Built with ❤️ and 🤖 AI assistance from Claude Code**
