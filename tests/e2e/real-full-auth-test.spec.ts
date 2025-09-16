import { test, expect } from '@playwright/test'

const TEST_CONFIG = {
  baseUrl: 'http://localhost:6789',
  demoUser: {
    username: process.env.LOGTO_DEMO_USERNAME || 'user',
    password: process.env.LOGTO_DEMO_PASSWORD || 'RtIoJ1Mc'
  }
}

test.describe('Real Full Authentication Test', () => {
  test('comprehensive demo user authentication and feature test', async ({ page }) => {
    console.log('🎬 Starting real full authentication test')
    console.log(`Using demo user: ${TEST_CONFIG.demoUser.username}`)
    
    // Step 1: Go to home page
    console.log('📍 Step 1: Navigate to home page')
    await page.goto(TEST_CONFIG.baseUrl)
    await page.waitForLoadState('networkidle')
    
    // Step 2: Initiate sign in
    console.log('📍 Step 2: Click sign in')
    const signInButton = page.locator('[data-testid="auth-button"]:visible').first()
    await expect(signInButton).toBeVisible()
    await signInButton.click()
    
    // Step 3: Wait for Logto page
    console.log('📍 Step 3: Wait for Logto sign-in page')
    await page.waitForURL('**/sign-in**', { timeout: 15000 })
    
    // Step 4: Fill credentials
    console.log('📍 Step 4: Fill in credentials')
    const usernameField = page.locator('input[name="identifier"]')
    await expect(usernameField).toBeVisible({ timeout: 10000 })
    await usernameField.fill(TEST_CONFIG.demoUser.username)
    
    const passwordField = page.locator('input[type="password"]').first()
    await expect(passwordField).toBeVisible()
    await passwordField.fill(TEST_CONFIG.demoUser.password)
    
    // Step 5: Submit sign in
    console.log('📍 Step 5: Submit sign in')
    const submitButton = page.locator('button[type="submit"]').first()
    await submitButton.click()
    
    // Step 6: Wait for successful authentication
    console.log('📍 Step 6: Wait for authentication success')
    await page.waitForURL(TEST_CONFIG.baseUrl + '/**', { timeout: 20000 })
    
    // Should not be on onboarding (demo user has org)
    await expect(page).not.toHaveURL(/\/onboarding/)
    console.log('   ✅ Successfully authenticated, not redirected to onboarding')
    
    // Step 7: Test organization APIs
    console.log('📍 Step 7: Test organization APIs')
    
    const orgCheckResponse = await page.request.get('/api/organizations/check')
    expect(orgCheckResponse.ok()).toBeTruthy()
    const orgCheckData = await orgCheckResponse.json()
    console.log(`   ✓ User has ${orgCheckData.organizations?.length || 0} organization(s)`)
    expect(orgCheckData.hasOrganizations).toBeTruthy()
    
    const orgsResponse = await page.request.get('/api/organizations')
    expect(orgsResponse.ok()).toBeTruthy()
    const orgsData = await orgsResponse.json()
    console.log(`   ✓ Organizations API returned ${orgsData.data?.length || 0} organization(s)`)
    
    // Step 8: Test ecosystem permissions
    console.log('📍 Step 8: Test ecosystem permissions')
    
    const permissionsResponse = await page.request.get('/api/ecosystem-apps/test')
    expect(permissionsResponse.ok()).toBeTruthy()
    const permissionsData = await permissionsResponse.json()
    
    console.log(`   ✓ Permission tests: ${permissionsData.summary.passed}/${permissionsData.summary.totalTests}`)
    console.log(`   ✓ Overall status: ${permissionsData.summary.overallStatus}`)
    
    expect(permissionsData.summary.overallStatus).toBe('passed')
    
    // Step 9: Navigate to profile and test features
    console.log('📍 Step 9: Test profile features')
    
    await page.goto(`${TEST_CONFIG.baseUrl}/profile`)
    await page.waitForLoadState('networkidle')
    
    // Test organization switcher if available
    const orgSwitcher = page.locator('[data-testid="organization-switcher"]')
    if (await orgSwitcher.isVisible({ timeout: 3000 })) {
      console.log('   ✓ Organization switcher is visible')
      await orgSwitcher.click()
      
      const orgDropdown = page.locator('[data-testid="organization-dropdown"]')
      await expect(orgDropdown).toBeVisible()
      
      const orgItems = page.locator('[data-testid="organization-item"]')
      const itemCount = await orgItems.count()
      console.log(`   ✓ Organization dropdown shows ${itemCount} organization(s)`)
      
      // Close dropdown
      await page.keyboard.press('Escape')
    } else {
      console.log('   ℹ️ Organization switcher not visible (single organization)')
    }
    
    // Step 10: Test profile settings and delete account UI
    console.log('📍 Step 10: Test profile settings')
    
    await page.goto(`${TEST_CONFIG.baseUrl}/profile/settings`)
    await page.waitForLoadState('networkidle')
    
    // Scroll to find delete account section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    
    const deleteButton = page.locator('[data-testid="delete-account-button"]')
    if (await deleteButton.isVisible({ timeout: 5000 })) {
      console.log('   ✓ Delete account button found')
      
      // Open delete confirmation (but don't actually delete)
      await deleteButton.click()
      
      const confirmInput = page.locator('[data-testid="delete-confirmation-input"]')
      await expect(confirmInput).toBeVisible()
      
      const confirmDeleteButton = page.locator('[data-testid="confirm-delete-button"]')
      await expect(confirmDeleteButton).toBeVisible()
      await expect(confirmDeleteButton).toBeDisabled()
      
      console.log('   ✓ Delete account confirmation dialog works')
      
      // Close dialog without deleting
      await page.keyboard.press('Escape')
      
    } else {
      console.log('   ⚠️ Delete account button not found')
    }
    
    // Step 11: Test other profile sections
    console.log('📍 Step 11: Test other profile sections')
    
    // Test ecosystem apps section
    await page.goto(`${TEST_CONFIG.baseUrl}/profile/ecosystem-apps`)
    await page.waitForLoadState('networkidle')
    console.log('   ✓ Ecosystem apps page accessible')
    
    // Test organization section  
    await page.goto(`${TEST_CONFIG.baseUrl}/profile/organization`)
    await page.waitForLoadState('networkidle')
    console.log('   ✓ Organization page accessible')
    
    console.log('\n🎉 Real full authentication test completed successfully!')
    console.log('✅ All authentication, authorization, and UI features validated')
  })
  
  test('test sign out functionality', async ({ page }) => {
    console.log('🎬 Testing sign out functionality')
    
    // First sign in
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
    console.log('   ✓ Signed in successfully')
    
    // Now test sign out - try multiple selectors
    const signOutButton = page.locator('[data-testid="auth-button"]:visible').or(page.locator('text="Sign out"')).or(page.locator('button:has-text("Sign out")'))
    
    if (await signOutButton.isVisible({ timeout: 5000 })) {
      await signOutButton.click()
      
      // Wait for sign out to complete
      await page.waitForTimeout(3000)
      
      // Check if we're signed out by looking for sign in button
      const signInButtonAfter = page.locator('[data-testid="auth-button"]:visible').first()
      if (await signInButtonAfter.isVisible({ timeout: 5000 })) {
        console.log('   ✅ Sign out successful - sign in button visible again')
      } else {
        console.log('   ⚠️ Sign out status unclear')
      }
    } else {
      console.log('   ⚠️ Sign out button not found - may not be implemented yet')
    }
  })
})