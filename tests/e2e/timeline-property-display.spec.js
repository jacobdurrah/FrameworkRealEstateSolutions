const { test, expect } = require('@playwright/test');

test.describe('Timeline Property Display', () => {
  let simulationId;

  test.beforeEach(async ({ page }) => {
    // Navigate to portfolio simulator
    await page.goto('/portfolio-simulator.html');
    
    // Start a new simulation
    await page.fill('#simulationName', 'Timeline Property Test');
    await page.fill('#targetIncome', '10000');
    await page.fill('#initialCapital', '50000');
    await page.fill('#timeHorizon', '36');
    
    // Click start simulation
    await page.click('button:has-text("START SIMULATION")');
    await page.waitForTimeout(2000);
    
    // Get simulation ID from URL
    const url = page.url();
    const urlParams = new URLSearchParams(url.split('?')[1]);
    simulationId = urlParams.get('id');
    
    console.log('Started simulation with ID:', simulationId);
  });

  test('Properties appear in timeline immediately after adding', async ({ page }) => {
    // Check initial state - should have Month 0 card and add button
    const initialCards = await page.locator('.timeline-card').count();
    console.log('Initial timeline cards:', initialCards);
    expect(initialCards).toBe(1); // Month 0 snapshot
    
    // Click add button
    await page.click('.timeline-add-btn');
    await page.waitForSelector('#timelineModal.active');
    
    // Click property acquisition
    await page.click('.timeline-option:has-text("Property Acquisition")');
    await page.waitForSelector('#propertyModal.active');
    
    // Switch to manual entry
    await page.click('button:has-text("Manual Entry")');
    await page.waitForTimeout(500);
    
    // Fill minimal property details
    await page.fill('#newPropertyAddress', '123 Timeline Test St');
    await page.fill('#newPurchasePrice', '100000');
    await page.fill('#newMonthlyRent', '1000');
    
    // Take screenshot before submitting
    await page.screenshot({ path: 'test-before-submit.png', fullPage: true });
    
    // Submit property
    await page.click('button:has-text("Add to Timeline")');
    
    // Wait for UI to update
    await page.waitForTimeout(3000);
    
    // Take screenshot after submitting
    await page.screenshot({ path: 'test-after-submit.png', fullPage: true });
    
    // Check console logs
    await page.evaluate(() => {
      console.log('Checking timeline after property addition...');
    });
    
    // Verify property card appears in timeline
    const propertyCard = page.locator('.timeline-card:has-text("123 Timeline Test St")');
    await expect(propertyCard).toBeVisible({ timeout: 10000 });
    
    // Verify property card has correct type
    const cardClasses = await propertyCard.getAttribute('class');
    expect(cardClasses).toContain('acquisition-card');
    
    // Verify summary metrics updated
    const totalProperties = await page.textContent('.metric-card:has-text("Total Properties") .metric-value');
    expect(totalProperties).toBe('1');
    
    // Verify monthly income updated
    const monthlyIncome = await page.textContent('.metric-card:has-text("Current Monthly Income") .metric-value');
    expect(monthlyIncome).not.toBe('$0');
  });

  test('Timeline persists with properties after page refresh', async ({ page }) => {
    // Add a property first
    await page.click('.timeline-add-btn');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Property Acquisition")');
    await page.waitForSelector('#propertyModal.active');
    await page.click('button:has-text("Manual Entry")');
    
    await page.fill('#newPropertyAddress', '456 Refresh Test Ave');
    await page.fill('#newPurchasePrice', '150000');
    await page.fill('#newMonthlyRent', '1500');
    
    await page.click('button:has-text("Add to Timeline")');
    await page.waitForTimeout(3000);
    
    // Verify property is in timeline before refresh
    await expect(page.locator('.timeline-card:has-text("456 Refresh Test Ave")')).toBeVisible();
    
    // Get metrics before refresh
    const incomeBeforeRefresh = await page.textContent('.metric-card:has-text("Current Monthly Income") .metric-value');
    
    // Refresh the page
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Verify property still appears in timeline
    const propertyCard = page.locator('.timeline-card:has-text("456 Refresh Test Ave")');
    await expect(propertyCard).toBeVisible({ timeout: 10000 });
    
    // Verify metrics are preserved
    const incomeAfterRefresh = await page.textContent('.metric-card:has-text("Current Monthly Income") .metric-value');
    expect(incomeAfterRefresh).toBe(incomeBeforeRefresh);
  });

  test('Multiple properties display in correct chronological order', async ({ page }) => {
    // Add property in month 3
    await page.click('.timeline-add-btn');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Property Acquisition")');
    await page.waitForSelector('#propertyModal.active');
    await page.click('button:has-text("Manual Entry")');
    
    await page.fill('#newPropertyAddress', 'Month 3 Property');
    await page.fill('#newPurchasePrice', '100000');
    await page.fill('#newMonthlyRent', '1000');
    await page.fill('#newPurchaseMonth', '3');
    
    await page.click('button:has-text("Add to Timeline")');
    await page.waitForTimeout(2000);
    
    // Add property in month 1
    await page.click('.timeline-add-btn:first-of-type');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Property Acquisition")');
    await page.waitForSelector('#propertyModal.active');
    await page.click('button:has-text("Manual Entry")');
    
    await page.fill('#newPropertyAddress', 'Month 1 Property');
    await page.fill('#newPurchasePrice', '80000');
    await page.fill('#newMonthlyRent', '800');
    await page.fill('#newPurchaseMonth', '1');
    
    await page.click('button:has-text("Add to Timeline")');
    await page.waitForTimeout(2000);
    
    // Get all property cards
    const propertyCards = await page.locator('.timeline-card.acquisition-card').all();
    
    // Verify order - Month 1 should come before Month 3
    const firstCardText = await propertyCards[0].textContent();
    const secondCardText = await propertyCards[1].textContent();
    
    expect(firstCardText).toContain('Month 1 Property');
    expect(secondCardText).toContain('Month 3 Property');
    
    // Verify total properties count
    const totalProperties = await page.textContent('.metric-card:has-text("Total Properties") .metric-value');
    expect(totalProperties).toBe('2');
  });

  test('Property details are fully displayed in timeline card', async ({ page }) => {
    // Add a property with full details
    await page.click('.timeline-add-btn');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Property Acquisition")');
    await page.waitForSelector('#propertyModal.active');
    await page.click('button:has-text("Manual Entry")');
    
    await page.fill('#newPropertyAddress', '789 Detailed Display Ln');
    await page.fill('#newPurchasePrice', '200000');
    await page.fill('#newMonthlyRent', '2000');
    await page.fill('#newDownPayment', '25');
    await page.fill('#newInterestRate', '7.0');
    
    await page.click('button:has-text("Add to Timeline")');
    await page.waitForTimeout(3000);
    
    // Verify property card shows all key details
    const propertyCard = page.locator('.timeline-card:has-text("789 Detailed Display Ln")');
    
    // Check for purchase price
    await expect(propertyCard.locator('text=Purchase Price: $200,000')).toBeVisible();
    
    // Check for financing details
    await expect(propertyCard.locator('text=Down Payment: 25%')).toBeVisible();
    
    // Check for cash flow analysis
    await expect(propertyCard.locator('text=Monthly Cash Flow Analysis')).toBeVisible();
    await expect(propertyCard.locator('text=Gross Rent: $2,000')).toBeVisible();
    await expect(propertyCard.locator('text=Net Cash Flow:')).toBeVisible();
  });
});