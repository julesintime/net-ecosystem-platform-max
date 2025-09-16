import { test, expect } from '@playwright/test'

test.describe('Logto Registration Debug', () => {
  test.skip('debug logto registration flow (NO USER CREATION)', async ({ page }) => {
    console.log('🔍 Starting Logto registration debug (structure only)')
    
    await page.goto('http://localhost:6789')
    
    // Click sign in to go to Logto
    const signInButton = page.locator('[data-testid="auth-button"]:visible').first()
    await expect(signInButton).toBeVisible()
    await signInButton.click()
    
    await page.waitForURL('**/sign-in**', { timeout: 15000 })
    console.log('✅ On Logto sign-in page')
    
    // Look for "Create account" or "Register" link
    console.log('🔍 Looking for registration link...')
    
    const createAccountLink = page.locator('a:has-text("Create account"), a:has-text("Register"), a:has-text("Sign up")')
    await expect(createAccountLink.first()).toBeVisible({ timeout: 10000 })
    
    const linkText = await createAccountLink.first().textContent()
    console.log(`✅ Found registration link: "${linkText}"`)
    
    await createAccountLink.first().click()
    
    // Wait for registration page
    await page.waitForURL('**/register**', { timeout: 10000 })
    console.log('✅ On registration page')
    console.log(`Registration URL: ${page.url()}`)
    
    // Debug: Check page structure
    const pageTitle = await page.locator('h1, h2, .title, [data-testid="title"]').first().textContent()
    console.log(`Page title: ${pageTitle}`)
    
    // Debug: List all input fields
    const inputs = page.locator('input')
    const inputCount = await inputs.count()
    console.log(`Found ${inputCount} input fields on registration page`)
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i)
      const type = await input.getAttribute('type')
      const name = await input.getAttribute('name')
      const placeholder = await input.getAttribute('placeholder')
      const required = await input.getAttribute('required')
      console.log(`  Input ${i}: type="${type}", name="${name}", placeholder="${placeholder}", required="${required}"`)
    }
    
    // Debug: List all buttons
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    console.log(`Found ${buttonCount} buttons on registration page`)
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      const type = await button.getAttribute('type')
      const text = await button.textContent()
      console.log(`  Button ${i}: type="${type}", text="${text?.trim()}"`)
    }
    
    // Just check form structure without submitting
    const usernameField = page.locator('input[name="identifier"], input[name="username"], input[type="text"]').first()
    await expect(usernameField).toBeVisible()
    console.log('✅ Username field found and accessible')
    
    const submitButton = page.locator('button[type="submit"]').first()
    await expect(submitButton).toBeVisible()
    console.log('✅ Submit button found and accessible')
    
    console.log('🔍 Registration structure debug complete - NO USER CREATED')
  })
  
  test('test registration page accessibility without creating user', async ({ page }) => {
    console.log('🔍 Testing registration page accessibility')
    
    await page.goto('http://localhost:6789')
    
    const signInButton = page.locator('[data-testid="auth-button"]:visible').first()
    await signInButton.click()
    
    await page.waitForURL('**/sign-in**', { timeout: 15000 })
    
    const createAccountLink = page.locator('a:has-text("Create account")')
    await createAccountLink.click()
    
    await page.waitForURL('**/register**', { timeout: 10000 })
    
    // Just verify the form exists without submitting
    const usernameField = page.locator('input[name="identifier"]')
    await expect(usernameField).toBeVisible()
    
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
    
    console.log('✅ Registration form is accessible')
    
    // Don't actually register - just verify the form works
    console.log('ℹ️ Form validation complete without creating test user')
  })
})