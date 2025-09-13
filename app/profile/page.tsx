"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { SidebarNav } from "@/components/forms/sidebar-nav"
import { ProfileForm } from "@/components/forms/profile-form"
import { AccountForm } from "@/components/forms/account-form"
import { AppearanceForm } from "@/components/forms/appearance-form"
import { NotificationsForm } from "@/components/forms/notifications-form"
import { DisplayForm } from "@/components/forms/display-form"

const sidebarNavItems = [
  {
    title: "Profile",
    href: "/profile",
  },
  {
    title: "Account", 
    href: "/profile/account",
  },
  {
    title: "Appearance",
    href: "/profile/appearance",
  },
  {
    title: "Notifications",
    href: "/profile/notifications",
  },
  {
    title: "Display",
    href: "/profile/display",
  },
]

export default function ProfilePage() {
  const [activeSection, setActiveSection] = useState("Profile")

  const renderContent = () => {
    switch (activeSection) {
      case "Profile":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Profile</h3>
              <p className="text-sm text-muted-foreground">
                This is how others will see you on the site.
              </p>
            </div>
            <Separator />
            <ProfileForm />
          </div>
        )
      case "Account":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Account</h3>
              <p className="text-sm text-muted-foreground">
                Update your account settings. Set your preferred language and
                timezone.
              </p>
            </div>
            <Separator />
            <AccountForm />
          </div>
        )
      case "Appearance":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Appearance</h3>
              <p className="text-sm text-muted-foreground">
                Customize the appearance of the app. Automatically switch between day
                and night themes.
              </p>
            </div>
            <Separator />
            <AppearanceForm />
          </div>
        )
      case "Notifications":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Configure how you receive notifications.
              </p>
            </div>
            <Separator />
            <NotificationsForm />
          </div>
        )
      case "Display":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Display</h3>
              <p className="text-sm text-muted-foreground">
                Turn items on or off to control what&apos;s displayed in the app.
              </p>
            </div>
            <Separator />
            <DisplayForm />
          </div>
        )
      default:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">{activeSection}</h3>
              <p className="text-sm text-muted-foreground">
                {activeSection} settings coming soon.
              </p>
            </div>
            <Separator />
            <div className="text-center py-12">
              <p className="text-muted-foreground">This section is under development.</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="h-full overflow-hidden">
      {/* Mobile View */}
      <div className="sm:hidden flex flex-col h-full">
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetTitle className="sr-only">
                  Settings Navigation
                </SheetTitle>
                <div className="p-6">
                  <h3 className="font-medium mb-4">Settings</h3>
                  <div className="space-y-1">
                    <SidebarNav 
                      items={sidebarNavItems.map(item => ({
                        ...item,
                        href: "#"
                      }))}
                      onSectionChange={(title) => setActiveSection(title)}
                      orientation="vertical"
                      className="w-full"
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
        </div>
        
        {/* Mobile Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Tablet View */}
      <div className="hidden sm:block lg:hidden h-full overflow-hidden">
        <div className="h-full flex">
          {/* Compact Sidebar */}
          <div className="w-56 border-r flex-shrink-0">
            <div className="p-6">
              <h3 className="font-medium mb-4">Settings</h3>
              <div className="space-y-1">
                <SidebarNav 
                  items={sidebarNavItems.map(item => ({
                    ...item,
                    href: "#"
                  }))}
                  onSectionChange={(title) => setActiveSection(title)}
                  orientation="vertical"
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop View - Full Settings Layout */}
      <div className="hidden lg:block h-full overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="space-y-6 p-6 pb-16">
            <div className="space-y-0.5">
              <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
              <p className="text-muted-foreground">
                Manage your account settings and set e-mail preferences.
              </p>
            </div>
            <Separator className="my-6" />
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
              <aside className="-mx-4 lg:w-1/5">
                <SidebarNav 
                  items={sidebarNavItems.map(item => ({
                    ...item,
                    href: "#" // Use hash for client-side navigation
                  }))}
                  className="px-4"
                  onSectionChange={(title) => setActiveSection(title)}
                  orientation="vertical"
                />
              </aside>
              <div className="flex-1 lg:max-w-2xl">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}