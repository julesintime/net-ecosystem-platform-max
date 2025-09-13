"use client"

import * as React from "react"
import { 
  OrganizationContextValue,
  OrganizationWithStats,
  InviteMemberFormData,
  BulkInviteFormData,
  OrganizationProfileFormData,
  InvitationWithDetails,
  OrganizationRoleWithDetails,
  OrganizationStats,
  OperationState,
} from "@/lib/types/organization"
import { useOrganization } from "@/hooks/use-organization"
import { useMembers } from "@/hooks/use-members"
import { useInvitations } from "@/hooks/use-invitations"

const OrganizationContext = React.createContext<OrganizationContextValue | undefined>(undefined)

interface OrganizationProviderProps {
  children: React.ReactNode
  organizationId: string
}

export function OrganizationProvider({ children, organizationId }: OrganizationProviderProps) {
  // Use our custom hooks
  const {
    organization,
    stats,
    isLoading: orgLoading,
    error: orgError,
    operationState: orgOperationState,
    updateOrganization: updateOrg,
    deleteOrganization: deleteOrg,
    leaveOrganization: leaveOrg,
    refreshData: refreshOrgData,
  } = useOrganization({ organizationId })

  const {
    members,
    isLoading: membersLoading,
    error: membersError,
    operationState: membersOperationState,
    inviteMember: inviteMemberHook,
    bulkInviteMembers: bulkInviteMembersHook,
    updateMemberRoles,
    removeMember,
    refreshData: refreshMembersData,
  } = useMembers({ organizationId })

  const {
    invitations,
    isLoading: invitationsLoading,
    error: invitationsError,
    resendInvitation,
    revokeInvitation,
    refreshData: refreshInvitationsData,
  } = useInvitations({ organizationId })

  // Mock roles data - in real implementation, fetch from API
  const mockRoles: OrganizationRoleWithDetails[] = React.useMemo(() => [
    {
      id: "admin",
      name: "Admin",
      description: "Full administrative access",
      permissions: [
        "manage:members",
        "manage:roles", 
        "manage:settings",
        "manage:billing",
        "delete:organization",
        "view:analytics",
      ],
      memberCount: 2,
      isBuiltIn: true,
      canManageMembers: true,
      canManageRoles: true,
      canDeleteOrganization: true,
    },
    {
      id: "member",
      name: "Member",
      description: "Standard member access",
      permissions: ["view:analytics"],
      memberCount: 15,
      isBuiltIn: true,
      canManageMembers: false,
      canManageRoles: false,
      canDeleteOrganization: false,
    },
    {
      id: "guest",
      name: "Guest", 
      description: "Limited read-only access",
      permissions: [],
      memberCount: 3,
      isBuiltIn: true,
      canManageMembers: false,
      canManageRoles: false,
      canDeleteOrganization: false,
    },
  ], [])

  // Combine operation states
  const operationState: OperationState = React.useMemo(() => {
    if (orgOperationState.isLoading) return orgOperationState
    if (membersOperationState.isLoading) return membersOperationState
    
    return {
      isLoading: false,
      error: orgOperationState.error || membersOperationState.error || null,
    }
  }, [orgOperationState, membersOperationState])

  // Action handlers
  const inviteMember = React.useCallback(async (data: InviteMemberFormData) => {
    await inviteMemberHook(data)
    await refreshInvitationsData()
  }, [inviteMemberHook, refreshInvitationsData])

  const bulkInviteMembers = React.useCallback(async (data: BulkInviteFormData) => {
    await bulkInviteMembersHook(data)
    await refreshInvitationsData()
  }, [bulkInviteMembersHook, refreshInvitationsData])

  const updateMemberRolesFn = React.useCallback(async (memberId: string, roleIds: string[]) => {
    await updateMemberRoles(memberId, { roleIds })
    await refreshMembersData()
  }, [updateMemberRoles, refreshMembersData])

  const removeMemberFn = React.useCallback(async (memberId: string) => {
    await removeMember(memberId)
    await refreshMembersData()
  }, [removeMember, refreshMembersData])

  const resendInvitationFn = React.useCallback(async (invitationId: string) => {
    await resendInvitation(invitationId)
    await refreshInvitationsData()
  }, [resendInvitation, refreshInvitationsData])

  const revokeInvitationFn = React.useCallback(async (invitationId: string) => {
    await revokeInvitation(invitationId)
    await refreshInvitationsData()
  }, [revokeInvitation, refreshInvitationsData])

  const updateOrganization = React.useCallback(async (data: OrganizationProfileFormData) => {
    await updateOrg(data)
    await refreshOrgData()
  }, [updateOrg, refreshOrgData])

  const deleteOrganization = React.useCallback(async () => {
    await deleteOrg()
  }, [deleteOrg])

  const leaveOrganization = React.useCallback(async () => {
    await leaveOrg()
  }, [leaveOrg])

  const refreshData = React.useCallback(async () => {
    await Promise.all([
      refreshOrgData(),
      refreshMembersData(),
      refreshInvitationsData(),
    ])
  }, [refreshOrgData, refreshMembersData, refreshInvitationsData])

  const contextValue: OrganizationContextValue = React.useMemo(() => ({
    // Current organization
    organization: organization || undefined,
    
    // Members
    members,
    membersLoading,
    membersError,
    
    // Invitations
    invitations,
    invitationsLoading,
    invitationsError,
    
    // Roles
    roles: mockRoles,
    rolesLoading: false,
    rolesError: undefined,
    
    // Stats
    stats: stats || undefined,
    statsLoading: orgLoading,
    
    // Operations
    operationState,
    
    // Actions
    inviteMember,
    bulkInviteMembers,
    updateMemberRoles: updateMemberRolesFn,
    removeMember: removeMemberFn,
    resendInvitation: resendInvitationFn,
    revokeInvitation: revokeInvitationFn,
    updateOrganization,
    deleteOrganization,
    leaveOrganization,
    refreshData,
  }), [
    organization,
    members,
    membersLoading,
    membersError,
    invitations,
    invitationsLoading,
    invitationsError,
    mockRoles,
    stats,
    orgLoading,
    operationState,
    inviteMember,
    bulkInviteMembers,
    updateMemberRolesFn,
    removeMemberFn,
    resendInvitationFn,
    revokeInvitationFn,
    updateOrganization,
    deleteOrganization,
    leaveOrganization,
    refreshData,
  ])

  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganizationContext(): OrganizationContextValue {
  const context = React.useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganizationContext must be used within an OrganizationProvider')
  }
  return context
}