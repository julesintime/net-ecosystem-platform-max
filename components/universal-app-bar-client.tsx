'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Inbox, Music, ShoppingBag, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AuthButton } from "./auth/auth-button"

const navigation = [
  {
    name: "Inbox",
    href: "/inbox",
    icon: Inbox,
  },
  {
    name: "Library", 
    href: "/library",
    icon: Music,
  },
  {
    name: "Catalog",
    href: "/catalog",
    icon: ShoppingBag,
  },
  {
    name: "Profile",
    href: "/profile", 
    icon: User,
  },
]

interface UniversalAppBarClientProps {
  isAuthenticated: boolean
}

export function UniversalAppBarClient({ isAuthenticated }: UniversalAppBarClientProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="fixed left-0 top-0 z-50 hidden h-full w-16 flex-col border-r bg-background md:flex">
        <nav className="flex flex-col items-center gap-4 px-2 py-8">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    variant={isActive ? "default" : "ghost"}
                    size="icon"
                    className={cn(
                      "h-9 w-9",
                      isActive && "bg-accent text-accent-foreground"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span className="sr-only">{item.name}</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {item.name}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </nav>
        
        {/* Authentication Controls */}
        <div className="mt-auto flex flex-col items-center gap-4 px-2 py-8">
          <AuthButton isAuthenticated={isAuthenticated} />
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
        <nav className="flex items-center justify-around px-2 py-3">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Button
                key={item.name}
                asChild
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "flex flex-col gap-1 h-auto py-2 px-3",
                  isActive && "bg-accent text-accent-foreground"
                )}
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{item.name}</span>
                </Link>
              </Button>
            )
          })}
          
          {/* Mobile Authentication Controls */}
          <AuthButton 
            isAuthenticated={isAuthenticated} 
            variant="outline"
            size="sm"
            showText={true}
          />
        </nav>
      </div>
    </>
  )
}