# Social Provider Configuration Guide
# Issue #10 - Stream B: Authentication & Sign-in Experience

## Overview
This document provides step-by-step instructions for configuring Google, GitHub, and Microsoft OAuth providers for the Net Ecosystem Platform.

## Google OAuth Configuration

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client IDs**

### 2. OAuth Consent Screen
Configure the OAuth consent screen:
- **User Type**: External
- **Application Name**: Net Ecosystem Platform
- **User Support Email**: Your admin email
- **Developer Contact**: Your admin email
- **Authorized Domains**: Add `logto.app` and your domain

### 3. OAuth Client Configuration
Create OAuth 2.0 Client ID:
- **Application Type**: Web application
- **Name**: Net Ecosystem Platform
- **Authorized JavaScript Origins**:
  ```
  https://z3zlta.logto.app
  ```
- **Authorized Redirect URIs**:
  ```
  https://z3zlta.logto.app/callback/google
  ```

### 4. Logto Configuration
In Logto Admin Console:
1. Navigate to **Sign-in Experience** → **Social**
2. Click **Add Social Connector**
3. Select **Google**
4. Configure:
   ```json
   {
     "clientId": "YOUR_GOOGLE_CLIENT_ID",
     "clientSecret": "YOUR_GOOGLE_CLIENT_SECRET",
     "scope": "openid profile email"
   }
   ```

## GitHub OAuth Configuration

### 1. GitHub Developer Settings

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**

### 2. OAuth App Configuration
- **Application Name**: Net Ecosystem Platform
- **Homepage URL**: `http://localhost:6789` (for development)
- **Application Description**: Multi-tenant SaaS platform with organization management
- **Authorization Callback URL**: 
  ```
  https://z3zlta.logto.app/callback/github
  ```

### 3. Logto Configuration
In Logto Admin Console:
1. Navigate to **Sign-in Experience** → **Social**
2. Click **Add Social Connector**
3. Select **GitHub**
4. Configure:
   ```json
   {
     "clientId": "YOUR_GITHUB_CLIENT_ID",
     "clientSecret": "YOUR_GITHUB_CLIENT_SECRET",
     "scope": "user:email"
   }
   ```

## Microsoft OAuth Configuration (Optional)

### 1. Azure Active Directory Setup

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** → **App Registrations**
3. Click **New Registration**

### 2. App Registration Configuration
- **Name**: Net Ecosystem Platform
- **Supported Account Types**: Accounts in any organizational directory and personal Microsoft accounts
- **Redirect URI**: 
  - Type: Web
  - URI: `https://z3zlta.logto.app/callback/azuread`

### 3. Authentication Configuration
Under **Authentication**:
- **Platform Type**: Web
- **Redirect URIs**: `https://z3zlta.logto.app/callback/azuread`
- **Logout URL**: `http://localhost:6789`
- **Implicit Grant**: Enable ID tokens

### 4. API Permissions
Add the following Microsoft Graph permissions:
- `openid`
- `profile`
- `email`
- `User.Read`

### 5. Create Client Secret
1. Go to **Certificates & Secrets**
2. Click **New Client Secret**
3. Add description and expiration
4. Copy the secret value (only shown once)

### 6. Logto Configuration
In Logto Admin Console:
1. Navigate to **Sign-in Experience** → **Social**
2. Click **Add Social Connector**
3. Select **Microsoft**
4. Configure:
   ```json
   {
     "clientId": "YOUR_AZURE_CLIENT_ID",
     "clientSecret": "YOUR_AZURE_CLIENT_SECRET",
     "scope": "openid profile email",
     "tenantId": "common"
   }
   ```

## Environment Variables

Add the following to your `.env.local`:

```bash
# Social Provider Configuration (Optional - managed in Logto)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

AZURE_CLIENT_ID=your_azure_client_id
AZURE_CLIENT_SECRET=your_azure_client_secret
```

## Testing Social Providers

### 1. Development Testing
1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:6789`
3. Click sign-in and test each social provider
4. Verify user data is correctly synced

### 2. Validation Checklist
- [ ] Google OAuth redirects properly
- [ ] GitHub OAuth redirects properly  
- [ ] Microsoft OAuth redirects properly (if configured)
- [ ] User profile data is synced (name, email, avatar)
- [ ] First-time users are properly registered
- [ ] Returning users are properly authenticated
- [ ] Organization invitation flow works with social providers

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**:
   - Ensure callback URLs match exactly in provider consoles
   - Check for trailing slashes or protocol mismatches

2. **Scope Issues**:
   - Verify required scopes are configured
   - Check consent screen configuration

3. **Client Secret Issues**:
   - Ensure secrets are not expired
   - Verify secrets are correctly copied

4. **CORS Issues**:
   - Verify authorized origins in provider consoles
   - Check Logto CORS configuration

### Debug Steps

1. **Check Logto Logs**:
   - Enable debug logging in Logto admin console
   - Monitor callback endpoints

2. **Browser Developer Tools**:
   - Check network requests during OAuth flow
   - Verify redirect parameters

3. **Provider Console Logs**:
   - Check OAuth app logs in provider consoles
   - Verify request counts and error rates

## Security Best Practices

1. **Client Secret Management**:
   - Store secrets securely (never in code)
   - Rotate secrets regularly
   - Use different secrets for dev/prod

2. **Redirect URI Security**:
   - Use exact matches (no wildcards)
   - Use HTTPS in production
   - Validate all redirect URIs

3. **Scope Minimization**:
   - Only request necessary permissions
   - Document why each scope is needed
   - Review scopes regularly

4. **OAuth State Parameter**:
   - Logto handles state parameter automatically
   - Verify state validation is enabled

## Production Considerations

1. **Domain Configuration**:
   - Update redirect URIs for production domains
   - Configure proper CORS origins
   - Use production-grade secrets

2. **Rate Limiting**:
   - Monitor API usage against provider limits
   - Implement proper error handling for rate limits

3. **User Experience**:
   - Customize consent screens with your branding
   - Provide clear privacy policy links
   - Handle provider-specific errors gracefully

This configuration enables secure and reliable social authentication for the Net Ecosystem Platform with proper error handling and user experience.