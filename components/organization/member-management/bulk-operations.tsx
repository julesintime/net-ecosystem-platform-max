"use client"

import * as React from "react"
import { UserPlus, UserX, Shield, Mail, Download, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

import { OrganizationMemberWithUser, BulkInviteFormData } from "@/lib/types/organization"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

// Mock roles for bulk assignment
const MOCK_ROLES = [
  { id: "admin", name: "Admin" },
  { id: "member", name: "Member" },
  { id: "guest", name: "Guest" },
]

const bulkRoleAssignmentSchema = z.object({
  roleIds: z.array(z.string()).min(1, "Please select at least one role"),
})

type BulkRoleAssignmentFormValues = z.infer<typeof bulkRoleAssignmentSchema>

interface BulkOperationsProps {
  selectedMembers: string[]
  members: OrganizationMemberWithUser[]
  onBulkRemove: (memberIds: string[]) => Promise<void>
  onBulkRoleUpdate?: (memberIds: string[], roleIds: string[]) => Promise<void>
  onBulkInvite?: (data: BulkInviteFormData) => Promise<void>
  onExportMembers?: () => void
  onImportMembers?: () => void
  isLoading?: boolean
}

export function BulkOperations({
  selectedMembers,
  members,
  onBulkRemove,
  onBulkRoleUpdate,
  onBulkInvite,
  onExportMembers,
  onImportMembers,
  isLoading = false,
}: BulkOperationsProps) {
  const [showRemoveDialog, setShowRemoveDialog] = React.useState(false)
  const [showRoleDialog, setShowRoleDialog] = React.useState(false)
  const [showBulkInviteDialog, setShowBulkInviteDialog] = React.useState(false)

  const selectedMemberObjects = members.filter(member => selectedMembers.includes(member.id))
  const hasAdmins = selectedMemberObjects.some(member => 
    member.organizationRoles.some(role => role.name.toLowerCase() === 'admin')
  )

  const bulkRoleForm = useForm<BulkRoleAssignmentFormValues>({
    resolver: zodResolver(bulkRoleAssignmentSchema),
    defaultValues: {
      roleIds: ["member"],
    },
  })

  const handleBulkRemove = async () => {
    setShowRemoveDialog(false)
    await onBulkRemove(selectedMembers)
  }

  const handleBulkRoleUpdate = async (values: BulkRoleAssignmentFormValues) => {
    setShowRoleDialog(false)
    if (onBulkRoleUpdate) {
      await onBulkRoleUpdate(selectedMembers, values.roleIds)
    }
  }

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Roles', 'Status', 'Joined Date']
    const csvData = selectedMemberObjects.map(member => [
      member.user.name || member.user.username || 'Unknown',
      member.user.primaryEmail || '',
      member.organizationRoles.map(r => r.name).join('; '),
      member.status,
      member.joinedAt.toISOString().split('T')[0]
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `organization-members-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (selectedMembers.length === 0) {
    return null
  }

  return (
    <>
      <div className="flex items-center space-x-2">
        <Badge variant="secondary">
          {selectedMembers.length} selected
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Bulk Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Member Actions</DropdownMenuLabel>
            
            <DropdownMenuItem onClick={() => setShowRoleDialog(true)}>
              <Shield className="mr-2 h-4 w-4" />
              Update roles
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => {}/* Send bulk message */}>
              <Mail className="mr-2 h-4 w-4" />
              Send message
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export selected
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={() => setShowRemoveDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <UserX className="mr-2 h-4 w-4" />
              Remove selected
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Additional quick actions */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowBulkInviteDialog(true)}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Bulk Invite
        </Button>

        {onExportMembers && (
          <Button variant="outline" size="sm" onClick={onExportMembers}>
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
        )}

        {onImportMembers && (
          <Button variant="outline" size="sm" onClick={onImportMembers}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
        )}
      </div>

      {/* Bulk Remove Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Selected Members</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to remove {selectedMembers.length} member
                {selectedMembers.length === 1 ? '' : 's'} from this organization?
              </p>
              
              {hasAdmins && (
                <div className="rounded-md bg-destructive/10 p-3">
                  <p className="text-sm font-medium text-destructive">
                    Warning: Admin members are selected
                  </p>
                  <p className="text-sm text-destructive mt-1">
                    Removing admin members may affect organization management capabilities.
                  </p>
                </div>
              )}
              
              <div className="max-h-32 overflow-y-auto">
                <p className="text-sm font-medium mb-2">Selected members:</p>
                <div className="space-y-1">
                  {selectedMemberObjects.map(member => (
                    <div key={member.id} className="text-sm flex items-center justify-between">
                      <span>{member.user.name || member.user.username || 'Unknown'}</span>
                      <Badge variant="outline" className="text-xs">
                        {member.organizationRoles.map(r => r.name).join(', ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              <p className="text-sm font-medium">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove {selectedMembers.length} Member{selectedMembers.length === 1 ? '' : 's'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Role Assignment Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Roles for Selected Members</DialogTitle>
            <DialogDescription>
              Assign new roles to {selectedMembers.length} selected member
              {selectedMembers.length === 1 ? '' : 's'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="max-h-32 overflow-y-auto">
              <p className="text-sm font-medium mb-2">Selected members:</p>
              <div className="space-y-1">
                {selectedMemberObjects.map(member => (
                  <div key={member.id} className="text-sm flex items-center justify-between">
                    <span>{member.user.name || member.user.username || 'Unknown'}</span>
                    <Badge variant="outline" className="text-xs">
                      Current: {member.organizationRoles.map(r => r.name).join(', ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <Form {...bulkRoleForm}>
              <form onSubmit={bulkRoleForm.handleSubmit(handleBulkRoleUpdate)} className="space-y-4">
                <FormField
                  control={bulkRoleForm.control}
                  name="roleIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Roles</FormLabel>
                      <FormDescription>
                        These roles will replace the current roles for all selected members.
                      </FormDescription>
                      <div className="space-y-2">
                        {MOCK_ROLES.map((role) => (
                          <div
                            key={role.id}
                            className={`cursor-pointer rounded-lg border p-3 transition-colors ${
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
                            <div className="flex items-center space-x-3">
                              <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${
                                field.value.includes(role.id)
                                  ? 'border-primary bg-primary'
                                  : 'border-muted-foreground'
                              }`}>
                                {field.value.includes(role.id) && (
                                  <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                                )}
                              </div>
                              <div className="font-medium">{role.name}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowRoleDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Updating..." : "Update Roles"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Invite Dialog would go here - simplified for now */}
      <Dialog open={showBulkInviteDialog} onOpenChange={setShowBulkInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Invite Members</DialogTitle>
            <DialogDescription>
              Import a CSV file or paste email addresses to invite multiple members at once.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center py-8">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Bulk invite functionality coming soon.
                <br />
                Use the individual invite dialog for now.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowBulkInviteDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}