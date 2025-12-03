#!/bin/bash

# Professor Carl E2E Test Suite Runner
# Runs comprehensive Puppeteer tests for all user flows

set -e

echo "🧪 Starting E2E Test Suite for Professor Carl"
echo "=============================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if dev server is running
echo -n "Checking if dev server is running on port 3000... "
if nc -z localhost 3000 2>/dev/null; then
  echo -e "${GREEN}✓${NC}"
else
  echo -e "${RED}✗${NC}"
  echo ""
  echo -e "${RED}ERROR: Dev server not running on port 3000${NC}"
  echo -e "${YELLOW}Please start the dev server first:${NC}"
  echo "  npm run dev"
  echo ""
  exit 1
fi

# Create screenshots directory
echo -n "Creating screenshots directory... "
mkdir -p __tests__/screenshots
echo -e "${GREEN}✓${NC}"

# Check if dependencies are installed
echo -n "Checking test dependencies... "
if [ -f "node_modules/puppeteer/package.json" ]; then
  echo -e "${GREEN}✓${NC}"
else
  echo -e "${YELLOW}⚠${NC}"
  echo ""
  echo -e "${YELLOW}Installing test dependencies...${NC}"
  npm install
  echo ""
fi

echo ""
echo -e "${BLUE}Running E2E Tests...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Run tests
npm run test:e2e -- --verbose

TEST_EXIT_CODE=$?

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ All E2E Tests Passed!${NC}"
else
  echo -e "${RED}❌ Some tests failed (exit code: $TEST_EXIT_CODE)${NC}"
fi

echo ""
echo "📸 Screenshots saved to: __tests__/screenshots/"
echo "📊 Test coverage: Run 'npm run test:coverage' for details"
echo ""
echo "Test suites executed:"
echo "  • Onboarding Flow"
echo "  • Teacher Dashboard"
echo "  • Chat Interface"
echo "  • API Endpoints"
echo ""

exit $TEST_EXIT_CODE
