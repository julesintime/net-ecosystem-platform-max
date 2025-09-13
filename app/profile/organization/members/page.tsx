"use client"

import * as React from "react"
import { ArrowLeft, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { OrganizationProvider, useOrganizationContext } from "@/components/organization/organization-context"
import { OrganizationMemberWithUser, InviteMemberFormData, UpdateMemberFormData } from "@/lib/types/organization"
import { MembersList } from "@/components/organization/member-management/members-list"
import { InviteMemberDialog } from "@/components/organization/member-management/invite-member-dialog"
import { RoleAssignment } from "@/components/organization/member-management/role-assignment"
import { BulkOperations } from "@/components/organization/member-management/bulk-operations"

// Mock organization ID - in real implementation, get from auth context or URL
const MOCK_ORGANIZATION_ID = "org_123456789"

function MembersManagementContent() {
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false)
  const [roleAssignmentMember, setRoleAssignmentMember] = React.useState<OrganizationMemberWithUser | null>(null)
  const [activeTab, setActiveTab] = React.useState("members")

  const {
    organization,
    members,
    invitations,
    membersLoading,
    invitationsLoading,
    operationState,
    inviteMember,
    updateMemberRoles,
    removeMember,
  } = useOrganizationContext()

  const handleInviteMember = async (data: InviteMemberFormData) => {
    await inviteMember(data)
    setInviteDialogOpen(false)
  }

  const handleEditMember = (member: OrganizationMemberWithUser) => {
    setRoleAssignmentMember(member)
  }

  const handleRemoveMember = async (member: OrganizationMemberWithUser) => {
    if (confirm(`Are you sure you want to remove ${member.user.name || member.user.username}?`)) {
      await removeMember(member.id)
    }
  }

  const handleUpdateMemberRoles = async (memberId: string, data: UpdateMemberFormData) => {
    await updateMemberRoles(memberId, data.roleIds)
    setRoleAssignmentMember(null)
  }

  const pendingInvitations = invitations.filter(inv => inv.status === 'Pending')
  const expiredInvitations = invitations.filter(inv => inv.status === 'Expired')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <a href="/profile/organization">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Organization
            </a>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Member Management</h1>
            <p className="text-muted-foreground">
              {organization?.name && `Manage members for ${organization.name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {members.length} member{members.length === 1 ? '' : 's'}
          </Badge>
          {pendingInvitations.length > 0 && (
            <Badge variant="secondary">
              {pendingInvitations.length} pending
            </Badge>
          )}
        </div>
      </div>

      {/* Alerts */}
      {expiredInvitations.length > 0 && (
        <Alert>
          <AlertDescription>
            You have {expiredInvitations.length} expired invitation{expiredInvitations.length === 1 ? '' : 's'} 
            that may need to be resent.
          </AlertDescription>
        </Alert>
      )}

      {operationState.error && (
        <Alert variant="destructive">
          <AlertDescription>
            {operationState.error}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Members ({members.length})</span>
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center space-x-2">
            <span>Invitations ({invitations.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <MembersList
            organizationId={MOCK_ORGANIZATION_ID}
            onInviteMember={() => setInviteDialogOpen(true)}
            onEditMember={handleEditMember}
            onRemoveMember={handleRemoveMember}
          />
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                Manage outstanding invitations to join your organization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingInvitations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    No pending invitations
                  </p>
                  <Button onClick={() => setInviteDialogOpen(true)}>
                    Invite Member
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingInvitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{invitation.invitee}</p>
                        <p className="text-sm text-muted-foreground">
                          Invited {invitation.createdAtDate.toLocaleDateString()} • 
                          Expires {invitation.expiresAtDate.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{invitation.roleName || 'Member'}</Badge>
                        <Button variant="outline" size="sm">
                          Resend
                        </Button>
                        <Button variant="outline" size="sm">
                          Revoke
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {expiredInvitations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Expired Invitations</CardTitle>
                <CardDescription>
                  These invitations have expired and may need to be resent.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expiredInvitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{invitation.invitee}</p>
                        <p className="text-sm text-muted-foreground">
                          Expired {invitation.expiresAtDate.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">Expired</Badge>
                        <Button variant="outline" size="sm">
                          Resend
                        </Button>
                        <Button variant="outline" size="sm">
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onInviteMember={handleInviteMember}
        isLoading={operationState.isLoading}
      />

      <RoleAssignment
        open={!!roleAssignmentMember}
        onOpenChange={(open) => !open && setRoleAssignmentMember(null)}
        member={roleAssignmentMember}
        onUpdateRoles={handleUpdateMemberRoles}
        isLoading={operationState.isLoading}
      />
    </div>
  )
}

export default function MembersManagementPage() {
  return (
    <div className="container mx-auto py-6">
      <OrganizationProvider organizationId={MOCK_ORGANIZATION_ID}>
        <MembersManagementContent />
      </OrganizationProvider>
    </div>
  )
}