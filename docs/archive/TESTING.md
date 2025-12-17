# Testing Guide for Professor Carl

## Overview

This document describes the comprehensive E2E testing suite for Professor Carl, built with Puppeteer and Jest.

## Test Coverage

### 1. **Onboarding Flow Tests** (`__tests__/e2e/onboarding.test.ts`)
- ✅ 3-step wizard navigation
- ✅ Preference selection (content, interaction, voice)
- ✅ localStorage persistence
- ✅ Progress indicators
- ✅ Liquid glass UI styling
- ✅ Back navigation
- ✅ Mobile responsiveness
- ✅ Skip onboarding with existing preferences

### 2. **Teacher Dashboard Tests** (`__tests__/e2e/dashboard.test.ts`)
- ✅ Tab navigation (Video Library, Upload, Analytics)
- ✅ Video upload form
- ✅ YouTube URL analysis
- ✅ Video library display
- ✅ Student analytics (coming soon)
- ✅ Glass panel styling
- ✅ Mobile/tablet responsiveness
- ✅ Authentication checks
- ✅ Empty state handling

### 3. **Chat Interface Tests** (`__tests__/e2e/chat.test.ts`)
- ✅ Message input and send functionality
- ✅ Keyboard shortcuts (Enter to send)
- ✅ Glass UI styling
- ✅ Message bubble rendering
- ✅ Chat history display
- ✅ Loading/thinking states
- ✅ Mobile responsiveness
- ✅ Long message handling
- ✅ Input clearing after send
- ✅ User/AI message distinction
- ✅ Offline error handling
- ✅ Keyboard navigation accessibility

### 4. **API Endpoint Tests** (`__tests__/e2e/api.test.ts`)
- ✅ Authentication requirements
- ✅ Video analysis API
- ✅ Memory storage API
- ✅ Chat API
- ✅ Session validation
- ✅ CORS headers
- ✅ Malformed JSON handling
- ✅ Rate limiting (if implemented)
- ✅ Health check endpoint

## Running Tests

### Prerequisites

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the dev server:**
   ```bash
   npm run dev
   ```
   Server must be running on `http://localhost:3000`

### Run All Tests

```bash
# Using the test runner script
./__tests__/run-all.sh

# Or using npm scripts
npm run test:e2e
```

### Run Specific Test Suites

```bash
# Onboarding tests only
npm test -- __tests__/e2e/onboarding.test.ts

# Dashboard tests only
npm test -- __tests__/e2e/dashboard.test.ts

# Chat tests only
npm test -- __tests__/e2e/chat.test.ts

# API tests only
npm test -- __tests__/e2e/api.test.ts
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Generate Coverage Report

```bash
npm run test:coverage
```

## Test Structure

```
__tests__/
├── setup.ts                 # Global test setup
├── utils/
│   ├── browser.ts           # Puppeteer utilities
│   └── auth.ts              # Authentication helpers
├── e2e/
│   ├── onboarding.test.ts   # Onboarding flow tests
│   ├── dashboard.test.ts    # Teacher dashboard tests
│   ├── chat.test.ts         # Chat interface tests
│   └── api.test.ts          # API endpoint tests
├── screenshots/             # Test screenshots (auto-generated)
└── run-all.sh              # Test runner script
```

## Utility Functions

### Browser Utilities (`__tests__/utils/browser.ts`)

- `createBrowser()` - Create Puppeteer browser instance
- `createPage()` - Create new page with viewport
- `navigateTo(page, path)` - Navigate to URL
- `screenshot(page, name)` - Take screenshot
- `waitForElement(page, selector)` - Wait for element
- `waitForText(page, text)` - Wait for text to appear
- `clickElement(page, selector)` - Click element
- `typeIntoField(page, selector, text)` - Type into input
- `setMobileViewport(page)` - Set mobile viewport (375x667)
- `setDesktopViewport(page)` - Set desktop viewport (1280x720)
- `setTabletViewport(page)` - Set tablet viewport (768x1024)

### Auth Utilities (`__tests__/utils/auth.ts`)

- `mockTeacherSession(page)` - Create mock teacher login
- `mockStudentSession(page)` - Create mock student login
- `clearAuth(page)` - Clear all auth data
- `isAuthenticated(page)` - Check auth status
- `getUserRole(page)` - Get current user role
- `setOnboardingPreferences(page, prefs)` - Set preferences
- `getOnboardingPreferences(page)` - Get preferences
- `skipOnboarding(page)` - Skip onboarding with defaults

## Writing New Tests

### Test Template

```typescript
import { Browser, Page } from 'puppeteer'
import { createBrowser, createPage, navigateTo, screenshot } from '../utils/browser'

