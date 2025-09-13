import { UserInfoResponse } from '@logto/next'

export interface LogtoUser extends UserInfoResponse {
  id: string
  username?: string
  email?: string
  name?: string
  picture?: string
}