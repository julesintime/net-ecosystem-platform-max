import { handleSignIn } from '@logto/next/server-actions'
import { logtoConfig } from '@/lib/auth/logto-config'

export const GET = handleSignIn(logtoConfig)