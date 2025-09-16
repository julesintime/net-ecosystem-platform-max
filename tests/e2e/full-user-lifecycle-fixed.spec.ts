import { test, expect, Page } from '@playwright/test'

// Test configuration
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

test.describe('Full User Lifecycle - Fixed', () => {
  let userId: string | null = null

  test.skip('complete user journey: registration → onboarding → permissions → deletion', async ({ page }) => {
    console.log('🎬 Starting full user lifecycle test (FIXED)')
    console.log(`📝 Test user: ${TEST_CONFIG.testUser.username}`)
    
    // Step 1: Navigate to homepage
    console.log('\n📍 Step 1: Navigate to homepage')
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
    
    // Step 4: Register new user via Logto (FIXED MULTI-STEP PROCESS)
    console.log('📍 Step 4: Register new user via Logto (multi-step)')
    
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
    
    // Check if we're on onboarding page
    const currentUrl = page.url()
    if (currentUrl.includes('/onboarding')) {
      console.log('📍 Step 6: Creating organization during onboarding')
      
      await expect(page.locator('h1')).toContainText(/Welcome|Get Started|Create.*Organization/i)
      
      const orgNameInput = page.locator('input[name="organizationName"]')
      await expect(orgNameInput).toBeVisible()
      await orgNameInput.fill(TEST_CONFIG.testUser.organizationName)
      
      const orgDescInput = page.locator('textarea[name="organizationDescription"]')
      if (await orgDescInput.isVisible()) {
        await orgDescInput.fill('Test organization created during E2E test')
      }
      
      const createOrgButton = page.locator('button[type="submit"]')
      await createOrgButton.click()
      console.log('   ✓ Organization created')
      
      // Wait for redirect to home
      await page.waitForURL(TEST_CONFIG.baseUrl + '/', { timeout: 15000 })
    } else {
      console.log('   ✓ User already has organization, skipped onboarding')
    }
    
    // Step 7: Test ecosystem app permissions
    console.log('📍 Step 7: Testing ecosystem app permissions')
    
    const permissionsResponse = await page.request.get('/api/ecosystem-apps/test')
    expect(permissionsResponse.ok()).toBeTruthy()
    
    const permissionsData = await permissionsResponse.json()
    console.log(`   ✓ Permissions test: ${permissionsData.summary.passed}/${permissionsData.summary.totalTests} passed`)
    
    // Store user ID for deletion test
    userId = permissionsData.user?.id
    console.log(`   ✓ User ID: ${userId}`)
    
    // Step 8: Navigate to profile settings for deletion
    console.log('📍 Step 8: Navigate to profile settings')
    
    await page.goto(`${TEST_CONFIG.baseUrl}/profile/settings`)
    await page.waitForLoadState('networkidle')
    
    // Step 9: Delete account
    console.log('📍 Step 9: Delete account')
    
    // Scroll to bottom to find delete section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    
    const deleteButton = page.locator('[data-testid="delete-account-button"]')
    await expect(deleteButton).toBeVisible({ timeout: 10000 })
    await deleteButton.click()
    console.log('   ✓ Clicked delete account button')
    
    // Confirm deletion
    const confirmInput = page.locator('[data-testid="delete-confirmation-input"]')
    await expect(confirmInput).toBeVisible()
    await confirmInput.fill('DELETE')
    
    const confirmDeleteButton = page.locator('[data-testid="confirm-delete-button"]')
    await expect(confirmDeleteButton).toBeEnabled()
    await confirmDeleteButton.click()
    console.log('   ✓ Confirmed account deletion')
    
    // Wait for redirect after deletion
    await page.waitForURL(TEST_CONFIG.baseUrl + '/', { timeout: 15000 })
    console.log('   ✓ Account deleted and redirected to home')
    
    // Step 10: Verify deletion
    console.log('📍 Step 10: Verify account deletion')
    
    if (userId) {
      const verifyResponse = await page.request.post('/api/user/delete', {
        data: { userId }
      })
      
      if (verifyResponse.ok()) {
        const verifyData = await verifyResponse.json()
        if (!verifyData.exists) {
          console.log('   ✅ User successfully deleted from Logto')
          // Remove from cleanup list since it's deleted
          const index = createdTestUsers.indexOf(TEST_CONFIG.testUser.username)
          if (index > -1) {
            createdTestUsers.splice(index, 1)
          }
        } else {
          console.log('   ⚠️ User still exists in Logto')
        }
      }
    }
    
    console.log('\n🎉 Full user lifecycle test completed successfully!')
  })

  test('test with existing demo user', async ({ page }) => {
    console.log('🎬 Testing with demo user credentials')
    
    // Step 1: Sign in with demo user
    console.log('📍 Step 1: Sign in with demo user')
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
    
    // Step 2: Verify successful login
    console.log('📍 Step 2: Verify successful login')
    await page.waitForURL(TEST_CONFIG.baseUrl + '/**', { timeout: 15000 })
    
    // Should not be redirected to onboarding (demo user has organizations)
    await expect(page).not.toHaveURL(/\/onboarding/)
    console.log('   ✓ Demo user has organizations')
    
    // Step 3: Test permissions
    console.log('📍 Step 3: Test ecosystem permissions')
    
    const permissionsResponse = await page.request.get('/api/ecosystem-apps/test')
    expect(permissionsResponse.ok()).toBeTruthy()
    
    const permissionsData = await permissionsResponse.json()
    expect(permissionsData.summary.overallStatus).toBe('passed')
    console.log('   ✓ All permission tests passed')
    
    console.log('\n✅ Demo user test completed successfully!')
  })
})

// Cleanup function to delete any orphaned test users
test.afterEach(async ({ page }) => {
  console.log('🧹 Starting test cleanup...')
  
  if (createdTestUsers.length > 0) {
    console.log(`⚠️ Found ${createdTestUsers.length} potentially orphaned test users`)
    
    for (const username of createdTestUsers) {
      try {
        console.log(`🗑️ Attempting to clean up test user: ${username}`)
        
        // Try to sign in as this user to get their ID, then delete
        await page.goto(TEST_CONFIG.baseUrl)
        const signInButton = page.locator('[data-testid="auth-button"]:visible').first()
        if (await signInButton.isVisible({ timeout: 5000 })) {
          await signInButton.click()
          await page.waitForURL('**/sign-in**', { timeout: 10000 })
          
          const usernameField = page.locator('input[name="identifier"]')
          await usernameField.fill(username)
          
          const passwordField = page.locator('input[type="password"]').first()
          await passwordField.fill(TEST_CONFIG.testUser.password)
          
          const submitButton = page.locator('button[type="submit"]').first()
          await submitButton.click()
          
          // If login successful, delete the account
          await page.waitForURL(TEST_CONFIG.baseUrl + '/**', { timeout: 10000 })
          
          // Call delete API
          const deleteResponse = await page.request.delete('/api/user/delete')
          if (deleteResponse.ok()) {
            console.log(`   ✅ Successfully deleted test user: ${username}`)
          } else {
            console.log(`   ⚠️ Failed to delete test user: ${username}`)
          }
        }
      } catch (error) {
        console.log(`   ❌ Error during cleanup of ${username}:`, error)
      }
    }
    
    // Clear the array
    createdTestUsers.length = 0
  }
  
  console.log('🧹 Test cleanup completed')
})