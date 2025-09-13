"use client"

import { createContext } from 'react'
import { LogtoOrganization } from '@/lib/types/management-api'

export interface OrganizationContextData {
  // Current organization state
  currentOrganization: LogtoOrganization | null
  userOrganizations: LogtoOrganization[]
  isLoading: boolean
  error: string | null
  
  // Organization switching
  switchOrganization: (organizationId: string) => Promise<void>
  refreshOrganizations: () => Promise<void>
  
  // Organization management
  createOrganization: (data: { name: string; description?: string }) => Promise<LogtoOrganization>
  leaveOrganization: (organizationId: string) => Promise<void>
  
  // Context helpers
  isAdmin: boolean
  isMember: boolean
  canManageOrganization: boolean
  hasMultipleOrganizations: boolean
}

export const OrganizationContext = createContext<OrganizationContextData>({
  currentOrganization: null,
  userOrganizations: [],
  isLoading: true,
  error: null,
  switchOrganization: async () => {},
  refreshOrganizations: async () => {},
  createOrganization: async () => { throw new Error('Not implemented') },
  leaveOrganization: async () => {},
  isAdmin: false,
  isMember: false,
  canManageOrganization: false,
  hasMultipleOrganizations: false,
})

export type { LogtoOrganization } from '@/lib/types/management-api'