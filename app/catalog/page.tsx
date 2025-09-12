"use client"

import { useState } from "react"
import Image from "next/image"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { DataTable } from "@/components/data-table/data-table"
import { columns } from "@/components/data-table/columns"
import { tasks } from "@/lib/tasks-data"

export default function CatalogPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Mobile Header */}
      <div className="flex items-center justify-between border-b px-6 py-4 md:hidden">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="py-4">
              <h2 className="text-lg font-semibold">Catalog Menu</h2>
            </div>
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-semibold">Catalog</h1>
        <div className="w-10" />
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 p-6">
        <div className="flex items-center justify-between space-y-2">
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              <Image
                src="https://images.unsplash.com/photo-1618083707692-b2932bb8a21e?w=32&h=32&fit=crop&crop=face"
                width={32}
                height={32}
                alt="Avatar"
                className="rounded-full"
              />
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Welcome back!
                </h2>
                <p className="text-sm text-muted-foreground">
                  Here's a list of your tasks for this month!
                </p>
              </div>
            </div>
          </div>
          <div className="md:hidden">
            <div className="flex items-center space-x-4">
              <Image
                src="https://images.unsplash.com/photo-1618083707692-b2932bb8a21e?w=24&h=24&fit=crop&crop=face"
                width={24}
                height={24}
                alt="Avatar"
                className="rounded-full"
              />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Your tasks for this month
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 py-6 overflow-hidden">
          <DataTable data={tasks} columns={columns} />
        </div>
      </div>
    </div>
  )
}