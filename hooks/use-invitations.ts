"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  InvitationWithDetails,
  InvitationTableFilters,
  OperationState,
  PaginationState,
  SortState,
} from '@/lib/types/organization'
import { 
  LogtoOrganizationInvitation,
  ManagementApiResponse,
  PaginatedResponse 
} from '@/lib/types/management-api'

export interface UseInvitationsOptions {
  organizationId?: string
  autoFetch?: boolean
  initialPageSize?: number
}

export interface UseInvitationsReturn {
  invitations: InvitationWithDetails[]
  filteredInvitations: InvitationWithDetails[]
  selectedInvitations: string[]
  isLoading: boolean
  error: string | null
  operationState: OperationState
  pagination: PaginationState
  filters: InvitationTableFilters
  sorting: SortState
  
  // Actions
  fetchInvitations: () => Promise<void>
  resendInvitation: (invitationId: string) => Promise<void>
  revokeInvitation: (invitationId: string) => Promise<void>
  bulkRevokeInvitations: (invitationIds: string[]) => Promise<void>
  
  // Selection
  selectInvitation: (invitationId: string) => void
  selectAllInvitations: () => void
  clearSelection: () => void
  
  // Filters and sorting
  setFilters: (filters: Partial<InvitationTableFilters>) => void
  setSorting: (sorting: Partial<SortState>) => void
  setPagination: (pagination: Partial<PaginationState>) => void
  
  // Utils
  refreshData: () => Promise<void>
  canManageInvitation: (invitationId: string) => boolean
}

