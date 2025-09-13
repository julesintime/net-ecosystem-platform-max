"use client"

import * as React from "react"
import { toast as sonnerToast } from "sonner"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  action?: {
    label: string
    onClick: () => void
  }
}

export function useToast() {
  const toast = React.useCallback(({ title, description, variant, action }: ToastProps) => {
    const message = title
    const descriptionText = description

    if (variant === "destructive") {
      sonnerToast.error(message, {
        description: descriptionText,
        action: action ? {
          label: action.label,
          onClick: action.onClick,
        } : undefined,
      })
    } else {
      sonnerToast.success(message, {
        description: descriptionText,
        action: action ? {
          label: action.label,
          onClick: action.onClick,
        } : undefined,
      })
    }
  }, [])

  return { toast }
}