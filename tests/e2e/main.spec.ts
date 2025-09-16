import { test, expect } from '@playwright/test'

const TEST_CONFIG = {
  baseUrl: 'http://localhost:6789',
  demoUser: {
    username: process.env.LOGTO_DEMO_USERNAME || 'user',
    password: process.env.LOGTO_DEMO_PASSWORD || 'RtIoJ1Mc'
  }
}

test.describe('User Lifecycle and Organization Management', () => {
  test('demo user authentication and permissions test', async ({ page }) => {
    // Step 1: Sign in with demo user
    await page.goto(TEST_CONFIG.baseUrl)
    
    const signInButton = page.locator('[data-testid="auth-button"]:visible').first()
    await expect(signInButton).toBeVisible()
    await signInButton.click()
    
    await page.waitForURL('**/sign-in**', { timeout: 15000 })
    
    const usernameField = page.locator('input[name="identifier"]')
    await expect(usernameField).toBeVisible()
    await usernameField.fill(TEST_CONFIG.demoUser.username)
    
    const passwordField = page.locator('input[type="password"]').first()
    await expect(passwordField).toBeVisible()
    await passwordField.fill(TEST_CONFIG.demoUser.password)
    
    const submitButton = page.locator('button[type="submit"]').first()
    await submitButton.click()
    
    // Step 2: Wait for successful login
    await page.waitForURL(TEST_CONFIG.baseUrl + '/**', { timeout: 20000 })
    await expect(page).not.toHaveURL(/\/onboarding/)
    
    // Step 3: Test ecosystem app permissions
    const permissionsResponse = await page.request.get('/api/ecosystem-apps/test')
    expect(permissionsResponse.ok()).toBeTruthy()
    
    const permissionsData = await permissionsResponse.json()
    expect(permissionsData.summary.overallStatus).toBe('passed')
  })
  
  test('profile navigation and organization switcher', async ({ page }) => {
    // Sign in first
    await page.goto(TEST_CONFIG.baseUrl)
    const signInButton = page.locator('[data-testid="auth-button"]:visible').first()
    await signInButton.click()
    
    await page.waitForURL('**/sign-in**', { timeout: 10000 })
    
    const usernameField = page.locator('input[name="identifier"]')
    await usernameField.fill(TEST_CONFIG.demoUser.username)
    
    const passwordField = page.locator('input[type="password"]').first()
    await passwordField.fill(TEST_CONFIG.demoUser.password)
    
    const submitButton = page.locator('button[type="submit"]').first()
    await submitButton.click()
    
    await page.waitForURL(TEST_CONFIG.baseUrl + '/**', { timeout: 15000 })
    
    // Navigate to profile
    await page.goto(`${TEST_CONFIG.baseUrl}/profile`)
    await page.waitForLoadState('networkidle')
    
    // Test organization switcher if visible
    const orgSwitcher = page.locator('[data-testid="organization-switcher"]')
    if (await orgSwitcher.isVisible({ timeout: 5000 })) {
      await orgSwitcher.click()
      
      const orgDropdown = page.locator('[data-testid="organization-dropdown"]')
      await expect(orgDropdown).toBeVisible()
      
      const orgItems = page.locator('[data-testid="organization-item"]')
      expect(await orgItems.count()).toBeGreaterThan(0)
      
      await page.keyboard.press('Escape')
    }
  })
  
  test('delete account UI validation', async ({ page }) => {
    // Sign in first
    await page.goto(TEST_CONFIG.baseUrl)
    const signInButton = page.locator('[data-testid="auth-button"]:visible').first()
    await signInButton.click()
    
    await page.waitForURL('**/sign-in**', { timeout: 10000 })
    
    const usernameField = page.locator('input[name="identifier"]')
    await usernameField.fill(TEST_CONFIG.demoUser.username)
    
    const passwordField = page.locator('input[type="password"]').first()
    await passwordField.fill(TEST_CONFIG.demoUser.password)
    
    const submitButton = page.locator('button[type="submit"]').first()
    await submitButton.click()
    
    await page.waitForURL(TEST_CONFIG.baseUrl + '/**', { timeout: 15000 })
    
    // Navigate directly to profile settings page
    await page.goto(`${TEST_CONFIG.baseUrl}/profile/settings`)
    await page.waitForLoadState('networkidle')
    
    // Scroll to find delete section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    
    const deleteButton = page.locator('[data-testid="delete-account-button"]')
    await expect(deleteButton).toBeVisible({ timeout: 10000 })
    
    // Click to open dialog
    await deleteButton.click()
    
    const confirmInput = page.locator('[data-testid="delete-confirmation-input"]')
    await expect(confirmInput).toBeVisible()
    
    const confirmDeleteButton = page.locator('[data-testid="confirm-delete-button"]')
    await expect(confirmDeleteButton).toBeVisible()
    await expect(confirmDeleteButton).toBeDisabled()
    
    // Close dialog without deleting
    await page.keyboard.press('Escape')
  })
  
  test('onboarding page accessibility check', async ({ page }) => {
    // Sign in first
    await page.goto(TEST_CONFIG.baseUrl)
    const signInButton = page.locator('[data-testid="auth-button"]:visible').first()
    await signInButton.click()
    
    await page.waitForURL('**/sign-in**', { timeout: 10000 })
    
    const usernameField = page.locator('input[name="identifier"]')
    await usernameField.fill(TEST_CONFIG.demoUser.username)
    
    const passwordField = page.locator('input[type="password"]').first()
    await passwordField.fill(TEST_CONFIG.demoUser.password)
    
    const submitButton = page.locator('button[type="submit"]').first()
    await submitButton.click()
    
    await page.waitForURL(TEST_CONFIG.baseUrl + '/**', { timeout: 15000 })
    
    // Navigate directly to onboarding to test the UI
    await page.goto(`${TEST_CONFIG.baseUrl}/onboarding`)
    await page.waitForLoadState('networkidle')
    
    // Check if we get redirected back (user already has org) or see onboarding form
    const currentUrl = page.url()
    if (currentUrl.includes('/onboarding')) {
      // User doesn't have org - validate onboarding form
      const orgNameInput = page.locator('input[name="organizationName"]')
      await expect(orgNameInput).toBeVisible()
      
      const createOrgButton = page.locator('button[type="submit"]')
      await expect(createOrgButton).toBeVisible()
    } else {
      // User was redirected back (has organizations) - this is expected behavior
      await expect(page).not.toHaveURL(/\/onboarding/)
    }
  })
  
  test('organization APIs functionality', async ({ page }) => {
    // Sign in first
    await page.goto(TEST_CONFIG.baseUrl)
    const signInButton = page.locator('[data-testid="auth-button"]:visible').first()
    await signInButton.click()
    
    await page.waitForURL('**/sign-in**', { timeout: 10000 })
    
    const usernameField = page.locator('input[name="identifier"]')
    await usernameField.fill(TEST_CONFIG.demoUser.username)
    
    const passwordField = page.locator('input[type="password"]').first()
    await passwordField.fill(TEST_CONFIG.demoUser.password)
    
    const submitButton = page.locator('button[type="submit"]').first()
    await submitButton.click()
    
    await page.waitForURL(TEST_CONFIG.baseUrl + '/**', { timeout: 15000 })
    
    // Test organization check API
    const orgCheckResponse = await page.request.get('/api/organizations/check')
    expect(orgCheckResponse.ok()).toBeTruthy()
    
    const orgCheckData = await orgCheckResponse.json()
    expect(orgCheckData.hasOrganizations).toBeTruthy()
    expect(orgCheckData.organizations.length).toBeGreaterThan(0)
    
    // Test organizations list API
    const orgsResponse = await page.request.get('/api/organizations')
    expect(orgsResponse.ok()).toBeTruthy()
    
    const orgsData = await orgsResponse.json()
    expect(orgsData.data.length).toBeGreaterThan(0)
    
    // Test ecosystem permissions API
    const permResponse = await page.request.get('/api/ecosystem-apps/test')
    expect(permResponse.ok()).toBeTruthy()
    
    const permData = await permResponse.json()
    expect(permData.summary.overallStatus).toBe('passed')
    expect(permData.summary.passed).toEqual(permData.summary.totalTests)
  })
})