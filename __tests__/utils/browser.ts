/**
 * Browser utility functions for Puppeteer E2E tests
 */
import puppeteer, { Browser, Page } from 'puppeteer'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

/**
 * Create a new browser instance
 */
export async function createBrowser(): Promise<Browser> {
  return await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  })
}

/**
 * Create a new page with default viewport
 */
export async function createPage(browser: Browser, viewport = { width: 1280, height: 720 }): Promise<Page> {
  const page = await browser.newPage()
  await page.setViewport(viewport)

  // Enable console logging from the page
  page.on('console', (msg) => {
    const type = msg.type()
    if (type === 'error' || type === 'warning') {
      console.log(`[Browser ${type}]:`, msg.text())
    }
  })

  return page
}

/**
 * Wait for an element to appear on the page
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout = 5000
): Promise<void> {
  try {
    await page.waitForSelector(selector, { timeout, visible: true })
  } catch (error) {
    throw new Error(`Element not found: ${selector} (timeout: ${timeout}ms)`)
  }
}

/**
 * Wait for text to appear on the page
 */
export async function waitForText(
  page: Page,
  text: string,
  timeout = 5000
): Promise<void> {
  try {
    await page.waitForFunction(
      (searchText) => document.body.innerText.includes(searchText),
      { timeout },
      text
    )
  } catch (error) {
    throw new Error(`Text not found: "${text}" (timeout: ${timeout}ms)`)
  }
}

/**
 * Take a screenshot and save to __tests__/screenshots
 */
export async function screenshot(page: Page, name: string): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `${name}-${timestamp}.png`
  await page.screenshot({
    path: `__tests__/screenshots/${filename}`,
    fullPage: true,
  })
  console.log(`📸 Screenshot saved: ${filename}`)
}

/**
 * Navigate to a path and wait for network idle
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  const url = `${BASE_URL}${path}`
  await page.goto(url, {
    waitUntil: 'networkidle0',
    timeout: 10000,
  })
}

/**
 * Click an element by selector
 */
export async function clickElement(page: Page, selector: string): Promise<void> {
  await waitForElement(page, selector)
  await page.click(selector)
}

/**
 * Type into an input field
 */
export async function typeIntoField(
  page: Page,
  selector: string,
  text: string
): Promise<void> {
  await waitForElement(page, selector)
  await page.type(selector, text)
}

/**
 * Get text content of an element
 */
export async function getElementText(page: Page, selector: string): Promise<string> {
  await waitForElement(page, selector)
  return await page.$eval(selector, (el) => el.textContent || '')
}

/**
 * Check if element exists
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout: 1000 })
    return true
  } catch {
    return false
  }
}

/**
 * Get all elements matching selector
 */
export async function getElements(page: Page, selector: string) {
  return await page.$$(selector)
}

/**
 * Wait for navigation to complete
 */
export async function waitForNavigation(page: Page): Promise<void> {
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 })
}

/**
 * Get current URL
 */
export function getCurrentUrl(page: Page): string {
  return page.url()
}

/**
 * Set mobile viewport (iPhone SE)
 */
export async function setMobileViewport(page: Page): Promise<void> {
  await page.setViewport({ width: 375, height: 667 })
}

/**
 * Set desktop viewport
 */
export async function setDesktopViewport(page: Page): Promise<void> {
  await page.setViewport({ width: 1280, height: 720 })
}

/**
 * Set tablet viewport (iPad)
 */
export async function setTabletViewport(page: Page): Promise<void> {
  await page.setViewport({ width: 768, height: 1024 })
}
