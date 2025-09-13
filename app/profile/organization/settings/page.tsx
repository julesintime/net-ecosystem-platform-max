"use client"

import * as React from "react"
import { ArrowLeft, Settings, Shield, BarChart3, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

import { OrganizationProvider, useOrganizationContext } from "@/components/organization/organization-context"
import { OrganizationProfileFormData } from "@/lib/types/organization"
import { OrganizationProfile } from "@/components/organization/settings/organization-profile"
import { OrganizationDanger } from "@/components/organization/settings/organization-danger"
import { UsageMetrics } from "@/components/organization/settings/usage-metrics"

// Mock organization ID - in real implementation, get from auth context or URL
const MOCK_ORGANIZATION_ID = "org_123456789"

function OrganizationSettingsContent() {
  const [activeTab, setActiveTab] = React.useState("profile")

  const {
    organization,
    stats,
    operationState,
    updateOrganization,
    deleteOrganization,
    leaveOrganization,
  } = useOrganizationContext()

  const handleUpdateOrganization = async (data: OrganizationProfileFormData) => {
    await updateOrganization(data)
  }

  const handleDeleteOrganization = async () => {
    if (confirm("Are you absolutely sure? This cannot be undone.")) {
      await deleteOrganization()
      // Redirect to home or organization list
      window.location.href = "/"
    }
  }

  const handleLeaveOrganization = async () => {
    if (confirm("Are you sure you want to leave this organization?")) {
      await leaveOrganization()
      // Redirect to home or organization list
      window.location.href = "/"
    }
  }

  const handleTransferOwnership = async (newOwnerId: string) => {
    // Implementation would go here
    console.log("Transfer ownership to:", newOwnerId)
  }

  // Mock current user permissions - in real implementation, get from auth context
  const currentUserIsOwner = true
  const canManageSettings = true

  if (!organization) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <a href="/profile/organization">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Organization
            </a>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

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
            <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
            <p className="text-muted-foreground">
              Manage settings for {organization.name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={organization.customData?.isPublic ? "default" : "secondary"}>
            {organization.customData?.isPublic ? "Public" : "Private"}
          </Badge>
          {organization.isMfaRequired && (
            <Badge variant="outline">
              <Shield className="h-3 w-3 mr-1" />
              MFA Required
            </Badge>
          )}
        </div>
      </div>

      {/* Permission Check */}
      {!canManageSettings && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don&apos;t have permission to modify organization settings. 
            Contact an organization admin for access.
          </AlertDescription>
        </Alert>
      )}

      {/* Operation State */}
      {operationState.error && (
        <Alert variant="destructive">
          <AlertDescription>
            {operationState.error}
          </AlertDescription>
        </Alert>
      )}

      {operationState.isLoading && (
        <Alert>
          <AlertDescription>
            Processing your request...
          </AlertDescription>
        </Alert>
      )}

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="danger" className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Danger Zone</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <OrganizationProfile
            organization={organization}
            onUpdate={handleUpdateOrganization}
            isLoading={operationState.isLoading}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {stats ? (
            <UsageMetrics
              stats={stats}
              organizationName={organization.name}
            />
          ) : (
            <Alert>
              <AlertDescription>
                Loading analytics data...
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Security Settings</h3>
            <p className="text-sm text-muted-foreground">
              Configure security policies and access controls for your organization.
            </p>
          </div>

          <Separator />

          <div className="grid gap-6">
            {/* MFA Settings */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Multi-Factor Authentication</h4>
                <p className="text-sm text-muted-foreground">
                  Current status: {organization.isMfaRequired ? "Required for all members" : "Optional"}
                </p>
              </div>
              
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  {organization.isMfaRequired 
                    ? "All organization members are required to enable MFA on their accounts."
                    : "Members can optionally enable MFA on their accounts."
                  }
                </AlertDescription>
              </Alert>
            </div>

            {/* Access Controls */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Access Controls</h4>
                <p className="text-sm text-muted-foreground">
                  Control who can join and access your organization.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Public Organization</span>
                    <Badge variant={organization.customData?.isPublic ? "default" : "outline"}>
                      {organization.customData?.isPublic ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {organization.customData?.isPublic 
                      ? "Your organization is visible in public directories."
                      : "Your organization is private and not publicly visible."
                    }
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Public Join</span>
                    <Badge variant={organization.customData?.allowPublicJoin ? "default" : "outline"}>
                      {organization.customData?.allowPublicJoin ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {organization.customData?.allowPublicJoin
                      ? "Anyone can request to join your organization."
                      : "Users need an invitation to join your organization."
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Session Management */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Session Management</h4>
                <p className="text-sm text-muted-foreground">
                  Configure session timeouts and security policies.
                </p>
              </div>
              
              <Alert>
                <AlertDescription>
                  Advanced session management features are coming soon. Contact support for enterprise session controls.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="danger" className="space-y-6">
          <OrganizationDanger
            organization={organization}
            onTransferOwnership={handleTransferOwnership}
            onDeleteOrganization={handleDeleteOrganization}
            onLeaveOrganization={handleLeaveOrganization}
            currentUserIsOwner={currentUserIsOwner}
            isLoading={operationState.isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function OrganizationSettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <OrganizationProvider organizationId={MOCK_ORGANIZATION_ID}>
        <OrganizationSettingsContent />
      </OrganizationProvider>
    </div>
  )
}