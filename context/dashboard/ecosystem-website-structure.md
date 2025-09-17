# Xuperson Website Structure
## AI-Native Developer Enabler Platform

### Domain Architecture (Explore → Educate → Emerge)

#### xuperson.org (Institute/Landing - Explore Layer)
```
xuperson.org/
├── Hero: XPS manifesto
├── CTA: newsletter & sign up
├── Logo cloud
├── Change log
└── Subdomains:
    ├── lab.xuperson.org (Org-Lab)
    │   └── Directory
    ├── scholar.xuperson.org (Org-Scholar - Academic)
    │   ├── Landing bento
    │   ├── Profile dropdown
    │   ├── Institutional and Organizational Economics
    │   │   ├── Sidebar: WTP
    │   │   └── Sidebar: PDMS
    │   ├── International Entrepreneurship
    │   │   ├── EE
    │   │   └── CAISE
    │   └── Generative Agent Based Modeling & Simulation
    │       └── PHENON
    └── blog.xuperson.org (Org-Blog - Review)
        ├── Landing: masonry layout / email client
        ├── Julesintime
        │   ├── Philosophy
        │   ├── Photography
        │   └── Programming
        ├── Management
        └── Aiconomics
```

#### xuperson.net (Platform - Educate Layer)
```
xuperson.net/
├── Platform services (root domain)
├── {org}.xuperson.net/ (Organization workspaces)
│   ├── /dashboard (unified platform interface)
│   ├── /catalog (app marketplace)
│   ├── /library (template marketplace)
│   ├── /billing (usage-based & subscription billing)
│   ├── /settings (platform configuration)
│   └── /coaching (AI mentoring sessions)
└── {app}.{org}.xuperson.net/ (App testbed environment)
```

#### xuperson.com (Commercial - Emerge Layer)
```
xuperson.com/
├── Hero: 10% & 10x - our formulas hire CAO
├── Logo cloud
├── Feature
├── Pricing - Solo/Mini/Para
├── Testimonial
├── Footer
├── Portfolio
│   ├── Directory of formulas
│   └── Directory of cases
└── {app-name}.xuperson.com/ (Production app hosting)
```

### Content Organization Framework

#### Books/Tutorial Platform (xuperson.org)
- **AINE** (AI-Native Ecosystem)
- **ESX** (Ecosystem Extensions)

#### Development Tracks
##### Personal Development
- Individual focus
- Expertise development

##### Business Development  
- Organizational focus
- Social development

##### Methodology
- Design → Develop → Deploy
- RAI Institute: Explore → Educate → Emerge

### Multi-Language Support
#### Chinese Market Integration
- **初海方程式** (First Ocean Formula)
- **精益极简出海** (Lean Minimal Going Global)
- **云爱长 CAO** (Cloud Artificial Officer)

### Technical Implementation

#### Domain Routing (Next.js Middleware)
```typescript
// Based on Vercel/platforms model
- xuperson.org: Research hub, documentation
- {project}.xuperson.org: Project-specific sites
- xuperson.net: Platform services 
- {org}.xuperson.net: Organization workspaces
- {app}.{org}.xuperson.net: App testbeds
- xuperson.com: Marketing, incubator
- {app}.xuperson.com: Production apps
```

#### Core Platform Features
- **Template Marketplace**: Claude Artifacts-style deployment
- **Integration Marketplace**: 20+ services with wholesale billing
- **AI Coaching System**: Audio/video/text mentoring
- **Subscription Plans**: Starter/Pro/Enterprise tiers
- **OAuth-First Architecture**: Centralized identity management

#### Authentication & Access Control
- **Logto Implementation**: RBAC with role activation
- **Cross-subdomain Sessions**: `.xuperson.net` cookie domain
- **Permission-based Routing**: Dynamic access control
- **M2M Integration**: Automated role management

### Deployment Strategy
1. **Phase 1**: Core platform (xuperson.net)
2. **Phase 2**: Integration marketplace  
3. **Phase 3**: AI coaching & billing
4. **Phase 4**: Scale & enterprise features

### Key Differentiators
- AI-native development environment
- Usage-based coaching with human mentors
- Seamless template-to-production pipeline
- Wholesale integration billing model
- Multi-domain brand architecture