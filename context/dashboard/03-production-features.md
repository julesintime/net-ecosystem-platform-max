# Production-Ready Features: Advanced Organization Management & OAuth Platform

## Overview

This guide implements advanced features for production-ready multi-tenant SaaS applications, including comprehensive organization management, member invitation system, OAuth provider functionality, and third-party application marketplace.

## Prerequisites

- Completed **01-foundation-setup.md** and **02-logto-integration.md**
- Running Logto instance with organization support
- Basic authentication flow working

## Part A: Advanced Organization Management

### Step 1: Organization Creation Flow

#### Create Organization Creation Form

Create `src/components/organization/create-organization-form.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { LoadingSpinner } from '@/components/ui/loading'
import { useToast } from '@/components/ui/use-toast'
import { createOrganizationSchema, CreateOrganizationData } from '@/lib/validations/auth'
import { slugify } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export function CreateOrganizationForm() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<CreateOrganizationData>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
    },
  })

  // Auto-generate slug from name
  const watchedName = form.watch('name')
  React.useEffect(() => {
    if (watchedName && !form.formState.dirtyFields.slug) {
      form.setValue('slug', slugify(watchedName))
    }
  }, [watchedName, form])

  async function onSubmit(data: CreateOrganizationData) {
    setIsLoading(true)
    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create organization')
      }

      const result = await response.json()
      
      toast({
        title: 'Success',
        description: 'Organization created successfully',
      })

      router.push(`/dashboard/organizations/${result.data.id}`)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create organization',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Organization</CardTitle>
        <CardDescription>
          Set up your organization to start inviting members and managing resources.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Acme Corporation" 
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    The display name for your organization.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Slug</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="acme-corporation" 
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    A unique identifier for your organization (used in URLs).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="A brief description of your organization..." 
                      className="resize-none" 
                      rows={3}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Briefly describe your organization's purpose.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                disabled={isLoading}
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Organization'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
```

#### Create Organization Creation Page

Create `src/app/dashboard/organizations/create/page.tsx`:

```tsx
import { CreateOrganizationForm } from '@/components/organization/create-organization-form'

export default function CreateOrganizationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Organization</h1>
        <p className="text-muted-foreground">
          Set up a new organization to manage members and resources.
        </p>
      </div>
      
      <CreateOrganizationForm />
    </div>
  )
}
```

### Step 2: Member Invitation System

#### Create Invitation Form Component

Create `src/components/organization/invite-member-form.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/loading'
import { useToast } from '@/components/ui/use-toast'
import { inviteMemberSchema, InviteMemberData } from '@/lib/validations/auth'
import { UserPlus } from 'lucide-react'

interface InviteMemberFormProps {
  organizationId: string
  onSuccess?: () => void
}

const roleDescriptions = {
  admin: 'Can manage members, settings, and most organization resources',
  developer: 'Can manage applications, API keys, and development resources',
  member: 'Standard access to organization resources and content',
  viewer: 'Read-only access to organization resources',
}

export function InviteMemberForm({ organizationId, onSuccess }: InviteMemberFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<InviteMemberData>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: '',
      role: 'member',
    },
  })

  async function onSubmit(data: InviteMemberData) {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/organizations/${organizationId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to send invitation')
      }

      toast({
        title: 'Invitation sent',
        description: `Invitation sent to ${data.email} successfully`,
      })

      form.reset()
      setIsOpen(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send invitation',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your organization.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="member@example.com" 
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(roleDescriptions).map(([role, description]) => (
                        <SelectItem key={role} value={role}>
                          <div className="flex flex-col">
                            <span className="font-medium capitalize">{role}</span>
                            <span className="text-xs text-muted-foreground">
                              {description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the appropriate role for this member.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Sending...
                  </>
                ) : (
                  'Send Invitation'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

#### Create Members Management Component

Create `src/components/organization/members-table.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'
import { MoreHorizontal, UserMinus, Crown, Shield, User, Eye } from 'lucide-react'
import { OrganizationMember, OrganizationRole } from '@/types/auth'
import { InviteMemberForm } from './invite-member-form'

