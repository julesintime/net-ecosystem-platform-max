"use client"

import * as React from "react"
import { BarChart3, Users, Database, Zap, Calendar, TrendingUp } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

import { OrganizationStats } from "@/lib/types/organization"

interface UsageMetricsProps {
  stats: OrganizationStats
  organizationName: string
}

function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 Bytes'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function UsageMetrics({ stats, organizationName }: UsageMetricsProps) {
  const storageUsagePercent = Math.round((stats.storageUsed / stats.storageLimit) * 100)
  const apiUsagePercent = Math.round((stats.apiCallsThisMonth / stats.apiCallsLimit) * 100)

  const currentDate = new Date()
  const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium">Usage & Analytics</h3>
        <p className="text-sm text-muted-foreground">
          Monitor your organization's resource usage and activity metrics.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              {stats.activeMembers} active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-green-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Storage Used</p>
                <p className="text-2xl font-bold">{formatBytes(stats.storageUsed)}</p>
              </div>
            </div>
            <div className="mt-2">
              <Progress value={storageUsagePercent} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {storageUsagePercent}% of {formatBytes(stats.storageLimit)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">API Calls</p>
                <p className="text-2xl font-bold">{formatNumber(stats.apiCallsThisMonth)}</p>
              </div>
            </div>
            <div className="mt-2">
              <Progress value={apiUsagePercent} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {apiUsagePercent}% of {formatNumber(stats.apiCallsLimit)} this month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Roles</p>
                <p className="text-2xl font-bold">{stats.totalRoles}</p>
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Including built-in roles
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Member Activity</span>
            </CardTitle>
            <CardDescription>
              Current member status and activity overview
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Active Members</span>
              <div className="flex items-center space-x-2">
                <Badge variant="default">{stats.activeMembers}</Badge>
                <span className="text-xs text-muted-foreground">
                  {Math.round((stats.activeMembers / stats.totalMembers) * 100)}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Pending Invitations</span>
              <Badge variant="secondary">{stats.pendingInvitations}</Badge>
            </div>

            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Member Engagement</span>
                <span>{Math.round((stats.activeMembers / stats.totalMembers) * 100)}%</span>
              </div>
              <Progress value={(stats.activeMembers / stats.totalMembers) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Resource Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Resource Usage</span>
            </CardTitle>
            <CardDescription>
              Storage and API usage for {currentMonth}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Storage</span>
                <span className="text-sm font-medium">
                  {formatBytes(stats.storageUsed)} / {formatBytes(stats.storageLimit)}
                </span>
              </div>
              <Progress value={storageUsagePercent} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{storageUsagePercent}% used</span>
                <span>{formatBytes(stats.storageLimit - stats.storageUsed)} remaining</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">API Calls</span>
                <span className="text-sm font-medium">
                  {formatNumber(stats.apiCallsThisMonth)} / {formatNumber(stats.apiCallsLimit)}
                </span>
              </div>
              <Progress value={apiUsagePercent} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{apiUsagePercent}% used</span>
                <span>{formatNumber(stats.apiCallsLimit - stats.apiCallsThisMonth)} remaining</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Alerts */}
      {(storageUsagePercent > 80 || apiUsagePercent > 80) && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="text-orange-700">Usage Alerts</CardTitle>
            <CardDescription>
              You're approaching your usage limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {storageUsagePercent > 80 && (
              <div className="flex items-center justify-between p-3 rounded-lg border border-orange-200 bg-white">
                <div>
                  <p className="text-sm font-medium">Storage Usage High</p>
                  <p className="text-xs text-muted-foreground">
                    You've used {storageUsagePercent}% of your storage limit
                  </p>
                </div>
                <Badge variant="outline" className="text-orange-700 border-orange-200">
                  {storageUsagePercent}%
                </Badge>
              </div>
            )}
            
            {apiUsagePercent > 80 && (
              <div className="flex items-center justify-between p-3 rounded-lg border border-orange-200 bg-white">
                <div>
                  <p className="text-sm font-medium">API Usage High</p>
                  <p className="text-xs text-muted-foreground">
                    You've used {apiUsagePercent}% of your monthly API limit
                  </p>
                </div>
                <Badge variant="outline" className="text-orange-700 border-orange-200">
                  {apiUsagePercent}%
                </Badge>
              </div>
            )}
            
            <div className="pt-2">
              <Button variant="outline" size="sm" className="text-orange-700 border-orange-200">
                Upgrade Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historical Data Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Usage History</span>
          </CardTitle>
          <CardDescription>
            Historical usage data and trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mb-4" />
            <p className="text-sm mb-2">Historical usage charts coming soon</p>
            <p className="text-xs text-center max-w-sm">
              We're working on detailed analytics and historical usage tracking 
              to help you better understand your organization's patterns.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}