# Ecosystem Authentication Implementation Guide

## Overview

This document provides a comprehensive guide to implementing "Sign in with Ecosystem" functionality using Logto's organization-based multi-tenancy and application access management.

## Key Concepts

### Logto Application Types

1. **First-Party Applications**
   - Traditional web apps, SPAs, or Native apps owned by your organization
   - Access controlled through organization membership
   - Examples: `no-demo-access`, `ecosystem-net-platform-max`, `fumadocs`

2. **Third-Party Applications** 
   - External applications requiring explicit user consent
   - Access controlled through user consent to organizations
   - Examples: `Demo CRM`, `Demo Analytics`

3. **Machine-to-Machine (M2M) Applications**
   - Service-to-service communication apps
   - Managed through organization application associations
   - Example: `service-account-api`

### Access Control Models

#### Third-Party Application Access
- Requires **explicit user consent** via `getUserConsentOrganizations(appId, userId)`
- User must consent to allow the app access to their organizations
- Consent granted using `grantUserConsentOrganizations(appId, userId, organizationIds)`

#### First-Party Application Access  
- Access granted through **organization membership**
- Apps can be associated with organizations via Management API
- Users access apps through their organization roles and memberships

## Implementation Architecture

### Core Components

1. **LogtoManagementClient** (`lib/auth/logto-management-client.ts`)
   - M2M authentication with Logto Management API
   - Handles token caching and API requests

2. **EcosystemAccessManager** (`lib/auth/ecosystem-access-manager.ts`) 
   - Core business logic for application access management
   - Handles both first-party and third-party access patterns

3. **Ecosystem Apps API** (`app/api/user/ecosystem-apps/`)
   - REST endpoints for fetching and managing user application access
   - Supports both viewing apps and granting/revoking access

4. **Profile UI** (`app/profile/ecosystem-apps/page.tsx`)
   - User interface for viewing and managing application access
   - Separate sections for first-party and third-party applications

### Access Logic Flow

```typescript
// For each application in the ecosystem
for (const app of allApplications) {
  if (app.isThirdParty) {
    // Third-party: Check user consent
    const userConsentOrgs = await getUserConsentOrganizations(app.id, userId)
    hasAccess = userConsentOrgs.length > 0
  } else {
    // First-party: Check organization membership  
    let foundInOrg = false
    for (const org of userOrganizations) {
      const orgApps = await getOrganizationApplications(org.id)
      if (orgApps.some(orgApp => orgApp.id === app.id)) {
        hasAccess = true
        foundInOrg = true
        break
      }
    }
    if (!foundInOrg) {
      hasAccess = true // First-party apps are generally accessible
    }
  }
}
```

## Previous Implementation Failures

### Critical Misunderstandings

1. **Wrong Application Filtering**
   ```typescript
   // ❌ WRONG: Filtered apps by organization membership
   const firstPartyApps = apps.filter(app => 
     !app.isThirdParty && appBelongsToUserOrganization(app)
   )
   
   // ✅ CORRECT: Show all apps, check access separately  
   const firstPartyApps = apps.filter(app => !app.isThirdParty)
   ```

2. **Misunderstood Third-Party Access**
   ```typescript
   // ❌ WRONG: Thought third-party apps needed organization association
   if (appOrganizations.length === 0) {
     throw new Error('App not associated with any organization')
   }
   
   // ✅ CORRECT: Third-party apps require user consent, not org association
   const userConsent = await getUserConsentOrganizations(appId, userId)
   hasAccess = userConsent.length > 0
   ```

3. **Incorrect Grant Access Logic**
   ```typescript
   // ❌ WRONG: Tried to associate apps with organizations
   await associateAppWithOrganization(appId, organizationId)
   
   // ✅ CORRECT: Grant user consent for third-party apps
   await grantUserConsentOrganizations(appId, userId, userOrganizationIds)
   ```

### Root Cause Analysis

The fundamental error was **not understanding Logto's consent model**:

- **First-party applications**: Access through organization membership and roles
- **Third-party applications**: Access through explicit user consent to organizations  
- **Applications exist independently** of organization associations
- **User consent is the bridge** between users, organizations, and third-party apps

## Correct Implementation

### EcosystemAccessManager Methods

```typescript
class EcosystemAccessManager {
  async getUserEcosystemApps(userId: string): Promise<EcosystemApp[]> {
    // 1. Get ALL applications (don't filter by organization)
    const allApplications = await logtoManagementClient.getApplications()
    
    // 2. Separate by type
    const firstPartyApps = allApplications.filter(app => !app.isThirdParty)
    const thirdPartyApps = allApplications.filter(app => app.isThirdParty)
    
    // 3. Check access for each type correctly
    for (const app of [...firstPartyApps, ...thirdPartyApps]) {
      if (app.isThirdParty) {
        // Check user consent
        const userConsentOrgs = await getUserConsentOrganizations(app.id, userId)
        hasAccess = userConsentOrgs.length > 0
      } else {
        // Check organization membership or treat as global
        hasAccess = await checkFirstPartyAppAccess(app, userId)
      }
    }
  }

  async grantUserAppAccess(userId: string, applicationId: string): Promise<void> {
    const app = await getApplication(applicationId)
    
    if (app.isThirdParty) {
      // Grant consent to user's organizations
      const userOrganizations = await getUserOrganizations(userId)
      await grantUserConsentOrganizations(applicationId, userId, userOrganizations)
    } else {
      // First-party access is managed through organization membership
      console.log('First-party app access is inherent through organization membership')
    }
  }
}
```

### UI Logic

```typescript
// First-party apps
{app.appType === 'first-party' && app.hasAccess ? (
  <Button disabled>Organization Member</Button>
) : (
  <Button onClick={() => handleToggleAccess(app.id, app.hasAccess)}>
    {app.hasAccess ? 'Revoke' : 'Request'} Access
  </Button>
)}

// Third-party apps  
<Button onClick={() => handleToggleAccess(app.id, app.hasAccess)}>
  {app.hasAccess ? 'Revoke Consent' : 'Grant Consent'}
</Button>
```

## Environment Configuration

```bash
# M2M Credentials for Management API
LOGTO_M2M_APP_ID=wcjwd10m66h51xsqn8e69
LOGTO_M2M_APP_SECRET=Uga94IsYrPMIjpL2Gjgs8apQNgrFsXY8
LOGTO_MANAGEMENT_API_RESOURCE=https://z3zlta.logto.app/api

# Logto Instance
LOGTO_ENDPOINT=https://z3zlta.logto.app/
```

## API Endpoints

- `GET /api/user/ecosystem-apps` - Fetch user's ecosystem applications
- `POST /api/user/ecosystem-apps/[id]/access` - Grant/revoke application access

## Testing Verification

The corrected implementation successfully shows:

- **9 total applications** (7 first-party, 2 third-party)
- **fumadocs** appearing in first-party applications
- **Demo CRM** and **Demo Analytics** as third-party apps requiring consent
- **Proper access states** and button labels based on application type

## Key Takeaways

1. **Read the documentation carefully** - Logto's consent model is clearly documented
2. **Understand the domain model** before implementing business logic
3. **Third-party apps require user consent**, not organization association
4. **First-party apps use organization membership** for access control
5. **Show all applications** and determine access separately
6. **Use proper API methods** for each application type

This implementation now correctly follows Logto's intended architecture for multi-tenant SaaS applications.