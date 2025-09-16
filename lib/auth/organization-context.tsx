"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface Organization {
  id: string
  name: string
  description?: string | null
  customData?: Record<string, unknown>
  createdAt?: number
}

interface OrganizationContextType {
  currentOrganization: Organization | null
  organizations: Organization[]
  isLoading: boolean
  error: string | null
  setCurrentOrganization: (org: Organization) => void
  switchOrganization: (orgId: string) => Promise<void>
  refreshOrganizations: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Load organizations on mount
  useEffect(() => {
    loadOrganizations()
  }, [])

  const loadOrganizations = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/organizations/check')
      if (!response.ok) {
        throw new Error('Failed to load organizations')
      }
      
      const data = await response.json()
      setOrganizations(data.organizations || [])
      
      // Set current organization from localStorage or use first org
      const storedOrgId = localStorage.getItem('currentOrganizationId')
      const storedOrg = data.organizations.find((org: Organization) => org.id === storedOrgId)
      
      if (storedOrg) {
        setCurrentOrganization(storedOrg)
      } else if (data.organizations.length > 0) {
        setCurrentOrganization(data.organizations[0])
        localStorage.setItem('currentOrganizationId', data.organizations[0].id)
      }
    } catch (err) {
      console.error('Error loading organizations:', err)
      setError(err instanceof Error ? err.message : 'Failed to load organizations')
    } finally {
      setIsLoading(false)
    }
  }

  const switchOrganization = async (orgId: string) => {
    const org = organizations.find(o => o.id === orgId)
    if (!org) {
      throw new Error('Organization not found')
    }
    
    setCurrentOrganization(org)
    localStorage.setItem('currentOrganizationId', org.id)
    
    // Trigger a page refresh to update all components with new org context
    router.refresh()
  }

  const refreshOrganizations = async () => {
    await loadOrganizations()
  }

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        organizations,
        isLoading,
        error,
        setCurrentOrganization,
        switchOrganization,
        refreshOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}