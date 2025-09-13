"use client"

import { useState, useEffect, useCallback, ReactNode } from 'react'
import { OrganizationContext, OrganizationContextData, LogtoOrganization } from '@/lib/contexts/organization-context'
import { OrganizationStorage } from '@/lib/utils/organization-storage'
import { useOrganizationSwitch } from '@/hooks/use-organization-switch'
import { OrganizationBrandingManager } from '@/lib/utils/organization-branding'

interface OrganizationProviderProps {
  children: ReactNode
  initialOrganization?: LogtoOrganization | null
  initialOrganizations?: LogtoOrganization[]
}

export function OrganizationProvider({ 
  children, 
  initialOrganization = null,
  initialOrganizations = []
}: OrganizationProviderProps) {
  const [currentOrganization, setCurrentOrganization] = useState<LogtoOrganization | null>(initialOrganization)
  const [userOrganizations, setUserOrganizations] = useState<LogtoOrganization[]>(initialOrganizations)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { 
    switchOrganization: performSwitch, 
    isSwitching 
  } = useOrganizationSwitch({
    onSwitchComplete: (organization) => {
      setCurrentOrganization(organization)
      setError(null)
      // Apply organization branding
      OrganizationBrandingManager.applyBranding(organization)
    },
    onSwitchError: (switchError) => {
      setError(switchError)
    },
    redirectAfterSwitch: false // We handle updates manually
  })
  
  // Fetch user's organizations
  const refreshOrganizations = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/organizations', {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch organizations')
      }
      
      const { data } = await response.json() as { data: LogtoOrganization[] }
      setUserOrganizations(data || [])
      
      // If no current organization is set, try to restore from storage or use first available
      if (!currentOrganization) {
        const stored = OrganizationStorage.getCurrentOrganization()
        if (stored && data.some(org => org.id === stored.organizationId)) {
          const storedOrg = data.find(org => org.id === stored.organizationId)
          if (storedOrg) {
            setCurrentOrganization(storedOrg)
            return
          }
        }
        
        // Use first organization if available
        if (data.length > 0) {
          setCurrentOrganization(data[0])
          OrganizationStorage.setCurrentOrganization(data[0].id, data[0].name)
          // Apply branding for the initial organization
          OrganizationBrandingManager.applyBranding(data[0])
        }
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch organizations'
      setError(errorMessage)
      console.error('Error fetching organizations:', err)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization])
  
  // Switch organization handler
  const switchOrganization = useCallback(async (organizationId: string) => {
    const targetOrg = userOrganizations.find(org => org.id === organizationId)
    if (!targetOrg) {
      setError('Organization not found')
      return
    }
    
    await performSwitch(organizationId)
  }, [userOrganizations, performSwitch])
  
  // Create organization handler
  const createOrganization = useCallback(async (data: { name: string; description?: string }): Promise<LogtoOrganization> => {
    const response = await fetch('/api/organizations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create organization')
    }
    
    const { data: newOrg } = await response.json() as { data: LogtoOrganization }
    
    // Refresh organizations to include the new one
    await refreshOrganizations()
    
    return newOrg
  }, [refreshOrganizations])
  
  // Leave organization handler
  const leaveOrganization = useCallback(async (organizationId: string) => {
    const response = await fetch(`/api/organizations/${organizationId}/leave`, {
      method: 'POST',
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to leave organization')
    }
    
    // If leaving current organization, clear it and switch to another
    if (currentOrganization?.id === organizationId) {
      const remainingOrgs = userOrganizations.filter(org => org.id !== organizationId)
      if (remainingOrgs.length > 0) {
        await switchOrganization(remainingOrgs[0].id)
      } else {
        setCurrentOrganization(null)
        OrganizationStorage.clearCurrentOrganization()
      }
    }
    
    // Refresh organizations
    await refreshOrganizations()
  }, [currentOrganization, userOrganizations, switchOrganization, refreshOrganizations])
  
  // Initialize on mount
  useEffect(() => {
    // Try to restore branding from storage first
    OrganizationBrandingManager.restoreBrandingFromStorage()
    
    if (initialOrganizations.length === 0) {
      refreshOrganizations()
    } else {
      setIsLoading(false)
      // Apply branding if we have an initial organization
      if (initialOrganization) {
        OrganizationBrandingManager.applyBranding(initialOrganization)
      }
    }
  }, [initialOrganizations.length, refreshOrganizations, initialOrganization])
  
  // Calculate derived values
  const isAdmin = currentOrganization ? 
    // In a real implementation, you'd check the user's role in the current organization
    true : false // Placeholder - implement based on your role system
  
  const isMember = currentOrganization ? true : false
  const canManageOrganization = isAdmin
  const hasMultipleOrganizations = userOrganizations.length > 1
  
  const contextValue: OrganizationContextData = {
    currentOrganization,
    userOrganizations,
    isLoading: isLoading || isSwitching,
    error,
    switchOrganization,
    refreshOrganizations,
    createOrganization,
    leaveOrganization,
    isAdmin,
    isMember,
    canManageOrganization,
    hasMultipleOrganizations,
  }
  
  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  )
}