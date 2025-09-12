"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string
    title: string
  }[]
  activeSection?: string
  onSectionChange?: (title: string) => void
  orientation?: "horizontal" | "vertical"
}

export function SidebarNav({ 
  className, 
  items, 
  activeSection,
  onSectionChange,
  orientation = "vertical",
  ...props 
}: SidebarNavProps) {
  const pathname = usePathname()

  const navClasses = orientation === "horizontal" 
    ? "flex space-x-2" 
    : "flex flex-col space-y-1"

  return (
    <nav
      className={cn(navClasses, className)}
      {...props}
    >
      {items.map((item) => {
        const isActive = activeSection ? activeSection === item.title : pathname === item.href
        
        return onSectionChange ? (
          <button
            key={item.title}
            onClick={() => onSectionChange(item.title)}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              isActive
                ? "bg-muted hover:bg-muted"
                : "hover:bg-transparent hover:underline",
              "justify-start w-full text-left"
            )}
          >
            {item.title}
          </button>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              isActive
                ? "bg-muted hover:bg-muted"
                : "hover:bg-transparent hover:underline",
              "justify-start"
            )}
          >
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}