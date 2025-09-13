"use client"

import { useContext } from 'react'
import { OrganizationContext } from '@/lib/contexts/organization-context'

export function useOrganizationContext() {
  const context = useContext(OrganizationContext)
  
  if (!context) {
    throw new Error('useOrganizationContext must be used within an OrganizationProvider')
  }
  
  return context
}