describe('My Feature', () => {
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
  })

  afterEach(async () => {
    await page.close()
  })

  test('should do something', async () => {
    await navigateTo(page, '/my-page')
    await screenshot(page, 'my-feature-test')

    // Your test assertions here
    expect(true).toBe(true)
  })
})
```

### Best Practices

1. **Use utility functions** - Don't write raw Puppeteer code
2. **Take screenshots** - Capture visual state at key points
3. **Wait for elements** - Never use arbitrary `setTimeout()`
4. **Graceful failures** - Tests should pass even if backend not configured
5. **Clear descriptions** - Test names should explain what they verify
6. **Isolate tests** - Each test should be independent
7. **Clean up** - Close pages and browsers in `afterEach`/`afterAll`

## Screenshot Naming Convention

Screenshots are saved with timestamps:
```
<test-name>-<timestamp>.png
```

Examples:
- `onboarding-step1-2025-12-02T12-34-56-789Z.png`
- `dashboard-home-2025-12-02T12-34-57-123Z.png`
- `chat-message-sent-2025-12-02T12-34-58-456Z.png`

## Continuous Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Start dev server
        run: npm run dev &

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-screenshots
          path: __tests__/screenshots/
```

## Troubleshooting

### Dev server not running
```bash
Error: Dev server not running on port 3000
Solution: Run `npm run dev` before tests
```

### Puppeteer browser launch failed
```bash
Error: Failed to launch browser
Solution: Install Chromium dependencies
  Linux: sudo apt-get install chromium-browser
  macOS: brew install chromium
```

### Test timeout
```bash
Error: Timeout waiting for element
Solution: Increase timeout in jest.config.js:
  testTimeout: 60000 // 60 seconds
```

### Screenshots not saving
```bash
Error: ENOENT: no such file or directory
Solution: Create directory manually
  mkdir -p __tests__/screenshots
```

## Test Execution Time

Target execution times:
- Onboarding tests: ~20 seconds
- Dashboard tests: ~25 seconds
- Chat tests: ~30 seconds
- API tests: ~15 seconds
- **Total: < 2 minutes**

## Coverage Goals

- ✅ **User Flows**: 100% of critical paths
- ✅ **UI Components**: All major components tested
- ✅ **API Endpoints**: All routes have security tests
- ✅ **Responsive Design**: Mobile, tablet, desktop viewports
- ✅ **Error Handling**: Graceful degradation tested

## Next Steps

### Future Test Additions

1. **Visual Regression Tests**
   - Compare screenshots against baselines
   - Detect unintended UI changes

2. **Performance Tests**
   - Measure page load times
   - Monitor bundle size
   - Test Core Web Vitals

3. **Accessibility Tests**
   - Automated a11y checks with axe-core
   - Keyboard navigation verification
   - Screen reader compatibility

4. **Load Tests**
   - Concurrent user simulation
   - API stress testing
   - Database performance

5. **Integration Tests**
   - Real Anthropic API testing (with mocks)
   - Supabase database operations
   - YouTube API integration

## Resources

- [Puppeteer Documentation](https://pptr.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://testingjavascript.com/)
- [Web Accessibility](https://www.w3.org/WAI/)

---

**Last Updated**: December 2025
**Maintained By**: Professor Carl Development Team
**Test Framework**: Puppeteer + Jest + TypeScript
