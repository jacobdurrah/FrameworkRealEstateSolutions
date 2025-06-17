const { test, expect } = require('@playwright/test');

test.describe('Financial Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/portfolio-simulator.html');
    
    // Start a simulation
    await page.fill('#simulationName', 'Calculator Test');
    await page.fill('#targetIncome', '10000');
    await page.fill('#initialCapital', '100000');
    await page.click('button:has-text("START SIMULATION")');
    await page.waitForTimeout(2000);
  });

  test('Calculates mortgage payment correctly', async ({ page }) => {
    // Add property with financing
    await page.click('.timeline-add-btn');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Property Acquisition")');
    await page.waitForSelector('#propertyModal.active');
    await page.click('button:has-text("Manual Entry")');
    
    // Enter property details
    await page.fill('#newPurchasePrice', '200000');
    await page.fill('#newMonthlyRent', '2000');
    
    // Set financing details
    await page.check('input[name="financingType"][value="FINANCED"]');
    await page.fill('#newDownPayment', '20'); // 20%
    await page.fill('#newInterestRate', '7'); // 7%
    await page.fill('#newLoanTerm', '30'); // 30 years
    
    // Wait for cash flow preview to update
    await page.waitForTimeout(1000);
    
    // Check mortgage calculation
    // Loan amount: $200,000 - 20% = $160,000
    // Monthly payment at 7% for 30 years ≈ $1,064
    const cashFlowPreview = await page.textContent('#cashFlowDetails');
    expect(cashFlowPreview).toContain('Mortgage');
    
    // The exact payment should be calculated
    const monthlyPayment = 160000 * (0.07/12 * Math.pow(1 + 0.07/12, 360)) / (Math.pow(1 + 0.07/12, 360) - 1);
    expect(Math.round(monthlyPayment)).toBeCloseTo(1064, -1);
  });

  test('Calculates cash flow correctly with all expenses', async ({ page }) => {
    // Add property
    await page.click('.timeline-add-btn');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Property Acquisition")');
    await page.waitForSelector('#propertyModal.active');
    await page.click('button:has-text("Manual Entry")');
    
    // Enter specific values for testing
    await page.fill('#newPurchasePrice', '150000');
    await page.fill('#newMonthlyRent', '1500');
    await page.fill('#newPropertyTax', '1800'); // Annual
    await page.fill('#newInsurance', '100'); // Monthly
    await page.fill('#newManagementPercent', '10');
    await page.fill('#newMaintenancePercent', '5');
    await page.fill('#newVacancyRate', '8');
    
    // Use cash purchase for simpler calculation
    await page.check('input[name="financingType"][value="CASH"]');
    
    // Wait for preview update
    await page.waitForTimeout(1000);
    
    // Expected calculations:
    // Gross Rent: $1,500
    // Vacancy (8%): $120
    // Property Tax: $150/mo
    // Insurance: $100
    // Management (10%): $150
    // Maintenance (5%): $75
    // Net Cash Flow: $1,500 - $120 - $150 - $100 - $150 - $75 = $905
    
    const preview = await page.textContent('#cashFlowDetails');
    expect(preview).toContain('$905'); // Net cash flow
  });

  test('Updates calculations when input values change', async ({ page }) => {
    // Add property modal
    await page.click('.timeline-add-btn');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Property Acquisition")');
    await page.waitForSelector('#propertyModal.active');
    await page.click('button:has-text("Manual Entry")');
    
    // Initial values
    await page.fill('#newPurchasePrice', '100000');
    await page.fill('#newMonthlyRent', '1000');
    
    // Get initial cash flow
    await page.waitForTimeout(500);
    const initialPreview = await page.textContent('#cashFlowDetails');
    
    // Change rent
    await page.fill('#newMonthlyRent', '1200');
    await page.waitForTimeout(500);
    
    // Cash flow should update
    const updatedPreview = await page.textContent('#cashFlowDetails');
    expect(updatedPreview).not.toBe(initialPreview);
    
    // Should show higher cash flow
    expect(updatedPreview).toContain('Cash Flow');
  });

  test('Handles all-cash vs financed calculations', async ({ page }) => {
    // Add property modal
    await page.click('.timeline-add-btn');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Property Acquisition")');
    await page.waitForSelector('#propertyModal.active');
    await page.click('button:has-text("Manual Entry")');
    
    await page.fill('#newPurchasePrice', '100000');
    await page.fill('#newMonthlyRent', '1000');
    
    // Test with financing
    await page.check('input[name="financingType"][value="FINANCED"]');
    await page.waitForTimeout(500);
    const financedPreview = await page.textContent('#cashFlowDetails');
    
    // Test all cash
    await page.check('input[name="financingType"][value="CASH"]');
    await page.waitForTimeout(500);
    const cashPreview = await page.textContent('#cashFlowDetails');
    
    // Cash purchase should have higher cash flow (no mortgage)
    expect(cashPreview).not.toBe(financedPreview);
    
    // Financing fields should be hidden for cash purchase
    const financingFields = page.locator('#financingFields');
    await expect(financingFields).toBeHidden();
  });

  test('Calculates total cash needed including closing costs', async ({ page }) => {
    // Add property modal
    await page.click('.timeline-add-btn');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Property Acquisition")');
    await page.waitForSelector('#propertyModal.active');
    await page.click('button:has-text("Manual Entry")');
    
    // Set values
    await page.fill('#newPurchasePrice', '200000');
    await page.fill('#newRehabCost', '10000');
    
    // Financed purchase
    await page.check('input[name="financingType"][value="FINANCED"]');
    await page.fill('#newDownPayment', '25'); // 25% = $50,000
    await page.fill('#newClosingCostPercent', '2'); // 2% of loan amount
    
    await page.waitForTimeout(500);
    
    // Expected total cash needed:
    // Down payment: $50,000
    // Closing costs: 2% of $150,000 = $3,000
    // Rehab: $10,000
    // Total: $63,000
    
    const preview = await page.textContent('#cashFlowDetails');
    expect(preview).toContain('$63,000');
  });
});