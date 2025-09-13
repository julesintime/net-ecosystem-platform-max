# Email Authentication & Branding Configuration
# Issue #10 - Stream B: Authentication & Sign-in Experience

## Email/Password Authentication Configuration

### 1. Sign-up and Sign-in Settings

In Logto Admin Console → **Sign-in Experience** → **General**:

#### Sign-in Methods
- **Username**: Disabled
- **Email**: Enabled (primary identifier)
- **Phone**: Disabled
- **Social Sign-in**: Enabled

#### Sign-up Settings
- **Enable Sign-up**: Yes
- **Email Verification Required**: Yes
- **Terms of Service**: Optional (add link if available)
- **Privacy Policy**: Optional (add link if available)

### 2. Password Policy Configuration

Navigate to **Sign-in Experience** → **Password**:

#### Password Requirements
```json
{
  "policy": {
    "length": {
      "min": 8,
      "max": 128
    },
    "characterTypes": {
      "min": 3
    },
    "rejects": {
      "pwned": true,
      "repetitiveOrSequentialCharacters": true,
      "userInfo": true
    }
  },
  "requirementDescription": "Password must be at least 8 characters long and contain at least 3 of the following: uppercase letters, lowercase letters, numbers, and special characters."
}
```

#### Password Strength Indicator
- **Show Password Strength**: Yes
- **Real-time Validation**: Yes
- **Minimum Strength**: Medium

### 3. Email Verification Configuration

Navigate to **Sign-in Experience** → **Email Verification**:

#### Verification Settings
- **Method**: Email Link (recommended for better UX)
- **Alternative Method**: Verification Code (6-digit)
- **Link Expiration**: 24 hours
- **Code Expiration**: 10 minutes
- **Maximum Attempts**: 5

#### Email Template Configuration
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - Net Ecosystem Platform</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 1px solid #eee;
            padding-bottom: 20px;
        }
        .logo {
            width: 60px;
            height: 60px;
            background: #000;
            border-radius: 12px;
            margin: 0 auto 16px;
        }
        .button {
            display: inline-block;
            background: #000;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 500;
            margin: 20px 0;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo"></div>
        <h1>Net Ecosystem Platform</h1>
    </div>
    
    <h2>Verify your email address</h2>
    
    <p>Hi there,</p>
    
    <p>Thanks for signing up for the Net Ecosystem Platform! To complete your registration, please verify your email address by clicking the button below:</p>
    
    <div style="text-align: center;">
        <a href="{{verification_link}}" class="button">Verify Email Address</a>
    </div>
    
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #666;">{{verification_link}}</p>
    
    <p>This link will expire in 24 hours for security reasons.</p>
    
    <p>If you didn't create an account with us, you can safely ignore this email.</p>
    
    <div class="footer">
        <p>Best regards,<br>The Net Ecosystem Platform Team</p>
        <p style="font-size: 12px;">This is an automated message, please do not reply to this email.</p>
    </div>
</body>
</html>
```

## Sign-in Experience Branding

### 1. Brand Configuration

Navigate to **Sign-in Experience** → **Branding**:

#### Brand Identity
```json
{
  "applicationName": "Net Ecosystem Platform",
  "displayName": "Ecosystem Platform",
  "logoUrl": "", 
  "darkLogoUrl": "",
  "faviconUrl": "",
  "termsOfUseUrl": "",
  "privacyPolicyUrl": ""
}
```

#### Color Scheme
```json
{
  "primaryColor": "#000000",
  "isDarkModeEnabled": true,
  "darkPrimaryColor": "#ffffff"
}
```

### 2. Custom CSS Styling

Add custom CSS for enhanced branding:

```css
/* Root Variables */
:root {
  --primary-color: #000000;
  --primary-hover: #333333;
  --border-radius: 8px;
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}

/* Container Styling */
.logto-container {
  font-family: var(--font-family);
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
}

/* Header Styling */
.logto-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logto-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #000;
  margin-bottom: 0.5rem;
}

