# Portfolio Simulator E2E Tests

This directory contains end-to-end browser tests for the Portfolio Simulator using Playwright.

## Setup

1. Install dependencies (already done):
   ```bash
   npm install --save-dev @playwright/test playwright
   ```

2. Install browsers (already done):
   ```bash
   npx playwright install
   ```

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Debug tests interactively
```bash
npm run test:e2e:debug
```

### Run tests with UI mode
```bash
npm run test:e2e:ui
```

### View test report
```bash
npm run test:report
```

## Test Structure

```
tests/
├── e2e/
│   ├── portfolio-simulator.spec.js  # Main test suite
│   └── helpers/
│       └── test-utils.js           # Reusable test utilities
└── README.md                        # This file
```

## Test Coverage

The test suite covers:

1. **Basic Functionality**
   - Page loading
   - Form validation
   - UI element visibility

2. **Core Features**
   - Creating new simulations
   - Saving and loading simulations
   - Adding properties to portfolio
   - Financial calculations
   - Timeline updates
   - Data export

3. **Performance**
   - Page load time
   - Handling large portfolios

4. **Responsive Design**
   - Mobile viewport testing

5. **Error Handling**
   - API error scenarios
   - Invalid input handling

## Writing New Tests

1. Create a new test file in `tests/e2e/` with `.spec.js` extension
2. Import test utilities from `helpers/test-utils.js`
3. Use the Playwright test structure:

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/portfolio-simulator.html');
    // Test implementation
  });
});
```

## Configuration

Test configuration is in `playwright.config.js`:
- Base URL: http://localhost:8080
- Browsers: Chromium, Firefox, WebKit
- Mobile viewports: Pixel 5, iPhone 12
- Screenshots on failure
- Video recording on failure
- HTML report generation

## CI/CD Integration

The tests are configured to work in CI environments:
- Retries enabled on CI
- Parallel execution disabled on CI
- Screenshots and videos saved on failure

## Local Development

The test suite automatically starts a local web server before running tests using Python's http.server on port 8080.

Make sure you have Python 3 installed for the local server to work.

## Debugging Tips

1. Use `page.pause()` to pause execution:
   ```javascript
   await page.pause(); // Opens Playwright Inspector
   ```

2. Take screenshots during tests:
   ```javascript
   await page.screenshot({ path: 'debug.png' });
   ```

3. Use `console.log` with `page.evaluate`:
   ```javascript
   await page.evaluate(() => {
     console.log('Debug info:', document.title);
   });
   ```

4. Run specific test file:
   ```bash
   npx playwright test portfolio-simulator.spec.js
   ```

5. Run specific test:
   ```bash
   npx playwright test -g "should create a new simulation"
   ```