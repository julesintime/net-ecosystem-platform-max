"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { AlertTriangle, Trash2, ArrowRight, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

import { OrganizationWithStats } from "@/lib/types/organization"

// Form schemas
const transferOwnershipSchema = z.object({
  newOwnerId: z.string().min(1, "Please select a new owner"),
  confirmationText: z.string().min(1, "Please type the confirmation text"),
})

const deleteOrganizationSchema = z.object({
  confirmationText: z.string().min(1, "Please type the organization name to confirm"),
})

type TransferOwnershipFormValues = z.infer<typeof transferOwnershipSchema>
type DeleteOrganizationFormValues = z.infer<typeof deleteOrganizationSchema>

interface OrganizationDangerProps {
  organization: OrganizationWithStats
  onTransferOwnership?: (newOwnerId: string) => Promise<void>
  onDeleteOrganization?: () => Promise<void>
  onLeaveOrganization?: () => Promise<void>
  currentUserIsOwner?: boolean
  isLoading?: boolean
}

// Mock admin members for transfer
const MOCK_ADMIN_MEMBERS = [
  { id: "admin1", name: "John Smith", email: "john@company.com" },
  { id: "admin2", name: "Sarah Johnson", email: "sarah@company.com" },
  { id: "admin3", name: "Mike Wilson", email: "mike@company.com" },
]

export function OrganizationDanger({
  organization,
  onTransferOwnership,
  onDeleteOrganization,
  onLeaveOrganization,
  currentUserIsOwner = false,
  isLoading = false,
}: OrganizationDangerProps) {
  const [showTransferDialog, setShowTransferDialog] = React.useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = React.useState(false)
  const { toast } = useToast()

  const transferForm = useForm<TransferOwnershipFormValues>({
    resolver: zodResolver(transferOwnershipSchema),
    defaultValues: {
      newOwnerId: "",
      confirmationText: "",
    },
  })

  const deleteForm = useForm<DeleteOrganizationFormValues>({
    resolver: zodResolver(deleteOrganizationSchema),
    defaultValues: {
      confirmationText: "",
    },
  })

  const handleTransferOwnership = async (values: TransferOwnershipFormValues) => {
    if (values.confirmationText !== "transfer ownership") {
      transferForm.setError("confirmationText", {
        message: 'Please type "transfer ownership" to confirm'
      })
      return
    }

    try {
      await onTransferOwnership?.(values.newOwnerId)
      setShowTransferDialog(false)
      transferForm.reset()
    } catch (error) {
      console.error('Failed to transfer ownership:', error)
    }
  }

  const handleDeleteOrganization = async (values: DeleteOrganizationFormValues) => {
    if (values.confirmationText !== organization.name) {
      deleteForm.setError("confirmationText", {
        message: `Please type "${organization.name}" to confirm`
      })
      return
    }

    try {
      await onDeleteOrganization?.()
      setShowDeleteDialog(false)
      deleteForm.reset()
    } catch (error) {
      console.error('Failed to delete organization:', error)
    }
  }

  const handleLeaveOrganization = async () => {
    try {
      await onLeaveOrganization?.()
      setShowLeaveDialog(false)
    } catch (error) {
      console.error('Failed to leave organization:', error)
    }
  }

  const copyOrganizationId = async () => {
    try {
      await navigator.clipboard.writeText(organization.id)
      toast({
        title: "Organization ID copied",
        description: "The organization ID has been copied to your clipboard.",
      })
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Unable to copy organization ID to clipboard.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
        <p className="text-sm text-muted-foreground">
          Irreversible and destructive actions for this organization.
        </p>
      </div>

      {/* Organization Info */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-base">Organization Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Organization ID:</span>
            <div className="flex items-center space-x-2">
              <code className="text-xs bg-muted px-2 py-1 rounded">{organization.id}</code>
              <Button variant="ghost" size="sm" onClick={copyOrganizationId}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Created:</span>
            <span className="text-sm text-muted-foreground">
              {organization.createdAtDate.toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Members:</span>
            <Badge variant="outline">{organization.memberCount}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Transfer Ownership */}
      {currentUserIsOwner && MOCK_ADMIN_MEMBERS.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-700">
              <ArrowRight className="h-5 w-5" />
              <span>Transfer Ownership</span>
            </CardTitle>
            <CardDescription>
              Transfer ownership of this organization to another admin member. 
              You will lose owner privileges but remain as an admin member.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => setShowTransferDialog(true)}
              className="border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              Transfer Organization Ownership
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Leave Organization */}
      {!currentUserIsOwner && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-700">
              <ArrowRight className="h-5 w-5" />
              <span>Leave Organization</span>
            </CardTitle>
            <CardDescription>
              Leave this organization. You will lose access to all organization resources 
              and need to be re-invited to regain access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => setShowLeaveDialog(true)}
              className="border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              Leave Organization
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Organization */}
      {currentUserIsOwner && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              <span>Delete Organization</span>
            </CardTitle>
            <CardDescription>
              Permanently delete this organization and all of its contents. 
              This action is not reversible, so please continue with caution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>This action cannot be undone.</strong> This will permanently delete 
                the organization, all member access, and all associated data.
              </AlertDescription>
            </Alert>
            
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Organization
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Transfer Ownership Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-orange-700">Transfer Organization Ownership</DialogTitle>
            <DialogDescription>
              Transfer ownership of "{organization.name}" to another admin member.
            </DialogDescription>
          </DialogHeader>

          <Form {...transferForm}>
            <form onSubmit={transferForm.handleSubmit(handleTransferOwnership)} className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  After transferring ownership:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>You will no longer be the organization owner</li>
                    <li>You will remain as an admin member</li>
                    <li>The new owner will have full control over the organization</li>
                    <li>This action cannot be undone by you</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <FormField
                control={transferForm.control}
                name="newOwnerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Owner</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an admin member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MOCK_ADMIN_MEMBERS.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex flex-col">
                              <span>{member.name}</span>
                              <span className="text-xs text-muted-foreground">{member.email}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select an admin member who will become the new organization owner.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={transferForm.control}
                name="confirmationText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Type <code className="text-sm bg-muted px-1 rounded">transfer ownership</code> to confirm
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="transfer ownership" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTransferDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isLoading}
                >
                  {isLoading ? "Transferring..." : "Transfer Ownership"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Organization Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Delete Organization
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Are you absolutely sure you want to delete "{organization.name}"?
                </p>
                
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This action will:
                    <ul className="list-disc list-inside mt-1">
                      <li>Permanently delete the organization</li>
                      <li>Remove access for all {organization.memberCount} members</li>
                      <li>Delete all organization data and settings</li>
                      <li>Cannot be undone</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <Form {...deleteForm}>
                  <form className="space-y-3">
                    <FormField
                      control={deleteForm.control}
                      name="confirmationText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Type <code className="text-sm bg-muted px-1 rounded">{organization.name}</code> to confirm
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={organization.name} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteForm.handleSubmit(handleDeleteOrganization)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete Organization"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Organization Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave "{organization.name}"? You will lose access 
              to all organization resources and will need to be re-invited to regain access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveOrganization}
              className="bg-orange-600 text-white hover:bg-orange-700"
              disabled={isLoading}
            >
              {isLoading ? "Leaving..." : "Leave Organization"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}