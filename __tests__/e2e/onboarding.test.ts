/**
 * E2E Tests: Onboarding Flow
 * Tests the 3-step onboarding wizard for new users
 */
import { Browser, Page } from 'puppeteer'
import {
  createBrowser,
  createPage,
  navigateTo,
  screenshot,
  waitForText,
  clickElement,
  elementExists,
  getCurrentUrl,
} from '../utils/browser'
import { getOnboardingPreferences, clearAuth } from '../utils/auth'

describe('Onboarding Flow', () => {
  let browser: Browser
  let page: Page

  beforeAll(async () => {
    browser = await createBrowser()
  })

  afterAll(async () => {
    await browser.close()
  })

  beforeEach(async () => {
    page = await createPage(browser)
    await clearAuth(page) // Start fresh
  })

  afterEach(async () => {
    await page.close()
  })

  test('should display onboarding step 1 on first visit', async () => {
    await navigateTo(page, '/')
    await screenshot(page, 'onboarding-step1-initial')

    // Check for step 1 content
    const hasContentQuestion = await elementExists(
      page,
      'text=/How do you learn best/i'
    )
    expect(hasContentQuestion).toBe(true)

    // Verify progress indicators exist
    const dots = await page.$$('[class*="rounded-full"]')
    expect(dots.length).toBeGreaterThanOrEqual(3)
  })

  test('should complete full 3-step onboarding and save preferences', async () => {
    await navigateTo(page, '/')

    // Step 1: Content preference
    await waitForText(page, 'How do you learn best?')
    await screenshot(page, 'onboarding-step1')

    // Click "Balanced mix" option
    const balancedButton = await page.$('button:has-text("Balanced")')
    if (balancedButton) {
      await balancedButton.click()
    } else {
      // Fallback: click any button in step 1
      const buttons = await page.$$('button[class*="glass-button"]')
      if (buttons.length > 0) {
        await buttons[1].click() // Middle option
      }
    }

    await page.waitForTimeout(500) // Wait for transition

    // Step 2: Interaction mode
    await waitForText(page, 'How do you prefer to interact?')
    await screenshot(page, 'onboarding-step2')

    const textButton = await page.$('button:has-text("Type")')
    if (textButton) {
      await textButton.click()
    } else {
      const buttons = await page.$$('button[class*="glass-button"]')
      if (buttons.length > 0) {
        await buttons[0].click() // First option
      }
    }

    await page.waitForTimeout(500)

    // Step 3: Voice selection
    await waitForText(page, "Pick Carl's voice")
    await screenshot(page, 'onboarding-step3')

    const echoButton = await page.$('button:has-text("Echo")')
    if (echoButton) {
      await echoButton.click()
    } else {
      const buttons = await page.$$('button[class*="glass-button"]')
      if (buttons.length > 0) {
        await buttons[0].click() // First voice option
      }
    }

    // Wait for redirect to /chat
    await page.waitForTimeout(1000)

    // Verify we're on the chat page
    const currentUrl = getCurrentUrl(page)
    expect(currentUrl).toContain('/chat')

    await screenshot(page, 'onboarding-complete-redirect')

    // Verify preferences saved to localStorage
    const preferences = await getOnboardingPreferences(page)
    expect(preferences).toBeTruthy()
    expect(preferences).toHaveProperty('content_preference')
    expect(preferences).toHaveProperty('interaction_mode')
    expect(preferences).toHaveProperty('selected_voice')
  })

  test('should show progress indicators for all 3 steps', async () => {
    await navigateTo(page, '/')

    // Check for progress dots/indicators
    const progressDots = await page.$$('[class*="rounded-full"]')
    expect(progressDots.length).toBeGreaterThanOrEqual(3)

    await screenshot(page, 'onboarding-progress-indicators')
  })

  test('should use liquid glass styling throughout onboarding', async () => {
    await navigateTo(page, '/')

    // Check for glass-panel class
    const hasGlassPanel = await elementExists(page, '.glass-panel')
    expect(hasGlassPanel).toBe(true)

    // Check for aurora background in CSS
    const hasAuroraStyles = await page.evaluate(() => {
      const bodyClasses = document.body.className
      return bodyClasses.includes('aurora') || bodyClasses.includes('bg-gradient')
    })

    await screenshot(page, 'onboarding-liquid-glass-ui')

    // Just verify the page has some styling
    expect(hasGlassPanel || hasAuroraStyles).toBe(true)
  })

  test('should handle back navigation between steps', async () => {
    await navigateTo(page, '/')

    // Complete step 1
    await waitForText(page, 'How do you learn best?')
    const buttons = await page.$$('button[class*="glass-button"]')
    if (buttons.length > 0) {
      await buttons[0].click()
    }

    await page.waitForTimeout(500)

    // Now on step 2
    await waitForText(page, 'How do you prefer to interact?')

    // Look for back button (if implemented)
    const backButton = await page.$('button:has-text("Back")')
    if (backButton) {
      await backButton.click()
      await page.waitForTimeout(500)

      // Should be back on step 1
      const backOnStep1 = await elementExists(page, 'text=/How do you learn best/i')
      expect(backOnStep1).toBe(true)
    }

    await screenshot(page, 'onboarding-back-navigation')
  })

  test('should be responsive on mobile viewport', async () => {
    await page.setViewport({ width: 375, height: 667 }) // iPhone SE
    await navigateTo(page, '/')

    await screenshot(page, 'onboarding-mobile-view')

    // Verify content is still visible
    const hasContent = await elementExists(page, 'text=/How do you learn/i')
    expect(hasContent).toBe(true)

    // Verify glass panel still renders
    const glassPanel = await page.$('.glass-panel')
    expect(glassPanel).toBeTruthy()
  })

  test('should skip onboarding if preferences already set', async () => {
    // Set preferences manually
    await page.evaluate(() => {
      localStorage.setItem(
        'preferences',
        JSON.stringify({
          content_preference: 'text_heavy',
          interaction_mode: 'voice',
          selected_voice: 'shimmer',
        })
      )
    })

    await navigateTo(page, '/')

    // Should redirect directly to /chat
    await page.waitForTimeout(1000)
    const currentUrl = getCurrentUrl(page)
    expect(currentUrl).toContain('/chat')

    await screenshot(page, 'onboarding-skip-with-existing-prefs')
  })
})
