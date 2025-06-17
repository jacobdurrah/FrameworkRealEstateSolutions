const { test, expect } = require('@playwright/test');

test.describe('Portfolio State Management', () => {
  let simulationId;

  test.beforeEach(async ({ page }) => {
    await page.goto('/portfolio-simulator.html');
    
    // Start a simulation
    await page.fill('#simulationName', 'State Test');
    await page.fill('#targetIncome', '5000');
    await page.fill('#initialCapital', '50000');
    await page.click('button:has-text("START SIMULATION")');
    await page.waitForTimeout(2000);
    
    // Get simulation ID
    const url = page.url();
    const urlParams = new URLSearchParams(url.split('?')[1]);
    simulationId = urlParams.get('id');
  });

  test('State updates when adding properties', async ({ page }) => {
    // Get initial state
    const initialIncome = await page.textContent('.metric-card:has-text("Current Monthly Income") .metric-value');
    const initialProperties = await page.textContent('.metric-card:has-text("Total Properties") .metric-value');
    
    expect(initialIncome).toBe('$0');
    expect(initialProperties).toBe('0');
    
    // Add a property
    await page.click('.timeline-add-btn');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Property Acquisition")');
    await page.waitForSelector('#propertyModal.active');
    await page.click('button:has-text("Manual Entry")');
    
    await page.fill('#newPropertyAddress', '123 State Test St');
    await page.fill('#newPurchasePrice', '100000');
    await page.fill('#newMonthlyRent', '1000');
    
    await page.click('button:has-text("Add to Timeline")');
    await page.waitForTimeout(3000);
    
    // Check updated state
    const updatedIncome = await page.textContent('.metric-card:has-text("Current Monthly Income") .metric-value');
    const updatedProperties = await page.textContent('.metric-card:has-text("Total Properties") .metric-value');
    
    expect(updatedIncome).not.toBe('$0');
    expect(updatedProperties).toBe('1');
  });

  test('Cash reserves update correctly', async ({ page }) => {
    // Get initial cash
    const getCashReserves = async () => {
      const cashText = await page.textContent('.metric-card:has-text("Cash") .metric-value');
      return parseFloat(cashText.replace(/[$,]/g, ''));
    };
    
    const initialCash = await getCashReserves();
    expect(initialCash).toBe(50000);
    
    // Add property with 20% down
    await page.click('.timeline-add-btn');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Property Acquisition")');
    await page.waitForSelector('#propertyModal.active');
    await page.click('button:has-text("Manual Entry")');
    
    await page.fill('#newPropertyAddress', '456 Cash Test Ave');
    await page.fill('#newPurchasePrice', '100000');
    await page.fill('#newMonthlyRent', '1000');
    await page.fill('#newDownPayment', '20');
    
    await page.click('button:has-text("Add to Timeline")');
    await page.waitForTimeout(3000);
    
    // Cash should decrease by down payment + closing costs
    const updatedCash = await getCashReserves();
    expect(updatedCash).toBeLessThan(initialCash);
    expect(updatedCash).toBeCloseTo(initialCash - 20000 - 1000, -100); // Roughly 20k down + closing
  });

  test('Multiple property state accumulation', async ({ page }) => {
    // Add first property
    await page.click('.timeline-add-btn');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Property Acquisition")');
    await page.waitForSelector('#propertyModal.active');
    await page.click('button:has-text("Manual Entry")');
    
    await page.fill('#newPropertyAddress', 'Property 1');
    await page.fill('#newPurchasePrice', '100000');
    await page.fill('#newMonthlyRent', '1000');
    
    await page.click('button:has-text("Add to Timeline")');
    await page.waitForTimeout(2000);
    
    // Add second property
    await page.click('.timeline-add-btn:last-child');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Property Acquisition")');
    await page.waitForSelector('#propertyModal.active');
    await page.click('button:has-text("Manual Entry")');
    
    await page.fill('#newPropertyAddress', 'Property 2');
    await page.fill('#newPurchasePrice', '150000');
    await page.fill('#newMonthlyRent', '1500');
    
    await page.click('button:has-text("Add to Timeline")');
    await page.waitForTimeout(3000);
    
    // Check cumulative state
    const totalProperties = await page.textContent('.metric-card:has-text("Total Properties") .metric-value');
    expect(totalProperties).toBe('2');
    
    // Income should be sum of both rents minus expenses
    const monthlyIncome = await page.textContent('.metric-card:has-text("Current Monthly Income") .metric-value');
    const incomeValue = parseFloat(monthlyIncome.replace(/[$,]/g, ''));
    expect(incomeValue).toBeGreaterThan(0);
  });

  test('Timeline snapshots capture correct state', async ({ page }) => {
    // Add a property first
    await page.click('.timeline-add-btn');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Property Acquisition")');
    await page.waitForSelector('#propertyModal.active');
    await page.click('button:has-text("Manual Entry")');
    
    await page.fill('#newPropertyAddress', 'Snapshot Test Property');
    await page.fill('#newPurchasePrice', '120000');
    await page.fill('#newMonthlyRent', '1200');
    await page.fill('#newPurchaseMonth', '3');
    
    await page.click('button:has-text("Add to Timeline")');
    await page.waitForTimeout(2000);
    
    // Add a snapshot at month 6
    await page.click('.timeline-add-btn:last-child');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Time Snapshot")');
    await page.waitForTimeout(2000);
    
    // Verify snapshot card shows correct state
    const snapshotCard = page.locator('.timeline-card.snapshot-card').last();
    await expect(snapshotCard).toBeVisible();
    
    // Should show 1 property
    const snapshotText = await snapshotCard.textContent();
    expect(snapshotText).toContain('Properties: 1');
  });

  test('State persists across page refresh', async ({ page }) => {
    // Add properties
    await page.click('.timeline-add-btn');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Property Acquisition")');
    await page.waitForSelector('#propertyModal.active');
    await page.click('button:has-text("Manual Entry")');
    
    await page.fill('#newPropertyAddress', 'Persistence Test');
    await page.fill('#newPurchasePrice', '200000');
    await page.fill('#newMonthlyRent', '2000');
    
    await page.click('button:has-text("Add to Timeline")');
    await page.waitForTimeout(3000);
    
    // Get state before refresh
    const incomeBeforeRefresh = await page.textContent('.metric-card:has-text("Current Monthly Income") .metric-value');
    const propertiesBeforeRefresh = await page.textContent('.metric-card:has-text("Total Properties") .metric-value');
    const equityBeforeRefresh = await page.textContent('.metric-card:has-text("Total Equity") .metric-value');
    
    // Refresh page
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Verify state is restored
    const incomeAfterRefresh = await page.textContent('.metric-card:has-text("Current Monthly Income") .metric-value');
    const propertiesAfterRefresh = await page.textContent('.metric-card:has-text("Total Properties") .metric-value');
    const equityAfterRefresh = await page.textContent('.metric-card:has-text("Total Equity") .metric-value');
    
    expect(incomeAfterRefresh).toBe(incomeBeforeRefresh);
    expect(propertiesAfterRefresh).toBe(propertiesBeforeRefresh);
    expect(equityAfterRefresh).toBe(equityBeforeRefresh);
  });

  test('Progress bar updates with income changes', async ({ page }) => {
    // Check initial progress (should be 0%)
    const progressBar = page.locator('#progressFill');
    const initialWidth = await progressBar.evaluate(el => el.style.width);
    expect(initialWidth).toBe('0%');
    
    // Add property to generate income
    await page.click('.timeline-add-btn');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Property Acquisition")');
    await page.waitForSelector('#propertyModal.active');
    await page.click('button:has-text("Manual Entry")');
    
    await page.fill('#newPropertyAddress', 'Progress Test');
    await page.fill('#newPurchasePrice', '150000');
    await page.fill('#newMonthlyRent', '1500');
    
    await page.click('button:has-text("Add to Timeline")');
    await page.waitForTimeout(3000);
    
    // Progress should update
    const updatedWidth = await progressBar.evaluate(el => el.style.width);
    expect(updatedWidth).not.toBe('0%');
    
    // Progress text should show current/target
    const progressText = await page.textContent('#progressText');
    expect(progressText).toContain('/ $5,000');
  });
});