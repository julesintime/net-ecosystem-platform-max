"use client"

const CURRENT_ORG_KEY = 'ecosystem-current-organization'
const ORG_PREFERENCES_KEY = 'ecosystem-organization-preferences'

export interface OrganizationPreferences {
  lastSwitched: number
  favorites: string[]
  switchCount: number
}

export interface StoredOrganizationData {
  organizationId: string
  name: string
  timestamp: number
}

export class OrganizationStorage {
  static getCurrentOrganization(): StoredOrganizationData | null {
    if (typeof window === 'undefined') return null
    
    try {
      const stored = localStorage.getItem(CURRENT_ORG_KEY)
      if (!stored) return null
      
      const data = JSON.parse(stored) as StoredOrganizationData
      
      // Validate data structure
      if (!data.organizationId || !data.name || !data.timestamp) {
        this.clearCurrentOrganization()
        return null
      }
      
      // Check if data is not too old (24 hours)
      const isStale = Date.now() - data.timestamp > 24 * 60 * 60 * 1000
      if (isStale) {
        this.clearCurrentOrganization()
        return null
      }
      
      return data
    } catch (error) {
      console.warn('Failed to parse stored organization data:', error)
      this.clearCurrentOrganization()
      return null
    }
  }
  
  static setCurrentOrganization(organizationId: string, name: string): void {
    if (typeof window === 'undefined') return
    
    const data: StoredOrganizationData = {
      organizationId,
      name,
      timestamp: Date.now()
    }
    
    try {
      localStorage.setItem(CURRENT_ORG_KEY, JSON.stringify(data))
      this.updatePreferences(organizationId)
    } catch (error) {
      console.warn('Failed to store organization data:', error)
    }
  }
  
  static clearCurrentOrganization(): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(CURRENT_ORG_KEY)
    } catch (error) {
      console.warn('Failed to clear organization data:', error)
    }
  }
  
  static getPreferences(): OrganizationPreferences {
    if (typeof window === 'undefined') {
      return { lastSwitched: 0, favorites: [], switchCount: 0 }
    }
    
    try {
      const stored = localStorage.getItem(ORG_PREFERENCES_KEY)
      if (!stored) {
        return { lastSwitched: 0, favorites: [], switchCount: 0 }
      }
      
      return JSON.parse(stored) as OrganizationPreferences
    } catch (error) {
      console.warn('Failed to parse organization preferences:', error)
      return { lastSwitched: 0, favorites: [], switchCount: 0 }
    }
  }
  
  static updatePreferences(organizationId: string): void {
    if (typeof window === 'undefined') return
    
    try {
      const current = this.getPreferences()
      const updated: OrganizationPreferences = {
        ...current,
        lastSwitched: Date.now(),
        switchCount: current.switchCount + 1
      }
      
      localStorage.setItem(ORG_PREFERENCES_KEY, JSON.stringify(updated))
    } catch (error) {
      console.warn('Failed to update organization preferences:', error)
    }
  }
  
  static addToFavorites(organizationId: string): void {
    if (typeof window === 'undefined') return
    
    try {
      const preferences = this.getPreferences()
      if (!preferences.favorites.includes(organizationId)) {
        preferences.favorites.push(organizationId)
        localStorage.setItem(ORG_PREFERENCES_KEY, JSON.stringify(preferences))
      }
    } catch (error) {
      console.warn('Failed to add organization to favorites:', error)
    }
  }
  
  static removeFromFavorites(organizationId: string): void {
    if (typeof window === 'undefined') return
    
    try {
      const preferences = this.getPreferences()
      preferences.favorites = preferences.favorites.filter(id => id !== organizationId)
      localStorage.setItem(ORG_PREFERENCES_KEY, JSON.stringify(preferences))
    } catch (error) {
      console.warn('Failed to remove organization from favorites:', error)
    }
  }
  
  static clearAllData(): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(CURRENT_ORG_KEY)
      localStorage.removeItem(ORG_PREFERENCES_KEY)
    } catch (error) {
      console.warn('Failed to clear organization storage:', error)
    }
  }
}