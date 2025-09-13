"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  OrganizationMemberWithUser,
  InviteMemberFormData,
  BulkInviteFormData,
  UpdateMemberFormData,
  MemberTableFilters,
  OperationState,
  PaginationState,
  SortState,
} from '@/lib/types/organization'
import { 
  LogtoOrganizationMember,
  LogtoUser,
  ManagementApiResponse,
  PaginatedResponse 
} from '@/lib/types/management-api'

export interface UseMembersOptions {
  organizationId?: string
  autoFetch?: boolean
  initialPageSize?: number
}

export interface UseMembersReturn {
  members: OrganizationMemberWithUser[]
  filteredMembers: OrganizationMemberWithUser[]
  selectedMembers: string[]
  isLoading: boolean
  error: string | null
  operationState: OperationState
  pagination: PaginationState
  filters: MemberTableFilters
  sorting: SortState
  
  // Actions
  fetchMembers: () => Promise<void>
  inviteMember: (data: InviteMemberFormData) => Promise<void>
  bulkInviteMembers: (data: BulkInviteFormData) => Promise<void>
  updateMemberRoles: (memberId: string, data: UpdateMemberFormData) => Promise<void>
  removeMember: (memberId: string) => Promise<void>
  bulkRemoveMembers: (memberIds: string[]) => Promise<void>
  
  // Selection
  selectMember: (memberId: string) => void
  selectAllMembers: () => void
  clearSelection: () => void
  
  // Filters and sorting
  setFilters: (filters: Partial<MemberTableFilters>) => void
  setSorting: (sorting: Partial<SortState>) => void
  setPagination: (pagination: Partial<PaginationState>) => void
  
  // Utils
  refreshData: () => Promise<void>
  canManageMember: (memberId: string) => boolean
}

