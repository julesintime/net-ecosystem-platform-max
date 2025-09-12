## FEATURE:

- A general landing page leads user to sign-in
- Redirect to Logto Sign-in experience to sign in or sign up
- After successful authentication, redirect user to onboarding process (create organization) or their dashboard
- Use Logto builtin organization functions
- Organization switcher in dashboard
- Use Logto builtin "Third-party App" functionality to create "Sign in with Logto" apps
- User can manage (list/revoke) their authorized apps in dashboard

## EXAMPLES:

In the examples/ folder, there is a `multi-tenant-saas-sample/` for you to understand what the how to integrate Logto in our use scenario.

## DOCUMENTATION:

- Logto documentation: https://deepwiki.com/logto-io/logto
- Must read use case:
    - Set up development environment: https://docs.logto.io/introduction/set-up-logto-oss
    - Step by step tutorial must follow: https://docs.logto.io/use-cases/multi-tenancy/build-multi-tenant-saas-application
    - Step by step quickstart for our tech stack: https://docs.logto.io/quick-starts/next-app-router
    - Set up M2M service account API token to entirely manipulate backend programmatically: https://docs.logto.io/integrate-logto/interact-with-management-api
    - Backend Management API: https://openapi.logto.io/
    - Architecture: https://docs.logto.io/introduction/plan-your-architecture/b2b
    - https://docs.logto.io/authorization/role-based-access-control
    - https://docs.logto.io/authorization/organization-template
    - How does `organization` works in Logto
    - https://docs.logto.io/organizations/understand-how-organizations-work
    - https://docs.logto.io/organizations/organization-management
    - https://docs.logto.io/organizations/just-in-time-provisioning
    - Understand `Third-party app` as OAuth/OIDC for `Sign in with Logto`: https://docs.logto.io/integrate-logto/third-party-applications
    - Logto specific API protection concept: https://docs.logto.io/integrate-logto/protected-app

## OTHER CONSIDERATIONS:

**NO NEED** database at this moment! 