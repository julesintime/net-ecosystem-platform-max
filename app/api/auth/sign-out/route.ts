import { signOut } from '@logto/next/server-actions'
import { logtoConfig } from '@/lib/auth/logto-config'

export async function GET() {
  return await signOut(logtoConfig)
}