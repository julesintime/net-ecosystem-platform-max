"use client"

import { useState, useCallback } from 'react'

export interface ProfileSettings {
  // Personal Information
  displayName: string
  email: string
  bio?: string
  location?: string
  website?: string
  
  // Preferences
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  
  // Notifications
  emailNotifications: boolean
  pushNotifications: boolean
  weeklyDigest: boolean
  securityAlerts: boolean
  
  // Privacy
  profileVisibility: 'public' | 'organization' | 'private'
  showEmail: boolean
  showLocation: boolean
}

export interface UseProfileSettingsOptions {
  initialSettings?: Partial<ProfileSettings>
}

export interface UseProfileSettingsReturn {
  settings: ProfileSettings
  isLoading: boolean
  isSaving: boolean
  error: string | null
  hasUnsavedChanges: boolean
  
  // Actions
  updateSetting: <K extends keyof ProfileSettings>(key: K, value: ProfileSettings[K]) => void
  updateSettings: (updates: Partial<ProfileSettings>) => void
  saveSettings: () => Promise<void>
  resetSettings: () => void
  loadSettings: () => Promise<void>
}

const defaultSettings: ProfileSettings = {
  displayName: '',
  email: '',
  bio: '',
  location: '',
  website: '',
  theme: 'system',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  emailNotifications: true,
  pushNotifications: true,
  weeklyDigest: false,
  securityAlerts: true,
  profileVisibility: 'organization',
  showEmail: false,
  showLocation: true,
}

export function useProfileSettings(options: UseProfileSettingsOptions = {}): UseProfileSettingsReturn {
  const [settings, setSettings] = useState<ProfileSettings>({
    ...defaultSettings,
    ...options.initialSettings
  })
  const [originalSettings, setOriginalSettings] = useState<ProfileSettings>({
    ...defaultSettings,
    ...options.initialSettings
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Check if there are unsaved changes
  const hasUnsavedChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings)
  
  const updateSetting = useCallback(<K extends keyof ProfileSettings>(
    key: K,
    value: ProfileSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setError(null)
  }, [])
  
  const updateSettings = useCallback((updates: Partial<ProfileSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
    setError(null)
  }, [])
  
  const loadSettings = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/profile/settings', {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to load profile settings')
      }
      
      const data = await response.json()
      const loadedSettings = { ...defaultSettings, ...data.settings }
      
      setSettings(loadedSettings)
      setOriginalSettings(loadedSettings)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load settings'
      setError(errorMessage)
      console.error('Error loading profile settings:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  const saveSettings = useCallback(async () => {
    if (isSaving || !hasUnsavedChanges) return
    
    setIsSaving(true)
    setError(null)
    
    try {
      const response = await fetch('/api/profile/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save profile settings')
      }
      
      const { data } = await response.json()
      const savedSettings = { ...defaultSettings, ...data.settings }
      
      setSettings(savedSettings)
      setOriginalSettings(savedSettings)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings'
      setError(errorMessage)
      console.error('Error saving profile settings:', err)
      throw err
    } finally {
      setIsSaving(false)
    }
  }, [settings, isSaving, hasUnsavedChanges])
  
  const resetSettings = useCallback(() => {
    setSettings(originalSettings)
    setError(null)
  }, [originalSettings])
  
  return {
    settings,
    isLoading,
    isSaving,
    error,
    hasUnsavedChanges,
    updateSetting,
    updateSettings,
    saveSettings,
    resetSettings,
    loadSettings,
  }
}