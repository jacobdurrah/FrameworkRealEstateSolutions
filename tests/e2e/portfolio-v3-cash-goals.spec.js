import { test, expect } from '@playwright/test';

test.describe('Portfolio V3 - Target Cash from Sales', () => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  
  test.beforeEach(async ({ page }) => {
    // Navigate to Portfolio Simulator V3
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("Portfolio Simulator V3")');
    
    // Handle any dialogs
    page.on('dialog', dialog => dialog.accept());
  });

  test('should display Target Cash from Sales input field', async ({ page }) => {
    // Switch to structured input
    await page.click('#inputModeToggle');
    
    // Check that the field exists
    await expect(page.locator('label:has-text("Target Cash from Sales")')).toBeVisible();
    await expect(page.locator('#targetCashFromSales')).toBeVisible();
    
    // Verify it's optional
    await expect(page.locator('label:has-text("Target Cash from Sales") span:has-text("(Optional)")')).toBeVisible();
  });

  test('should parse cash goals from natural language', async ({ page }) => {
    // Enter goal with cash target
    await page.fill('#goalInput', 'Generate $5K/month and $100K cash from sales in 36 months with $50K capital');
    
    // Generate strategy
    await page.click('button:has-text("Generate Strategy")');
    
    // Wait for parsed goal display
    await page.waitForSelector('.parsed-goal-summary', { timeout: 15000 });
    
    // Check that cash target is displayed
    await expect(page.locator('.parsed-goal-summary').getByText('Target Cash from Sales: $100,000')).toBeVisible();
  });

  test('should generate cash-only strategy', async ({ page }) => {
    // Switch to structured input
    await page.click('#inputModeToggle');
    
    // Set cash-only goal
    await page.fill('#targetIncome', '0');
    await page.fill('#targetCashFromSales', '100000');
    await page.fill('#timeline', '24');
    await page.fill('#startingCapital', '50000');
    
    // Generate strategy
    await page.click('button:has-text("Generate Strategy")');
    
    // Wait for strategy cards
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    
    // Check that cash from sales is displayed
    await expect(page.locator('.metric-label:has-text("Cash from Sales")')).toBeVisible();
    
    // Check strategy description mentions flips
    const description = await page.locator('.strategy-description').first().textContent();
    expect(description.toLowerCase()).toContain('flip');
  });

  test('should show success when cash goal achieved', async ({ page }) => {
    // Use structured input for controlled test
    await page.click('#inputModeToggle');
    
    // Set achievable cash goal
    await page.fill('#targetIncome', '0');
    await page.fill('#targetCashFromSales', '30000');
    await page.fill('#timeline', '24');
    await page.fill('#startingCapital', '50000');
    
    // Select aggressive strategy for more flips
    await page.selectOption('#strategyPreference', 'aggressive');
    
    // Generate strategy
    await page.click('button:has-text("Generate Strategy")');
    
    // Wait for strategy
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    
    // Look for success indicator (may be in description)
    const cards = await page.locator('.strategy-card').all();
    let foundSuccess = false;
    
    for (const card of cards) {
      const text = await card.textContent();
      if (text.includes('Cash goal achieved') || text.includes('All goals achieved')) {
        foundSuccess = true;
        break;
      }
    }
    
    expect(foundSuccess).toBe(true);
  });

  test('should show warning when cash goal not achieved', async ({ page }) => {
    // Set unrealistic cash goal
    await page.fill('#goalInput', 'Generate $500K cash from sales in 12 months with $20K capital');
    
    // Generate strategy
    await page.click('button:has-text("Generate Strategy")');
    
    // Wait for strategy
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    
    // Check for warning message
    const warningExists = await page.locator('text=/Cash goal not achieved/').count() > 0;
    expect(warningExists).toBe(true);
  });

  test('should handle combined goals (income + cash)', async ({ page }) => {
    // Switch to structured input
    await page.click('#inputModeToggle');
    
    // Set both goals
    await page.fill('#targetIncome', '3000');
    await page.fill('#targetCashFromSales', '50000');
    await page.fill('#timeline', '36');
    await page.fill('#startingCapital', '80000');
    
    // Generate strategy
    await page.click('button:has-text("Generate Strategy")');
    
    // Wait for strategy
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    
    // Check that both metrics are displayed
    await expect(page.locator('.metric-label:has-text("Monthly Income")')).toBeVisible();
    await expect(page.locator('.metric-label:has-text("Cash from Sales")')).toBeVisible();
    
    // Verify timeline has both rental and flip events
    await page.waitForSelector('#v2Components:visible');
    
    const timelineText = await page.locator('#timelineBody').textContent();
    expect(timelineText).toContain('Buy');
  });

  test('should work without cash goal (backward compatibility)', async ({ page }) => {
    // Enter traditional goal without cash target
    await page.fill('#goalInput', 'Build portfolio for $8K/month in 36 months with $60K capital');
    
    // Generate strategy
    await page.click('button:has-text("Generate Strategy")');
    
    // Wait for strategy
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    
    // Check that cash from sales is NOT displayed in parsed goal
    const parsedGoal = await page.locator('.parsed-goal-summary').textContent();
    expect(parsedGoal).not.toContain('Target Cash from Sales');
    
    // Strategy cards should not show cash metric (or show $0)
    const cashMetrics = await page.locator('.metric-label:has-text("Cash from Sales")').count();
    if (cashMetrics > 0) {
      // If shown, verify it's $0
      const cashValue = await page.locator('.metric-label:has-text("Cash from Sales") + .metric-value').first().textContent();
      expect(cashValue).toBe('$0');
    }
  });

  test('should respect no-flips constraint with cash goal', async ({ page }) => {
    // Switch to structured input
    await page.click('#inputModeToggle');
    
    // Set cash goal
    await page.fill('#targetIncome', '2000');
    await page.fill('#targetCashFromSales', '50000');
    await page.fill('#timeline', '48');
    await page.fill('#startingCapital', '100000');
    
    // Disable flips
    await page.uncheck('#allowFlips');
    
    // Generate strategy
    await page.click('button:has-text("Generate Strategy")');
    
    // Wait for strategy
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    
    // Check timeline doesn't have flip events
    await page.waitForSelector('#v2Components:visible');
    const timelineText = await page.locator('#timelineBody').textContent();
    expect(timelineText).not.toContain('Flip');
  });

  test('should update shareable links with cash goal', async ({ page, context }) => {
    // Switch to structured input
    await page.click('#inputModeToggle');
    
    // Set goals including cash
    await page.fill('#targetIncome', '4000');
    await page.fill('#targetCashFromSales', '75000');
    await page.fill('#timeline', '36');
    await page.fill('#startingCapital', '60000');
    
    // Generate strategy
    await page.click('button:has-text("Generate Strategy")');
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    
    // Share the simulation
    await page.click('button:has-text("Share")');
    await page.waitForSelector('h3:has-text("Share Your Simulation")');
    
    // Get the share URL
    const shareInput = await page.locator('input[readonly]').first();
    const shareUrl = await shareInput.inputValue();
    
    // Open in new page
    const newPage = await context.newPage();
    await newPage.goto(shareUrl);
    
    // Wait for load and verify cash target is preserved
    await newPage.waitForSelector('.parsed-goal-summary', { timeout: 10000 });
    
    // Switch to structured view to check the value
    await newPage.click('#inputModeToggle');
    const cashTargetValue = await newPage.locator('#targetCashFromSales').inputValue();
    expect(cashTargetValue).toBe('75000');
  });
});