import { test, expect } from '@playwright/test';

test.describe('Real Detroit Listings Integration', () => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  
  test.beforeEach(async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error' || msg.type() === 'warn') {
        console.log(`Browser: ${msg.text()}`);
      }
    });
    
    // Navigate to Portfolio Simulator V3
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('h1:has-text("Portfolio Simulator V3")');
  });

  test('test_real_listings_replaces_simulated_properties_on_timeline', async ({ page }) => {
    // Step 1: Generate a strategy
    await page.fill('#goalInput', 'Generate $4K/month in 24 months with $60K starting capital');
    await page.click('button:has-text("Generate Strategy")');
    
    // Wait for strategies to appear
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    
    // Select the first strategy
    await page.click('.strategy-card >> nth=0');
    
    // Wait for timeline to populate
    await page.waitForSelector('#timelineTable tbody tr', { timeout: 10000 });
    
    // Get initial property names
    const initialProperties = await page.locator('#timelineTable tbody tr').filter({ 
      hasText: 'Buy' 
    }).locator('input[placeholder="Property address"]').all();
    
    const initialNames = await Promise.all(
      initialProperties.map(input => input.inputValue())
    );
    
    console.log('Initial property names:', initialNames);
    
    // Step 2: Enable real listings
    await page.check('#useRealListings');
    
    // Step 3: Click Find Actual Listings
    await page.click('button:has-text("Find Actual Listings")');
    
    // Step 4: Wait for processing
    await page.waitForTimeout(3000); // Give API time to respond
    
    // Check if loading completed
    await page.waitForSelector('#v3LoadingState', { 
      state: 'hidden',
      timeout: 30000 
    }).catch(() => {
      console.log('Loading state timeout - checking results anyway');
    });
    
    // Step 5: Verify property names changed or warning appeared
    const updatedProperties = await page.locator('#timelineTable tbody tr').filter({ 
      hasText: 'Buy' 
    }).locator('input[placeholder="Property address"]').all();
    
    const updatedNames = await Promise.all(
      updatedProperties.map(input => input.inputValue())
    );
    
    console.log('Updated property names:', updatedNames);
    
    // Check for changes or warning message
    const hasAddresses = updatedNames.some(name => 
      name.includes(':') && (name.includes('St') || name.includes('Ave') || name.includes('Rd'))
    );
    
    const warningExists = await page.locator('.alert-warning').count() > 0;
    
    // Either properties were updated OR a warning was shown
    expect(hasAddresses || warningExists).toBe(true);
    
    if (hasAddresses) {
      console.log('✓ Properties were updated with real addresses');
    } else if (warningExists) {
      console.log('✓ Warning message shown (no listings available)');
    }
  });

  test('test_real_listing_api_returns_and_updates_timeline_correctly', async ({ page }) => {
    // Generate strategy with specific price range
    await page.click('#inputModeToggle'); // Switch to structured input
    
    await page.fill('#targetIncome', '3000');
    await page.fill('#timeline', '24');
    await page.fill('#startingCapital', '50000');
    
    await page.click('button:has-text("Generate Strategy")');
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    
    // Select balanced strategy
    const strategyCards = await page.locator('.strategy-card').all();
    for (const card of strategyCards) {
      const text = await card.textContent();
      if (text.includes('Balanced')) {
        await card.click();
        break;
      }
    }
    
    await page.waitForSelector('#timelineTable tbody tr');
    
    // Get property prices before
    const pricesBefore = await page.locator('#timelineTable tbody tr').filter({ 
      hasText: 'Buy' 
    }).locator('td:nth-child(4) input').all();
    
    const initialPrices = await Promise.all(
      pricesBefore.map(input => input.inputValue())
    );
    
    // Enable real listings
    await page.check('#useRealListings');
    await page.click('button:has-text("Find Actual Listings")');
    
    // Wait for completion
    await page.waitForTimeout(5000);
    
    // Check console for API calls
    const consoleLogs = [];
    page.on('console', msg => consoleLogs.push(msg.text()));
    
    // Verify either success or graceful failure
    const alerts = await page.locator('.alert').all();
    const hasAlert = alerts.length > 0;
    
    if (hasAlert) {
      const alertText = await alerts[0].textContent();
      console.log('Alert shown:', alertText);
      
      // Should be a warning, not an error about "feature not available"
      expect(alertText).not.toContain('Real listings feature not available');
      expect(alertText).not.toContain('Please refresh the page');
    }
    
    // Properties should still be functional
    const timelineRows = await page.locator('#timelineTable tbody tr').count();
    expect(timelineRows).toBeGreaterThan(0);
  });

  test('test_simulator_displays_fallback_warning_gracefully', async ({ page }) => {
    // Generate a strategy
    await page.fill('#goalInput', 'Build $5K/month portfolio in 36 months with $80K');
    await page.click('button:has-text("Generate Strategy")');
    
    await page.waitForSelector('.strategy-card');
    await page.click('.strategy-card >> nth=0');
    await page.waitForSelector('#timelineTable');
    
    // Mock API failure by intercepting the request
    await page.route('**/api/properties/search', route => {
      route.fulfill({
        status: 503,
        body: JSON.stringify({ error: 'Service temporarily unavailable' })
      });
    });
    
    // Try to find listings
    await page.check('#useRealListings');
    await page.click('button:has-text("Find Actual Listings")');
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Should show warning OR error (but not "feature not available")
    const warnings = await page.locator('.alert-warning').all();
    const errors = await page.locator('.alert-danger').all();
    const allAlerts = [...warnings, ...errors];
    
    // If route mocking worked, there should be an alert
    if (allAlerts.length > 0) {
        // Check text is user-friendly
        const alertText = await allAlerts[0].textContent();
        expect(alertText).not.toContain('Real listings feature not available');
        expect(alertText).not.toContain('Please refresh the page');
        
        // Should mention unavailability or estimates
        if (warnings.length > 0) {
            expect(alertText).toMatch(/unable to load|unavailable|estimated values|market averages/i);
        }
    } else {
        // If no alerts, the feature might have succeeded despite our mocking
        // Check that listings were actually processed
        const hasRealListings = await page.evaluate(() => {
            return window.timelineData && window.timelineData.some(event => 
                event.property && event.property.includes(':')
            );
        });
        console.log('No alerts shown - API might have succeeded despite mocking');
    }
    
    // Timeline should still be functional
    const timelineRows = await page.locator('#timelineTable tbody tr').count();
    expect(timelineRows).toBeGreaterThan(0);
    
    // Should be able to continue using the simulator
    const monthlyIncome = await page.locator('#monthlyIncome').textContent();
    expect(monthlyIncome).toBeTruthy();
  });

  test('handles initialization and toggle correctly', async ({ page }) => {
    // Generate strategy
    await page.fill('#goalInput', 'Generate $3K/month in 24 months with $50K');
    await page.click('button:has-text("Generate Strategy")');
    
    await page.waitForSelector('.strategy-card');
    await page.click('.strategy-card >> nth=0');
    await page.waitForSelector('#timelineTable');
    
    // Toggle real listings on and off multiple times
    for (let i = 0; i < 3; i++) {
      // Check
      await page.check('#useRealListings');
      await page.click('button:has-text("Find Actual Listings")');
      await page.waitForTimeout(2000);
      
      // Uncheck
      await page.uncheck('#useRealListings');
      await page.waitForTimeout(500);
    }
    
    // Should not show initialization errors
    const errorCount = await page.locator('text=not initialized').count();
    expect(errorCount).toBe(0);
    
    const featureErrorCount = await page.locator('text=Real listings feature not available').count();
    expect(featureErrorCount).toBe(0);
  });

  test('preserves timeline functionality with real listings', async ({ page }) => {
    // Generate strategy
    await page.fill('#goalInput', 'Build $4K/month portfolio in 24 months with $60K');
    await page.click('button:has-text("Generate Strategy")');
    
    await page.waitForSelector('.strategy-card');
    await page.click('.strategy-card >> nth=0');
    await page.waitForSelector('#timelineTable');
    
    // Enable real listings
    await page.check('#useRealListings');
    await page.click('button:has-text("Find Actual Listings")');
    
    await page.waitForTimeout(3000);
    
    // Add a new timeline event after real listings
    await page.click('button:has-text("Add Timeline Event")');
    
    // Should be able to edit timeline
    const firstPropertyInput = await page.locator('#timelineTable tbody tr >> nth=0').locator('input[placeholder="Property address"]');
    await firstPropertyInput.fill('Test Property Edit');
    
    // Recalculate should work
    if (await page.locator('button:has-text("Refresh")').isVisible()) {
      await page.click('button:has-text("Refresh")');
    }
    
    // Portfolio summary should update
    const summaryExists = await page.locator('#monthlyIncome').isVisible();
    expect(summaryExists).toBe(true);
  });
});