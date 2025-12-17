# Installing E2E Testing Dependencies

## Issue: NPM Cache Permission Error

If you encounter npm cache permission errors, follow these steps:

### Solution 1: Fix NPM Cache Permissions (Recommended)

```bash
sudo chown -R $(whoami) ~/.npm
cd /Users/brandon/ProfeesorCarl
npm install
```

### Solution 2: Use Clean NPM Cache

```bash
rm -rf ~/.npm
cd /Users/brandon/ProfeesorCarl
npm install
```

### Solution 3: Manual Install

```bash
cd /Users/brandon/ProfeesorCarl
npm install --save-dev puppeteer@23.10.4
npm install --save-dev jest@29.7.0
npm install --save-dev ts-jest@29.2.6
npm install --save-dev @types/jest@29.5.14
npm install --save-dev @types/puppeteer@7.0.4
```

### Solution 4: Use Yarn (Alternative)

```bash
cd /Users/brandon/ProfeesorCarl
yarn add -D puppeteer jest ts-jest @types/jest @types/puppeteer
```

## Verify Installation

After dependencies are installed, verify with:

```bash
# Check if packages are installed
ls -la node_modules/puppeteer
ls -la node_modules/jest

# Run a test to confirm
npm test -- --version
```

## Required Dependencies

The following dependencies must be installed for E2E tests:

```json
{
  "devDependencies": {
    "puppeteer": "^23.10.4",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.6",
    "@types/jest": "^29.5.14",
    "@types/puppeteer": "^7.0.4"
  }
}
```

These have already been added to `package.json`.

## After Installation

Once dependencies are installed, you can run tests:

```bash
# Start dev server
npm run dev

# In another terminal, run tests
npm run test:e2e

# Or use the test runner
./__tests__/run-all.sh
```

## Troubleshooting

### Puppeteer Chrome Download Fails

If Puppeteer can't download Chrome:

```bash
# macOS
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm install puppeteer

# Then install Chrome separately
brew install --cask google-chrome
```

### Jest TypeScript Errors

If Jest can't parse TypeScript:

```bash
npm install --save-dev ts-node
```

### Permission Denied on Scripts

```bash
chmod +x __tests__/run-all.sh
```

## Next Steps

See `TESTING.md` for full testing documentation.
