"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Globe, Shield, CheckCircle2, XCircle, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

interface EcosystemApp {
  id: string
  name: string
  description: string
  url?: string
  iconUrl?: string
  organizationId: string
  organizationName: string
  hasAccess: boolean
  lastAccessed?: Date
  permissions: string[]
  appType: 'first-party' | 'third-party'
  logtoType: string
}

export default function EcosystemAppsPage() {
  const [apps, setApps] = useState<EcosystemApp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadUserEcosystemApps()
  }, [])

  const loadUserEcosystemApps = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/ecosystem-apps')
      
      if (!response.ok) {
        throw new Error('Failed to load ecosystem applications')
      }
      
      const data = await response.json()
      setApps(data.apps || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAccess = async (appId: string, currentAccess: boolean) => {
    try {
      const response = await fetch(`/api/user/ecosystem-apps/${appId}/access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: currentAccess ? 'revoke' : 'grant'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        // Show more detailed error message from the backend
        const errorMessage = result.details || result.error || 'Failed to update application access'
        setError(errorMessage)
        return
      }

      // Reload apps to reflect changes
      await loadUserEcosystemApps()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update access')
    }
  }

  const formatLastAccessed = (date?: Date) => {
    if (!date) return 'Never'
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    )
  }

  if (loading) {
    return (
      <div className="h-full overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="space-y-6 p-6 pb-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/profile">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Ecosystem Applications</h2>
                <p className="text-muted-foreground">
                  Manage your access to applications in the ecosystem.
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-hidden">
      <div className="h-full overflow-y-auto">
        <div className="space-y-6 p-6 pb-16">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/profile">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-2xl font-bold tracking-tight">Ecosystem Applications</h2>
              </div>
              <p className="text-muted-foreground">
                Manage your access to applications in the ecosystem. You can grant or revoke access to applications based on your organization memberships.
              </p>
            </div>
          </div>
          
          <Separator />

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Access Request Failed</p>
                  <p className="text-sm">{error}</p>
                  {error.includes('organization administrator') && (
                    <p className="text-xs text-muted-foreground">
                      💡 Tip: Organization administrators can add you to organizations in the Logto Console under Organizations → Members.
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{apps.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Access</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {apps.filter(app => app.hasAccess).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Organizations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(apps.map(app => app.organizationId)).size}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Applications Grid */}
          {apps.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Applications Found</h3>
                <p className="text-muted-foreground text-center">
                  You don't have access to any ecosystem applications yet. Contact your organization administrator to get access to applications.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* First-party Applications */}
              {apps.filter(app => app.appType === 'first-party').length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold">🏠 First-Party Applications</h3>
                    <Badge variant="secondary">{apps.filter(app => app.appType === 'first-party').length}</Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {apps.filter(app => app.appType === 'first-party').map((app) => (
                      <Card key={app.id} className="relative">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              {app.iconUrl ? (
                                <img 
                                  src={app.iconUrl} 
                                  alt={`${app.name} icon`}
                                  className="w-8 h-8 rounded-md"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                                  <Globe className="h-4 w-4 text-blue-600" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-base truncate flex items-center gap-2">
                                  {app.name}
                                  <Badge variant="outline" className="text-xs">{app.logtoType}</Badge>
                                </CardTitle>
                                <CardDescription className="text-xs">
                                  {app.organizationName}
                                </CardDescription>
                              </div>
                            </div>
                            <Badge variant={app.hasAccess ? "default" : "secondary"}>
                              {app.hasAccess ? (
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                              ) : (
                                <XCircle className="h-3 w-3 mr-1" />
                              )}
                              {app.hasAccess ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          {app.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {app.description}
                            </p>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Permissions */}
                          {app.permissions.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2">Permissions</p>
                              <div className="flex flex-wrap gap-1">
                                {app.permissions.slice(0, 3).map((permission) => (
                                  <Badge key={permission} variant="outline" className="text-xs">
                                    {permission}
                                  </Badge>
                                ))}
                                {app.permissions.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{app.permissions.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Last Accessed */}
                          <div className="text-xs text-muted-foreground">
                            {app.hasAccess ? (
                              `Last accessed: ${formatLastAccessed(app.lastAccessed)}`
                            ) : (
                              app.appType === 'third-party' ? 'Requires consent to access' : 'No organization access'
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            {app.url && app.hasAccess && (
                              <Button size="sm" variant="outline" asChild className="flex-1">
                                <a href={app.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Open App
                                </a>
                              </Button>
                            )}
                            {app.appType === 'first-party' && app.hasAccess ? (
                              <Button size="sm" variant="outline" disabled className="flex-1">
                                <Shield className="h-3 w-3 mr-1" />
                                {app.organizationName === 'Platform Access' ? 'Platform Access' : 
                                 app.organizationName === 'Organization Member Access' ? 'Member Access' :
                                 'Organization Member'}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant={app.hasAccess ? "destructive" : "default"}
                                onClick={() => handleToggleAccess(app.id, app.hasAccess)}
                                className="flex-1"
                              >
                                <Shield className="h-3 w-3 mr-1" />
                                {app.hasAccess ? 'Revoke' : (app.appType === 'third-party' ? 'Grant Consent' : 'Request')} Access
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Third-party Applications */}
              {apps.filter(app => app.appType === 'third-party').length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold">🌐 Third-Party Applications</h3>
                    <Badge variant="secondary">{apps.filter(app => app.appType === 'third-party').length}</Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {apps.filter(app => app.appType === 'third-party').map((app) => (
                      <Card key={app.id} className="relative">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              {app.iconUrl ? (
                                <img 
                                  src={app.iconUrl} 
                                  alt={`${app.name} icon`}
                                  className="w-8 h-8 rounded-md"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                                  <Globe className="h-4 w-4 text-green-600" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-base truncate flex items-center gap-2">
                                  {app.name}
                                  <Badge variant="outline" className="text-xs">{app.logtoType}</Badge>
                                </CardTitle>
                                <CardDescription className="text-xs">
                                  {app.organizationName}
                                </CardDescription>
                              </div>
                            </div>
                            <Badge variant={app.hasAccess ? "default" : "secondary"}>
                              {app.hasAccess ? (
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                              ) : (
                                <XCircle className="h-3 w-3 mr-1" />
                              )}
                              {app.hasAccess ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          {app.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {app.description}
                            </p>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Last Accessed */}
                          <div className="text-xs text-muted-foreground">
                            {app.hasAccess ? (
                              `Last accessed: ${formatLastAccessed(app.lastAccessed)}`
                            ) : (
                              app.appType === 'third-party' ? 'Requires consent to access' : 'No organization access'
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            {app.url && app.hasAccess && (
                              <Button size="sm" variant="outline" asChild className="flex-1">
                                <a href={app.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Open App
                                </a>
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant={app.hasAccess ? "destructive" : "default"}
                              onClick={() => handleToggleAccess(app.id, app.hasAccess)}
                              className="flex-1"
                            >
                              <Shield className="h-3 w-3 mr-1" />
                              {app.hasAccess ? 'Revoke Consent' : 'Grant Consent'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}