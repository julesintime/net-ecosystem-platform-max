import { UserInfoResponse, IdTokenClaims } from '@logto/next'

export interface LogtoUser extends UserInfoResponse {
  id: string
  username?: string
  email?: string
  name?: string
  picture?: string
}

export interface AuthContext {
  isAuthenticated: boolean
  claims: IdTokenClaims | null
}

export interface AuthButtonProps {
  onSignIn?: () => Promise<void>
  onSignOut?: () => Promise<void>
}