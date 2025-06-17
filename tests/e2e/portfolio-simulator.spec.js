// Portfolio Simulator E2E Tests
const { test, expect } = require('@playwright/test');
const { 
  waitForElement, 
  fillField, 
  clickButton, 
  createSimulation,
  addProperty,
  getPortfolioMetrics,
  verifySimulationSaved,
  takeScreenshot
} = require('./helpers/test-utils');

test.describe('Portfolio Simulator', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to portfolio simulator
    await page.goto('/portfolio-simulator.html');
    
    // Wait for page to load
    await waitForElement(page, '#simulationForm');
  });

  test('should load the portfolio simulator page', async ({ page }) => {
    // Verify main elements are present
    await expect(page.locator('h1')).toContainText('Portfolio Simulator');
    await expect(page.locator('#simulationForm')).toBeVisible();
    await expect(page.locator('#simulationName')).toBeVisible();
    await expect(page.locator('#targetIncome')).toBeVisible();
    await expect(page.locator('#initialCapital')).toBeVisible();
  });

  test('should create a new simulation', async ({ page }) => {
    // Create simulation with custom parameters
    await createSimulation(page, {
      name: 'E2E Test Simulation',
      targetIncome: 15000,
      initialCapital: 100000,
      timeHorizon: 24,
      strategyType: 'aggressive'
    });

    // Verify simulation was created
    await expect(page.locator('#currentSimulationName')).toContainText('E2E Test Simulation');
    
    // Verify phases section is visible
    await expect(page.locator('#phasesList')).toBeVisible();
    
    // Take screenshot of created simulation
    await takeScreenshot(page, 'simulation-created');
  });

  test('should save and load a simulation', async ({ page }) => {
    // Create a simulation
    const simulationName = `Test Sim ${Date.now()}`;
    await createSimulation(page, { name: simulationName });

    // Save the simulation
    await clickButton(page, 'Save Simulation');
    await page.waitForTimeout(2000); // Allow save to complete

    // Verify it appears in saved simulations
    await verifySimulationSaved(page, simulationName);

    // Start a new simulation
    await createSimulation(page, { name: 'Another Simulation' });

    // Load the previous simulation
    const savedSimCard = page.locator(`.saved-sim-card:has-text("${simulationName}")`);
    await savedSimCard.locator('button:has-text("Load")').click();

    // Verify the simulation was loaded
    await expect(page.locator('#currentSimulationName')).toContainText(simulationName);
  });

  test('should add a property to the portfolio', async ({ page }) => {
    // Create a simulation first
    await createSimulation(page);

    // Add a property
    await addProperty(page, '48205'); // Search by zip code

    // Verify property was added
    const propertyCards = await page.$$('.property-card');
    expect(propertyCards.length).toBeGreaterThan(0);

    // Check that metrics updated
    const metrics = await getPortfolioMetrics(page);
    expect(metrics['Total Properties']).toBe('1');
  });

  test('should calculate financial projections', async ({ page }) => {
    // Create simulation
    await createSimulation(page, {
      targetIncome: 5000,
      initialCapital: 75000
    });

    // Add multiple properties
    await addProperty(page, '48205');
    await page.waitForTimeout(1000);
    
    // Verify projections are displayed
    await expect(page.locator('#projectionsChart')).toBeVisible();
    
    // Check that timeline is visible
    await expect(page.locator('#timelineContainer')).toBeVisible();
    
    // Take screenshot of projections
    await takeScreenshot(page, 'financial-projections');
  });

  test('should handle form validation', async ({ page }) => {
    // Try to create simulation with invalid data
    await fillField(page, '#simulationName', '');
    await fillField(page, '#targetIncome', '-1000');
    await fillField(page, '#initialCapital', '0');
    
    await clickButton(page, 'Start Simulation');
    
    // Should still be on the form (not navigated away)
    await expect(page.locator('#simulationForm')).toBeVisible();
    
    // Fix the values
    await fillField(page, '#simulationName', 'Valid Simulation');
    await fillField(page, '#targetIncome', '5000');
    await fillField(page, '#initialCapital', '50000');
    
    await clickButton(page, 'Start Simulation');
    
    // Should now succeed
    await waitForElement(page, '#phasesList');
  });

  test('should update timeline when properties are added', async ({ page }) => {
    // Create simulation
    await createSimulation(page);
    
    // Check initial timeline
    const initialEvents = await page.$$('.timeline-event');
    const initialCount = initialEvents.length;
    
    // Add a property
    await addProperty(page, '48205');
    
    // Check timeline updated
    await page.waitForTimeout(1000);
    const updatedEvents = await page.$$('.timeline-event');
    expect(updatedEvents.length).toBeGreaterThan(initialCount);
  });

  test('should export simulation data', async ({ page }) => {
    // Create and populate a simulation
    await createSimulation(page, {
      name: 'Export Test Simulation'
    });
    
    await addProperty(page, '48205');
    
    // Click export button
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      clickButton(page, 'Export to CSV')
    ]);
    
    // Verify download started
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to portfolio simulator
    await page.goto('/portfolio-simulator.html');
    
    // Verify responsive design
    await expect(page.locator('#simulationForm')).toBeVisible();
    
    // Create simulation on mobile
    await createSimulation(page, {
      name: 'Mobile Test Simulation'
    });
    
    // Verify it works
    await expect(page.locator('#phasesList')).toBeVisible();
    
    // Take mobile screenshot
    await takeScreenshot(page, 'mobile-portfolio-simulator');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls to simulate errors
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    // Try to create simulation
    await createSimulation(page);
    
    // Should show error message (check for alert or error display)
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('Error');
      dialog.accept();
    });
  });
});

// Performance tests
test.describe('Portfolio Simulator Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/portfolio-simulator.html');
    await waitForElement(page, '#simulationForm');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
  
  test('should handle large portfolios efficiently', async ({ page }) => {
    // Create simulation
    await page.goto('/portfolio-simulator.html');
    await createSimulation(page);
    
    // Add multiple properties (simulate large portfolio)
    const propertyCount = 5;
    for (let i = 0; i < propertyCount; i++) {
      await addProperty(page, '48205');
      await page.waitForTimeout(500); // Brief pause between additions
    }
    
    // Verify all properties added
    const propertyCards = await page.$$('.property-card');
    expect(propertyCards.length).toBe(propertyCount);
    
    // Check that UI is still responsive
    await clickButton(page, 'Save Simulation');
    
    // Take screenshot of large portfolio
    await takeScreenshot(page, 'large-portfolio');
  });
});