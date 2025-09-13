"use client"

import { LogtoOrganization } from '@/lib/types/management-api'

export interface OrganizationBranding {
  primaryColor?: string
  secondaryColor?: string
  logo?: string
  favicon?: string
  theme?: 'light' | 'dark' | 'auto'
  customCSS?: string
}

export interface OrganizationBrandingData {
  branding: OrganizationBranding
  isCustomized: boolean
}

// Default branding values
const DEFAULT_BRANDING: OrganizationBranding = {
  primaryColor: '#0f172a', // slate-900
  secondaryColor: '#64748b', // slate-500
  theme: 'auto',
}

export class OrganizationBrandingManager {
  private static currentBranding: OrganizationBranding = DEFAULT_BRANDING
  private static appliedOrganization: string | null = null

  /**
   * Extract branding information from organization data
   */
  static extractBranding(organization: LogtoOrganization): OrganizationBrandingData {
    const customData = organization.customData || {}
    
    // Look for branding in custom data
    const branding: OrganizationBranding = {
      ...DEFAULT_BRANDING,
      primaryColor: customData.brandColor || customData.primaryColor,
      secondaryColor: customData.accentColor || customData.secondaryColor,
      logo: customData.logo || customData.logoUrl,
      favicon: customData.favicon,
      theme: customData.theme,
      customCSS: customData.customCSS,
    }
    
    const isCustomized = !!(
      branding.primaryColor !== DEFAULT_BRANDING.primaryColor ||
      branding.secondaryColor !== DEFAULT_BRANDING.secondaryColor ||
      branding.logo ||
      branding.favicon ||
      branding.theme !== DEFAULT_BRANDING.theme ||
      branding.customCSS
    )
    
    return {
      branding,
      isCustomized,
    }
  }
  
  /**
   * Apply organization branding to the document
   */
  static applyBranding(organization: LogtoOrganization): void {
    if (typeof window === 'undefined') return
    
    const { branding, isCustomized } = this.extractBranding(organization)
    
    // Don't reapply the same branding
    if (this.appliedOrganization === organization.id) {
      return
    }
    
    this.currentBranding = branding
    this.appliedOrganization = organization.id
    
    // Apply CSS custom properties
    const root = document.documentElement
    
    if (branding.primaryColor) {
      root.style.setProperty('--org-primary', branding.primaryColor)
    }
    
    if (branding.secondaryColor) {
      root.style.setProperty('--org-secondary', branding.secondaryColor)
    }
    
    // Update favicon if provided
    if (branding.favicon) {
      this.updateFavicon(branding.favicon)
    }
    
    // Apply custom CSS if provided
    if (branding.customCSS) {
      this.applyCustomCSS(branding.customCSS, organization.id)
    }
    
    // Apply theme
    if (branding.theme && branding.theme !== 'auto') {
      root.setAttribute('data-theme', branding.theme)
    }
    
    // Store in sessionStorage for consistency
    try {
      sessionStorage.setItem('org-branding', JSON.stringify({
        organizationId: organization.id,
        branding,
        appliedAt: Date.now(),
      }))
    } catch (error) {
      console.warn('Failed to store organization branding:', error)
    }
  }
  
  /**
   * Reset to default branding
   */
  static resetBranding(): void {
    if (typeof window === 'undefined') return
    
    const root = document.documentElement
    
    // Remove custom properties
    root.style.removeProperty('--org-primary')
    root.style.removeProperty('--org-secondary')
    root.removeAttribute('data-theme')
    
    // Remove custom CSS
    const existingStyle = document.querySelector('#org-custom-css')
    if (existingStyle) {
      existingStyle.remove()
    }
    
    // Reset favicon to default
    this.resetFavicon()
    
    this.currentBranding = DEFAULT_BRANDING
    this.appliedOrganization = null
    
    // Clear sessionStorage
    try {
      sessionStorage.removeItem('org-branding')
    } catch (error) {
      console.warn('Failed to clear organization branding:', error)
    }
  }
  
  /**
   * Get current applied branding
   */
  static getCurrentBranding(): OrganizationBranding {
    return { ...this.currentBranding }
  }
  
  /**
   * Check if branding is applied for a specific organization
   */
  static isBrandingApplied(organizationId: string): boolean {
    return this.appliedOrganization === organizationId
  }
  
  /**
   * Restore branding from sessionStorage if available
   */
  static restoreBrandingFromStorage(): boolean {
    if (typeof window === 'undefined') return false
    
    try {
      const stored = sessionStorage.getItem('org-branding')
      if (!stored) return false
      
      const data = JSON.parse(stored)
      const { organizationId, branding, appliedAt } = data
      
      // Check if data is not too old (1 hour)
      const isStale = Date.now() - appliedAt > 60 * 60 * 1000
      if (isStale) {
        sessionStorage.removeItem('org-branding')
        return false
      }
      
      // Apply the stored branding
      this.applyStoredBranding(branding, organizationId)
      return true
      
    } catch (error) {
      console.warn('Failed to restore organization branding:', error)
      return false
    }
  }
  
  private static updateFavicon(faviconUrl: string): void {
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement
    if (link) {
      link.href = faviconUrl
    } else {
      const newLink = document.createElement('link')
      newLink.rel = 'icon'
      newLink.href = faviconUrl
      document.head.appendChild(newLink)
    }
  }
  
  private static resetFavicon(): void {
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement
    if (link && link.href !== '/favicon.ico') {
      link.href = '/favicon.ico'
    }
  }
  
  private static applyCustomCSS(customCSS: string, organizationId: string): void {
    // Remove existing custom CSS
    const existingStyle = document.querySelector('#org-custom-css')
    if (existingStyle) {
      existingStyle.remove()
    }
    
    // Create new style element
    const style = document.createElement('style')
    style.id = 'org-custom-css'
    style.setAttribute('data-org-id', organizationId)
    style.textContent = customCSS
    document.head.appendChild(style)
  }
  
  private static applyStoredBranding(branding: OrganizationBranding, organizationId: string): void {
    this.currentBranding = branding
    this.appliedOrganization = organizationId
    
    const root = document.documentElement
    
    if (branding.primaryColor) {
      root.style.setProperty('--org-primary', branding.primaryColor)
    }
    
    if (branding.secondaryColor) {
      root.style.setProperty('--org-secondary', branding.secondaryColor)
    }
    
    if (branding.favicon) {
      this.updateFavicon(branding.favicon)
    }
    
    if (branding.customCSS) {
      this.applyCustomCSS(branding.customCSS, organizationId)
    }
    
    if (branding.theme && branding.theme !== 'auto') {
      root.setAttribute('data-theme', branding.theme)
    }
  }
}

/**
 * Hook to get organization logo with fallback
 */
export function getOrganizationLogo(organization: LogtoOrganization | null): string | null {
  if (!organization) return null
  
  const { branding } = OrganizationBrandingManager.extractBranding(organization)
  return branding.logo || null
}

/**
 * Hook to get organization primary color
 */
export function getOrganizationPrimaryColor(organization: LogtoOrganization | null): string {
  if (!organization) return DEFAULT_BRANDING.primaryColor!
  
  const { branding } = OrganizationBrandingManager.extractBranding(organization)
  return branding.primaryColor || DEFAULT_BRANDING.primaryColor!
}