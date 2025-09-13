'use server'

import { signIn, signOut, getLogtoContext } from '@logto/next/server-actions'
import { logtoConfig } from './logto-config'
import { redirect } from 'next/navigation'

export async function handleSignIn() {
  await signIn(logtoConfig, {
    redirectUri: `${process.env.LOGTO_BASE_URL}/api/logto/callback`
  })
}

export async function handleSignOut() {
  await signOut(logtoConfig, process.env.LOGTO_BASE_URL || 'http://localhost:6789')
}

export async function getAuthContext() {
  try {
    const context = await getLogtoContext(logtoConfig)
    return {
      isAuthenticated: context.isAuthenticated,
      claims: context.claims
    }
  } catch (error) {
    console.error('Error getting auth context:', error)
    return {
      isAuthenticated: false,
      claims: null
    }
  }
}