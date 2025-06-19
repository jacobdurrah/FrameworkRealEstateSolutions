import { test, expect } from '@playwright/test';

test.describe('Portfolio V3 - Net Worth Metric', () => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  
  test.beforeEach(async ({ page }) => {
    // Navigate to Portfolio Simulator V3
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("Portfolio Simulator V3")');
    
    // Handle any dialogs
    page.on('dialog', dialog => dialog.accept());
  });

  test('should display Net Worth card in Portfolio Summary', async ({ page }) => {
    // Generate a strategy first
    await page.fill('#goalInput', 'Generate $5K/month in 24 months with $30K capital');
    await page.click('button:has-text("Generate Strategy")');
    
    // Wait for strategy and V2 components to show
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    await page.waitForSelector('#v2Components:visible');
    
    // Check that Net Worth card exists
    await expect(page.locator('.summary-label:has-text("Net Worth (Equity + Cash)")')).toBeVisible();
    await expect(page.locator('#totalNetWorth')).toBeVisible();
  });

  test('should calculate Net Worth as Equity + Cash', async ({ page }) => {
    // Generate a strategy
    await page.fill('#goalInput', 'Build portfolio for $8K/month in 36 months with $50K');
    await page.click('button:has-text("Generate Strategy")');
    
    // Wait for calculations
    await page.waitForSelector('#v2Components:visible', { timeout: 15000 });
    await page.waitForTimeout(1000); // Allow calculations to complete
    
    // Get values
    const equityText = await page.locator('#totalEquity').textContent();
    const cashText = await page.locator('#totalCashOnHand').textContent();
    const netWorthText = await page.locator('#totalNetWorth').textContent();
    
    // Parse currency values
    const parseValue = (text) => {
      return parseInt(text.replace(/[^0-9-]/g, '')) || 0;
    };
    
    const equity = parseValue(equityText);
    const cash = parseValue(cashText);
    const netWorth = parseValue(netWorthText);
    
    // Verify Net Worth = Equity + Cash
    expect(netWorth).toBe(equity + cash);
  });

  test('should update Net Worth when view month changes', async ({ page }) => {
    // Generate strategy with timeline events
    await page.fill('#goalInput', 'Generate $6K/month in 30 months with $40K capital');
    await page.click('button:has-text("Generate Strategy")');
    
    // Wait for V2 components
    await page.waitForSelector('#v2Components:visible', { timeout: 15000 });
    
    // Get initial Net Worth
    const initialNetWorth = await page.locator('#totalNetWorth').textContent();
    
    // Change view month to 12
    await page.fill('#summaryMonth', '12');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    
    // Get updated values
    const updatedNetWorth = await page.locator('#totalNetWorth').textContent();
    const updatedEquity = await page.locator('#totalEquity').textContent();
    const updatedCash = await page.locator('#totalCashOnHand').textContent();
    
    // Verify values changed
    expect(updatedNetWorth).not.toBe(initialNetWorth);
    
    // Verify calculation still correct
    const parseValue = (text) => parseInt(text.replace(/[^0-9-]/g, '')) || 0;
    const equity = parseValue(updatedEquity);
    const cash = parseValue(updatedCash);
    const netWorth = parseValue(updatedNetWorth);
    
    expect(netWorth).toBe(equity + cash);
  });

  test('should show positive Net Worth in green', async ({ page }) => {
    // Generate strategy
    await page.fill('#goalInput', 'Build $5K/month portfolio with $50K starting capital');
    await page.click('button:has-text("Generate Strategy")');
    
    // Wait for display
    await page.waitForSelector('#v2Components:visible', { timeout: 15000 });
    
    // Check Net Worth has positive class
    const netWorthElement = page.locator('#totalNetWorth');
    await expect(netWorthElement).toHaveClass(/positive/);
  });

  test('should include cash from sales in Net Worth', async ({ page }) => {
    // Generate initial strategy
    await page.fill('#goalInput', 'Generate $4K/month in 24 months with $30K');
    await page.click('button:has-text("Generate Strategy")');
    await page.waitForSelector('#v2Components:visible', { timeout: 15000 });
    
    // Add a property sale manually
    await page.click('button:has-text("Add Event")');
    
    // Find the last row and set it as a sale
    const rows = await page.locator('#timelineBody tr').count();
    const lastRow = page.locator(`#timelineBody tr:nth-child(${rows})`);
    
    // Set month
    await lastRow.locator('input[type="number"]').first().fill('18');
    
    // Set action to sell
    await lastRow.locator('select').selectOption('sell');
    
    // Set property name (should match an existing property)
    await lastRow.locator('input[placeholder="Property address"]').fill('Property 1');
    
    // Set sale price
    await lastRow.locator('input[type="number"]').nth(1).fill('120000');
    
    // Trigger recalculation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    
    // Change view to month 18 to see the sale
    await page.fill('#summaryMonth', '18');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    
    // Verify Cash from Sales is included
    const cashFromSales = await page.locator('#cashFromSales').textContent();
    const totalCash = await page.locator('#totalCashOnHand').textContent();
    const netWorth = await page.locator('#totalNetWorth').textContent();
    
    // Cash from sales should be > 0
    const parseValue = (text) => parseInt(text.replace(/[^0-9-]/g, '')) || 0;
    expect(parseValue(cashFromSales)).toBeGreaterThan(0);
    
    // Total cash should include sales
    expect(parseValue(totalCash)).toBeGreaterThan(0);
    
    // Net worth should reflect the increased cash
    expect(parseValue(netWorth)).toBeGreaterThan(0);
  });

  test('should handle zero Net Worth correctly', async ({ page }) => {
    // Navigate directly to V3 without generating strategy
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    
    // Manually show V2 components
    await page.evaluate(() => {
      document.getElementById('v2Components').style.display = 'block';
    });
    
    // Check initial state - all zeros
    await expect(page.locator('#totalEquity')).toHaveText('$0');
    await expect(page.locator('#totalCashOnHand')).toHaveText('$0');
    await expect(page.locator('#totalNetWorth')).toHaveText('$0');
  });
});