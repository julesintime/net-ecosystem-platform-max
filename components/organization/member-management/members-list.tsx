"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, UserPlus, Mail, Shield, Trash2, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { OrganizationMemberWithUser, formatMemberRole, formatMemberStatus } from "@/lib/types/organization"
import { useMembers } from "@/hooks/use-members"

interface MembersListProps {
  organizationId: string
  onInviteMember?: () => void
  onEditMember?: (member: OrganizationMemberWithUser) => void
  onRemoveMember?: (member: OrganizationMemberWithUser) => void
}

// Create columns for the data table
const createColumns = (
  onEditMember?: (member: OrganizationMemberWithUser) => void,
  onRemoveMember?: (member: OrganizationMemberWithUser) => void
): ColumnDef<OrganizationMemberWithUser>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "user.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Member" />
    ),
    cell: ({ row }) => {
      const member = row.original
      const user = member.user
      
      return (
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.name || "User"} />
            <AvatarFallback>
              {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{user.name || user.username || 'Unknown'}</span>
            <span className="text-sm text-muted-foreground">{user.primaryEmail}</span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "organizationRoles",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => {
      const roles = row.original.organizationRoles
      const roleText = formatMemberRole(roles)
      
      return (
        <div className="flex items-center space-x-1">
          <Badge variant="secondary">
            {roleText}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const { label, variant } = formatMemberStatus(status)
      
      return <Badge variant={variant}>{label}</Badge>
    },
  },
  {
    accessorKey: "joinedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Joined" />
    ),
    cell: ({ row }) => {
      const joinedAt = row.getValue("joinedAt") as Date
      return (
        <div className="text-sm">
          {joinedAt.toLocaleDateString()}
        </div>
      )
    },
  },
  {
    accessorKey: "lastActivity",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Active" />
    ),
    cell: ({ row }) => {
      const lastActivity = row.getValue("lastActivity") as Date | undefined
      return (
        <div className="text-sm text-muted-foreground">
          {lastActivity ? lastActivity.toLocaleDateString() : 'Never'}
        </div>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const member = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(member.user.primaryEmail || '')}
            >
              Copy email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEditMember?.(member)}>
              <Shield className="mr-2 h-4 w-4" />
              Edit roles
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {/* Send message */}}>
              <Mail className="mr-2 h-4 w-4" />
              Send message
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onRemoveMember?.(member)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove member
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function MembersList({ 
  organizationId, 
  onInviteMember, 
  onEditMember, 
  onRemoveMember 
}: MembersListProps) {
  const {
    members,
    filteredMembers,
    selectedMembers,
    isLoading,
    error,
    filters,
    setFilters,
    selectMember,
    selectAllMembers,
    clearSelection,
    bulkRemoveMembers,
    operationState,
  } = useMembers({ organizationId })

  const [searchInput, setSearchInput] = React.useState("")

  // Handle search input changes
  const handleSearchChange = React.useCallback((value: string) => {
    setSearchInput(value)
    setFilters({ search: value })
  }, [setFilters])

  // Handle bulk remove
  const handleBulkRemove = React.useCallback(async () => {
    if (selectedMembers.length === 0) return
    
    try {
      await bulkRemoveMembers(selectedMembers)
    } catch (error) {
      console.error('Failed to remove members:', error)
    }
  }, [selectedMembers, bulkRemoveMembers])

  const columns = React.useMemo(
    () => createColumns(onEditMember, onRemoveMember),
    [onEditMember, onRemoveMember]
  )

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Failed to load organization members</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Members</h3>
          <p className="text-sm text-muted-foreground">
            Manage organization members and their roles.
          </p>
        </div>
        <Button onClick={onInviteMember}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      {/* Search and Bulk Actions */}
      <div className="flex items-center justify-between space-x-2">
        <div className="flex items-center space-x-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        {selectedMembers.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {selectedMembers.length} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkRemove}
              disabled={operationState.isLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove Selected
            </Button>
            <Button variant="outline" size="sm" onClick={clearSelection}>
              Clear Selection
            </Button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && members.length === 0 && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Data Table */}
      {(!isLoading || members.length > 0) && (
        <DataTable 
          columns={columns} 
          data={filteredMembers}
        />
      )}

      {/* Empty State */}
      {!isLoading && members.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium mb-2">No members found</h4>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Start building your team by inviting members to your organization.
            </p>
            <Button onClick={onInviteMember}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Your First Member
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}