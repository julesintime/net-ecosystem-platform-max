"use client"

import { Plus, Settings, Users, Building2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useOrganizationContext } from '@/hooks/use-organization-context'

interface OrganizationQuickActionsProps {
  className?: string
}

export function OrganizationQuickActions({ className }: OrganizationQuickActionsProps) {
  const {
    currentOrganization,
    userOrganizations,
    isAdmin,
    canManageOrganization,
    hasMultipleOrganizations,
  } = useOrganizationContext()
  
  if (!currentOrganization) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Setup
          </CardTitle>
          <CardDescription>
            Get started by creating or joining an organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/profile/organization">
              <Plus className="mr-2 h-4 w-4" />
              Create Organization
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/profile/organization/join">
              <Users className="mr-2 h-4 w-4" />
              Join Organization
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }
  
  const quickActions = [
    {
      title: 'Manage Members',
      description: 'Invite and manage team members',
      href: '/profile/organization/members',
      icon: Users,
      badge: null,
      show: canManageOrganization
    },
    {
      title: 'Organization Settings',
      description: 'Configure organization preferences',
      href: '/profile/organization/settings',
      icon: Settings,
      badge: null,
      show: canManageOrganization
    },
    {
      title: 'View Organization',
      description: 'Go to organization dashboard',
      href: '/profile/organization',
      icon: Building2,
      badge: null,
      show: true
    }
  ].filter(action => action.show)
  
  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {currentOrganization.name}
              </CardTitle>
              <CardDescription>
                {currentOrganization.description || 'Your current organization'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isAdmin ? 'default' : 'secondary'}>
                {isAdmin ? 'Admin' : 'Member'}
              </Badge>
              {hasMultipleOrganizations && (
                <Badge variant="outline">
                  {userOrganizations.length} orgs
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.href}
                  variant="ghost"
                  asChild
                  className="justify-start h-auto p-3"
                >
                  <Link href={action.href}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">{action.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {action.description}
                          </div>
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                </Button>
              )
            })}
          </div>
          
          {hasMultipleOrganizations && (
            <div className="mt-4 pt-3 border-t">
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link href="/profile/organizations">
                  <Building2 className="mr-2 h-4 w-4" />
                  Manage All Organizations ({userOrganizations.length})
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}