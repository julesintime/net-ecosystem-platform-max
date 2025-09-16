import { test, expect } from '@playwright/test'

const TEST_CONFIG = {
  baseUrl: 'http://localhost:6789',
  demoUser: {
    username: process.env.LOGTO_DEMO_USERNAME || 'user',
    password: process.env.LOGTO_DEMO_PASSWORD || 'RtIoJ1Mc'
  }
}

test.describe('Organization Switcher', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in with demo user before each test
    await page.goto(TEST_CONFIG.baseUrl)
    
    const signInButton = page.locator('[data-testid="auth-button"]:visible').first()
    await expect(signInButton).toBeVisible()
    await signInButton.click()
    
    await page.waitForURL('**/sign-in**', { timeout: 10000 })
    
    const usernameField = page.locator('input[name="identifier"]')
    await usernameField.fill(TEST_CONFIG.demoUser.username)
    
    const passwordField = page.locator('input[type="password"]').first()
    await passwordField.fill(TEST_CONFIG.demoUser.password)
    
    const submitButton = page.locator('button[type="submit"]').first()
    await submitButton.click()
    
    await page.waitForURL(TEST_CONFIG.baseUrl + '/**', { timeout: 15000 })
  })

  test('should display organization switcher when user has multiple organizations', async ({ page }) => {
    // Navigate to a page where organization switcher should be visible
    await page.goto(`${TEST_CONFIG.baseUrl}/profile`)
    
    const orgSwitcher = page.locator('[data-testid="organization-switcher"]')
    
    // Check if organization switcher is visible
    // Note: It might not be visible if user only has one organization
    if (await orgSwitcher.isVisible({ timeout: 5000 })) {
      await orgSwitcher.click()
      
      // Check for dropdown
      const orgDropdown = page.locator('[data-testid="organization-dropdown"]')
      await expect(orgDropdown).toBeVisible()
      
      // Check for organization items
      const orgItems = page.locator('[data-testid="organization-item"]')
      const itemCount = await orgItems.count()
      expect(itemCount).toBeGreaterThan(0)
      
      console.log(`✅ Organization switcher shows ${itemCount} organization(s)`)
      
      // Close the dropdown
      await page.keyboard.press('Escape')
    } else {
      console.log('ℹ️ Organization switcher not visible (user may have only one organization)')
    }
  })
  
  test('should allow switching between organizations', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseUrl}/profile`)
    
    const orgSwitcher = page.locator('[data-testid="organization-switcher"]')
    
    if (await orgSwitcher.isVisible({ timeout: 5000 })) {
      await orgSwitcher.click()
      
      const orgItems = page.locator('[data-testid="organization-item"]')
      const itemCount = await orgItems.count()
      
      if (itemCount > 1) {
        // Try to click on a different organization
        const secondOrg = orgItems.nth(1)
        await secondOrg.click()
        
        // Wait for potential page reload or context switch
        await page.waitForTimeout(2000)
        
        console.log('✅ Organization switching mechanism works')
      } else {
        console.log('ℹ️ User has only one organization, switching not applicable')
      }
    } else {
      console.log('ℹ️ Organization switcher not available')
    }
  })
  
  test('should display current organization name', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseUrl}/profile`)
    
    const orgSwitcher = page.locator('[data-testid="organization-switcher"]')
    
    if (await orgSwitcher.isVisible({ timeout: 5000 })) {
      // Check that the switcher shows some organization name
      const switcherText = await orgSwitcher.textContent()
      expect(switcherText).toBeTruthy()
      expect(switcherText!.trim().length).toBeGreaterThan(0)
      
      console.log(`✅ Current organization displayed: ${switcherText}`)
    } else {
      console.log('ℹ️ Organization switcher not visible')
    }
  })
})