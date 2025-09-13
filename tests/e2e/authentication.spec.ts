import { test, expect, Page } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set base URL and prepare page
    await page.goto('/')
  })

  test('should display login button on homepage', async ({ page }) => {
    // Check that login UI is present
    await expect(page.locator('[data-testid="auth-button"]')).toBeVisible()
  })

  test('should redirect to Logto on login attempt', async ({ page }) => {
    // Click login and verify redirect
    const loginButton = page.locator('[data-testid="auth-button"]')
    await expect(loginButton).toBeVisible()
    
    // Mock the authentication redirect
    await page.route('**/api/logto/sign-in', route => {
      route.fulfill({
        status: 302,
        headers: {
          'Location': 'https://mock-logto.test/sign-in'
        }
      })
    })
    
    await loginButton.click()
    
    // Verify redirect happens (in real scenario would go to Logto)
    await page.waitForResponse('**/api/logto/sign-in')
  })

  test('should handle authentication callback', async ({ page }) => {
    // Mock successful callback
    await page.route('**/api/logto/callback*', route => {
      route.fulfill({
        status: 302,
        headers: {
          'Location': '/',
          'Set-Cookie': 'logto-auth=mock-session; Path=/; HttpOnly'
        }
      })
    })

    await page.goto('/callback?code=mock-auth-code&state=mock-state')
    
    // Should redirect to home after successful auth
    await expect(page).toHaveURL('/')
  })

  test('should display user info when authenticated', async ({ page }) => {
    // Mock authenticated state
    await page.addInitScript(() => {
      window.localStorage.setItem('logto-auth-test', 'authenticated')
    })

    // Mock API responses for authenticated user
    await page.route('**/api/organizations', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          organizations: [
            {
              id: 'org_test_123',
              name: 'Test Organization',
              description: 'Test organization for E2E tests'
            }
          ]
        })
      })
    })

    await page.reload()
    
    // Should show authenticated UI elements
    await expect(page.locator('[data-testid="profile-dropdown"]')).toBeVisible()
    await expect(page.locator('[data-testid="organization-selector"]')).toBeVisible()
  })

  test('should handle organization switching', async ({ page }) => {
    // Mock organization token endpoint
    await page.route('**/api/organizations/*/token', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-org-token',
          organizationId: route.request().url().split('/')[5]
        })
      })
    })

    // Mock multiple organizations
    await page.route('**/api/organizations', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          organizations: [
            { id: 'org_1', name: 'Organization 1' },
            { id: 'org_2', name: 'Organization 2' }
          ]
        })
      })
    })

    await page.goto('/profile')
    
    // Should be able to switch organizations
    const orgSelector = page.locator('[data-testid="organization-selector"]')
    await expect(orgSelector).toBeVisible()
    
    await orgSelector.click()
    await page.locator('text=Organization 2').click()
    
    // Should make token request for new organization
    await page.waitForResponse('**/api/organizations/org_2/token')
  })

  test('should handle logout', async ({ page }) => {
    // Mock logout endpoint
    await page.route('**/api/logto/sign-out', route => {
      route.fulfill({
        status: 302,
        headers: {
          'Location': '/',
          'Set-Cookie': 'logto-auth=; Path=/; HttpOnly; Max-Age=0'
        }
      })
    })

    await page.goto('/profile')
    
    const logoutButton = page.locator('[data-testid="logout-button"]')
    await expect(logoutButton).toBeVisible()
    
    await logoutButton.click()
    
    // Should redirect to home and clear auth state
    await expect(page).toHaveURL('/')
    await expect(page.locator('[data-testid="auth-button"]')).toBeVisible()
  })
})