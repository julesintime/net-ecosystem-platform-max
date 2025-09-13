"use client"

import * as React from "react"
import { Building2, Users, Settings, AlertTriangle } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

import { OrganizationProvider, useOrganizationContext } from "@/components/organization/organization-context"
import { MembersList } from "@/components/organization/member-management/members-list"
import { InviteMemberDialog } from "@/components/organization/member-management/invite-member-dialog"
import { RoleAssignment } from "@/components/organization/member-management/role-assignment"
import { OrganizationProfile } from "@/components/organization/settings/organization-profile"
import { OrganizationDanger } from "@/components/organization/settings/organization-danger"
import { UsageMetrics } from "@/components/organization/settings/usage-metrics"

// Mock organization ID - in real implementation, get from auth context or URL
const MOCK_ORGANIZATION_ID = "org_123456789"

function OrganizationOverview() {
  const { organization, stats, members, invitations, operationState } = useOrganizationContext()

  if (!organization) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-12 w-12 rounded-lg mb-2" />
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
          <p className="text-muted-foreground">
            {organization.description || "Manage your organization settings and members."}
          </p>
        </div>
        <Badge variant={organization.customData?.isPublic ? "default" : "secondary"}>
          {organization.customData?.isPublic ? "Public" : "Private"}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Members</p>
                <p className="text-2xl font-bold">{organization.memberCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{organization.pendingInvitations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-green-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">MFA Required</p>
                <p className="text-2xl font-bold">{organization.isMfaRequired ? "Yes" : "No"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-purple-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-2xl font-bold">{organization.createdAtDate.getFullYear()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest member and organization activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.slice(0, 3).map((member) => (
              <div key={member.id} className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>
                  <strong>{member.user.name || member.user.username}</strong> joined the organization
                </span>
                <span className="text-muted-foreground">
                  {member.joinedAt.toLocaleDateString()}
                </span>
              </div>
            ))}
            
            {invitations.slice(0, 2).map((invitation) => (
              <div key={invitation.id} className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                <span>
                  Invitation sent to <strong>{invitation.invitee}</strong>
                </span>
                <span className="text-muted-foreground">
                  {invitation.createdAtDate.toLocaleDateString()}
                </span>
              </div>
            ))}

            {members.length === 0 && invitations.length === 0 && (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Member Management</span>
            </CardTitle>
            <CardDescription>
              Invite new members and manage existing ones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Active members</span>
              <Badge>{stats?.activeMembers || 0}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Pending invitations</span>
              <Badge variant="secondary">{organization.pendingInvitations}</Badge>
            </div>
            <Button className="w-full" asChild>
              <a href="/profile/organization/members">
                Manage Members
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Organization Settings</span>
            </CardTitle>
            <CardDescription>
              Configure your organization preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Visibility</span>
              <Badge variant={organization.customData?.isPublic ? "default" : "outline"}>
                {organization.customData?.isPublic ? "Public" : "Private"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">MFA Required</span>
              <Badge variant={organization.isMfaRequired ? "default" : "outline"}>
                {organization.isMfaRequired ? "Yes" : "No"}
              </Badge>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <a href="/profile/organization/settings">
                Organization Settings
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {organization.pendingInvitations > 5 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {organization.pendingInvitations} pending invitations that may need attention.
          </AlertDescription>
        </Alert>
      )}

      {stats && (stats.storageUsed / stats.storageLimit) > 0.8 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your organization is using {Math.round((stats.storageUsed / stats.storageLimit) * 100)}% 
            of available storage. Consider upgrading your plan.
          </AlertDescription>
        </Alert>
      )}

      {operationState.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {operationState.error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default function OrganizationPage() {
  return (
    <div className="container mx-auto py-6">
      <OrganizationProvider organizationId={MOCK_ORGANIZATION_ID}>
        <OrganizationOverview />
      </OrganizationProvider>
    </div>
  )
}