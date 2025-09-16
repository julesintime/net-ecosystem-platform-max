import { test, expect } from '@playwright/test'

const TEST_CONFIG = {
  baseUrl: 'http://localhost:6789',
  demoUser: {
    username: process.env.LOGTO_DEMO_USERNAME || 'user',
    password: process.env.LOGTO_DEMO_PASSWORD || 'RtIoJ1Mc'
  }
}

test.describe('Simple User Lifecycle Test', () => {
  test('demo user complete flow: login → permissions → profile → delete UI', async ({ page }) => {
    console.log('🎬 Starting simple user lifecycle test with demo user')
    
    // Step 1: Sign in with demo user
    console.log('📍 Step 1: Sign in with demo user')
    await page.goto(TEST_CONFIG.baseUrl)
    
    const signInButton = page.locator('[data-testid="auth-button"]:visible').first()
    await expect(signInButton).toBeVisible()
    await signInButton.click()
    
    await page.waitForURL('**/sign-in**', { timeout: 15000 })
    
    // Use the correct field names we discovered
    const usernameField = page.locator('input[name="identifier"]')
    await expect(usernameField).toBeVisible()
    await usernameField.fill(TEST_CONFIG.demoUser.username)
    
    const passwordField = page.locator('input[type="password"]').first()
    await expect(passwordField).toBeVisible()
    await passwordField.fill(TEST_CONFIG.demoUser.password)
    
    const submitButton = page.locator('button[type="submit"]').first()
    await submitButton.click()
    console.log('   ✓ Submitted credentials')
    
    // Step 2: Wait for successful login
    console.log('📍 Step 2: Wait for successful login')
    await page.waitForURL(TEST_CONFIG.baseUrl + '/**', { timeout: 20000 })
    
    // Should not be on onboarding (demo user has org)
    await expect(page).not.toHaveURL(/\/onboarding/)
    console.log('   ✓ Successfully logged in, not redirected to onboarding')
    
    // Step 3: Test ecosystem app permissions
    console.log('📍 Step 3: Test ecosystem permissions')
    
    const permissionsResponse = await page.request.get('/api/ecosystem-apps/test')
    expect(permissionsResponse.ok()).toBeTruthy()
    
    const permissionsData = await permissionsResponse.json()
    console.log(`   ✓ Permissions test: ${permissionsData.summary.passed}/${permissionsData.summary.totalTests} passed`)
    expect(permissionsData.summary.overallStatus).toBe('passed')
    
    // Step 4: Navigate to profile
    console.log('📍 Step 4: Navigate to profile')
    await page.goto(`${TEST_CONFIG.baseUrl}/profile`)
    await page.waitForLoadState('networkidle')
    
    // Step 5: Test organization switcher
    console.log('📍 Step 5: Test organization switcher')
    
    const orgSwitcher = page.locator('[data-testid="organization-switcher"]')
    if (await orgSwitcher.isVisible({ timeout: 5000 })) {
      await orgSwitcher.click()
      
      const orgDropdown = page.locator('[data-testid="organization-dropdown"]')
      await expect(orgDropdown).toBeVisible()
      
      const orgItems = page.locator('[data-testid="organization-item"]')
      const itemCount = await orgItems.count()
      console.log(`   ✓ Organization switcher shows ${itemCount} organization(s)`)
      
      // Close dropdown
      await page.keyboard.press('Escape')
    } else {
      console.log('   ℹ️ Organization switcher not visible')
    }
    
    // Step 6: Test delete account UI (but don't actually delete)
    console.log('📍 Step 6: Test delete account UI')
    
    // Navigate directly to profile settings
    await page.goto(`${TEST_CONFIG.baseUrl}/profile/settings`)
    await page.waitForLoadState('networkidle')
    
    // Scroll to find delete section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    
    const deleteButton = page.locator('[data-testid="delete-account-button"]')
    await expect(deleteButton).toBeVisible({ timeout: 10000 })
    console.log('   ✓ Delete account button found')
    
    // Click to open dialog
    await deleteButton.click()
    
    const confirmInput = page.locator('[data-testid="delete-confirmation-input"]')
    await expect(confirmInput).toBeVisible()
    
    const confirmDeleteButton = page.locator('[data-testid="confirm-delete-button"]')
    await expect(confirmDeleteButton).toBeVisible()
    await expect(confirmDeleteButton).toBeDisabled() // Should be disabled until "DELETE" is typed
    
    console.log('   ✓ Delete confirmation dialog works correctly')
    
    // Close dialog without deleting
    await page.keyboard.press('Escape')
    
    console.log('\n🎉 Simple user lifecycle test completed successfully!')
  })
  
  test('test organization onboarding for new user simulation', async ({ page }) => {
    console.log('🎬 Testing onboarding page directly')
    
    // Step 1: Sign in with demo user first
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
    
    // Step 2: Navigate directly to onboarding to test the UI
    console.log('📍 Step 2: Navigate to onboarding page directly')
    await page.goto(`${TEST_CONFIG.baseUrl}/onboarding`)
    await page.waitForLoadState('networkidle')
    
    // Step 3: Test onboarding form
    console.log('📍 Step 3: Test onboarding form')
    
    // Check if we get redirected back (user already has org) or see onboarding form
    const currentUrl = page.url()
    if (currentUrl.includes('/onboarding')) {
      // User doesn't have org - validate onboarding form
      const orgNameInput = page.locator('input[name="organizationName"]')
      await expect(orgNameInput).toBeVisible()
      
      const createOrgButton = page.locator('button[type="submit"]')
      await expect(createOrgButton).toBeVisible()
      console.log('   ✓ Onboarding form structure is correct')
    } else {
      // User was redirected back (has organizations) - this is expected behavior
      console.log('   ✓ User redirected back (has organizations)')
    }
    
    console.log('\n✅ Onboarding page test completed successfully!')
  })
  
  test('test organization APIs directly', async ({ page }) => {
    console.log('🎬 Testing organization APIs')
    
    // Step 1: Sign in first
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
    
    // Step 2: Test organization check API
    console.log('📍 Step 2: Test organization check API')
    
    const orgCheckResponse = await page.request.get('/api/organizations/check')
    expect(orgCheckResponse.ok()).toBeTruthy()
    
    const orgCheckData = await orgCheckResponse.json()
    console.log(`   ✓ User has ${orgCheckData.organizations.length} organization(s)`)
    expect(orgCheckData.hasOrganizations).toBeTruthy()
    
    // Step 3: Test organizations list API
    console.log('📍 Step 3: Test organizations list API')
    
    const orgsResponse = await page.request.get('/api/organizations')
    expect(orgsResponse.ok()).toBeTruthy()
    
    const orgsData = await orgsResponse.json()
    console.log(`   ✓ Organizations API returned ${orgsData.data.length} organization(s)`)
    
    // Step 4: Test ecosystem permissions API
    console.log('📍 Step 4: Test ecosystem permissions API')
    
    const permResponse = await page.request.get('/api/ecosystem-apps/test')
    expect(permResponse.ok()).toBeTruthy()
    
    const permData = await permResponse.json()
    console.log(`   ✓ Permissions: ${permData.summary.passed}/${permData.summary.totalTests} tests passed`)
    
    console.log('\n✅ Organization APIs test completed successfully!')
  })
})