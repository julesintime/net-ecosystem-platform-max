"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { UserSettings } from "@/components/profile/user-settings"

export default function ProfileSettingsPage() {
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
            <div className="space-y-0.5">
              <h2 className="text-2xl font-bold tracking-tight">Profile Settings</h2>
              <p className="text-muted-foreground">
                Manage your personal preferences and account settings.
              </p>
            </div>
          </div>
          
          <Separator />
          
          {/* Settings Content */}
          <UserSettings />
        </div>
      </div>
    </div>
  )
}