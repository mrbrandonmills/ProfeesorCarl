/**
 * Global test setup for Professor Carl E2E Tests
 * This file runs before all tests
 */

beforeAll(() => {
  console.log('🧪 Starting Professor Carl E2E Test Suite')
  console.log('📍 Base URL: http://localhost:3000')
  console.log('⏰ Test timeout: 30s per test')
  console.log('=' .repeat(50))
})

afterAll(() => {
  console.log('=' .repeat(50))
  console.log('✅ E2E Test Suite Complete')
  console.log('📸 Screenshots saved to __tests__/screenshots/')
})

// Global error handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection in test:', reason)
})
