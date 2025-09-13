'use server'

import { signIn, signOut, getLogtoContext } from '@logto/next/server-actions'
import { logtoConfig } from './logto-config'

export async function handleSignIn() {
  await signIn(logtoConfig)
}

export async function handleSignOut() {
  await signOut(logtoConfig)
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