.logto-header p {
  color: #666;
  font-size: 0.9rem;
}

/* Form Styling */
.logto-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Input Styling */
.logto-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: var(--border-radius);
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.logto-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
}

/* Button Styling */
.logto-button {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.logto-button:hover {
  background: var(--primary-hover);
}

.logto-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Social Button Styling */
.logto-social-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: var(--border-radius);
  background: white;
  color: #333;
  text-decoration: none;
  font-weight: 500;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.logto-social-button:hover {
  border-color: #ccc;
  background: #f9f9f9;
}

/* Error Styling */
.logto-error {
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

/* Success Styling */
.logto-success {
  color: #059669;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

/* Link Styling */
.logto-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
}

.logto-link:hover {
  text-decoration: underline;
}

/* Responsive Design */
@media (max-width: 480px) {
  .logto-container {
    padding: 1rem;
  }
  
  .logto-header h1 {
    font-size: 1.25rem;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .logto-container {
    background: #1a1a1a;
    color: #ffffff;
  }
  
  .logto-header h1 {
    color: #ffffff;
  }
  
  .logto-input {
    background: #2d2d2d;
    border-color: #404040;
    color: #ffffff;
  }
  
  .logto-input:focus {
    border-color: #ffffff;
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
  }
  
  .logto-social-button {
    background: #2d2d2d;
    border-color: #404040;
    color: #ffffff;
  }
  
  .logto-social-button:hover {
    border-color: #606060;
    background: #3d3d3d;
  }
}
```

### 3. Language and Localization

Navigate to **Sign-in Experience** → **Languages**:

#### Language Settings
- **Auto-detect Language**: Enabled
- **Fallback Language**: English (en)
- **Supported Languages**: English, Spanish, French (customize as needed)

#### Custom Text Content
```json
{
  "signIn": {
    "title": "Welcome back",
    "subtitle": "Sign in to your Ecosystem Platform account",
    "emailPlaceholder": "Enter your email address",
    "passwordPlaceholder": "Enter your password",
    "signInButton": "Sign In",
    "forgotPassword": "Forgot your password?",
    "noAccount": "Don't have an account?",
    "signUpLink": "Sign up here"
  },
  "signUp": {
    "title": "Create your account",
    "subtitle": "Join the Net Ecosystem Platform today",
    "emailPlaceholder": "Enter your email address",
    "passwordPlaceholder": "Create a secure password",
    "confirmPasswordPlaceholder": "Confirm your password",
    "signUpButton": "Create Account",
    "hasAccount": "Already have an account?",
    "signInLink": "Sign in here",
    "termsText": "By creating an account, you agree to our Terms of Service and Privacy Policy"
  }
}
```

## Organization Invitation Templates

### 1. Invitation Email Template

Configure organization invitation email in **Organizations** → **Invitation Templates**:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Organization Invitation - Net Ecosystem Platform</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 1px solid #eee;
            padding-bottom: 20px;
        }
        .logo {
            width: 60px;
            height: 60px;
            background: #000;
            border-radius: 12px;
            margin: 0 auto 16px;
        }
        .invitation-card {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
            border-left: 4px solid #000;
        }
        .button {
            display: inline-block;
            background: #000;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 500;
            margin: 20px 0;
        }
        .role-badge {
            background: #e5e7eb;
            color: #374151;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo"></div>
        <h1>Net Ecosystem Platform</h1>
    </div>
    
    <h2>You're invited to join {{organization_name}}</h2>
    
    <p>Hi there,</p>
    
    <p><strong>{{inviter_name}}</strong> has invited you to join <strong>{{organization_name}}</strong> on the Net Ecosystem Platform.</p>
    
    <div class="invitation-card">
        <h3>Invitation Details</h3>
        <p><strong>Organization:</strong> {{organization_name}}</p>
        <p><strong>Invited by:</strong> {{inviter_name}} ({{inviter_email}})</p>
        <p><strong>Your Role:</strong> <span class="role-badge">{{role_name}}</span></p>
        <p><strong>Expires:</strong> {{expiration_date}}</p>
    </div>
    
    <div style="text-align: center;">
        <a href="{{invitation_link}}" class="button">Accept Invitation</a>
    </div>
    
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #666;">{{invitation_link}}</p>
    
    <p><strong>What's Next?</strong></p>
    <ul>
        <li>Click the invitation link above</li>
        <li>Create your account or sign in if you already have one</li>
        <li>Start collaborating with your team on the platform</li>
    </ul>
    
    <p>This invitation will expire in 7 days for security reasons.</p>
    
    <p>If you have any questions, please contact {{inviter_name}} directly or reach out to our support team.</p>
    
    <div class="footer">
        <p>Best regards,<br>The Net Ecosystem Platform Team</p>
        <p style="font-size: 12px;">If you don't want to receive these invitations, please contact the organization administrator.</p>
    </div>
</body>
</html>
```

### 2. Welcome Message Template

Template for new organization members after accepting invitation:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to {{organization_name}} - Net Ecosystem Platform</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .welcome-card {
            background: linear-gradient(135deg, #000 0%, #333 100%);
            color: white;
            border-radius: 12px;
            padding: 32px;
            margin: 24px 0;
            text-align: center;
        }
        .button {
            display: inline-block;
            background: white;
            color: #000;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 500;
            margin: 20px 0;
        }
        .feature-list {
            display: grid;
            gap: 16px;
            margin: 24px 0;
        }
        .feature-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px;
            background: #f8f9fa;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 Welcome to the team!</h1>
    </div>
    
    <div class="welcome-card">
        <h2>Welcome to {{organization_name}}</h2>
        <p>You're now a member of the organization with {{role_name}} permissions.</p>
    </div>
    
    <p>Hi {{user_name}},</p>
    
    <p>Congratulations! You've successfully joined <strong>{{organization_name}}</strong> on the Net Ecosystem Platform.</p>
    
    <div style="text-align: center;">
        <a href="{{dashboard_link}}" class="button">Go to Dashboard</a>
    </div>
    
    <h3>What you can do now:</h3>
    
    <div class="feature-list">
        <div class="feature-item">
            <span>💬</span>
            <div>
                <strong>Inbox:</strong> Communicate with your team members and manage notifications
            </div>
        </div>
        <div class="feature-item">
            <span>📚</span>
            <div>
                <strong>Library:</strong> Access and manage templates, assets, and resources
            </div>
        </div>
        <div class="feature-item">
            <span>🏪</span>
            <div>
                <strong>Catalog:</strong> Browse and install applications from the marketplace
            </div>
        </div>
        <div class="feature-item">
            <span>👤</span>
            <div>
                <strong>Profile:</strong> Manage your profile and organization settings
            </div>
        </div>
    </div>
    
    <p>Need help getting started? Check out our <a href="{{help_center_link}}">Help Center</a> or contact your organization administrator.</p>
    
    <p>Happy collaborating!</p>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666;">
        <p>Best regards,<br>The Net Ecosystem Platform Team</p>
    </div>
</body>
</html>
```

## Testing Checklist

After implementing these configurations:

- [ ] Test email/password registration flow
- [ ] Verify email verification works
- [ ] Test password policy enforcement
- [ ] Validate sign-in page branding appears correctly
- [ ] Test social provider integration
- [ ] Verify organization invitation emails are sent
- [ ] Test invitation acceptance flow
- [ ] Validate welcome emails for new members
- [ ] Check responsive design on mobile devices
- [ ] Test dark mode support
- [ ] Verify all email templates render correctly

This comprehensive configuration ensures a professional, secure, and user-friendly authentication experience for the Net Ecosystem Platform.