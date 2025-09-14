import { test, expect } from '@playwright/test'

// Real authentication test with demo credentials
test.describe('Real Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should complete full authentication flow with demo user', async ({ page }) => {
    // 1. Navigate directly to sign-in API endpoint (since auth button uses server action)
    await page.goto('/api/auth/sign-in')
    
    // 2. Should be redirected to Logto sign-in page
    await page.waitForURL('**/sign-in**', { timeout: 10000 })
    
    // 3. Fill in demo credentials
    await page.fill('input[type="text"]:not([type="password"])', process.env.LOGTO_DEMO_USERNAME || 'user')
    await page.fill('input[type="password"]', process.env.LOGTO_DEMO_PASSWORD || 'RtIoJ1Mc')
    
    // 4. Click sign in
    await page.click('button[type="submit"]:has-text("Sign in")')
    
    // 5. Should be redirected back to home page authenticated
    await page.waitForURL('http://localhost:6789/', { timeout: 10000 })
    
    // 6. Verify authenticated state - should see profile dropdown
    await expect(page.locator('[data-testid="profile-dropdown"]')).toBeVisible({ timeout: 5000 })
    
    // 7. Test organization selector is visible
    await expect(page.locator('[data-testid="organization-selector"]')).toBeVisible({ timeout: 5000 })
  })

  test('should handle sign-out correctly', async ({ page }) => {
    // First sign in
    await page.goto('/api/auth/sign-in')
    await page.waitForURL('**/sign-in**')
    await page.fill('input[type="text"]:not([type="password"])', process.env.LOGTO_DEMO_USERNAME || 'user')
    await page.fill('input[type="password"]', process.env.LOGTO_DEMO_PASSWORD || 'RtIoJ1Mc')
    await page.click('button[type="submit"]:has-text("Sign in")')
    
    await page.waitForURL('http://localhost:6789/')
    await expect(page.locator('[data-testid="profile-dropdown"]')).toBeVisible()
    
    // Now test sign-out using API endpoint directly
    await page.goto('/api/auth/sign-out')
    
    // Should be redirected back to home page without errors
    await page.waitForURL('http://localhost:6789/', { timeout: 10000 })
    
    // Should see sign-in button again (not profile dropdown)
    await expect(page.locator('[data-testid="auth-button"]').first()).toBeVisible()
    await expect(page.locator('[data-testid="profile-dropdown"]')).not.toBeVisible()
  })
})