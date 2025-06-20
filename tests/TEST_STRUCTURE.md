# Test Suite Documentation

## Directory Structure

### `/e2e/`
End-to-end tests using Playwright framework. These tests simulate real user interactions across different browsers.

- **Portfolio Tests**: `portfolio-*.spec.js` - Tests for all versions of the portfolio simulator
- **Market Analysis Tests**: `market-analysis-*.spec.js` - Tests for AI-powered market analysis
- **Property Tests**: `property-*.spec.js`, `real-listings-*.spec.js` - Property finder and listing tests
- **Feature Tests**: Various feature-specific tests (timeline, table navigation, etc.)

### `/api/`
API-specific tests for backend endpoints.

### `/browser/`
Browser-specific tests for client-side functionality.

### `/manual/`
Manual test files and HTML pages for manual testing.

### `/manual-test-pages/`
HTML test pages for manual verification of features:
- `test-*.html` - Individual feature test pages
- `verify-*.html` - Verification pages for specific fixes

### `/standalone-scripts/`
Standalone JavaScript test scripts that can be run independently:
- `test-*.js` - Individual test scripts
- `verify-*.js` - Verification scripts
- `debug-*.js` - Debug utilities

### `/screenshots/`
Screenshots from automated test runs.

### `/screenshots-archive/`
Archived screenshots from previous test runs and debugging sessions.

## Running Tests

### Automated Tests (Playwright)
```bash
# Run all tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/[test-name].spec.js

# Run with UI for debugging
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed
```

### Unit Tests (Jest)
```bash
# Run all unit tests
npm test

# Run specific test file
npm test [test-name].test.js
```

### Manual Test Pages
1. Start local server: `npm start`
2. Navigate to `http://localhost:8080/tests/manual-test-pages/[test-page].html`

## Test Naming Convention

- `*.spec.js` - End-to-end tests (Playwright)
- `*.test.js` - Unit tests (Jest)
- `test-*.html` - Manual test pages
- `verify-*.html` - Verification pages for bug fixes
- `debug-*.*` - Debug utilities and helpers

## Writing New Tests

1. **E2E Tests**: Add to `/e2e/` directory with `.spec.js` extension
2. **Unit Tests**: Add to appropriate directory with `.test.js` extension
3. **Manual Tests**: Create HTML page in `/manual-test-pages/`
4. **Test Utilities**: Add to `/helpers/` directory

## Test Data

Test data and fixtures should be stored in the test file itself or in a dedicated fixtures directory when shared across multiple tests.