"use client"

import { useState, useEffect, useCallback } from 'react'
import { 
  OrganizationWithStats,
  OrganizationStats,
  OrganizationProfileFormData,
  OperationState,
} from '@/lib/types/organization'
import { LogtoOrganization } from '@/lib/types/management-api'

export interface UseOrganizationOptions {
  organizationId?: string
  autoFetch?: boolean
}

export interface UseOrganizationReturn {
  organization: OrganizationWithStats | null
  stats: OrganizationStats | null
  isLoading: boolean
  error: string | null
  operationState: OperationState
  
  // Actions
  fetchOrganization: () => Promise<void>
  fetchStats: () => Promise<void>
  updateOrganization: (data: OrganizationProfileFormData) => Promise<void>
  deleteOrganization: () => Promise<void>
  leaveOrganization: () => Promise<void>
  refreshData: () => Promise<void>
}

export function useOrganization({ organizationId, autoFetch = true }: UseOrganizationOptions = {}): UseOrganizationReturn {
  const [organization, setOrganization] = useState<OrganizationWithStats | null>(null)
  const [stats, setStats] = useState<OrganizationStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [operationState, setOperationState] = useState<OperationState>({
    isLoading: false,
    error: null
  })

  const fetchOrganization = useCallback(async () => {
    if (!organizationId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/organizations/${organizationId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch organization')
      }

      const { data }: { data: LogtoOrganization } = await response.json()
      
      // Transform to extended type with additional stats
      const organizationWithStats: OrganizationWithStats = {
        ...data,
        memberCount: 0, // Will be updated by separate call
        pendingInvitations: 0, // Will be updated by separate call
        createdAtDate: new Date(data.createdAt),
        lastActivity: undefined
      }

      setOrganization(organizationWithStats)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch organization'
      setError(errorMessage)
      console.error('Error fetching organization:', err)
    } finally {
      setIsLoading(false)
    }
  }, [organizationId])

  const fetchStats = useCallback(async () => {
    if (!organizationId) return

    try {
      // Fetch member count
      const membersResponse = await fetch(`/api/organizations/${organizationId}/members?page=1&page_size=1`)
      let memberCount = 0
      
      if (membersResponse.ok) {
        const membersData = await membersResponse.json()
        memberCount = membersData.data?.totalCount || 0
      }

      // Fetch invitation count (if API exists)
      let pendingInvitations = 0
      try {
        const invitationsResponse = await fetch(`/api/organizations/${organizationId}/invitations?status=Pending&page=1&page_size=1`)
        if (invitationsResponse.ok) {
          const invitationsData = await invitationsResponse.json()
          pendingInvitations = invitationsData.data?.totalCount || 0
        }
      } catch {
        // Invitation endpoint might not exist yet
      }

      // Mock stats for now - in real implementation these would come from your analytics API
      const mockStats: OrganizationStats = {
        totalMembers: memberCount,
        activeMembers: Math.max(0, memberCount - 1), // Assume 1 pending
        pendingInvitations,
        totalRoles: 3, // Admin, Member, Guest
        storageUsed: 1024 * 1024 * 256, // 256 MB
        storageLimit: 1024 * 1024 * 1024, // 1 GB
        apiCallsThisMonth: 2847,
        apiCallsLimit: 10000
      }

      setStats(mockStats)

      // Update organization with counts
      if (organization) {
        setOrganization(prev => prev ? {
          ...prev,
          memberCount,
          pendingInvitations
        } : null)
      }
    } catch (err) {
      console.error('Error fetching organization stats:', err)
    }
  }, [organizationId, organization])

  const updateOrganization = useCallback(async (data: OrganizationProfileFormData) => {
    if (!organizationId) return

    setOperationState({ isLoading: true, error: null, operation: 'update-profile' })

    try {
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          isMfaRequired: data.isMfaRequired,
          customData: {
            ...data.customData,
            isPublic: data.isPublic,
            allowPublicJoin: data.allowPublicJoin,
          }
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update organization')
      }

      const { data: updatedOrg }: { data: LogtoOrganization } = await response.json()
      
      setOrganization(prev => prev ? {
        ...prev,
        ...updatedOrg,
        createdAtDate: new Date(updatedOrg.createdAt)
      } : null)

      setOperationState({ isLoading: false, error: null })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update organization'
      setOperationState({ isLoading: false, error: errorMessage })
      throw err
    }
  }, [organizationId])

  const deleteOrganization = useCallback(async () => {
    if (!organizationId) return

    setOperationState({ isLoading: true, error: null, operation: 'delete' })

    try {
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete organization')
      }

      setOrganization(null)
      setStats(null)
      setOperationState({ isLoading: false, error: null })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete organization'
      setOperationState({ isLoading: false, error: errorMessage })
      throw err
    }
  }, [organizationId])

  const leaveOrganization = useCallback(async () => {
    if (!organizationId) return

    setOperationState({ isLoading: true, error: null, operation: 'leave' })

    try {
      // This would typically be a different endpoint for leaving vs deleting
      const response = await fetch(`/api/organizations/${organizationId}/leave`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to leave organization')
      }

      setOrganization(null)
      setStats(null)
      setOperationState({ isLoading: false, error: null })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave organization'
      setOperationState({ isLoading: false, error: errorMessage })
      throw err
    }
  }, [organizationId])

  const refreshData = useCallback(async () => {
    await Promise.all([fetchOrganization(), fetchStats()])
  }, [fetchOrganization, fetchStats])

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && organizationId) {
      fetchOrganization()
    }
  }, [autoFetch, organizationId, fetchOrganization])

  // Fetch stats after organization is loaded
  useEffect(() => {
    if (organization && !stats) {
      fetchStats()
    }
  }, [organization, stats, fetchStats])

  return {
    organization,
    stats,
    isLoading,
    error,
    operationState,
    
    fetchOrganization,
    fetchStats,
    updateOrganization,
    deleteOrganization,
    leaveOrganization,
    refreshData,
  }
}