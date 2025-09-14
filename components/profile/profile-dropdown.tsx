"use client"

import { useState } from 'react'
import Link from 'next/link'
import { LogOut, Settings, User, Building, Users, Plus, ChevronRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useOrganizationContext } from '@/hooks/use-organization-context'
import { OrganizationSelector } from './organization-selector'
import { handleSignOut } from '@/lib/auth/actions'

interface ProfileDropdownProps {
  userEmail?: string
  userName?: string
  userAvatar?: string
  className?: string
}

export function ProfileDropdown({ 
  userEmail, 
  userName, 
  userAvatar,
  className 
}: ProfileDropdownProps) {
  const {
    currentOrganization,
    userOrganizations,
    isLoading,
    switchOrganization,
    hasMultipleOrganizations,
    canManageOrganization,
  } = useOrganizationContext()
  
  const [isSwitching, setIsSwitching] = useState<string | null>(null)
  
  const handleQuickSwitch = async (organizationId: string) => {
    if (organizationId === currentOrganization?.id || isSwitching) return
    
    setIsSwitching(organizationId)
    try {
      await switchOrganization(organizationId)
    } catch (error) {
      console.error('Quick switch failed:', error)
    } finally {
      setIsSwitching(null)
    }
  }
  
  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (email) {
      return email[0].toUpperCase()
    }
    return 'U'
  }
  
  const displayName = userName || userEmail?.split('@')[0] || 'User'
  const initials = getInitials(userName, userEmail)
  
  // Get quick switch organizations (excluding current)
  const quickSwitchOrgs = userOrganizations
    .filter(org => org.id !== currentOrganization?.id)
    .slice(0, 3) // Show max 3 in dropdown
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="profile-dropdown">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userAvatar} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        {/* User Info Section */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            {userEmail && (
              <p className="text-xs leading-none text-muted-foreground">
                {userEmail}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Current Organization Section */}
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Current Organization
        </DropdownMenuLabel>
        
        <div className="px-2 py-1">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-24" />
            </div>
          ) : currentOrganization ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Building className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium truncate">
                  {currentOrganization.name}
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">
                Active
              </Badge>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building className="h-4 w-4" />
              <span className="text-sm">No organization selected</span>
            </div>
          )}
        </div>
        
        {/* Organization Quick Actions */}
        {currentOrganization && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/profile/organization" className="w-full">
                <Users className="mr-2 h-4 w-4" />
                Manage Organization
              </Link>
            </DropdownMenuItem>
            
            {canManageOrganization && (
              <DropdownMenuItem asChild>
                <Link href="/profile/organization/settings" className="w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Organization Settings
                </Link>
              </DropdownMenuItem>
            )}
          </>
        )}
        
        <DropdownMenuSeparator />
        
        {/* Quick Organization Switching */}
        {hasMultipleOrganizations && (
          <>
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
              Quick Switch
            </DropdownMenuLabel>
            
            {quickSwitchOrgs.map((org) => (
              <DropdownMenuItem 
                key={org.id}
                onClick={() => handleQuickSwitch(org.id)}
                disabled={isSwitching === org.id}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span className="text-sm truncate">{org.name}</span>
                  </div>
                  {isSwitching === org.id && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-b-transparent" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            
            {userOrganizations.length > 4 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Building className="mr-2 h-4 w-4" />
                  All Organizations
                  <ChevronRight className="ml-auto h-4 w-4" />
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <div className="p-2">
                    <OrganizationSelector showCreateButton={false} size="sm" />
                  </div>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            
            <DropdownMenuSeparator />
          </>
        )}
        
        {/* Main Navigation */}
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile" className="w-full">
              <User className="mr-2 h-4 w-4" />
              Profile Settings
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link href="/profile/account" className="w-full">
              <Settings className="mr-2 h-4 w-4" />
              Account Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        {/* Organization Management */}
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile/organization" className="w-full">
              <Building className="mr-2 h-4 w-4" />
              Organization Management
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem>
            <Plus className="mr-2 h-4 w-4" />
            Create Organization
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        {/* Sign Out */}
        <DropdownMenuItem 
          onClick={() => handleSignOut()}
          className="text-red-600 focus:text-red-600 focus:bg-red-50"
          data-testid="sign-out-button"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}