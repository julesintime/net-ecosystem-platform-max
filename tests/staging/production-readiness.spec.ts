import { test, expect, Browser, Page } from '@playwright/test'

test.describe('Production Readiness Validation', () => {
  let browser: Browser
  let page: Page

  test.beforeAll(async ({ browser: b }) => {
    browser = b
  })

  test.beforeEach(async () => {
    page = await browser.newPage()
  })

  test.afterEach(async () => {
    await page.close()
  })

  test('health endpoint should return healthy status', async () => {
    const response = await page.request.get('/api/health')
    expect(response.status()).toBe(200)
    
    const health = await response.json()
    expect(health.status).toBe('healthy')
    expect(health.auth.logto.configured).toBe(true)
  })

  test('should load all main pages without errors', async () => {
    const pages = ['/', '/inbox', '/library', '/catalog', '/profile']
    
    for (const path of pages) {
      const response = await page.goto(path)
      expect(response?.status()).toBeLessThan(400)
      
      // Check for JavaScript errors
      const errors: string[] = []
      page.on('pageerror', error => {
        errors.push(error.message)
      })
      
      await page.waitForLoadState('networkidle')
      expect(errors).toHaveLength(0)
    }
  })

  test('should have proper security headers', async () => {
    const response = await page.goto('/')
    const headers = response?.headers() || {}
    
    // Check critical security headers
    expect(headers['x-frame-options']).toBeDefined()
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['referrer-policy']).toBeDefined()
  })

  test('should handle authentication redirects properly', async () => {
    // Test that auth endpoints respond correctly
    const signInResponse = await page.request.get('/api/logto/sign-in')
    expect([302, 307].includes(signInResponse.status())).toBe(true)
    
    const location = signInResponse.headers()['location']
    expect(location).toContain('logto')
  })

  test('should validate organization API endpoints', async () => {
    // Test organization endpoints return proper responses
    const orgsResponse = await page.request.get('/api/organizations')
    
    // Should either return data or require authentication
    expect([200, 401, 403].includes(orgsResponse.status())).toBe(true)
    
    if (orgsResponse.status() === 200) {
      const orgs = await orgsResponse.json()
      expect(Array.isArray(orgs.organizations)).toBe(true)
    }
  })

  test('should have proper error handling', async () => {
    // Test 404 handling
    const notFoundResponse = await page.goto('/non-existent-page')
    expect(notFoundResponse?.status()).toBe(404)
    
    // Test API error handling
    const badApiResponse = await page.request.get('/api/non-existent-endpoint')
    expect(badApiResponse.status()).toBe(404)
  })

  test('should pass performance baseline', async () => {
    // Navigate to homepage
    await page.goto('/')
    
    // Measure performance
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      }
    })
    
    // Assert reasonable performance thresholds
    expect(performanceMetrics.loadTime).toBeLessThan(3000) // 3 seconds
    expect(performanceMetrics.domContentLoaded).toBeLessThan(2000) // 2 seconds
    expect(performanceMetrics.firstContentfulPaint).toBeLessThan(2000) // 2 seconds
  })

  test('should validate responsive design', async () => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Check mobile navigation is present
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible()
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.reload()
    
    // Check desktop sidebar is present
    await expect(page.locator('[data-testid="desktop-sidebar"]')).toBeVisible()
  })

  test('should validate accessibility standards', async () => {
    await page.goto('/')
    
    // Run basic accessibility checks
    const accessibilityViolations = await page.evaluate(() => {
      const violations: string[] = []
      
      // Check for missing alt text on images
      const images = document.querySelectorAll('img')
      images.forEach(img => {
        if (!img.alt && !img.getAttribute('aria-label')) {
          violations.push(`Image missing alt text: ${img.src}`)
        }
      })
      
      // Check for proper heading hierarchy
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      if (headings.length > 0 && !document.querySelector('h1')) {
        violations.push('Missing h1 heading')
      }
      
      // Check for form labels
      const inputs = document.querySelectorAll('input, select, textarea')
      inputs.forEach(input => {
        const id = input.getAttribute('id')
        const label = id ? document.querySelector(`label[for="${id}"]`) : null
        const ariaLabel = input.getAttribute('aria-label')
        
        if (!label && !ariaLabel) {
          violations.push(`Form control missing label: ${input.tagName}`)
        }
      })
      
      return violations
    })
    
    expect(accessibilityViolations).toHaveLength(0)
  })

  test('should validate database connections and external services', async () => {
    // Test health endpoint includes service status
    const response = await page.request.get('/api/health')
    const health = await response.json()
    
    expect(health.auth.logto.configured).toBe(true)
    expect(health.status).not.toBe('unhealthy')
    
    // If using database, check connection
    if (health.database) {
      expect(health.database.connected).toBe(true)
    }
  })

  test('should handle concurrent user sessions', async () => {
    const pages = await Promise.all([
      browser.newPage(),
      browser.newPage(),
      browser.newPage()
    ])
    
    try {
      // Simulate concurrent access
      const responses = await Promise.all(
        pages.map(p => p.goto('/'))
      )
      
      // All should load successfully
      responses.forEach(response => {
        expect(response?.status()).toBeLessThan(400)
      })
      
      // Check that each page can access the health endpoint
      const healthChecks = await Promise.all(
        pages.map(p => p.request.get('/api/health'))
      )
      
      healthChecks.forEach(response => {
        expect(response.status()).toBe(200)
      })
      
    } finally {
      await Promise.all(pages.map(p => p.close()))
    }
  })
})