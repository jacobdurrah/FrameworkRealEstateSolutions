import { test, expect } from '@playwright/test';

test.describe('Portfolio Simulator V3 - Rent/Expense Parsing and Goal Failure', () => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  const localURL = 'http://localhost:5500';
  
  // Use production URL by default, fallback to local
  const testURL = process.env.TEST_ENV === 'local' ? localURL : baseURL;
  
  test.beforeEach(async ({ page }) => {
    // Navigate to Portfolio Simulator V3
    await page.goto(`${testURL}/portfolio-simulator-v3.html`);
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("Portfolio Simulator V3")');
  });

  test('should parse custom rent and expenses from natural language', async ({ page }) => {
    // Enter a prompt with custom rent and expenses
    const goalInput = page.locator('#goalInput');
    await goalInput.fill('I want $3,000/month income in 12 months. Rent is $1,250 per unit. Expenses are $300/month per unit. Starting with $50K.');
    
    // Click Generate Strategy
    await page.click('button:has-text("Generate Strategy")');
    
    // Wait for strategy generation
    await page.waitForSelector('.parsed-goal-summary', { timeout: 30000 });
    
    // Verify parsed values are displayed
    const parsedGoal = page.locator('.parsed-goal-summary');
    await expect(parsedGoal).toContainText('Target Income: $3,000/month');
    await expect(parsedGoal).toContainText('Timeline: 12 months');
    await expect(parsedGoal).toContainText('Starting Capital: $50,000');
    await expect(parsedGoal).toContainText('Rent per Unit: $1,250/month');
    await expect(parsedGoal).toContainText('Expenses per Unit: $300/month');
    await expect(parsedGoal).toContainText('Cash Flow per Unit: $950/month');
    
    // Wait for strategy cards
    await page.waitForSelector('.strategy-card');
    
    // Verify timeline is generated
    await page.waitForSelector('#timelineTable tbody tr', { timeout: 10000 });
    
    // Check that rent values in timeline match parsed values
    const firstRentInput = page.locator('#timelineTable tbody tr:first-child input[value="1250"]');
    await expect(firstRentInput).toBeVisible();
    
    // Check expenses
    const firstExpenseInput = page.locator('#timelineTable tbody tr:first-child input[value="300"]');
    await expect(firstExpenseInput).toBeVisible();
  });

  test('should handle goal failure gracefully', async ({ page }) => {
    // Enter an unreachable goal - very high income, short time, low capital
    const goalInput = page.locator('#goalInput');
    await goalInput.fill('I want $10,000/month in 6 months with $30K. Rent is $1,200 and expenses $400.');
    
    // Click Generate Strategy
    await page.click('button:has-text("Generate Strategy")');
    
    // Wait for strategy generation
    await page.waitForSelector('.strategy-card', { timeout: 30000 });
    
    // Check for warning message in strategy description
    const strategyCards = page.locator('.strategy-card');
    const cardCount = await strategyCards.count();
    
    let hasWarning = false;
    for (let i = 0; i < cardCount; i++) {
      const cardText = await strategyCards.nth(i).textContent();
      if (cardText?.includes('⚠️ Goal not achieved')) {
        hasWarning = true;
        
        // Verify the warning shows actual achievement
        expect(cardText).toMatch(/best result is \$\d+\/month/);
        expect(cardText).toMatch(/using \d+ properties/);
        expect(cardText).toMatch(/in \d+ months/);
      }
    }
    
    expect(hasWarning).toBeTruthy();
    
    // Verify timeline shows (even if goal not met, should show best effort)
    // Wait a bit for timeline to render
    await page.waitForTimeout(2000);
    
    // Check if timeline section is visible
    const timelineSection = page.locator('#v2Components');
    const isTimelineVisible = await timelineSection.isVisible();
    
    if (isTimelineVisible) {
      // If visible, should have at least one row
      const rows = page.locator('#timelineTable tbody tr');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThan(0);
    }
  });

  test('should use default rent/expenses when not specified', async ({ page }) => {
    // Enter a prompt without rent/expenses
    const goalInput = page.locator('#goalInput');
    await goalInput.fill('Generate $5,000/month passive income in 24 months with $100K starting capital.');
    
    // Click Generate Strategy
    await page.click('button:has-text("Generate Strategy")');
    
    // Wait for parsed goal display
    await page.waitForSelector('.parsed-goal-summary', { timeout: 30000 });
    
    // Verify default values are used
    const parsedGoal = page.locator('.parsed-goal-summary');
    await expect(parsedGoal).toContainText('Rent per Unit: $1,200/month');
    await expect(parsedGoal).toContainText('Expenses per Unit: $350/month');
    await expect(parsedGoal).toContainText('Cash Flow per Unit: $850/month');
  });

  test('should sync structured input with rent values', async ({ page }) => {
    // Toggle to structured input
    await page.click('#inputModeToggle');
    
    // Wait for structured input to appear
    await page.waitForSelector('#structuredInput');
    
    // Set values in structured input
    await page.fill('#targetIncome', '4000');
    await page.fill('#timeline', '18');
    await page.fill('#startingCapital', '75000');
    await page.fill('#monthlySavings', '1500');
    await page.fill('#minRent', '1100');
    await page.fill('#maxRent', '1400');
    
    // Generate strategy
    await page.click('button:has-text("Generate Strategy")');
    
    // Wait for parsed goal
    await page.waitForSelector('.parsed-goal-summary', { timeout: 30000 });
    
    // Verify rent is average of min/max
    const parsedGoal = page.locator('.parsed-goal-summary');
    await expect(parsedGoal).toContainText('Rent per Unit: $1,250/month'); // Average of 1100 and 1400
  });

  test('should show different strategies with feasibility indicators', async ({ page }) => {
    // Enter a challenging but achievable goal
    const goalInput = page.locator('#goalInput');
    await goalInput.fill('I want $8,000/month in 36 months. Have $150K. Rent is $1,400, expenses $300.');
    
    // Generate strategy
    await page.click('button:has-text("Generate Strategy")');
    
    // Wait for strategy cards
    await page.waitForSelector('.strategy-card', { timeout: 30000 });
    
    // Verify we have 3 strategy options
    const strategyCards = page.locator('.strategy-card');
    await expect(strategyCards).toHaveCount(3);
    
    // Check each strategy type
    await expect(page.locator('.strategy-card:has-text("Conservative")')).toBeVisible();
    await expect(page.locator('.strategy-card:has-text("Balanced")')).toBeVisible();
    await expect(page.locator('.strategy-card:has-text("Aggressive")')).toBeVisible();
    
    // Verify at least one shows monthly income
    const hasIncome = await page.locator('.strategy-card:has-text("Monthly Income:")').count() > 0;
    expect(hasIncome).toBeTruthy();
  });

  test('should calculate cash flow correctly with custom values', async ({ page }) => {
    // Test specific cash flow calculation
    const testCases = [
      { rent: 1500, expenses: 300, expectedFlow: 1200 },
      { rent: 1000, expenses: 600, expectedFlow: 400 },
      { rent: 1300, expenses: 400, expectedFlow: 900 }
    ];
    
    for (const testCase of testCases) {
      // Clear and enter new prompt
      const goalInput = page.locator('#goalInput');
      await goalInput.clear();
      await goalInput.fill(`Target $5,000/month. Rent is $${testCase.rent}/month. Expenses are $${testCase.expenses}/month.`);
      
      // Generate strategy
      await page.click('button:has-text("Generate Strategy")');
      
      // Wait for parsed goal with longer timeout for mobile
      await page.waitForSelector('.parsed-goal-summary', { timeout: 60000 });
      
      // Wait a bit for values to update
      await page.waitForTimeout(1000);
      
      // Verify cash flow calculation
      const parsedGoal = page.locator('.parsed-goal-summary');
      await expect(parsedGoal).toContainText(`Cash Flow per Unit: $${testCase.expectedFlow.toLocaleString()}/month`, { timeout: 10000 });
      
      // Clear for next test
      await page.reload();
      await page.waitForLoadState('networkidle');
    }
  });
});

// Run a quick smoke test to ensure the page loads
test('Portfolio V3 page loads successfully', async ({ page }) => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
  
  // Check main elements exist
  await expect(page.locator('h1:has-text("Portfolio Simulator V3")')).toBeVisible();
  await expect(page.locator('#goalInput')).toBeVisible();
  await expect(page.locator('button:has-text("Generate Strategy")')).toBeVisible();
  
  // Check example queries loaded
  const exampleQueries = page.locator('.example-query');
  await expect(exampleQueries.first()).toBeVisible();
});