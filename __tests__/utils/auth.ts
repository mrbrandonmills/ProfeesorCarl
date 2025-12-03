/**
 * Authentication utility functions for E2E tests
 */
import { Page } from 'puppeteer'
import { navigateTo } from './browser'

/**
 * Create a mock teacher session
 * This simulates a logged-in teacher for dashboard tests
 */
export async function mockTeacherSession(page: Page): Promise<void> {
  // Set mock auth cookie
  await page.setCookie({
    name: 'auth_token',
    value: 'mock-teacher-jwt-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    secure: false,
  })

  // Set localStorage for teacher role
  await page.evaluate(() => {
    localStorage.setItem('user_role', 'teacher')
    localStorage.setItem('user_id', 'mock-teacher-123')
    localStorage.setItem('user_email', 'teacher@professorcarl.com')
  })

  console.log('🔐 Mock teacher session created')
}

/**
 * Create a mock student session
 * This simulates a logged-in student for chat tests
 */
export async function mockStudentSession(page: Page): Promise<void> {
  // Set mock auth cookie
  await page.setCookie({
    name: 'auth_token',
    value: 'mock-student-jwt-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    secure: false,
  })

  // Set localStorage for student role
  await page.evaluate(() => {
    localStorage.setItem('user_role', 'student')
    localStorage.setItem('user_id', 'mock-student-456')
    localStorage.setItem('user_email', 'student@university.edu')
  })

  console.log('🔐 Mock student session created')
}

/**
 * Clear all authentication data
 */
export async function clearAuth(page: Page): Promise<void> {
  await page.deleteCookie({ name: 'auth_token' })
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  console.log('🔓 Auth data cleared')
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const cookies = await page.cookies()
  const hasAuthCookie = cookies.some((cookie) => cookie.name === 'auth_token')

  const hasLocalStorage = await page.evaluate(() => {
    return localStorage.getItem('user_role') !== null
  })

  return hasAuthCookie && hasLocalStorage
}

/**
 * Get current user role from localStorage
 */
export async function getUserRole(page: Page): Promise<string | null> {
  return await page.evaluate(() => {
    return localStorage.getItem('user_role')
  })
}

/**
 * Set onboarding preferences in localStorage
 */
export async function setOnboardingPreferences(
  page: Page,
  preferences: {
    content_preference?: string
    interaction_mode?: string
    selected_voice?: string
  }
): Promise<void> {
  await page.evaluate((prefs) => {
    localStorage.setItem('preferences', JSON.stringify(prefs))
  }, preferences)
  console.log('✅ Onboarding preferences set:', preferences)
}

/**
 * Get onboarding preferences from localStorage
 */
export async function getOnboardingPreferences(page: Page): Promise<any> {
  return await page.evaluate(() => {
    const prefs = localStorage.getItem('preferences')
    return prefs ? JSON.parse(prefs) : null
  })
}

/**
 * Skip onboarding by setting preferences
 */
export async function skipOnboarding(page: Page): Promise<void> {
  await setOnboardingPreferences(page, {
    content_preference: 'balanced',
    interaction_mode: 'text',
    selected_voice: 'echo',
  })
  console.log('⏭️  Onboarding skipped with default preferences')
}