export function useInvitations({ 
  organizationId, 
  autoFetch = true,
  initialPageSize = 20 
}: UseInvitationsOptions = {}): UseInvitationsReturn {
  const [invitations, setInvitations] = useState<InvitationWithDetails[]>([])
  const [selectedInvitations, setSelectedInvitations] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [operationState, setOperationState] = useState<OperationState>({
    isLoading: false,
    error: null
  })
  
  const [pagination, setPaginationState] = useState<PaginationState>({
    page: 1,
    pageSize: initialPageSize,
    total: 0
  })
  
  const [filters, setFiltersState] = useState<InvitationTableFilters>({})
  const [sorting, setSortingState] = useState<SortState>({
    field: 'createdAt',
    direction: 'desc'
  })

  const fetchInvitations = useCallback(async () => {
    if (!organizationId) return

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        page_size: pagination.pageSize.toString(),
      })
      
      if (filters.search) {
        params.set('q', filters.search)
      }

      if (filters.status) {
        params.set('status', filters.status)
      }

      const response = await fetch(`/api/organizations/${organizationId}/invitations?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch invitations')
      }

      const result: ManagementApiResponse<PaginatedResponse<LogtoOrganizationInvitation>> = await response.json()
      
      if (!result.data) {
        throw new Error('Invalid response format')
      }

      // Transform to extended type with additional details
      const invitationsWithDetails: InvitationWithDetails[] = result.data.data.map(invitation => ({
        ...invitation,
        inviterName: 'Admin User', // This would come from the API
        inviterEmail: 'admin@company.com', // This would come from the API
        roleName: 'Member', // This would be resolved from organizationRoleIds
        createdAtDate: new Date(invitation.createdAt),
        expiresAtDate: new Date(invitation.expiresAt),
        updatedAtDate: new Date(invitation.updatedAt),
      }))

      setInvitations(invitationsWithDetails)
      setPaginationState(prev => ({
        ...prev,
        total: result.data!.totalCount
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch invitations'
      setError(errorMessage)
      console.error('Error fetching invitations:', err)
    } finally {
      setIsLoading(false)
    }
  }, [organizationId, pagination.page, pagination.pageSize, filters.search, filters.status])

  const resendInvitation = useCallback(async (invitationId: string) => {
    if (!organizationId) return

    setOperationState({ isLoading: true, error: null, operation: 'resend-invitation' })

    try {
      const response = await fetch(`/api/organizations/${organizationId}/invitations/${invitationId}/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to resend invitation')
      }

      await fetchInvitations()
      setOperationState({ isLoading: false, error: null })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend invitation'
      setOperationState({ isLoading: false, error: errorMessage })
      throw err
    }
  }, [organizationId, fetchInvitations])

  const revokeInvitation = useCallback(async (invitationId: string) => {
    if (!organizationId) return

    setOperationState({ isLoading: true, error: null, operation: 'revoke-invitation' })

    try {
      const response = await fetch(`/api/organizations/${organizationId}/invitations/${invitationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to revoke invitation')
      }

      await fetchInvitations()
      setSelectedInvitations(prev => prev.filter(id => id !== invitationId))
      setOperationState({ isLoading: false, error: null })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to revoke invitation'
      setOperationState({ isLoading: false, error: errorMessage })
      throw err
    }
  }, [organizationId, fetchInvitations])

  const bulkRevokeInvitations = useCallback(async (invitationIds: string[]) => {
    if (!organizationId) return

    setOperationState({ isLoading: true, error: null, operation: 'bulk-revoke' })

    try {
      const results = await Promise.allSettled(
        invitationIds.map(invitationId =>
          fetch(`/api/organizations/${organizationId}/invitations/${invitationId}`, {
            method: 'DELETE',
          })
        )
      )

      const errors = results
        .map((result, index) => ({ result, id: invitationIds[index] }))
        .filter(({ result }) => result.status === 'rejected')
        .map(({ id }) => id)

      if (errors.length > 0) {
        throw new Error(`Failed to revoke invitations: ${errors.join(', ')}`)
      }

      await fetchInvitations()
      setSelectedInvitations([])
      setOperationState({ isLoading: false, error: null })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk revoke invitations'
      setOperationState({ isLoading: false, error: errorMessage })
      throw err
    }
  }, [organizationId, fetchInvitations])

  // Selection handlers
  const selectInvitation = useCallback((invitationId: string) => {
    setSelectedInvitations(prev => 
      prev.includes(invitationId) 
        ? prev.filter(id => id !== invitationId)
        : [...prev, invitationId]
    )
  }, [])

  const selectAllInvitations = useCallback(() => {
    setSelectedInvitations(invitations.map(invitation => invitation.id))
  }, [invitations])

  const clearSelection = useCallback(() => {
    setSelectedInvitations([])
  }, [])

  // Filter and sort handlers
  const setFilters = useCallback((newFilters: Partial<InvitationTableFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }))
    setPaginationState(prev => ({ ...prev, page: 1 })) // Reset to first page
  }, [])

  const setSorting = useCallback((newSorting: Partial<SortState>) => {
    setSortingState(prev => ({ ...prev, ...newSorting }))
  }, [])

  const setPagination = useCallback((newPagination: Partial<PaginationState>) => {
    setPaginationState(prev => ({ ...prev, ...newPagination }))
  }, [])

  // Filtered and sorted invitations
  const filteredInvitations = useMemo(() => {
    let filtered = [...invitations]

    // Apply filters
    if (filters.status) {
      filtered = filtered.filter(invitation => invitation.status === filters.status)
    }

    if (filters.role) {
      filtered = filtered.filter(invitation => invitation.roleName === filters.role)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(invitation =>
        invitation.invitee.toLowerCase().includes(searchLower) ||
        invitation.inviterName?.toLowerCase().includes(searchLower) ||
        invitation.inviterEmail?.toLowerCase().includes(searchLower)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: unknown = a
      let bValue: unknown = b

      // Navigate to nested property
      const fields = sorting.field.split('.')
      for (const field of fields) {
        aValue = (aValue as Record<string, unknown>)?.[field]
        bValue = (bValue as Record<string, unknown>)?.[field]
      }

      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1

      // Special handling for dates
      if (aValue instanceof Date && bValue instanceof Date) {
        const result = aValue.getTime() - bValue.getTime()
        return sorting.direction === 'desc' ? -result : result
      }

      const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      return sorting.direction === 'desc' ? -result : result
    })

    return filtered
  }, [invitations, filters, sorting])

  const canManageInvitation = useCallback((invitationId: string) => {
    // This would check current user permissions
    // For now, return true - implement proper permission checking
    return true
  }, [])

  const refreshData = useCallback(async () => {
    await fetchInvitations()
  }, [fetchInvitations])

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && organizationId) {
      fetchInvitations()
    }
  }, [autoFetch, organizationId, fetchInvitations])

  // Clear selection when invitations change
  useEffect(() => {
    setSelectedInvitations(prev => prev.filter(id => invitations.some(invitation => invitation.id === id)))
  }, [invitations])

  return {
    invitations,
    filteredInvitations,
    selectedInvitations,
    isLoading,
    error,
    operationState,
    pagination,
    filters,
    sorting,
    
    fetchInvitations,
    resendInvitation,
    revokeInvitation,
    bulkRevokeInvitations,
    
    selectInvitation,
    selectAllInvitations,
    clearSelection,
    
    setFilters,
    setSorting,
    setPagination,
    
    refreshData,
    canManageInvitation,
  }
}