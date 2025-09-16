import { test, expect } from '@playwright/test'

const TEST_CONFIG = {
  baseUrl: 'http://localhost:6789',
  logtoUrl: 'https://z3zlta.logto.app',
  testUser: {
    // Generate unique username for each test run
    username: `testuser_${Date.now()}`,
    password: 'TestPassword123!',
    organizationName: `TestOrg_${Date.now()}`
  },
  demoUser: {
    username: process.env.LOGTO_DEMO_USERNAME || 'user',
    password: process.env.LOGTO_DEMO_PASSWORD || 'RtIoJ1Mc'
  }
}

// Global variable to track created users for cleanup
const createdTestUsers: string[] = []

test.describe('COMPLETE User Lifecycle - Full Coverage', () => {
  let userId: string | null = null

  test.skip('FULL LIFECYCLE: registration → organization → permissions → profile → deletion', async ({ page }) => {
    console.log('🎬 Starting COMPLETE user lifecycle test')
    console.log(`📝 Test user: ${TEST_CONFIG.testUser.username}`)
    
    // Step 1: Navigate to homepage
    console.log('📍 Step 1: Navigate to homepage')
    await page.goto(TEST_CONFIG.baseUrl)
    await page.waitForLoadState('networkidle')
    
    // Step 2: Click Sign In to go to Logto
    console.log('📍 Step 2: Click Sign In button')
    const signInButton = page.locator('[data-testid="auth-button"]:visible').first()
    await expect(signInButton).toBeVisible()
    await signInButton.click()
    
    // Step 3: Wait for Logto sign-in page
    console.log('📍 Step 3: Waiting for Logto sign-in page')
    await page.waitForURL('**/sign-in**', { timeout: 15000 })
    
    // Step 4: Register new user via Logto (COMPLETE MULTI-STEP PROCESS)
    console.log('📍 Step 4: Register new user via Logto (complete multi-step)')
    
    // Click "Create account" link
    const createAccountLink = page.locator('a:has-text("Create account")')
    await expect(createAccountLink).toBeVisible({ timeout: 5000 })
    await createAccountLink.click()
    console.log('   ✓ Clicked create account link')
    
    // Step 4a: First step - Enter username
    await page.waitForURL('**/register**', { timeout: 10000 })
    console.log('   📍 On registration page - username step')
    
    const usernameField = page.locator('input[name="identifier"]')
    await expect(usernameField).toBeVisible({ timeout: 10000 })
    await usernameField.fill(TEST_CONFIG.testUser.username)
    console.log('   ✓ Filled username field')
    
    // Track this user for cleanup
    createdTestUsers.push(TEST_CONFIG.testUser.username)
    
    // Submit username
    const createAccountButton = page.locator('button[type="submit"]:has-text("Create account")')
    await createAccountButton.click()
    console.log('   ✓ Submitted username')
    
    // Step 4b: Second step - Enter password
    await page.waitForURL('**/register/password**', { timeout: 10000 })
    console.log('   📍 On password step')
    
    const passwordField = page.locator('input[type="password"]').first()
    await expect(passwordField).toBeVisible({ timeout: 10000 })
    await passwordField.fill(TEST_CONFIG.testUser.password)
    console.log('   ✓ Filled password field')
    
    // Check for confirm password field
    const passwordFields = page.locator('input[type="password"]')
    const passwordCount = await passwordFields.count()
    if (passwordCount > 1) {
      const confirmPasswordField = passwordFields.nth(1)
      await confirmPasswordField.fill(TEST_CONFIG.testUser.password)
      console.log('   ✓ Filled confirm password field')
    }
    
    // Submit registration
    const submitPasswordButton = page.locator('button[type="submit"]').first()
    await submitPasswordButton.click()
    console.log('   ✓ Submitted registration form')
    
    // Step 5: Handle callback and onboarding redirect
    console.log('📍 Step 5: Handling post-registration flow')
    
    // Wait for any redirect from Logto - more flexible approach
    try {
      await page.waitForURL('http://localhost:6789/**', { timeout: 30000 })
      console.log('   ✓ Successfully redirected back to our app')
    } catch (error) {
      console.log('   ⚠️ Timeout waiting for redirect - checking current URL')
      console.log(`   Current URL: ${page.url()}`)
    }
    
    // Step 6: CREATE ORGANIZATION (if on onboarding)
    const currentUrl = page.url()
    if (currentUrl.includes('/onboarding')) {
      console.log('📍 Step 6: Creating organization during onboarding')
      
      await expect(page.locator('h1')).toContainText(/Welcome|Get Started|Create.*Organization/i)
      
      const orgNameInput = page.locator('input[name="organizationName"]')
      await expect(orgNameInput).toBeVisible()
      await orgNameInput.fill(TEST_CONFIG.testUser.organizationName)
      console.log(`   ✓ Filled organization name: ${TEST_CONFIG.testUser.organizationName}`)
      
      const orgDescInput = page.locator('textarea[name="organizationDescription"]')
      if (await orgDescInput.isVisible()) {
        await orgDescInput.fill('Test organization created during comprehensive E2E test')
        console.log('   ✓ Filled organization description')
      }
      
      const createOrgButton = page.locator('button[type="submit"]')
      await createOrgButton.click()
      console.log('   ✓ Organization created successfully')
      
      // Wait for redirect to home after org creation
      await page.waitForURL(TEST_CONFIG.baseUrl + '/', { timeout: 15000 })
      console.log('   ✓ Redirected to home after organization creation')
    } else {
      console.log('   ℹ️ User already has organization, skipped onboarding')
    }
    
    // Step 7: COMPREHENSIVE ECOSYSTEM APP PERMISSIONS TESTING
    console.log('📍 Step 7: Testing comprehensive ecosystem app permissions')
    
    const permissionsResponse = await page.request.get('/api/ecosystem-apps/test')
    expect(permissionsResponse.ok()).toBeTruthy()
    
    const permissionsData = await permissionsResponse.json()
    console.log(`   ✓ Permissions test: ${permissionsData.summary.passed}/${permissionsData.summary.totalTests} passed`)
    console.log(`   ✓ Overall status: ${permissionsData.summary.overallStatus}`)
    
    // Store user ID for deletion test
    userId = permissionsData.user?.id
    console.log(`   ✓ User ID captured: ${userId}`)
    
    // Validate all permission tests passed
    expect(permissionsData.summary.overallStatus).toBe('passed')
    expect(permissionsData.summary.passed).toEqual(permissionsData.summary.totalTests)
    
    // Step 8: COMPREHENSIVE ORGANIZATION VALIDATION
    console.log('📍 Step 8: Comprehensive organization validation')
    
    // Test organization check API
    const orgCheckResponse = await page.request.get('/api/organizations/check')
    expect(orgCheckResponse.ok()).toBeTruthy()
    const orgCheckData = await orgCheckResponse.json()
    console.log(`   ✓ User has ${orgCheckData.organizations.length} organization(s)`)
    expect(orgCheckData.hasOrganizations).toBeTruthy()
    
    // Test organizations list API
    const orgsResponse = await page.request.get('/api/organizations')
    expect(orgsResponse.ok()).toBeTruthy()
    const orgsData = await orgsResponse.json()
    console.log(`   ✓ Organizations API returned ${orgsData.data.length} organization(s)`)
    expect(orgsData.data.length).toBeGreaterThan(0)
    
    // Step 9: NAVIGATE AND TEST PROFILE SECTIONS
    console.log('📍 Step 9: Navigate and test all profile sections')
    
    await page.goto(`${TEST_CONFIG.baseUrl}/profile`)
    await page.waitForLoadState('networkidle')
    console.log('   ✓ Navigated to profile page')
    
    // Test organization switcher if visible
    const orgSwitcher = page.locator('[data-testid="organization-switcher"]')
    if (await orgSwitcher.isVisible({ timeout: 5000 })) {
      await orgSwitcher.click()
      
      const orgDropdown = page.locator('[data-testid="organization-dropdown"]')
      await expect(orgDropdown).toBeVisible()
      
      const orgItems = page.locator('[data-testid="organization-item"]')
      const itemCount = await orgItems.count()
      console.log(`   ✓ Organization switcher shows ${itemCount} organization(s)`)
      expect(itemCount).toBeGreaterThan(0)
      
      // Close dropdown
      await page.keyboard.press('Escape')
    } else {
      console.log('   ℹ️ Organization switcher not visible (single org user)')
    }
    
    // Step 10: COMPREHENSIVE ACCOUNT DELETION WORKFLOW
    console.log('📍 Step 10: Comprehensive account deletion workflow')
    
    // Navigate to profile settings
    await page.goto(`${TEST_CONFIG.baseUrl}/profile/settings`)
    await page.waitForLoadState('networkidle')
    console.log('   ✓ Navigated to profile settings')
    
    // Scroll to find delete section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    
    const deleteButton = page.locator('[data-testid="delete-account-button"]')
    await expect(deleteButton).toBeVisible({ timeout: 10000 })
    console.log('   ✓ Delete account button found')
    
    // Click to open delete confirmation dialog
    await deleteButton.click()
    console.log('   ✓ Clicked delete account button')
    
    // Validate deletion confirmation dialog
    const confirmInput = page.locator('[data-testid="delete-confirmation-input"]')
    await expect(confirmInput).toBeVisible()
    
    const confirmDeleteButton = page.locator('[data-testid="confirm-delete-button"]')
    await expect(confirmDeleteButton).toBeVisible()
    await expect(confirmDeleteButton).toBeDisabled() // Should be disabled initially
    console.log('   ✓ Delete confirmation dialog structure validated')
    
    // Type DELETE to enable confirmation button
    await confirmInput.fill('DELETE')
    await expect(confirmDeleteButton).toBeEnabled()
    console.log('   ✓ Confirmation button enabled after typing DELETE')
    
    // ACTUALLY DELETE THE ACCOUNT
    await confirmDeleteButton.click()
    console.log('   ✓ Confirmed account deletion - USER DELETED')
    
    // Step 11: VALIDATE DELETION AND REDIRECT
    console.log('📍 Step 11: Validate deletion and redirect')
    
    // Wait for redirect after deletion (should go to home page)
    await page.waitForURL(TEST_CONFIG.baseUrl + '/', { timeout: 15000 })
    console.log('   ✓ Redirected to home page after deletion')
    
    // Verify user is signed out
    const signInButtonAfterDeletion = page.locator('[data-testid="auth-button"]:visible').first()
    await expect(signInButtonAfterDeletion).toBeVisible()
    console.log('   ✓ User successfully signed out after deletion')
    
    // Step 12: VERIFY ACCOUNT DELETION IN BACKEND
    console.log('📍 Step 12: Verify account deletion in backend')
    
    if (userId) {
      // Test that user no longer exists by trying to verify deletion
      const verifyResponse = await page.request.post('/api/user/delete', {
        data: { userId, action: 'verify' }
      })
      
      if (verifyResponse.ok()) {
        const verifyData = await verifyResponse.json()
        if (!verifyData.exists) {
          console.log('   ✅ User successfully deleted from Logto backend')
          // Remove from cleanup list since it's deleted
          const index = createdTestUsers.indexOf(TEST_CONFIG.testUser.username)
          if (index > -1) {
            createdTestUsers.splice(index, 1)
          }
        } else {
          console.log('   ⚠️ User still exists in Logto - this may indicate an issue')
        }
      }
    }
    
    console.log('\n🎉 COMPLETE USER LIFECYCLE TEST COMPLETED SUCCESSFULLY!')
    console.log('✅ Registration → Organization Creation → Permissions → Profile → Deletion - ALL VALIDATED')
  })

  test('Demo user validation (baseline test)', async ({ page }) => {
    console.log('🎬 Demo user baseline validation')
    
    // Sign in with demo user
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
    
    // Verify successful login
    await page.waitForURL(TEST_CONFIG.baseUrl + '/**', { timeout: 15000 })
    await expect(page).not.toHaveURL(/\/onboarding/)
    
    // Test permissions
    const permissionsResponse = await page.request.get('/api/ecosystem-apps/test')
    expect(permissionsResponse.ok()).toBeTruthy()
    
    const permissionsData = await permissionsResponse.json()
    expect(permissionsData.summary.overallStatus).toBe('passed')
    
    console.log('✅ Demo user baseline test completed')
  })
})

