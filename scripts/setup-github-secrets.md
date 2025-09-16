# GitHub Repository Secrets Setup

To enable Claude Code integration and E2E testing, you need to add the following secrets to your GitHub repository:

## Required Secrets

### Claude Code Integration
```bash
# Add your Anthropic API key for Claude Code
gh secret set ANTHROPIC_API_KEY --body "your-anthropic-api-key"
```

### Logto Authentication (for E2E tests)
```bash
# Demo user credentials
gh secret set LOGTO_DEMO_USERNAME --body "user"
gh secret set LOGTO_DEMO_PASSWORD --body "RtIoJ1Mc"

# Logto configuration
gh secret set LOGTO_ENDPOINT --body "https://z3zlta.logto.app/"
gh secret set LOGTO_APP_ID --body "m07bzoq8ltp8fswv7m2y8"
gh secret set LOGTO_APP_SECRET --body "your-spa-app-secret"
gh secret set LOGTO_M2M_APP_ID --body "wcjwd10m66h51xsqn8e69"
gh secret set LOGTO_M2M_APP_SECRET --body "your-m2m-app-secret"
gh secret set LOGTO_MANAGEMENT_API_RESOURCE --body "https://z3zlta.logto.app/api"
```

## Quick Setup Script

Copy and run this script after replacing the placeholder values:

```bash
#!/bin/bash

# Replace these values with your actual credentials
ANTHROPIC_API_KEY="your-anthropic-api-key-here"
LOGTO_APP_SECRET="your-spa-app-secret-here"
LOGTO_M2M_APP_SECRET="your-m2m-app-secret-here"

# Claude Code Integration
gh secret set ANTHROPIC_API_KEY --body "$ANTHROPIC_API_KEY"

# Demo User Credentials
gh secret set LOGTO_DEMO_USERNAME --body "user"
gh secret set LOGTO_DEMO_PASSWORD --body "RtIoJ1Mc"

# Logto Configuration
gh secret set LOGTO_ENDPOINT --body "https://z3zlta.logto.app/"
gh secret set LOGTO_APP_ID --body "m07bzoq8ltp8fswv7m2y8"
gh secret set LOGTO_APP_SECRET --body "$LOGTO_APP_SECRET"
gh secret set LOGTO_M2M_APP_ID --body "wcjwd10m66h51xsqn8e69"
gh secret set LOGTO_M2M_APP_SECRET --body "$LOGTO_M2M_APP_SECRET"
gh secret set LOGTO_MANAGEMENT_API_RESOURCE --body "https://z3zlta.logto.app/api"

echo "✅ All secrets have been configured!"
echo "🤖 Claude Code integration is ready"
echo "🧪 E2E tests will run on pull requests"
```

## Verify Setup

After adding secrets, create a test PR or mention `@claude` in an issue to verify the integration works!

## Claude GitHub App Installation

Don't forget to:
1. Install the Claude GitHub App on your repository
2. Grant necessary permissions for issue and PR management
3. Test the integration by mentioning `@claude` in an issue

## Notes

- The demo Logto instance (`z3zlta.logto.app`) is provided for testing
- E2E tests will automatically run on pull requests
- Claude will provide AI assistance on issues and PRs
- All secrets are encrypted and only available to GitHub Actions