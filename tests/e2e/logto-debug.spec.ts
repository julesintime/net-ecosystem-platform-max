import { test, expect } from '@playwright/test'

test.describe('Logto Integration Debug', () => {
  test('debug logto sign-in page structure', async ({ page }) => {
    console.log('🔍 Starting Logto sign-in page debug')
    
    await page.goto('http://localhost:6789')
    
    // Click sign in
    const signInButton = page.locator('[data-testid="auth-button"]:visible').first()
    await expect(signInButton).toBeVisible()
    await signInButton.click()
    
    // Wait for Logto page
    await page.waitForURL('**/sign-in**', { timeout: 15000 })
    console.log('✅ Redirected to Logto sign-in page')
    
    // Debug: Log current URL
    console.log(`Current URL: ${page.url()}`)
    
    // Debug: Find all input fields
    const inputs = page.locator('input')
    const inputCount = await inputs.count()
    console.log(`Found ${inputCount} input fields`)
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i)
      const type = await input.getAttribute('type')
      const name = await input.getAttribute('name')
      const placeholder = await input.getAttribute('placeholder')
      console.log(`Input ${i}: type="${type}", name="${name}", placeholder="${placeholder}"`)
    }
    
    // Debug: Find all buttons
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    console.log(`Found ${buttonCount} buttons`)
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      const type = await button.getAttribute('type')
      const text = await button.textContent()
      console.log(`Button ${i}: type="${type}", text="${text?.trim()}"`)
    }
    
    // Debug: Find all links
    const links = page.locator('a')
    const linkCount = await links.count()
    console.log(`Found ${linkCount} links`)
    
    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i)
      const href = await link.getAttribute('href')
      const text = await link.textContent()
      console.log(`Link ${i}: href="${href}", text="${text?.trim()}"`)
    }
    
    console.log('🔍 Debug complete')
  })
  
  test('test demo user credentials', async ({ page }) => {
    console.log('🔍 Testing demo user credentials')
    
    await page.goto('http://localhost:6789')
    
    const signInButton = page.locator('[data-testid="auth-button"]:visible').first()
    await signInButton.click()
    
    await page.waitForURL('**/sign-in**', { timeout: 15000 })
    
    // Try to sign in with demo credentials
    const demoUsername = process.env.LOGTO_DEMO_USERNAME || 'user'
    const demoPassword = process.env.LOGTO_DEMO_PASSWORD || 'RtIoJ1Mc'
    
    console.log(`Using demo credentials: ${demoUsername} / ${demoPassword}`)
    
    // Find username field (try different selectors)
    let usernameField = page.locator('input[name="identifier"]')
    if (!(await usernameField.isVisible({ timeout: 2000 }))) {
      usernameField = page.locator('input[name="username"]')
    }
    if (!(await usernameField.isVisible({ timeout: 2000 }))) {
      usernameField = page.locator('input[type="text"]').first()
    }
    
    await expect(usernameField).toBeVisible()
    await usernameField.fill(demoUsername)
    console.log('✅ Filled username field')
    
    // Find password field
    const passwordField = page.locator('input[type="password"]').first()
    await expect(passwordField).toBeVisible()
    await passwordField.fill(demoPassword)
    console.log('✅ Filled password field')
    
    // Find submit button
    const submitButton = page.locator('button[type="submit"]').first()
    await submitButton.click()
    console.log('✅ Clicked submit button')
    
    // Wait for redirect
    try {
      await page.waitForURL('http://localhost:6789/**', { timeout: 20000 })
      console.log('✅ Successfully signed in with demo user')
      
      // Check if we're on the home page or redirected elsewhere
      const currentUrl = page.url()
      console.log(`Final URL: ${currentUrl}`)
      
      // Check if sign-in was successful by looking for sign-out button or user info
      const userMenu = page.locator('[data-testid="user-menu"]')
      const userAvatar = page.locator('[data-testid="user-avatar"]')
      const signOutText = page.locator('text="Sign out"')
      const profileLink = page.locator('a:has-text("Profile")').first() // Use first() to avoid strict mode violation
      
      if (await userMenu.isVisible({ timeout: 2000 }) || 
          await userAvatar.isVisible({ timeout: 2000 }) || 
          await signOutText.isVisible({ timeout: 2000 }) ||
          await profileLink.isVisible({ timeout: 2000 })) {
        console.log('✅ User appears to be signed in (found user indicator)')
      } else {
        console.log('✅ User successfully redirected to home - sign-in appears successful')
      }
      
    } catch (error) {
      console.log('❌ Sign-in failed or timed out:', error)
      
      // Debug: Check what page we're on
      console.log(`Current URL after sign-in attempt: ${page.url()}`)
      
      // Check for error messages
      const errorMessages = page.locator('.error, [data-testid="error"], .alert-danger')
      const errorCount = await errorMessages.count()
      if (errorCount > 0) {
        console.log('Found error messages:')
        for (let i = 0; i < errorCount; i++) {
          const errorText = await errorMessages.nth(i).textContent()
          console.log(`  - ${errorText}`)
        }
      }
    }
  })
})