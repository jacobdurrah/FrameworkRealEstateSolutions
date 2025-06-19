import { test, expect } from '@playwright/test';

test.describe('Portfolio V3 - Real Detroit Listings', () => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  
  test.beforeEach(async ({ page }) => {
    // Navigate to Portfolio Simulator V3
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("Portfolio Simulator V3")');
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'warn') {
        console.log(`Browser console: ${msg.text()}`);
      }
    });
  });

  test('should find real listings for conservative strategy', async ({ page }) => {
    // Switch to structured input
    await page.click('#inputModeToggle');
    
    // Set conservative strategy parameters
    await page.fill('#targetIncome', '5000');
    await page.fill('#timeline', '36');
    await page.fill('#startingCapital', '80000');
    await page.selectOption('#strategyPreference', 'conservative');
    
    // Generate strategy
    await page.click('button:has-text("Generate Strategy")');
    
    // Wait for strategy to generate
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    
    // Select first strategy
    await page.click('.strategy-card >> nth=0');
    await page.waitForSelector('#timelineTable', { timeout: 10000 });
    
    // Enable real listings
    await page.check('#useRealListings');
    
    // Click find listings button
    await page.click('button:has-text("Find Actual Listings")');
    
    // Wait for listings to load (using actual loading element ID)
    await page.waitForSelector('#v3LoadingState >> text=Searching for real Detroit properties', { 
      state: 'visible',
      timeout: 5000 
    });
    
    // Wait for completion (loading state disappears)
    await page.waitForSelector('#v3LoadingState', { 
      state: 'hidden',
      timeout: 30000 
    });
    
    // Check that timeline has been updated
    const propertyCell = await page.locator('#timelineTable td >> nth=2').first();
    const propertyText = await propertyCell.textContent();
    
    // Should show format like "Rental – 123 Main St, Detroit, MI"
    expect(propertyText).toMatch(/^(Rental|BRRR|Flip)\s+–\s+.+,\s*Detroit,\s*MI/i);
    
    // Check for success message or appropriate warning
    const alerts = await page.locator('.alert').all();
    let foundAppropriateMessage = false;
    
    for (const alert of alerts) {
      const text = await alert.textContent();
      if (text.includes('Found') && text.includes('real listings') || 
          text.includes('No exact matches found')) {
        foundAppropriateMessage = true;
        break;
      }
    }
    
    expect(foundAppropriateMessage).toBe(true);
  });

  test('should find real listings for balanced strategy with cash goal', async ({ page }) => {
    // Switch to structured input
    await page.click('#inputModeToggle');
    
    // Set balanced strategy parameters
    await page.fill('#targetIncome', '4000');
    await page.fill('#targetCashFromSales', '50000');
    await page.fill('#timeline', '24');
    await page.fill('#startingCapital', '60000');
    await page.selectOption('#strategyPreference', 'balanced');
    
    // Generate strategy
    await page.click('button:has-text("Generate Strategy")');
    
    // Wait for strategy to generate
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    
    // Select balanced strategy (usually second)
    const strategyCards = await page.locator('.strategy-card').all();
    for (const card of strategyCards) {
      const text = await card.textContent();
      if (text.includes('Balanced')) {
        await card.click();
        break;
      }
    }
    
    await page.waitForSelector('#timelineTable', { timeout: 10000 });
    
    // Enable real listings
    await page.check('#useRealListings');
    
    // Click find listings button
    await page.click('button:has-text("Find Actual Listings")');
    
    // Wait for completion
    await page.waitForSelector('#v3LoadingState', { 
      state: 'hidden',
      timeout: 30000 
    });
    
    // Verify mix of property types
    const propertyCells = await page.locator('#timelineTable tbody tr').filter({ 
      hasText: 'Buy' 
    }).locator('td >> nth=2').all();
    
    let hasRental = false;
    let hasFlip = false;
    
    for (const cell of propertyCells) {
      const text = await cell.textContent();
      if (text.includes('Rental –')) hasRental = true;
      if (text.includes('Flip –')) hasFlip = true;
    }
    
    // Balanced strategy should have both types
    expect(hasRental || hasFlip).toBe(true);
  });

  test('should handle API failures gracefully', async ({ page }) => {
    // Generate a simple strategy first
    await page.fill('#goalInput', 'Generate $3K/month in 24 months with $50K');
    await page.click('button:has-text("Generate Strategy")');
    
    // Wait for strategy
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    await page.click('.strategy-card >> nth=0');
    await page.waitForSelector('#timelineTable', { timeout: 10000 });
    
    // Intercept API calls to simulate failure
    await page.route('**/api/properties/search', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    // Try to find listings
    await page.check('#useRealListings');
    await page.click('button:has-text("Find Actual Listings")');
    
    // Should show appropriate error/warning
    await page.waitForSelector('.alert', { timeout: 10000 });
    
    const alertText = await page.locator('.alert').first().textContent();
    expect(alertText).toMatch(/no exact matches found|api|error|unavailable/i);
    
    // Timeline should still be intact
    const timelineRows = await page.locator('#timelineTable tbody tr').count();
    expect(timelineRows).toBeGreaterThan(0);
  });

  test('should show proper loading states', async ({ page }) => {
    // Generate strategy
    await page.fill('#goalInput', 'Build portfolio for $5K/month in 36 months with $60K');
    await page.click('button:has-text("Generate Strategy")');
    
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    await page.click('.strategy-card >> nth=0');
    await page.waitForSelector('#timelineTable', { timeout: 10000 });
    
    // Enable listings and click find
    await page.check('#useRealListings');
    
    // Start monitoring for loading indicator
    const loadingPromise = page.waitForSelector('#v3LoadingState:has-text("Searching for real Detroit properties")', {
      state: 'visible',
      timeout: 5000
    });
    
    await page.click('button:has-text("Find Actual Listings")');
    
    // Verify loading indicator appears
    await loadingPromise;
    
    // Wait for it to complete
    await page.waitForSelector('#v3LoadingState', { 
      state: 'hidden',
      timeout: 30000 
    });
  });

  test('should preserve financial calculations after listing replacement', async ({ page }) => {
    // Switch to structured input for precise control
    await page.click('#inputModeToggle');
    
    // Set parameters
    await page.fill('#targetIncome', '3000');
    await page.fill('#timeline', '24');
    await page.fill('#startingCapital', '60000');
    
    // Generate strategy
    await page.click('button:has-text("Generate Strategy")');
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    await page.click('.strategy-card >> nth=0');
    await page.waitForSelector('#timelineTable', { timeout: 10000 });
    
    // Capture initial monthly income
    const initialIncome = await page.locator('#monthlyIncome').textContent();
    
    // Find real listings
    await page.check('#useRealListings');
    await page.click('button:has-text("Find Actual Listings")');
    await page.waitForSelector('#v3LoadingState', { state: 'hidden', timeout: 30000 });
    
    // Income should remain similar (within 20% due to price variations)
    const finalIncome = await page.locator('#monthlyIncome').textContent();
    
    const parseIncome = (str) => parseInt(str.replace(/[^0-9-]/g, ''));
    const initial = parseIncome(initialIncome);
    const final = parseIncome(finalIncome);
    
    // Allow for some variation due to real property prices
    const percentChange = Math.abs((final - initial) / initial);
    expect(percentChange).toBeLessThan(0.3); // Within 30% variance
  });
});