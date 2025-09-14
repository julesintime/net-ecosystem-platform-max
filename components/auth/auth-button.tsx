'use client'

import { LogIn, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface AuthButtonProps {
  isAuthenticated: boolean
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showText?: boolean
}

export function AuthButton({ 
  isAuthenticated, 
  variant = "outline", 
  size = "icon",
  className = "",
  showText = false
}: AuthButtonProps) {
  const handleAuth = () => {
    if (isAuthenticated) {
      // Navigate to sign-out endpoint
      window.location.href = '/api/auth/sign-out'
    } else {
      // Navigate to sign-in endpoint  
      window.location.href = '/api/auth/sign-in'
    }
  }

  if (showText) {
    return (
      <Button
        variant={variant}
        size={size}
        className={`flex flex-col gap-1 h-auto py-2 px-3 ${className}`}
        onClick={handleAuth}
        data-testid="auth-button"
      >
        {isAuthenticated ? (
          <LogOut className="h-4 w-4" />
        ) : (
          <LogIn className="h-4 w-4" />
        )}
        <span className="text-xs font-medium">
          {isAuthenticated ? "Sign Out" : "Sign In"}
        </span>
      </Button>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`h-9 w-9 ${className}`}
          onClick={handleAuth}
          data-testid="auth-button"
        >
          {isAuthenticated ? (
            <LogOut className="h-4 w-4" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          <span className="sr-only">
            {isAuthenticated ? "Sign Out" : "Sign In"}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        {isAuthenticated ? "Sign Out" : "Sign In"}
      </TooltipContent>
    </Tooltip>
  )
}