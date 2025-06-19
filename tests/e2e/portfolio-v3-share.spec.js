import { test, expect } from '@playwright/test';

test.describe('Portfolio Simulator V3 - Shareable Links', () => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  
  test.beforeEach(async ({ page }) => {
    // Navigate to Portfolio Simulator V3
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("Portfolio Simulator V3")');
    
    // Handle any dialogs
    page.on('dialog', dialog => dialog.accept());
  });

  test('should generate shareable link after creating strategy', async ({ page }) => {
    // Enter a goal
    await page.fill('#goalInput', 'Generate $5K/month in 24 months with $30K capital');
    
    // Generate strategy
    await page.click('button:has-text("Generate Strategy")');
    
    // Wait for strategy to be generated
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    
    // Click Share button
    await page.click('button:has-text("Share")');
    
    // Wait for modal to appear
    await page.waitForSelector('h3:has-text("Share Your Simulation")');
    
    // Check that the share link input exists and has a value
    const shareInput = await page.locator('input[readonly]').first();
    const shareUrl = await shareInput.inputValue();
    
    expect(shareUrl).toContain('portfolio-simulator-v3.html?state=');
    expect(shareUrl.length).toBeGreaterThan(100); // Should have compressed data
    
    // Close modal
    await page.click('button:has-text("Close")');
  });

  test('should load simulation from shared link', async ({ page, context }) => {
    // First, create a simulation
    await page.fill('#goalInput', 'Build portfolio for $8K/month in 36 months with $50K');
    await page.click('button:has-text("Generate Strategy")');
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    
    // Get the generated strategy details for comparison
    const originalIncome = await page.locator('.metric-value').filter({ hasText: '/mo' }).first().textContent();
    
    // Share the simulation
    await page.click('button:has-text("Share")');
    await page.waitForSelector('h3:has-text("Share Your Simulation")');
    
    // Get the share URL
    const shareInput = await page.locator('input[readonly]').first();
    const shareUrl = await shareInput.inputValue();
    
    // Open new page with shared link
    const newPage = await context.newPage();
    await newPage.goto(shareUrl);
    
    // Wait for simulation to load
    await newPage.waitForSelector('.parsed-goal-summary', { timeout: 10000 });
    
    // Verify the goal was restored
    const goalText = await newPage.locator('#goalInput').inputValue();
    expect(goalText).toContain('8K/month');
    
    // Verify strategy is displayed
    await newPage.waitForSelector('.strategy-card');
    const loadedIncome = await newPage.locator('.metric-value').filter({ hasText: '/mo' }).first().textContent();
    expect(loadedIncome).toBe(originalIncome);
    
    // Verify simulation name shows (Shared)
    const simName = await newPage.locator('#simulationName').textContent();
    expect(simName).toContain('(Shared)');
  });

  test('should preserve structured input mode in shared link', async ({ page, context }) => {
    // Switch to structured input
    await page.click('#inputModeToggle');
    
    // Fill structured inputs
    await page.fill('#targetIncome', '12000');
    await page.fill('#timeline', '48');
    await page.fill('#startingCapital', '100000');
    await page.fill('#monthlySavings', '5000');
    await page.selectOption('#strategyPreference', 'aggressive');
    
    // Generate strategy
    await page.click('button:has-text("Generate Strategy")');
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    
    // Share
    await page.click('button:has-text("Share")');
    const shareInput = await page.locator('input[readonly]').first();
    const shareUrl = await shareInput.inputValue();
    
    // Load in new page
    const newPage = await context.newPage();
    await newPage.goto(shareUrl);
    
    // Wait for load
    await newPage.waitForSelector('.parsed-goal-summary', { timeout: 10000 });
    
    // Verify structured mode is active
    const toggleChecked = await newPage.locator('#inputModeToggle').isChecked();
    expect(toggleChecked).toBe(true);
    
    // Verify values are restored
    expect(await newPage.locator('#targetIncome').inputValue()).toBe('12000');
    expect(await newPage.locator('#timeline').inputValue()).toBe('48');
    expect(await newPage.locator('#startingCapital').inputValue()).toBe('100000');
    expect(await newPage.locator('#monthlySavings').inputValue()).toBe('5000');
    expect(await newPage.locator('#strategyPreference').inputValue()).toBe('aggressive');
  });

  test('should show error when sharing without strategy', async ({ page }) => {
    // Try to share without generating strategy
    await page.click('button:has-text("Share")');
    
    // Check for error message
    await page.waitForSelector('#v3ErrorMessage:visible');
    const errorText = await page.locator('#v3ErrorMessage').textContent();
    expect(errorText).toContain('Please generate a strategy first');
  });

  test('should handle invalid share links gracefully', async ({ page }) => {
    // Navigate to invalid share link
    await page.goto(`${baseURL}/portfolio-simulator-v3.html?state=invalid_data`);
    
    // Wait for error
    await page.waitForSelector('#v3ErrorMessage:visible');
    const errorText = await page.locator('#v3ErrorMessage').textContent();
    expect(errorText).toContain('Failed to load shared simulation');
  });

  test('should preserve view month in shared link', async ({ page, context }) => {
    // Create simulation
    await page.fill('#goalInput', 'Generate $6K/month in 30 months with $40K');
    await page.click('button:has-text("Generate Strategy")');
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    
    // Change view month
    await page.fill('#summaryMonth', '12');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    
    // Share
    await page.click('button:has-text("Share")');
    const shareInput = await page.locator('input[readonly]').first();
    const shareUrl = await shareInput.inputValue();
    
    // Load in new page
    const newPage = await context.newPage();
    await newPage.goto(shareUrl);
    
    // Wait for load
    await newPage.waitForSelector('#v2Components:visible', { timeout: 10000 });
    
    // Verify view month is preserved
    const viewMonth = await newPage.locator('#summaryMonth').inputValue();
    expect(viewMonth).toBe('12');
  });

  test('should clear URL parameter after loading', async ({ page }) => {
    // Create a simple share URL
    const shareUrl = `${baseURL}/portfolio-simulator-v3.html?state=test`;
    await page.goto(shareUrl);
    
    // Wait for page to process the state
    await page.waitForTimeout(1000);
    
    // Check that URL no longer has state parameter
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('?state=');
    expect(currentUrl).toBe(`${baseURL}/portfolio-simulator-v3.html`);
  });
});