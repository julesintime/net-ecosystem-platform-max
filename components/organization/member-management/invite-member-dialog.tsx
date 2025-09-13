"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { X, Plus, Mail } from "lucide-react"

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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import { InviteMemberFormData, isValidEmail, BUILT_IN_ROLES } from "@/lib/types/organization"

// Form validation schema
const inviteMemberSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  roleIds: z.array(z.string()).min(1, "Please select at least one role"),
  message: z.string().optional(),
  sendEmail: z.boolean().default(true),
})

type InviteMemberFormValues = z.infer<typeof inviteMemberSchema>

interface InviteMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInviteMember: (data: InviteMemberFormData) => Promise<void>
  isLoading?: boolean
}

// Mock roles data - in real implementation, fetch from API
const MOCK_ROLES = [
  { id: "admin", name: "Admin", description: "Full access to organization settings and member management" },
  { id: "member", name: "Member", description: "Standard access to organization resources" },
  { id: "guest", name: "Guest", description: "Limited read-only access" },
]

export function InviteMemberDialog({
  open,
  onOpenChange,
  onInviteMember,
  isLoading = false,
}: InviteMemberDialogProps) {
  const [emailInput, setEmailInput] = React.useState("")
  const [emailList, setEmailList] = React.useState<string[]>([])
  const [isBulkMode, setIsBulkMode] = React.useState(false)

  const form = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: "",
      roleIds: ["member"], // Default to member role
      message: "",
      sendEmail: true,
    },
  })

  // Handle adding email to list for bulk invite
  const handleAddEmail = () => {
    const email = emailInput.trim()
    if (isValidEmail(email) && !emailList.includes(email)) {
      setEmailList(prev => [...prev, email])
      setEmailInput("")
    }
  }

  // Handle removing email from list
  const handleRemoveEmail = (emailToRemove: string) => {
    setEmailList(prev => prev.filter(email => email !== emailToRemove))
  }

  // Handle key press in email input
  const handleEmailKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAddEmail()
    }
  }

  // Handle form submission
  const onSubmit = async (values: InviteMemberFormValues) => {
    try {
      if (isBulkMode && emailList.length > 0) {
        // Bulk invite mode
        for (const email of emailList) {
          await onInviteMember({
            email,
            roleIds: values.roleIds,
            message: values.message,
            sendEmail: values.sendEmail,
          })
        }
      } else {
        // Single invite mode
        await onInviteMember(values)
      }
      
      // Reset form and close dialog
      form.reset()
      setEmailList([])
      setEmailInput("")
      setIsBulkMode(false)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to invite member:', error)
    }
  }

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      form.reset()
      setEmailList([])
      setEmailInput("")
      setIsBulkMode(false)
    }
  }, [open, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Invite Member{isBulkMode ? 's' : ''}</DialogTitle>
          <DialogDescription>
            {isBulkMode 
              ? "Add multiple email addresses to invite several members at once."
              : "Send an invitation to join your organization."
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Bulk Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-medium">Bulk Invite</span>
                <p className="text-xs text-muted-foreground">
                  Invite multiple members at once
                </p>
              </div>
              <Switch
                checked={isBulkMode}
                onCheckedChange={setIsBulkMode}
              />
            </div>

            <Separator />

            {/* Email Input */}
            {isBulkMode ? (
              <div className="space-y-3">
                <FormLabel>Email Addresses</FormLabel>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Enter email address..."
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onKeyDown={handleEmailKeyPress}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddEmail}
                      disabled={!isValidEmail(emailInput.trim()) || emailList.includes(emailInput.trim())}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Email List */}
                  {emailList.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {emailList.map((email) => (
                        <Badge key={email} variant="secondary" className="flex items-center gap-1">
                          {email}
                          <button
                            type="button"
                            onClick={() => handleRemoveEmail(email)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    {emailList.length === 0 
                      ? "Add email addresses by typing and pressing Enter or comma"
                      : `${emailList.length} email${emailList.length === 1 ? '' : 's'} added`
                    }
                  </p>
                </div>
              </div>
            ) : (
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="member@company.com" 
                        type="email"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      The email address of the person you want to invite.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Role Selection */}
            <FormField
              control={form.control}
              name="roleIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Roles</FormLabel>
                  <FormDescription>
                    Select the roles to assign to the invited member{isBulkMode ? 's' : ''}.
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
                        <div className="flex items-start space-x-3">
                          <div className={`mt-0.5 h-4 w-4 rounded border-2 flex items-center justify-center ${
                            field.value.includes(role.id)
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground'
                          }`}>
                            {field.value.includes(role.id) && (
                              <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{role.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {role.description}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Personal Message */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Welcome to our team! We're excited to have you join us..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Add a personal message to include in the invitation email.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Send Email Toggle */}
            <FormField
              control={form.control}
              name="sendEmail"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Send Email Invitation</FormLabel>
                    <FormDescription>
                      Send an email notification to the invited member{isBulkMode ? 's' : ''}.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

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
                disabled={isLoading || (isBulkMode && emailList.length === 0)}
              >
                {isLoading ? (
                  "Sending..."
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    {isBulkMode 
                      ? `Invite ${emailList.length} Member${emailList.length === 1 ? '' : 's'}`
                      : "Send Invitation"
                    }
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}