import { test, expect } from '@playwright/test';

test.describe('Month Selector Feature Tests', () => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  
  test.beforeEach(async ({ page }) => {
    // Navigate to Portfolio V3
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    await page.waitForLoadState('networkidle');
    
    // Add test data to ensure summary is visible
    await page.evaluate(() => {
      window.timelineData = [{
        id: Date.now(),
        month: 0,
        action: 'buy',
        property: 'Test Property',
        price: 200000,
        downPercent: 20,
        downAmount: 40000,
        loanAmount: 160000,
        rate: 7,
        term: 30,
        payment: 1064,
        rent: 2000,
        monthlyExpenses: 500
      }];
      if (window.recalculateAll) window.recalculateAll();
    });
    
    await page.waitForTimeout(500);
  });
  
  test('UI elements are present and accessible', async ({ page }) => {
    // Check all UI elements
    const monthInput = page.locator('#summaryMonth');
    const stepperDown = page.locator('.month-stepper-down');
    const stepperUp = page.locator('.month-stepper-up');
    const yearDisplay = page.locator('#summaryYears');
    const monthInputGroup = page.locator('.month-input-group');
    
    // Verify visibility
    await expect(monthInput).toBeVisible();
    await expect(stepperDown).toBeVisible();
    await expect(stepperUp).toBeVisible();
    await expect(yearDisplay).toBeVisible();
    await expect(monthInputGroup).toBeVisible();
    
    // Check accessibility attributes
    await expect(monthInput).toHaveAttribute('aria-label', 'Month number');
    await expect(stepperDown).toHaveAttribute('aria-label', 'Decrease month');
    await expect(stepperUp).toHaveAttribute('aria-label', 'Increase month');
    
    // Check CSS classes
    await expect(monthInput).toHaveClass(/month-input/);
    await expect(stepperDown).toHaveClass(/month-stepper/);
    await expect(stepperUp).toHaveClass(/month-stepper/);
  });
  
  test('Stepper buttons increment and decrement correctly', async ({ page }) => {
    const monthInput = page.locator('#summaryMonth');
    const stepperDown = page.locator('.month-stepper-down');
    const stepperUp = page.locator('.month-stepper-up');
    
    // Set initial value
    await monthInput.fill('10');
    await monthInput.press('Enter');
    
    // Test increment
    await stepperUp.click();
    await expect(monthInput).toHaveValue('11');
    
    await stepperUp.click();
    await expect(monthInput).toHaveValue('12');
    
    // Test decrement
    await stepperDown.click();
    await expect(monthInput).toHaveValue('11');
    
    await stepperDown.click();
    await expect(monthInput).toHaveValue('10');
  });
  
  test('Boundary values are enforced', async ({ page }) => {
    const monthInput = page.locator('#summaryMonth');
    const stepperDown = page.locator('.month-stepper-down');
    const stepperUp = page.locator('.month-stepper-up');
    
    // Test lower boundary (0)
    await monthInput.fill('0');
    await monthInput.press('Enter');
    await stepperDown.click();
    await expect(monthInput).toHaveValue('0');
    
    // Test upper boundary (360)
    await monthInput.fill('360');
    await monthInput.press('Enter');
    await stepperUp.click();
    await expect(monthInput).toHaveValue('360');
    
    // Test negative values are corrected
    await monthInput.fill('-5');
    await stepperUp.click(); // Trigger validation
    const value = await monthInput.inputValue();
    expect(parseInt(value)).toBeGreaterThanOrEqual(0);
  });
  
  test('Year display updates correctly', async ({ page }) => {
    const monthInput = page.locator('#summaryMonth');
    const yearDisplay = page.locator('#summaryYears');
    
    // Test month 0
    await monthInput.fill('0');
    await monthInput.press('Enter');
    await expect(yearDisplay).toHaveText('(Today)');
    
    // Test 12 months (1 year)
    await monthInput.fill('12');
    await monthInput.press('Enter');
    await expect(yearDisplay).toContainText('1.0 years');
    
    // Test 24 months (2 years)
    await monthInput.fill('24');
    await monthInput.press('Enter');
    await expect(yearDisplay).toContainText('2.0 years');
    
    // Test 30 months (2.5 years)
    await monthInput.fill('30');
    await monthInput.press('Enter');
    await expect(yearDisplay).toContainText('2.5 years');
  });
  
  test('Debouncing prevents excessive updates', async ({ page }) => {
    // Track recalculation calls
    const updateCount = await page.evaluate(() => {
      return new Promise(resolve => {
        let count = 0;
        const original = window.recalculateAll;
        window.recalculateAll = function() {
          count++;
          return original.apply(this, arguments);
        };
        
        const input = document.getElementById('summaryMonth');
        
        // Simulate rapid typing
        const values = [1, 12, 123, 12, 1];
        values.forEach((val, i) => {
          setTimeout(() => {
            input.value = val;
            input.dispatchEvent(new Event('input'));
          }, i * 50); // 50ms between each input
        });
        
        // Wait for debounce timeout plus buffer
        setTimeout(() => {
          window.recalculateAll = original;
          resolve(count);
        }, 1000);
      });
    });
    
    // Should only update once or twice due to debouncing
    expect(updateCount).toBeLessThanOrEqual(2);
    expect(updateCount).toBeGreaterThan(0);
  });
  
  test('Direct input works correctly', async ({ page }) => {
    const monthInput = page.locator('#summaryMonth');
    const yearDisplay = page.locator('#summaryYears');
    
    // Test various direct inputs
    const testCases = [
      { input: '6', expectedYear: '0.5 years' },
      { input: '18', expectedYear: '1.5 years' },
      { input: '36', expectedYear: '3.0 years' },
      { input: '120', expectedYear: '10.0 years' }
    ];
    
    for (const testCase of testCases) {
      await monthInput.fill(testCase.input);
      await monthInput.press('Enter');
      await page.waitForTimeout(200);
      
      const yearText = await yearDisplay.textContent();
      expect(yearText).toContain(testCase.expectedYear);
    }
  });
  
  test('Mobile responsiveness', async ({ page, browserName }) => {
    // Skip on desktop browsers
    if (!browserName.includes('Mobile')) {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
    }
    
    const stepperUp = page.locator('.month-stepper-up');
    const stepperDown = page.locator('.month-stepper-down');
    const monthInput = page.locator('#summaryMonth');
    
    // Check elements are still visible
    await expect(stepperUp).toBeVisible();
    await expect(stepperDown).toBeVisible();
    await expect(monthInput).toBeVisible();
    
    // Check touch target sizes
    const upBox = await stepperUp.boundingBox();
    const downBox = await stepperDown.boundingBox();
    
    // Minimum touch target should be 44x44 pixels
    expect(upBox.width).toBeGreaterThanOrEqual(44);
    expect(upBox.height).toBeGreaterThanOrEqual(44);
    expect(downBox.width).toBeGreaterThanOrEqual(44);
    expect(downBox.height).toBeGreaterThanOrEqual(44);
    
    // Test functionality still works
    await stepperUp.click();
    const value = await monthInput.inputValue();
    expect(parseInt(value)).toBeGreaterThan(0);
  });
  
  test('Keyboard navigation', async ({ page }) => {
    const monthInput = page.locator('#summaryMonth');
    
    // Focus the input
    await monthInput.focus();
    
    // Test arrow keys
    await monthInput.fill('10');
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(100);
    
    let value = await monthInput.inputValue();
    expect(parseInt(value)).toBe(11);
    
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);
    
    value = await monthInput.inputValue();
    expect(parseInt(value)).toBe(10);
    
    // Test Enter key
    await monthInput.fill('24');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    
    const yearDisplay = await page.locator('#summaryYears').textContent();
    expect(yearDisplay).toContain('2.0 years');
  });
  
  test('Integration with portfolio calculations', async ({ page }) => {
    const monthInput = page.locator('#summaryMonth');
    const netCashFlow = page.locator('#netCashFlow');
    const totalEquity = page.locator('#totalEquity');
    
    // Get initial values at month 0
    await monthInput.fill('0');
    await monthInput.press('Enter');
    await page.waitForTimeout(500);
    
    const initialCashFlow = await netCashFlow.textContent();
    const initialEquity = await totalEquity.textContent();
    
    // Check values at month 12
    await monthInput.fill('12');
    await monthInput.press('Enter');
    await page.waitForTimeout(500);
    
    const laterCashFlow = await netCashFlow.textContent();
    const laterEquity = await totalEquity.textContent();
    
    // Values should be different (due to appreciation, loan paydown, etc.)
    expect(laterEquity).not.toBe(initialEquity);
    
    // Cash flow might be the same (monthly values)
    // but equity should increase over time
    console.log(`Month 0 - Cash Flow: ${initialCashFlow}, Equity: ${initialEquity}`);
    console.log(`Month 12 - Cash Flow: ${laterCashFlow}, Equity: ${laterEquity}`);
  });
});

test.describe('Month Selector Cross-Browser Tests', () => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  
  test('Works consistently across all browsers', async ({ page, browserName }) => {
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    await page.waitForLoadState('networkidle');
    
    // Add test data
    await page.evaluate(() => {
      window.timelineData = [{
        id: 1,
        month: 0,
        action: 'buy',
        property: 'Cross-Browser Test',
        price: 100000,
        downPercent: 20,
        downAmount: 20000,
        loanAmount: 80000,
        rate: 7,
        term: 30,
        payment: 532,
        rent: 1000,
        monthlyExpenses: 200
      }];
      if (window.recalculateAll) window.recalculateAll();
    });
    
    const monthInput = page.locator('#summaryMonth');
    const stepperUp = page.locator('.month-stepper-up');
    
    // Basic functionality test
    await stepperUp.click();
    const value = await monthInput.inputValue();
    
    expect(parseInt(value)).toBe(1);
    console.log(`✅ ${browserName}: Month selector working`);
  });
});