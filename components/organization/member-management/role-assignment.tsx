"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Shield, Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { 
  OrganizationMemberWithUser, 
  OrganizationRoleWithDetails,
  UpdateMemberFormData,
  ORGANIZATION_PERMISSIONS,
  getMemberPermissions,
  formatMemberRole,
} from "@/lib/types/organization"

// Form validation schema
const roleAssignmentSchema = z.object({
  roleIds: z.array(z.string()).min(1, "Please select at least one role"),
})

type RoleAssignmentFormValues = z.infer<typeof roleAssignmentSchema>

interface RoleAssignmentProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: OrganizationMemberWithUser | null
  onUpdateRoles: (memberId: string, data: UpdateMemberFormData) => Promise<void>
  isLoading?: boolean
}

// Mock roles data with permissions - in real implementation, fetch from API
const MOCK_ROLES: OrganizationRoleWithDetails[] = [
  {
    id: "admin",
    name: "Admin",
    description: "Full administrative access",
    permissions: [
      ORGANIZATION_PERMISSIONS.MANAGE_MEMBERS,
      ORGANIZATION_PERMISSIONS.MANAGE_ROLES,
      ORGANIZATION_PERMISSIONS.MANAGE_SETTINGS,
      ORGANIZATION_PERMISSIONS.MANAGE_BILLING,
      ORGANIZATION_PERMISSIONS.DELETE_ORGANIZATION,
      ORGANIZATION_PERMISSIONS.VIEW_ANALYTICS,
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
    permissions: [
      ORGANIZATION_PERMISSIONS.VIEW_ANALYTICS,
    ],
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
]

function getPermissionLabel(permission: string): string {
  switch (permission) {
    case ORGANIZATION_PERMISSIONS.MANAGE_MEMBERS:
      return "Manage Members"
    case ORGANIZATION_PERMISSIONS.MANAGE_ROLES:
      return "Manage Roles"
    case ORGANIZATION_PERMISSIONS.MANAGE_SETTINGS:
      return "Manage Settings"
    case ORGANIZATION_PERMISSIONS.MANAGE_BILLING:
      return "Manage Billing"
    case ORGANIZATION_PERMISSIONS.DELETE_ORGANIZATION:
      return "Delete Organization"
    case ORGANIZATION_PERMISSIONS.VIEW_ANALYTICS:
      return "View Analytics"
    default:
      return permission
  }
}

export function RoleAssignment({
  open,
  onOpenChange,
  member,
  onUpdateRoles,
  isLoading = false,
}: RoleAssignmentProps) {
  const form = useForm<RoleAssignmentFormValues>({
    resolver: zodResolver(roleAssignmentSchema),
    defaultValues: {
      roleIds: [],
    },
  })

  // Update form when member changes
  React.useEffect(() => {
    if (member) {
      form.reset({
        roleIds: member.organizationRoles.map(role => role.id),
      })
    }
  }, [member, form])

  // Calculate effective permissions from selected roles
  const selectedRoleIds = form.watch("roleIds")
  const selectedRoles = MOCK_ROLES.filter(role => selectedRoleIds.includes(role.id))
  const effectivePermissions = getMemberPermissions(selectedRoles)

  // Handle form submission
  const onSubmit = async (values: RoleAssignmentFormValues) => {
    if (!member) return

    try {
      await onUpdateRoles(member.id, {
        roleIds: values.roleIds,
      })
      
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to update member roles:', error)
    }
  }

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      form.reset()
    }
  }, [open, form])

  if (!member) return null

  const currentRoleText = formatMemberRole(member.organizationRoles)
  const hasChanges = JSON.stringify(selectedRoleIds.sort()) !== 
    JSON.stringify(member.organizationRoles.map(r => r.id).sort())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Member Roles</DialogTitle>
          <DialogDescription>
            Update the roles and permissions for this organization member.
          </DialogDescription>
        </DialogHeader>

        {/* Member Info */}
        <div className="flex items-center space-x-4 rounded-lg border p-4">
          <Avatar>
            <AvatarImage src={member.user.avatar} alt={member.user.name || "User"} />
            <AvatarFallback>
              {member.user.name 
                ? member.user.name.split(' ').map(n => n[0]).join('').toUpperCase() 
                : 'U'
              }
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h4 className="font-medium">{member.user.name || member.user.username || 'Unknown'}</h4>
            <p className="text-sm text-muted-foreground">{member.user.primaryEmail}</p>
            <div className="mt-1">
              <Badge variant="outline">Current: {currentRoleText}</Badge>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Role Selection */}
            <FormField
              control={form.control}
              name="roleIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Roles</FormLabel>
                  <FormDescription>
                    Select one or more roles to assign to this member.
                  </FormDescription>
                  
                  <div className="space-y-3">
                    {MOCK_ROLES.map((role) => (
                      <div
                        key={role.id}
                        className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                          field.value.includes(role.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted/50'
                        }`}
                        onClick={() => {
                          const newValue = field.value.includes(role.id)
                            ? field.value.filter(id => id !== role.id)
                            : [...field.value, role.id]
                          field.onChange(newValue)
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`mt-1 h-4 w-4 rounded border-2 flex items-center justify-center ${
                            field.value.includes(role.id)
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground'
                          }`}>
                            {field.value.includes(role.id) && (
                              <Check className="h-3 w-3 text-primary-foreground" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium flex items-center space-x-2">
                                  <span>{role.name}</span>
                                  {role.isBuiltIn && (
                                    <Badge variant="secondary" className="text-xs">Built-in</Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {role.description}
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {role.memberCount} member{role.memberCount === 1 ? '' : 's'}
                              </div>
                            </div>
                            
                            {/* Role Permissions */}
                            {role.permissions.length > 0 && (
                              <div className="mt-2">
                                <div className="text-xs font-medium text-muted-foreground mb-1">
                                  Permissions:
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {role.permissions.map((permission) => (
                                    <Badge key={permission} variant="outline" className="text-xs">
                                      {getPermissionLabel(permission)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Effective Permissions Summary */}
            {selectedRoles.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Effective Permissions</span>
                </h4>
                
                {effectivePermissions.size > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {Array.from(effectivePermissions).map((permission) => (
                      <Badge key={permission} variant="default" className="text-xs">
                        {getPermissionLabel(permission)}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No special permissions granted.
                  </p>
                )}
              </div>
            )}

            {/* Warning for Admin Role */}
            {selectedRoleIds.includes("admin") && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Admin Role:</strong> This member will have full administrative access, 
                  including the ability to manage all members, roles, and organization settings.
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !hasChanges}
              >
                {isLoading ? "Updating..." : "Update Roles"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}