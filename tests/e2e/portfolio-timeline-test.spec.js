const { test, expect } = require('@playwright/test');

// Test the portfolio simulator timeline functionality
test.describe('Portfolio Simulator Timeline', () => {
  let simulationId;

  test.beforeEach(async ({ page }) => {
    // Navigate to portfolio simulator
    await page.goto('/portfolio-simulator.html');
    
    // Start a new simulation
    await page.fill('#simulationName', 'Timeline Test');
    await page.fill('#targetIncome', '10000');
    await page.fill('#initialCapital', '50000');
    await page.fill('#timeHorizon', '36');
    await page.selectOption('#strategyType', 'balanced');
    
    // Click start simulation
    await page.click('button:has-text("START SIMULATION")');
    
    // Wait for simulation to load
    await page.waitForTimeout(2000);
    
    // Get simulation ID from URL
    const url = page.url();
    const urlParams = new URLSearchParams(url.split('?')[1]);
    simulationId = urlParams.get('id');
  });

  test('Timeline persists on page refresh', async ({ page }) => {
    // Add a property to timeline
    await page.click('.timeline-add-btn');
    await page.waitForSelector('#timelineModal.active');
    
    // Click property acquisition
    await page.click('.timeline-option:has-text("Property Acquisition")');
    
    // Fill property details
    await page.fill('#newPropertyAddress', '123 Test St');
    await page.fill('#newPurchasePrice', '150000');
    await page.fill('#newMonthlyRent', '1500');
    
    // Submit property
    await page.click('button:has-text("Add to Timeline")');
    await page.waitForTimeout(2000);
    
    // Verify property appears in timeline
    await expect(page.locator('.timeline-card:has-text("123 Test St")')).toBeVisible();
    
    // Get initial metrics
    const initialIncome = await page.textContent('.metric-card:has-text("Current Monthly Income") .metric-value');
    const initialProperties = await page.textContent('.metric-card:has-text("Total Properties") .metric-value');
    
    // Refresh the page
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Verify timeline still shows the property
    await expect(page.locator('.timeline-card:has-text("123 Test St")')).toBeVisible();
    
    // Verify metrics are preserved
    const afterIncome = await page.textContent('.metric-card:has-text("Current Monthly Income") .metric-value');
    const afterProperties = await page.textContent('.metric-card:has-text("Total Properties") .metric-value');
    
    expect(afterIncome).toBe(initialIncome);
    expect(afterProperties).toBe(initialProperties);
  });

  test('Values update immediately after adding property', async ({ page }) => {
    // Get initial values
    const getMetrics = async () => {
      const income = await page.textContent('.metric-card:has-text("Current Monthly Income") .metric-value');
      const properties = await page.textContent('.metric-card:has-text("Total Properties") .metric-value');
      const equity = await page.textContent('.metric-card:has-text("Total Equity") .metric-value');
      const cash = await page.textContent('.metric-card:has-text("Cash") .metric-value');
      
      return {
        income: parseFloat(income.replace(/[$,]/g, '')),
        properties: parseInt(properties),
        equity: parseFloat(equity.replace(/[$,]/g, '')),
        cash: parseFloat(cash.replace(/[$,]/g, ''))
      };
    };
    
    const initialMetrics = await getMetrics();
    
    // Add a property
    await page.click('.timeline-add-btn');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Property Acquisition")');
    
    await page.fill('#newPropertyAddress', '456 Test Ave');
    await page.fill('#newPurchasePrice', '200000');
    await page.fill('#newMonthlyRent', '2000');
    await page.fill('#newRehabCost', '0');
    
    // Calculate expected values
    const expectedCashFlow = 2000 - (200000 * 0.0075) - 200 - 100 - 150; // Rough calculation
    
    // Submit property
    await page.click('button:has-text("Add to Timeline")');
    
    // Wait for updates
    await page.waitForTimeout(1000);
    
    // Get updated metrics
    const updatedMetrics = await getMetrics();
    
    // Verify immediate updates
    expect(updatedMetrics.properties).toBe(initialMetrics.properties + 1);
    expect(updatedMetrics.income).toBeGreaterThan(initialMetrics.income);
    expect(updatedMetrics.equity).toBeGreaterThan(initialMetrics.equity);
    expect(updatedMetrics.cash).toBeLessThan(initialMetrics.cash);
  });

  test('Timeline shows all event types correctly', async ({ page }) => {
    // Add property
    await page.click('.timeline-add-btn');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Property Acquisition")');
    await page.fill('#newPropertyAddress', '789 Test Blvd');
    await page.fill('#newPurchasePrice', '175000');
    await page.fill('#newMonthlyRent', '1750');
    await page.click('button:has-text("Add to Timeline")');
    await page.waitForTimeout(1000);
    
    // Add snapshot
    await page.click('.timeline-add-btn:last-child');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Time Snapshot")');
    await page.waitForTimeout(1000);
    
    // Add wait period
    await page.click('.timeline-add-btn:last-child');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Wait Period")');
    await page.waitForSelector('#propertyModal');
    await page.fill('#waitMonths', '6');
    await page.click('button:has-text("Add Wait Period")');
    await page.waitForTimeout(1000);
    
    // Verify all events appear
    await expect(page.locator('.timeline-card:has-text("789 Test Blvd")')).toBeVisible();
    await expect(page.locator('.timeline-card:has-text("Snapshot")')).toBeVisible();
    await expect(page.locator('.timeline-card:has-text("Wait")')).toBeVisible();
    
    // Refresh and verify persistence
    await page.reload();
    await page.waitForTimeout(2000);
    
    await expect(page.locator('.timeline-card:has-text("789 Test Blvd")')).toBeVisible();
    await expect(page.locator('.timeline-card:has-text("Snapshot")')).toBeVisible();
    await expect(page.locator('.timeline-card:has-text("Wait")')).toBeVisible();
  });

  test('Timeline events maintain correct order', async ({ page }) => {
    // Add events in specific months
    const events = [
      { month: 3, type: 'property', address: 'Property Month 3' },
      { month: 1, type: 'property', address: 'Property Month 1' },
      { month: 6, type: 'property', address: 'Property Month 6' }
    ];
    
    for (const event of events) {
      await page.click('.timeline-add-btn');
      await page.waitForSelector('#timelineModal.active');
      await page.click('.timeline-option:has-text("Property Acquisition")');
      
      await page.fill('#newPropertyAddress', event.address);
      await page.fill('#newPurchasePrice', '100000');
      await page.fill('#newMonthlyRent', '1000');
      await page.fill('#purchaseMonth', event.month.toString());
      
      await page.click('button:has-text("Add to Timeline")');
      await page.waitForTimeout(1000);
    }
    
    // Get all timeline cards
    const cards = await page.locator('.timeline-card').all();
    const cardTexts = [];
    
    for (const card of cards) {
      const text = await card.textContent();
      if (text.includes('Property Month')) {
        cardTexts.push(text);
      }
    }
    
    // Verify correct order
    expect(cardTexts[0]).toContain('Property Month 1');
    expect(cardTexts[1]).toContain('Property Month 3');
    expect(cardTexts[2]).toContain('Property Month 6');
  });

  test('Property sale updates values correctly', async ({ page }) => {
    // First add a property
    await page.click('.timeline-add-btn');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Property Acquisition")');
    
    await page.fill('#newPropertyAddress', '100 Sale Test St');
    await page.fill('#newPurchasePrice', '150000');
    await page.fill('#newMonthlyRent', '1500');
    await page.click('button:has-text("Add to Timeline")');
    await page.waitForTimeout(2000);
    
    // Get metrics after purchase
    const afterPurchase = await page.textContent('.metric-card:has-text("Current Monthly Income") .metric-value');
    
    // Add property sale
    await page.click('.timeline-add-btn:last-child');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Property Sale")');
    
    await page.waitForSelector('#propertyModal');
    await page.selectOption('#sellPropertySelect', '100 Sale Test St');
    await page.fill('#salePrice', '180000');
    await page.fill('#saleMonth', '12');
    
    await page.click('button:has-text("Add Sale")');
    await page.waitForTimeout(2000);
    
    // Verify sale appears in timeline
    await expect(page.locator('.timeline-card:has-text("Sale")')).toBeVisible();
    
    // Verify income is updated (should be lower after sale)
    const afterSale = await page.textContent('.metric-card:has-text("Current Monthly Income") .metric-value');
    expect(parseFloat(afterSale.replace(/[$,]/g, ''))).toBeLessThan(parseFloat(afterPurchase.replace(/[$,]/g, '')));
  });
});

// Run test from terminal
test('Terminal execution test', async ({ page }) => {
  console.log('Starting portfolio simulator timeline test...');
  
  // Navigate to test page
  await page.goto('/portfolio-simulator-test.html');
  
  // Test adding property
  await page.click('button:has-text("Add Property")');
  await page.waitForTimeout(500);
  
  // Verify console shows success
  const consoleText = await page.textContent('#console');
  expect(consoleText).toContain('Property added successfully');
  
  // Test refresh
  await page.click('button:has-text("Simulate Page Refresh")');
  await page.waitForTimeout(1000);
  
  // Get console text after refresh
  const consoleTextAfterRefresh = await page.textContent('#console');
  
  // Verify timeline persisted
  expect(consoleTextAfterRefresh).toContain('State loaded from localStorage');
  
  console.log('Timeline persistence test completed successfully!');
});