interface MembersTableProps {
  organizationId: string
  members: OrganizationMember[]
  currentUserRole: OrganizationRole
  currentUserId: string
  onMemberRemoved: () => void
}

const roleIcons = {
  owner: Crown,
  admin: Shield,
  developer: User,
  member: User,
  viewer: Eye,
}

const roleColors = {
  owner: 'destructive',
  admin: 'default',
  developer: 'secondary',
  member: 'outline',
  viewer: 'outline',
} as const

export function MembersTable({ 
  organizationId, 
  members, 
  currentUserRole, 
  currentUserId, 
  onMemberRemoved 
}: MembersTableProps) {
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)
  const { toast } = useToast()

  const canManageMembers = ['owner', 'admin'].includes(currentUserRole)

  async function removeMember(memberId: string) {
    setRemovingMemberId(memberId)
    try {
      const response = await fetch(`/api/organizations/${organizationId}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to remove member')
      }

      toast({
        title: 'Member removed',
        description: 'Member has been removed from the organization',
      })

      onMemberRemoved()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove member',
        variant: 'destructive',
      })
    } finally {
      setRemovingMemberId(null)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            Manage your organization members and their roles.
          </CardDescription>
        </div>
        {canManageMembers && (
          <InviteMemberForm 
            organizationId={organizationId} 
            onSuccess={onMemberRemoved}
          />
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              {canManageMembers && <TableHead className="w-[50px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const RoleIcon = roleIcons[member.role]
              const isCurrentUser = member.userId === currentUserId
              const canRemove = canManageMembers && !isCurrentUser && member.role !== 'owner'
              
              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.user.avatar} />
                        <AvatarFallback>
                          {member.user.name?.[0] || member.user.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.user.name || 'Unknown User'}
                          {isCurrentUser && (
                            <span className="text-xs text-muted-foreground ml-2">(you)</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={roleColors[member.role]} className="flex items-center w-fit">
                      <RoleIcon className="h-3 w-3 mr-1" />
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </TableCell>
                  {canManageMembers && (
                    <TableCell>
                      {canRemove && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <UserMinus className="h-4 w-4 mr-2" />
                                  Remove Member
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Member</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove {member.user.name || member.user.email} 
                                    from the organization? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => removeMember(member.id)}
                                    disabled={removingMemberId === member.id}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {removingMemberId === member.id ? 'Removing...' : 'Remove'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
```

### Step 3: Organization Detail Page

Create `src/app/dashboard/organizations/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { getLogtoContext } from '@logto/next/server-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MembersTable } from '@/components/organization/members-table'
import { logtoConfig } from '@/lib/logto'

interface OrganizationPageProps {
  params: { id: string }
}

export default async function OrganizationPage({ params }: OrganizationPageProps) {
  const { claims } = await getLogtoContext(logtoConfig)
  
  // In a real app, you'd fetch the organization and members from your API
  // For now, we'll use mock data based on the organization ID
  const organizationId = params.id
  
  const organization = {
    id: organizationId,
    name: 'Example Organization',
    description: 'This is a sample organization for demonstration.',
    memberCount: 3,
    createdAt: '2024-01-15T10:00:00Z',
  }

  const members = [
    {
      id: '1',
      userId: claims?.sub || '',
      organizationId,
      role: 'owner' as const,
      user: {
        id: claims?.sub || '',
        email: claims?.email || '',
        name: claims?.name || '',
        avatar: claims?.picture,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      },
      joinedAt: '2024-01-15T10:00:00Z',
    }
  ]

  if (!organization) {
    notFound()
  }

  const currentUserRole = members.find(m => m.userId === claims?.sub)?.role || 'viewer'

  return (
    <div className="space-y-6">
      {/* Organization Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
          <p className="text-muted-foreground">{organization.description}</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {organization.memberCount} member{organization.memberCount !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Organization Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organization.memberCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Your Role</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="text-sm capitalize">
              {currentUserRole}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {new Date(organization.createdAt).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members Management */}
      <MembersTable
        organizationId={organizationId}
        members={members}
        currentUserRole={currentUserRole}
        currentUserId={claims?.sub || ''}
        onMemberRemoved={() => {
          // In a real app, you'd refetch the members data
          window.location.reload()
        }}
      />
    </div>
  )
}
```

## Part B: OAuth Provider & Third-Party Applications

### Step 4: Third-Party Application Management

#### Create Application Form Component

Create `src/components/applications/create-application-form.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { LoadingSpinner } from '@/components/ui/loading'
import { useToast } from '@/components/ui/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Copy, Eye, EyeOff } from 'lucide-react'

const createApplicationSchema = z.object({
  name: z.string().min(2, 'Application name must be at least 2 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  redirectUris: z.string().min(1, 'At least one redirect URI is required'),
  postLogoutRedirectUris: z.string().optional(),
})

type CreateApplicationData = z.infer<typeof createApplicationSchema>

interface CreateApplicationFormProps {
  organizationId?: string
  onSuccess?: (application: any) => void
}

export function CreateApplicationForm({ organizationId, onSuccess }: CreateApplicationFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [createdApp, setCreatedApp] = useState<any>(null)
  const [showSecret, setShowSecret] = useState(false)
  const { toast } = useToast()

  const form = useForm<CreateApplicationData>({
    resolver: zodResolver(createApplicationSchema),
    defaultValues: {
      name: '',
      description: '',
      redirectUris: 'http://localhost:3000/callback',
      postLogoutRedirectUris: 'http://localhost:3000',
    },
  })

  async function onSubmit(data: CreateApplicationData) {
    setIsLoading(true)
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          redirectUris: data.redirectUris.split('\n').filter(uri => uri.trim()),
          postLogoutRedirectUris: data.postLogoutRedirectUris 
            ? data.postLogoutRedirectUris.split('\n').filter(uri => uri.trim())
            : [],
          organizationId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create application')
      }

      const result = await response.json()
      setCreatedApp(result.data)
      
      toast({
        title: 'Application created',
        description: 'Your application has been created successfully',
      })

      onSuccess?.(result.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create application',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: 'Value copied to clipboard',
    })
  }

  if (createdApp) {
    return (
      <Dialog open={true} onOpenChange={() => setCreatedApp(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Application Created Successfully</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Save your client secret now. 
                You won't be able to see it again.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Application Name</label>
                <p className="text-sm text-muted-foreground">{createdApp.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Client ID</label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded-md text-sm">
                    {createdApp.clientId}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(createdApp.clientId)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Client Secret</label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded-md text-sm">
                    {showSecret ? createdApp.clientSecret : '•'.repeat(40)}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(createdApp.clientSecret)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={() => setCreatedApp(null)}
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Application</CardTitle>
        <CardDescription>
          Create a new OAuth application for third-party integrations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Application Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="My Awesome App" 
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    The name users will see when authorizing your application.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="A brief description of your application..." 
                      className="resize-none" 
                      rows={3}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe what your application does.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="redirectUris"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Redirect URIs</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="http://localhost:3000/callback&#10;https://myapp.com/auth/callback"
                      className="resize-none font-mono text-sm" 
                      rows={4}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    One URI per line. Users will be redirected here after authentication.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="postLogoutRedirectUris"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Post-logout Redirect URIs (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="http://localhost:3000&#10;https://myapp.com"
                      className="resize-none font-mono text-sm" 
                      rows={3}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    One URI per line. Users will be redirected here after logout.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Application'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
```

#### Create Applications API Routes

Create `src/app/api/applications/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withPermission } from '@/lib/api-protection'
import { managementApi } from '@/lib/management-api'
import { z } from 'zod'

const createApplicationSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  redirectUris: z.array(z.string().url()),
  postLogoutRedirectUris: z.array(z.string().url()).optional(),
  organizationId: z.string().optional(),
})

export const POST = withPermission('manage:applications')(async (request, context) => {
  try {
    const body = await request.json()
    const validatedData = createApplicationSchema.parse(body)

    // Create third-party application in Logto
    const applicationConfig = {
      name: validatedData.name,
      type: 'ThirdParty', // Critical: must be exactly this value
      description: validatedData.description,
      oidcClientMetadata: {
        redirectUris: validatedData.redirectUris,
        postLogoutRedirectUris: validatedData.postLogoutRedirectUris || [],
        grantTypes: ['authorization_code', 'refresh_token'],
        responseTypes: ['code'],
      },
    }

    const application = await managementApi.createApplication(applicationConfig)

    return NextResponse.json({
      data: {
        id: application.id,
        name: application.name,
        clientId: application.oidcClientMetadata.clientId,
        clientSecret: application.oidcClientMetadata.clientSecret,
        redirectUris: application.oidcClientMetadata.redirectUris,
        createdAt: new Date().toISOString(),
      },
      message: 'Application created successfully'
    })
  } catch (error) {
    console.error('Create application error:', error)
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500 }
    )
  }
})

export const GET = withAuth(async (request, context) => {
  try {
    // Get user's applications from Management API
    const applications = await managementApi.getUserApplications(context.user.id)

    return NextResponse.json({ 
      data: applications.map((app: any) => ({
        id: app.id,
        name: app.name,
        description: app.description,
        clientId: app.oidcClientMetadata.clientId,
        createdAt: app.createdAt,
        // Don't return client secret in list view
      }))
    })
  } catch (error) {
    console.error('Get applications error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    )
  }
})
```

### Step 5: Applications Dashboard

#### Create Applications List Component

Create `src/components/applications/applications-table.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'
import { MoreHorizontal, Trash, Copy, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Application {
  id: string
  name: string
  description?: string
  clientId: string
  createdAt: string
}

interface ApplicationsTableProps {
  applications: Application[]
  onApplicationDeleted: () => void
}

export function ApplicationsTable({ applications, onApplicationDeleted }: ApplicationsTableProps) {
  const [deletingAppId, setDeletingAppId] = useState<string | null>(null)
  const { toast } = useToast()

  async function deleteApplication(appId: string) {
    setDeletingAppId(appId)
    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete application')
      }

      toast({
        title: 'Application deleted',
        description: 'Application has been deleted successfully',
      })

      onApplicationDeleted()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete application',
        variant: 'destructive',
      })
    } finally {
      setDeletingAppId(null)
    }
  }

  function copyClientId(clientId: string) {
    navigator.clipboard.writeText(clientId)
    toast({
      title: 'Copied',
      description: 'Client ID copied to clipboard',
    })
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ExternalLink className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
          <p className="text-muted-foreground text-center mb-4">
            Create your first OAuth application to enable third-party integrations.
          </p>
          <Button asChild>
            <Link href="/dashboard/applications/create">
              Create Application
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Applications</CardTitle>
        <CardDescription>
          Manage your OAuth applications and their credentials.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Application</TableHead>
              <TableHead>Client ID</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => (
              <TableRow key={app.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{app.name}</p>
                    {app.description && (
                      <p className="text-sm text-muted-foreground">
                        {app.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {app.clientId.substring(0, 20)}...
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyClientId(app.clientId)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(app.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/applications/${app.id}`}>
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Application</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{app.name}"? 
                              This will revoke all access tokens and cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteApplication(app.id)}
                              disabled={deletingAppId === app.id}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deletingAppId === app.id ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
```

#### Create Applications Dashboard Page

Create `src/app/dashboard/applications/page.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { ApplicationsTable } from '@/components/applications/applications-table'
import { LoadingPage } from '@/components/ui/loading'
import Link from 'next/link'

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchApplications() {
    try {
      const response = await fetch('/api/applications')
      if (response.ok) {
        const data = await response.json()
        setApplications(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  if (loading) {
    return <LoadingPage />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground">
            Create and manage OAuth applications for third-party integrations.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/applications/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Application
          </Link>
        </Button>
      </div>

      {/* Applications Table */}
      <ApplicationsTable
        applications={applications}
        onApplicationDeleted={fetchApplications}
      />
    </div>
  )
}
```

## Step 6: OAuth Integration Examples

### Create OAuth Example Documentation

Create `src/components/applications/oauth-examples.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface OAuthExamplesProps {
  clientId: string
  redirectUri: string
}

export function OAuthExamples({ clientId, redirectUri }: OAuthExamplesProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('javascript')

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: 'Code copied to clipboard',
    })
  }

  const authUrl = `${process.env.NEXT_PUBLIC_LOGTO_ENDPOINT}/oidc/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=openid%20profile%20email&` +
    `state=random_state_value`

  const examples = {
    javascript: `// JavaScript OAuth Integration
const clientId = '${clientId}';
const redirectUri = '${redirectUri}';
const authUrl = '${authUrl}';

// Redirect user to authorization URL
function signInWithEcosystem() {
  window.location.href = authUrl;
}

// Handle callback (call this on your callback page)
async function handleCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  
  if (code) {
    // Exchange code for tokens
    const response = await fetch('/api/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirectUri })
    });
    
    const tokens = await response.json();
    // Store tokens securely and redirect user
  }
}`,
    curl: `# Step 1: Redirect user to authorization URL
# ${authUrl}

# Step 2: Exchange authorization code for tokens
curl -X POST '${process.env.NEXT_PUBLIC_LOGTO_ENDPOINT}/oidc/token' \\
  -H 'Content-Type: application/x-www-form-urlencoded' \\
  -d 'grant_type=authorization_code' \\
  -d 'client_id=${clientId}' \\
  -d 'client_secret=YOUR_CLIENT_SECRET' \\
  -d 'code=AUTHORIZATION_CODE' \\
  -d 'redirect_uri=${redirectUri}'`,
    python: `# Python OAuth Integration
import requests
from urllib.parse import urlencode

CLIENT_ID = '${clientId}'
CLIENT_SECRET = 'your_client_secret'
REDIRECT_URI = '${redirectUri}'
AUTH_URL = '${process.env.NEXT_PUBLIC_LOGTO_ENDPOINT}/oidc/auth'
TOKEN_URL = '${process.env.NEXT_PUBLIC_LOGTO_ENDPOINT}/oidc/token'

def get_auth_url():
    params = {
        'client_id': CLIENT_ID,
        'redirect_uri': REDIRECT_URI,
        'response_type': 'code',
        'scope': 'openid profile email',
        'state': 'random_state_value'
    }
    return f"{AUTH_URL}?{urlencode(params)}"

def exchange_code_for_tokens(code):
    data = {
        'grant_type': 'authorization_code',
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'code': code,
        'redirect_uri': REDIRECT_URI
    }
    
    response = requests.post(TOKEN_URL, data=data)
    return response.json()`,
    react: `// React OAuth Hook
import { useState, useEffect } from 'react';

const CLIENT_ID = '${clientId}';
const REDIRECT_URI = '${redirectUri}';

export function useEcosystemAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const signIn = () => {
    const authUrl = '${authUrl}';
    window.location.href = authUrl;
  };

  const handleCallback = async (code: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/ecosystem/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      
      const data = await response.json();
      setUser(data.user);
      localStorage.setItem('ecosystem_tokens', JSON.stringify(data.tokens));
    } catch (error) {
      console.error('Authentication failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, signIn, handleCallback };
}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integration Examples</CardTitle>
        <CardDescription>
          Code examples for integrating "Sign in with Ecosystem" in your application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="javascript">JavaScript</TabsTrigger>
            <TabsTrigger value="react">React</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
            <TabsTrigger value="curl">cURL</TabsTrigger>
          </TabsList>
          
          {Object.entries(examples).map(([lang, code]) => (
            <TabsContent key={lang} value={lang} className="mt-4">
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{code}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(code)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Quick Test URL</h4>
          <p className="text-sm text-blue-700 mb-3">
            Use this URL to test the OAuth flow directly in your browser:
          </p>
          <div className="flex items-center space-x-2">
            <code className="flex-1 text-xs bg-white p-2 rounded border break-all">
              {authUrl}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(authUrl)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

## Next Steps

This comprehensive production features guide provides:

1. **Advanced Organization Management** - Complete member invitation and role management
2. **OAuth Provider Platform** - Third-party application creation and management
3. **Developer Experience** - Code examples and integration guides

Continue with:
- **04-deployment-operations.md** - Production deployment and monitoring
- **Consolidated configuration files** - Single source configs

These features enable building a complete multi-tenant SaaS platform with enterprise-grade organization management and OAuth provider capabilities.