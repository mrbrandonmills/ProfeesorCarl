# E2E Test Suite for Professor Carl

## Quick Start

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Run all tests:**
   ```bash
   ./__tests__/run-all.sh
   ```

3. **View screenshots:**
   ```bash
   open __tests__/screenshots/
   ```

## Test Files

- `setup.ts` - Global test configuration
- `utils/browser.ts` - Puppeteer helper functions
- `utils/auth.ts` - Authentication utilities
- `e2e/onboarding.test.ts` - Onboarding flow (7 tests)
- `e2e/dashboard.test.ts` - Teacher dashboard (12 tests)
- `e2e/chat.test.ts` - Chat interface (14 tests)
- `e2e/api.test.ts` - API endpoints (10 tests)

## Total Coverage

**43 E2E tests** covering:
- User authentication
- Onboarding wizard
- Video management
- Chat interface
- API security
- Responsive design
- Error handling

See `../TESTING.md` for full documentation.
