import { LogtoNextConfig, UserScope } from '@logto/next'

export const logtoConfig: LogtoNextConfig = {
  endpoint: process.env.LOGTO_ENDPOINT!,
  appId: process.env.LOGTO_APP_ID!,
  appSecret: process.env.LOGTO_APP_SECRET!,
  baseUrl: process.env.LOGTO_BASE_URL!,
  cookieSecret: process.env.LOGTO_COOKIE_SECRET!,
  cookieSecure: process.env.NODE_ENV === 'production',
  resources: [
    process.env.LOGTO_MANAGEMENT_API_RESOURCE!
  ],
  scopes: [
    UserScope.Email,
    UserScope.Profile,
    UserScope.Organizations
  ]
}

// Validate required environment variables
export function validateLogtoConfig() {
  const requiredEnvVars = [
    'LOGTO_ENDPOINT',
    'LOGTO_APP_ID', 
    'LOGTO_APP_SECRET',
    'LOGTO_BASE_URL',
    'LOGTO_COOKIE_SECRET',
    'NEXT_PUBLIC_LOGTO_ENDPOINT'
  ]

  const missing = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}