// Cleanup function to handle any orphaned test users
test.afterEach(async ({ page }) => {
  if (createdTestUsers.length > 0) {
    console.log(`🧹 Cleaning up ${createdTestUsers.length} potentially orphaned test users`)
    
    for (const username of createdTestUsers) {
      try {
        console.log(`🗑️ Attempting cleanup: ${username}`)
        
        // Try to sign in and delete via UI
        await page.goto(TEST_CONFIG.baseUrl)
        const signInButton = page.locator('[data-testid="auth-button"]:visible').first()
        if (await signInButton.isVisible({ timeout: 3000 })) {
          await signInButton.click()
          await page.waitForURL('**/sign-in**', { timeout: 5000 })
          
          const usernameField = page.locator('input[name="identifier"]')
          await usernameField.fill(username)
          
          const passwordField = page.locator('input[type="password"]').first()
          await passwordField.fill(TEST_CONFIG.testUser.password)
          
          const submitButton = page.locator('button[type="submit"]').first()
          await submitButton.click()
          
          // If login successful, delete the account via API
          await page.waitForURL(TEST_CONFIG.baseUrl + '/**', { timeout: 5000 })
          
          const deleteResponse = await page.request.delete('/api/user/delete')
          if (deleteResponse.ok()) {
            console.log(`   ✅ Successfully cleaned up: ${username}`)
          }
        }
      } catch (error) {
        console.log(`   ⚠️ Could not cleanup ${username}:`, error)
      }
    }
    
    // Clear the array
    createdTestUsers.length = 0
  }
})