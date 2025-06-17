const { test, expect } = require('@playwright/test');

test.describe('Property Card Display', () => {
  let simulationId;

  test.beforeEach(async ({ page }) => {
    // Navigate to portfolio simulator
    await page.goto('/portfolio-simulator.html');
    
    // Start a new simulation
    await page.fill('#simulationName', 'Property Card Test');
    await page.fill('#targetIncome', '10000');
    await page.fill('#initialCapital', '100000');
    await page.fill('#timeHorizon', '36');
    
    // Click start simulation
    await page.click('button:has-text("START SIMULATION")');
    await page.waitForTimeout(2000);
    
    // Get simulation ID from URL
    const url = page.url();
    const urlParams = new URLSearchParams(url.split('?')[1]);
    simulationId = urlParams.get('id');
  });

  test('Property card shows detailed financing information', async ({ page }) => {
    // Click add button
    await page.click('.timeline-add-btn');
    await page.waitForSelector('#timelineModal.active');
    
    // Click property acquisition
    await page.click('.timeline-option:has-text("Property Acquisition")');
    await page.waitForSelector('#propertyModal.active');
    
    // Switch to manual entry
    await page.click('button:has-text("Manual Entry")');
    await page.waitForTimeout(500);
    
    // Fill property details
    await page.fill('#newPropertyAddress', '123 Detailed Test St');
    await page.fill('#newPurchasePrice', '200000');
    await page.fill('#newMonthlyRent', '2000');
    await page.fill('#newRehabCost', '5000');
    
    // Set financing details
    await page.check('input[name="financingType"][value="FINANCED"]');
    await page.fill('#newDownPayment', '25');
    await page.fill('#newInterestRate', '7.5');
    await page.fill('#newLoanTerm', '30');
    
    // Set operating expenses
    await page.fill('#newPropertyTax', '2400'); // Annual
    await page.fill('#newInsurance', '150');
    await page.fill('#newManagementPercent', '10');
    await page.fill('#newMaintenancePercent', '5');
    await page.fill('#newVacancyRate', '5');
    
    // Wait for cash flow preview to update
    await page.waitForTimeout(500);
    
    // Verify down payment amount is shown
    const downPaymentAmount = await page.textContent('#downPaymentAmount');
    expect(downPaymentAmount).toBe('$50,000');
    
    // Submit property
    await page.click('button:has-text("Add to Timeline")');
    await page.waitForTimeout(2000);
    
    // Verify property card displays correctly
    const propertyCard = await page.locator('.timeline-card:has-text("123 Detailed Test St")');
    await expect(propertyCard).toBeVisible();
    
    // Check financing details are shown
    await expect(propertyCard.locator('text=Down Payment: 25%')).toBeVisible();
    await expect(propertyCard.locator('text=$50,000')).toBeVisible();
    await expect(propertyCard.locator('text=Loan Amount:')).toBeVisible();
    await expect(propertyCard.locator('text=$150,000')).toBeVisible();
    await expect(propertyCard.locator('text=Interest Rate: 7.5%')).toBeVisible();
    
    // Check monthly cash flow breakdown
    await expect(propertyCard.locator('text=Monthly Cash Flow Analysis')).toBeVisible();
    await expect(propertyCard.locator('text=Gross Rent: $2,000')).toBeVisible();
    await expect(propertyCard.locator('text=- Vacancy (5%):')).toBeVisible();
    await expect(propertyCard.locator('text=- Property Tax:')).toBeVisible();
    await expect(propertyCard.locator('text=- Insurance:')).toBeVisible();
    await expect(propertyCard.locator('text=- Management (10%):')).toBeVisible();
    await expect(propertyCard.locator('text=- Maintenance (5%):')).toBeVisible();
    await expect(propertyCard.locator('text=- Debt Service:')).toBeVisible();
    await expect(propertyCard.locator('text=Net Cash Flow:')).toBeVisible();
  });

  test('Cash purchase shows correctly without debt service', async ({ page }) => {
    // Click add button
    await page.click('.timeline-add-btn');
    await page.waitForSelector('#timelineModal.active');
    
    // Click property acquisition
    await page.click('.timeline-option:has-text("Property Acquisition")');
    await page.waitForSelector('#propertyModal.active');
    
    // Switch to manual entry
    await page.click('button:has-text("Manual Entry")');
    await page.waitForTimeout(500);
    
    // Fill property details
    await page.fill('#newPropertyAddress', '456 Cash Purchase Ave');
    await page.fill('#newPurchasePrice', '150000');
    await page.fill('#newMonthlyRent', '1500');
    
    // Select all cash
    await page.check('input[name="financingType"][value="CASH"]');
    await page.waitForTimeout(500);
    
    // Submit property
    await page.click('button:has-text("Add to Timeline")');
    await page.waitForTimeout(2000);
    
    // Verify property card displays correctly
    const propertyCard = await page.locator('.timeline-card:has-text("456 Cash Purchase Ave")');
    await expect(propertyCard).toBeVisible();
    
    // Check shows "All Cash" and no debt service
    await expect(propertyCard.locator('text=Financing: All Cash')).toBeVisible();
    await expect(propertyCard.locator('text=- Debt Service:')).not.toBeVisible();
  });

  test('Timeline persists with detailed property cards on refresh', async ({ page }) => {
    // Add a property first
    await page.click('.timeline-add-btn');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Property Acquisition")');
    await page.waitForSelector('#propertyModal.active');
    await page.click('button:has-text("Manual Entry")');
    
    await page.fill('#newPropertyAddress', '789 Persistence Test Ln');
    await page.fill('#newPurchasePrice', '175000');
    await page.fill('#newMonthlyRent', '1750');
    await page.fill('#newDownPayment', '30');
    
    await page.click('button:has-text("Add to Timeline")');
    await page.waitForTimeout(2000);
    
    // Refresh page
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Verify property card still shows with details
    const propertyCard = await page.locator('.timeline-card:has-text("789 Persistence Test Ln")');
    await expect(propertyCard).toBeVisible();
    await expect(propertyCard.locator('text=Down Payment: 30%')).toBeVisible();
    await expect(propertyCard.locator('text=Monthly Cash Flow Analysis')).toBeVisible();
  });
});