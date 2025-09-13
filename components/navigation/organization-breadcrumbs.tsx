"use client"

import Link from 'next/link'
import { ChevronRight, Home, Building } from 'lucide-react'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { useOrganizationContext } from '@/hooks/use-organization-context'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
  isCurrentPage?: boolean
}

interface OrganizationBreadcrumbsProps {
  items?: BreadcrumbItem[]
  className?: string
  showOrganization?: boolean
  showHome?: boolean
}

export function OrganizationBreadcrumbs({ 
  items = [],
  className,
  showOrganization = true,
  showHome = true
}: OrganizationBreadcrumbsProps) {
  const { currentOrganization } = useOrganizationContext()
  
  // Build breadcrumb items with organization context
  const breadcrumbItems: BreadcrumbItem[] = []
  
  // Add home if requested
  if (showHome) {
    breadcrumbItems.push({
      label: 'Home',
      href: '/',
      isCurrentPage: false
    })
  }
  
  // Add organization if available and requested
  if (showOrganization && currentOrganization) {
    breadcrumbItems.push({
      label: currentOrganization.name,
      href: '/profile/organization',
      isCurrentPage: false
    })
  }
  
  // Add custom items
  breadcrumbItems.push(...items)
  
  if (breadcrumbItems.length === 0) {
    return null
  }
  
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1
          const isCurrentPage = item.isCurrentPage || isLast
          
          return (
            <div key={index} className="flex items-center">
              <BreadcrumbItem>
                {isCurrentPage || !item.href ? (
                  <BreadcrumbPage className="flex items-center gap-1">
                    {/* Add icon for specific pages */}
                    {item.label === 'Home' && <Home className="h-4 w-4" />}
                    {item.label === currentOrganization?.name && <Building className="h-4 w-4" />}
                    <span className={cn(
                      isCurrentPage && "font-medium"
                    )}>
                      {item.label}
                    </span>
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href} className="flex items-center gap-1 hover:text-foreground">
                      {/* Add icon for specific pages */}
                      {item.label === 'Home' && <Home className="h-4 w-4" />}
                      {item.label === currentOrganization?.name && <Building className="h-4 w-4" />}
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              
              {!isLast && (
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
              )}
            </div>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}