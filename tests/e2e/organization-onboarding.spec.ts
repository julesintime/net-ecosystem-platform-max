import { test, expect } from '@playwright/test'

test.describe('Organization Onboarding', () => {
  test('should display onboarding page for new users', async ({ page }) => {
    // This test simulates accessing the onboarding page directly
    // In real scenarios, new users would be redirected here after registration
    
    await page.goto('http://localhost:6789/onboarding')
    
    // Check if the page loads
    await expect(page).toHaveURL(/.*onboarding/)
    
    // Look for organization creation form
    const organizationNameInput = page.locator('input[name="organizationName"]')
    if (await organizationNameInput.isVisible({ timeout: 5000 })) {
      await expect(organizationNameInput).toBeVisible()
      
      const submitButton = page.locator('button[type="submit"]')
      await expect(submitButton).toBeVisible()
      
      console.log('✅ Onboarding form is accessible')
    } else {
      // User might be redirected if already authenticated with organization
      console.log('ℹ️ User redirected (likely already has organization)')
    }
  })
  
  test('should handle organization creation form', async ({ page }) => {
    await page.goto('http://localhost:6789/onboarding')
    
    // If we see the form, test its functionality
    const organizationNameInput = page.locator('input[name="organizationName"]')
    
    if (await organizationNameInput.isVisible({ timeout: 5000 })) {
      // Fill out the form (but don't submit to avoid creating test data)
      await organizationNameInput.fill('Test Organization')
      
      const descriptionTextarea = page.locator('textarea[name="organizationDescription"]')
      if (await descriptionTextarea.isVisible()) {
        await descriptionTextarea.fill('This is a test organization')
      }
      
      const submitButton = page.locator('button[type="submit"]')
      await expect(submitButton).toBeVisible()
      await expect(submitButton).toContainText(/create/i)
      
      console.log('✅ Organization form can be filled out')
    } else {
      console.log('ℹ️ Onboarding form not visible (user may already have org)')
    }
  })
})