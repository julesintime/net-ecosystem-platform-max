"use client"

import { Building, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useOrganizationContext } from '@/hooks/use-organization-context'
import { OrganizationSelector } from '@/components/profile/organization-selector'

interface OrganizationIndicatorProps {
  className?: string
  variant?: 'default' | 'compact' | 'minimal'
  showDropdown?: boolean
  showBadge?: boolean
}

export function OrganizationIndicator({ 
  className,
  variant = 'default',
  showDropdown = true,
  showBadge = true
}: OrganizationIndicatorProps) {
  const {
    currentOrganization,
    isLoading,
    hasMultipleOrganizations,
    isAdmin,
    isMember
  } = useOrganizationContext()
  
  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-24" />
        {showBadge && <Skeleton className="h-5 w-12 rounded-full" />}
      </div>
    )
  }
  
  if (!currentOrganization) {
    return (
      <div className={cn(
        "flex items-center gap-2 text-muted-foreground",
        className
      )}>
        <Building className="h-4 w-4" />
        <span className="text-sm">No organization</span>
      </div>
    )
  }
  
  const getRoleBadgeVariant = () => {
    if (isAdmin) return 'default'
    if (isMember) return 'secondary'
    return 'outline'
  }
  
  const getRoleText = () => {
    if (isAdmin) return 'Admin'
    if (isMember) return 'Member'
    return 'Guest'
  }
  
  const content = (
    <div className="flex items-center gap-2 min-w-0">
      <Building className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      
      <div className="min-w-0 flex-1">
        <div className="font-medium truncate text-sm">
          {currentOrganization.name}
        </div>
        {variant === 'default' && currentOrganization.description && (
          <div className="text-xs text-muted-foreground truncate">
            {currentOrganization.description}
          </div>
        )}
      </div>
      
      {showBadge && (
        <Badge variant={getRoleBadgeVariant()} className="text-xs">
          {getRoleText()}
        </Badge>
      )}
      
      {showDropdown && hasMultipleOrganizations && (
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  )
  
  if (!showDropdown || !hasMultipleOrganizations) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50",
        variant === 'compact' && "px-2 py-1",
        variant === 'minimal' && "px-0 py-0 bg-transparent",
        className
      )}>
        {content}
      </div>
    )
  }
  
  // Render with dropdown for organization switching
  return (
    <div className={cn("w-full", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <OrganizationSelector 
              className="w-full" 
              size={variant === 'compact' ? 'sm' : 'default'}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Switch organization</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}