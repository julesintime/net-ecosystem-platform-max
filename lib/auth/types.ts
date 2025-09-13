import { UserInfoResponse } from '@logto/next'

export interface LogtoUser extends UserInfoResponse {
  id: string
  username?: string
  email?: string
  name?: string
  picture?: string
}

export interface AuthContextType {
  user: LogtoUser | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: () => void
  signOut: () => void
}

export interface LogtoConfig {
  endpoint: string
  appId: string
  appSecret: string
  baseUrl: string
  cookieSecret: string
  resources?: string[]
  scopes?: string[]
}