export function useMembers({ 
  organizationId, 
  autoFetch = true,
  initialPageSize = 20 
}: UseMembersOptions = {}): UseMembersReturn {
  const [members, setMembers] = useState<OrganizationMemberWithUser[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
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
  
  const [filters, setFiltersState] = useState<MemberTableFilters>({})
  const [sorting, setSortingState] = useState<SortState>({
    field: 'name',
    direction: 'asc'
  })

  const fetchMembers = useCallback(async () => {
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

      const response = await fetch(`/api/organizations/${organizationId}/members?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch members')
      }

      const result: ManagementApiResponse<PaginatedResponse<LogtoOrganizationMember>> = await response.json()
      
      if (!result.data) {
        throw new Error('Invalid response format')
      }

      // Transform to extended type with user data
      const membersWithUsers: OrganizationMemberWithUser[] = result.data.data.map(member => ({
        ...member,
        user: {
          id: member.id,
          username: member.username,
          primaryEmail: member.primaryEmail,
          primaryPhone: member.primaryPhone,
          name: member.name,
          avatar: member.avatar,
          customData: member.customData,
          identities: member.identities || {},
          lastSignInAt: member.lastSignInAt,
          createdAt: member.createdAt,
          updatedAt: member.updatedAt || member.createdAt,
          profile: member.profile || {},
          applicationId: member.applicationId,
          isSuspended: member.isSuspended || false,
          hasPassword: member.hasPassword || false,
          ssoIdentities: member.ssoIdentities || [],
        } as LogtoUser,
        joinedAt: new Date(member.createdAt),
        lastActivity: member.lastSignInAt ? new Date(member.lastSignInAt) : undefined,
        status: member.isSuspended ? 'suspended' : 'active'
      }))

      setMembers(membersWithUsers)
      setPaginationState(prev => ({
        ...prev,
        total: result.data!.totalCount
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch members'
      setError(errorMessage)
      console.error('Error fetching members:', err)
    } finally {
      setIsLoading(false)
    }
  }, [organizationId, pagination.page, pagination.pageSize, filters.search])

  const inviteMember = useCallback(async (data: InviteMemberFormData) => {
    if (!organizationId) return

    setOperationState({ isLoading: true, error: null, operation: 'invite' })

    try {
      // For now, we'll use the add member endpoint with user ID
      // In a real implementation, you'd have a separate invitation endpoint
      const response = await fetch(`/api/organizations/${organizationId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invitee: data.email,
          organizationRoleIds: data.roleIds,
          messagePayload: data.message ? { message: data.message } : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to invite member')
      }

      await fetchMembers()
      setOperationState({ isLoading: false, error: null })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to invite member'
      setOperationState({ isLoading: false, error: errorMessage })
      throw err
    }
  }, [organizationId, fetchMembers])

  const bulkInviteMembers = useCallback(async (data: BulkInviteFormData) => {
    if (!organizationId) return

    setOperationState({ isLoading: true, error: null, operation: 'bulk-invite' })

    try {
      const invitations = data.emails.map(email => ({
        invitee: email,
        organizationRoleIds: data.roleIds,
        messagePayload: data.message ? { message: data.message } : undefined,
      }))

      const results = await Promise.allSettled(
        invitations.map(invitation =>
          fetch(`/api/organizations/${organizationId}/invitations`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(invitation),
          })
        )
      )

      const errors = results
        .map((result, index) => ({ result, email: data.emails[index] }))
        .filter(({ result }) => result.status === 'rejected')
        .map(({ email }) => email)

      if (errors.length > 0) {
        throw new Error(`Failed to invite: ${errors.join(', ')}`)
      }

      await fetchMembers()
      setOperationState({ isLoading: false, error: null })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk invite members'
      setOperationState({ isLoading: false, error: errorMessage })
      throw err
    }
  }, [organizationId, fetchMembers])

  const updateMemberRoles = useCallback(async (memberId: string, data: UpdateMemberFormData) => {
    if (!organizationId) return

    setOperationState({ isLoading: true, error: null, operation: 'update-role' })

    try {
      const response = await fetch(`/api/organizations/${organizationId}/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationRoleIds: data.roleIds,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update member roles')
      }

      await fetchMembers()
      setOperationState({ isLoading: false, error: null })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update member roles'
      setOperationState({ isLoading: false, error: errorMessage })
      throw err
    }
  }, [organizationId, fetchMembers])

  const removeMember = useCallback(async (memberId: string) => {
    if (!organizationId) return

    setOperationState({ isLoading: true, error: null, operation: 'remove' })

    try {
      const response = await fetch(`/api/organizations/${organizationId}/members?userId=${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove member')
      }

      await fetchMembers()
      setSelectedMembers(prev => prev.filter(id => id !== memberId))
      setOperationState({ isLoading: false, error: null })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove member'
      setOperationState({ isLoading: false, error: errorMessage })
      throw err
    }
  }, [organizationId, fetchMembers])

  const bulkRemoveMembers = useCallback(async (memberIds: string[]) => {
    if (!organizationId) return

    setOperationState({ isLoading: true, error: null, operation: 'bulk-remove' })

    try {
      const results = await Promise.allSettled(
        memberIds.map(memberId =>
          fetch(`/api/organizations/${organizationId}/members?userId=${memberId}`, {
            method: 'DELETE',
          })
        )
      )

      const errors = results
        .map((result, index) => ({ result, id: memberIds[index] }))
        .filter(({ result }) => result.status === 'rejected')
        .map(({ id }) => id)

      if (errors.length > 0) {
        throw new Error(`Failed to remove members: ${errors.join(', ')}`)
      }

      await fetchMembers()
      setSelectedMembers([])
      setOperationState({ isLoading: false, error: null })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk remove members'
      setOperationState({ isLoading: false, error: errorMessage })
      throw err
    }
  }, [organizationId, fetchMembers])

  // Selection handlers
  const selectMember = useCallback((memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }, [])

  const selectAllMembers = useCallback(() => {
    setSelectedMembers(members.map(member => member.id))
  }, [members])

  const clearSelection = useCallback(() => {
    setSelectedMembers([])
  }, [])

  // Filter and sort handlers
  const setFilters = useCallback((newFilters: Partial<MemberTableFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }))
    setPaginationState(prev => ({ ...prev, page: 1 })) // Reset to first page
  }, [])

  const setSorting = useCallback((newSorting: Partial<SortState>) => {
    setSortingState(prev => ({ ...prev, ...newSorting }))
  }, [])

  const setPagination = useCallback((newPagination: Partial<PaginationState>) => {
    setPaginationState(prev => ({ ...prev, ...newPagination }))
  }, [])

  // Filtered and sorted members
  const filteredMembers = useMemo(() => {
    let filtered = [...members]

    // Apply filters
    if (filters.role) {
      filtered = filtered.filter(member => 
        member.organizationRoles.some(role => role.name === filters.role)
      )
    }

    if (filters.status) {
      filtered = filtered.filter(member => member.status === filters.status)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(member =>
        member.name?.toLowerCase().includes(searchLower) ||
        member.primaryEmail?.toLowerCase().includes(searchLower) ||
        member.username?.toLowerCase().includes(searchLower)
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

      const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      return sorting.direction === 'desc' ? -result : result
    })

    return filtered
  }, [members, filters, sorting])

  const canManageMember = useCallback((memberId: string) => {
    // This would check current user permissions
    // For now, return true - implement proper permission checking
    return true
  }, [])

  const refreshData = useCallback(async () => {
    await fetchMembers()
  }, [fetchMembers])

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && organizationId) {
      fetchMembers()
    }
  }, [autoFetch, organizationId, fetchMembers])

  // Clear selection when members change
  useEffect(() => {
    setSelectedMembers(prev => prev.filter(id => members.some(member => member.id === id)))
  }, [members])

  return {
    members,
    filteredMembers,
    selectedMembers,
    isLoading,
    error,
    operationState,
    pagination,
    filters,
    sorting,
    
    fetchMembers,
    inviteMember,
    bulkInviteMembers,
    updateMemberRoles,
    removeMember,
    bulkRemoveMembers,
    
    selectMember,
    selectAllMembers,
    clearSelection,
    
    setFilters,
    setSorting,
    setPagination,
    
    refreshData,
    canManageMember,
  }
}