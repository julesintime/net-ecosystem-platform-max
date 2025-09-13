"use client"

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { LogtoOrganization } from '@/lib/types/management-api'
import { OrganizationStorage } from '@/lib/utils/organization-storage'

export interface UseOrganizationSwitchOptions {
  onSwitchStart?: (organizationId: string) => void
  onSwitchComplete?: (organization: LogtoOrganization) => void
  onSwitchError?: (error: string) => void
  redirectAfterSwitch?: boolean
}

export interface UseOrganizationSwitchReturn {
  isSwitching: boolean
  switchError: string | null
  switchOrganization: (organizationId: string) => Promise<void>
  clearSwitchError: () => void
  
  // Quick actions
  switchToLastOrganization: () => Promise<void>
  getQuickSwitchOrganizations: (allOrganizations: LogtoOrganization[]) => LogtoOrganization[]
}

export function useOrganizationSwitch(options: UseOrganizationSwitchOptions = {}): UseOrganizationSwitchReturn {
  const {
    onSwitchStart,
    onSwitchComplete,
    onSwitchError,
    redirectAfterSwitch = true
  } = options
  
  const router = useRouter()
  const [isSwitching, setIsSwitching] = useState(false)
  const [switchError, setSwitchError] = useState<string | null>(null)
  
  const clearSwitchError = useCallback(() => {
    setSwitchError(null)
  }, [])
  
  const switchOrganization = useCallback(async (organizationId: string) => {
    if (isSwitching) return
    
    setIsSwitching(true)
    setSwitchError(null)
    
    try {
      onSwitchStart?.(organizationId)
      
      // Step 1: Get organization token
      const tokenResponse = await fetch(`/api/organizations/${organizationId}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!tokenResponse.ok) {
        const error = await tokenResponse.json()
        throw new Error(error.message || 'Failed to get organization token')
      }
      
      const { accessToken } = await tokenResponse.json()
      
      // Step 2: Fetch organization details with new token
      const orgResponse = await fetch(`/api/organizations/${organizationId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!orgResponse.ok) {
        const error = await orgResponse.json()
        throw new Error(error.message || 'Failed to fetch organization details')
      }
      
      const { data: organization } = await orgResponse.json() as { data: LogtoOrganization }
      
      // Step 3: Store organization context
      OrganizationStorage.setCurrentOrganization(organization.id, organization.name)
      
      // Step 4: Trigger refresh by redirecting to current page
      if (redirectAfterSwitch) {
        router.refresh()
      }
      
      onSwitchComplete?.(organization)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Organization switch failed'
      setSwitchError(errorMessage)
      onSwitchError?.(errorMessage)
      console.error('Organization switch error:', error)
    } finally {
      setIsSwitching(false)
    }
  }, [isSwitching, router, redirectAfterSwitch, onSwitchStart, onSwitchComplete, onSwitchError])
  
  const switchToLastOrganization = useCallback(async () => {
    const stored = OrganizationStorage.getCurrentOrganization()
    if (stored) {
      await switchOrganization(stored.organizationId)
    }
  }, [switchOrganization])
  
  const getQuickSwitchOrganizations = useCallback((allOrganizations: LogtoOrganization[]) => {
    const preferences = OrganizationStorage.getPreferences()
    const currentStored = OrganizationStorage.getCurrentOrganization()
    
    // Sort organizations: favorites first, then by last switched time, then alphabetically
    return allOrganizations
      .filter(org => org.id !== currentStored?.organizationId) // Exclude current
      .sort((a, b) => {
        const aIsFavorite = preferences.favorites.includes(a.id)
        const bIsFavorite = preferences.favorites.includes(b.id)
        
        if (aIsFavorite && !bIsFavorite) return -1
        if (!aIsFavorite && bIsFavorite) return 1
        
        // If both or neither are favorites, sort by name
        return a.name.localeCompare(b.name)
      })
      .slice(0, 5) // Limit to 5 quick switch options
  }, [])
  
  return {
    isSwitching,
    switchError,
    switchOrganization,
    clearSwitchError,
    switchToLastOrganization,
    getQuickSwitchOrganizations,
  }
}