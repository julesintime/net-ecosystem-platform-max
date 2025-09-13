"use client"

import * as React from "react"
import { MoreHorizontal, Shield, Mail, Copy, UserX, AlertTriangle } from "lucide-react"

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
import { useToast } from "@/hooks/use-toast"

import { OrganizationMemberWithUser } from "@/lib/types/organization"

interface MemberActionsProps {
  member: OrganizationMemberWithUser
  onEditRoles?: (member: OrganizationMemberWithUser) => void
  onRemoveMember?: (member: OrganizationMemberWithUser) => void
  onSendMessage?: (member: OrganizationMemberWithUser) => void
  canManageMember?: boolean
  isCurrentUser?: boolean
}

export function MemberActions({
  member,
  onEditRoles,
  onRemoveMember,
  onSendMessage,
  canManageMember = true,
  isCurrentUser = false,
}: MemberActionsProps) {
  const [showRemoveDialog, setShowRemoveDialog] = React.useState(false)
  const { toast } = useToast()

  const handleCopyEmail = async () => {
    if (member.user.primaryEmail) {
      try {
        await navigator.clipboard.writeText(member.user.primaryEmail)
        toast({
          title: "Email copied",
          description: "Member's email address has been copied to clipboard.",
        })
      } catch (error) {
        toast({
          title: "Failed to copy",
          description: "Unable to copy email address to clipboard.",
          variant: "destructive",
        })
      }
    }
  }

  const handleCopyMemberId = async () => {
    try {
      await navigator.clipboard.writeText(member.id)
      toast({
        title: "Member ID copied",
        description: "Member ID has been copied to clipboard.",
      })
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Unable to copy member ID to clipboard.",
        variant: "destructive",
      })
    }
  }

  const handleRemoveMember = () => {
    setShowRemoveDialog(false)
    onRemoveMember?.(member)
  }

  // Check if member is admin
  const isAdmin = member.organizationRoles.some(role => role.name.toLowerCase() === 'admin')
  const memberName = member.user.name || member.user.username || 'Unknown Member'

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Member Actions</DropdownMenuLabel>
          
          {/* Copy Actions */}
          <DropdownMenuItem onClick={handleCopyEmail} disabled={!member.user.primaryEmail}>
            <Copy className="mr-2 h-4 w-4" />
            Copy email
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyMemberId}>
            <Copy className="mr-2 h-4 w-4" />
            Copy member ID
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Management Actions */}
          {canManageMember && !isCurrentUser && (
            <>
              <DropdownMenuItem onClick={() => onEditRoles?.(member)}>
                <Shield className="mr-2 h-4 w-4" />
                Edit roles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSendMessage?.(member)}>
                <Mail className="mr-2 h-4 w-4" />
                Send message
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => setShowRemoveDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <UserX className="mr-2 h-4 w-4" />
                Remove member
              </DropdownMenuItem>
            </>
          )}

          {/* Self Actions */}
          {isCurrentUser && (
            <DropdownMenuItem 
              onClick={() => setShowRemoveDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <UserX className="mr-2 h-4 w-4" />
              Leave organization
            </DropdownMenuItem>
          )}

          {/* Disabled Actions for Current User */}
          {isCurrentUser && canManageMember && (
            <>
              <DropdownMenuItem disabled>
                <Shield className="mr-2 h-4 w-4" />
                Edit roles (self)
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Remove/Leave Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span>
                {isCurrentUser ? 'Leave Organization' : 'Remove Member'}
              </span>
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {isCurrentUser 
                  ? 'Are you sure you want to leave this organization? You will lose access to all organization resources and data.'
                  : `Are you sure you want to remove ${memberName} from this organization? They will lose access to all organization resources and data.`
                }
              </p>
              
              {isAdmin && (
                <div className="rounded-md bg-destructive/10 p-3">
                  <p className="text-sm font-medium text-destructive">
                    <AlertTriangle className="inline mr-1 h-4 w-4" />
                    Warning: This member has admin privileges
                  </p>
                  <p className="text-sm text-destructive mt-1">
                    Removing an admin member may affect organization management capabilities.
                  </p>
                </div>
              )}
              
              <p className="text-sm font-medium">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCurrentUser ? 'Leave Organization' : 'Remove Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}