const { test, expect } = require('@playwright/test');

test.describe('Complete User Journey', () => {
  test('Full portfolio building workflow', async ({ page }) => {
    // 1. Navigate to portfolio simulator
    await page.goto('/portfolio-simulator.html');
    
    // 2. Start a new simulation
    await page.fill('#simulationName', 'My Real Estate Portfolio');
    await page.fill('#targetIncome', '10000');
    await page.fill('#initialCapital', '100000');
    await page.fill('#timeHorizon', '60'); // 5 years
    await page.selectOption('#strategyType', 'balanced');
    
    await page.click('button:has-text("START SIMULATION")');
    await page.waitForTimeout(2000);
    
    // Verify simulation started
    expect(page.url()).toContain('?id=');
    const title = await page.textContent('#simulationTitle');
    expect(title).toBe('My Real Estate Portfolio');
    
    // 3. Add first property (month 1)
    await page.click('.timeline-add-btn');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Property Acquisition")');
    await page.waitForSelector('#propertyModal.active');
    await page.click('button:has-text("Manual Entry")');
    
    // Fill property details
    await page.fill('#newPropertyAddress', '123 Main Street, Anytown USA');
    await page.fill('#newPurchasePrice', '150000');
    await page.fill('#newMonthlyRent', '1500');
    await page.fill('#newRehabCost', '5000');
    
    // Set financing
    await page.check('input[name="financingType"][value="FINANCED"]');
    await page.fill('#newDownPayment', '25');
    await page.fill('#newInterestRate', '7.5');
    
    // Set operating expenses
    await page.fill('#newPropertyTax', '1800');
    await page.fill('#newInsurance', '120');
    await page.fill('#newManagementPercent', '8');
    await page.fill('#newMaintenancePercent', '5');
    await page.fill('#newVacancyRate', '5');
    
    await page.click('button:has-text("Add to Timeline")');
    await page.waitForTimeout(3000);
    
    // Verify property added
    await expect(page.locator('.timeline-card:has-text("123 Main Street")')).toBeVisible();
    const totalProperties = await page.textContent('.metric-card:has-text("Total Properties") .metric-value');
    expect(totalProperties).toBe('1');
    
    // 4. Add a wait period (month 6)
    await page.click('.timeline-add-btn:last-child');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Wait Period")');
    await page.waitForSelector('#propertyModal.active');
    
    await page.fill('#waitMonths', '6');
    await page.click('button:has-text("Add Wait Period")');
    await page.waitForTimeout(2000);
    
    // 5. Add second property (month 12)
    await page.click('.timeline-add-btn:last-child');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Property Acquisition")');
    await page.waitForSelector('#propertyModal.active');
    await page.click('button:has-text("Manual Entry")');
    
    await page.fill('#newPropertyAddress', '456 Oak Avenue, Somewhere USA');
    await page.fill('#newPurchasePrice', '200000');
    await page.fill('#newMonthlyRent', '2000');
    await page.fill('#newPurchaseMonth', '12');
    
    // Use different financing
    await page.fill('#newDownPayment', '30');
    await page.fill('#newInterestRate', '7.0');
    
    await page.click('button:has-text("Add to Timeline")');
    await page.waitForTimeout(3000);
    
    // 6. Add a snapshot (month 18)
    await page.click('.timeline-add-btn:last-child');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Time Snapshot")');
    await page.waitForTimeout(2000);
    
    // 7. Verify portfolio metrics
    const monthlyIncome = await page.textContent('.metric-card:has-text("Current Monthly Income") .metric-value');
    const incomeValue = parseFloat(monthlyIncome.replace(/[$,]/g, ''));
    expect(incomeValue).toBeGreaterThan(0);
    
    const totalPropertiesFinal = await page.textContent('.metric-card:has-text("Total Properties") .metric-value');
    expect(totalPropertiesFinal).toBe('2');
    
    // 8. Check progress toward goal
    const progressText = await page.textContent('#progressText');
    expect(progressText).toContain('/ $10,000');
    
    // 9. Save progress
    await page.click('button:has-text("SAVE PROGRESS")');
    await page.waitForTimeout(2000);
    
    // 10. Verify timeline has all events
    const timelineCards = await page.locator('.timeline-card').count();
    expect(timelineCards).toBeGreaterThanOrEqual(5); // Initial + 2 properties + wait + snapshot
    
    // 11. Test page refresh persistence
    const urlBeforeRefresh = page.url();
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Should maintain same URL and data
    expect(page.url()).toBe(urlBeforeRefresh);
    const titleAfterRefresh = await page.textContent('#simulationTitle');
    expect(titleAfterRefresh).toBe('My Real Estate Portfolio');
    
    // Timeline should still show all events
    const timelineCardsAfterRefresh = await page.locator('.timeline-card').count();
    expect(timelineCardsAfterRefresh).toBe(timelineCards);
  });

  test('BRRRR strategy workflow', async ({ page }) => {
    // Start simulation
    await page.goto('/portfolio-simulator.html');
    await page.fill('#simulationName', 'BRRRR Strategy Test');
    await page.fill('#targetIncome', '5000');
    await page.fill('#initialCapital', '75000');
    await page.selectOption('#strategyType', 'aggressive');
    
    await page.click('button:has-text("START SIMULATION")');
    await page.waitForTimeout(2000);
    
    // Add BRRRR property
    await page.click('.timeline-add-btn');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Property Acquisition")');
    await page.waitForSelector('#propertyModal.active');
    await page.click('button:has-text("Manual Entry")');
    
    await page.fill('#newPropertyAddress', 'BRRRR Property');
    await page.fill('#newPurchasePrice', '80000');
    await page.fill('#newMonthlyRent', '1200');
    await page.fill('#newRehabCost', '20000');
    
    // Select BRRRR strategy
    await page.selectOption('#strategySelect', 'brrrr');
    
    // BRRRR options should appear
    await expect(page.locator('#refinanceAfter')).toBeVisible();
    await page.fill('#refinanceAfter', '6');
    await page.fill('#refinanceLTV', '75');
    
    await page.click('button:has-text("Add to Timeline")');
    await page.waitForTimeout(3000);
    
    // Should see property and scheduled refinance
    await expect(page.locator('.timeline-card:has-text("BRRRR Property")')).toBeVisible();
    
    // After refinance month, should see refinance event
    const refinanceCard = page.locator('.timeline-card:has-text("Refinance")');
    await expect(refinanceCard).toBeVisible({ timeout: 10000 });
  });

  test('Property sale workflow', async ({ page }) => {
    // Start simulation and add property
    await page.goto('/portfolio-simulator.html');
    await page.fill('#simulationName', 'Sale Test');
    await page.click('button:has-text("START SIMULATION")');
    await page.waitForTimeout(2000);
    
    // Add property to sell later
    await page.click('.timeline-add-btn');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Property Acquisition")');
    await page.waitForSelector('#propertyModal.active');
    await page.click('button:has-text("Manual Entry")');
    
    await page.fill('#newPropertyAddress', 'Property to Sell');
    await page.fill('#newPurchasePrice', '100000');
    await page.fill('#newMonthlyRent', '1000');
    
    await page.click('button:has-text("Add to Timeline")');
    await page.waitForTimeout(3000);
    
    // Add property sale
    await page.click('.timeline-add-btn:last-child');
    await page.waitForSelector('#timelineModal.active');
    await page.click('.timeline-option:has-text("Sell Property")');
    await page.waitForSelector('#propertyModal.active');
    
    // Select property to sell
    await page.selectOption('#sellPropertySelect', 'Property to Sell');
    await page.fill('#salePrice', '125000');
    await page.fill('#saleMonth', '24');
    
    await page.click('button:has-text("Add Sale")');
    await page.waitForTimeout(3000);
    
    // Verify sale appears in timeline
    await expect(page.locator('.timeline-card:has-text("Sale")')).toBeVisible();
    
    // After sale, property count should decrease
    const saleCard = page.locator('.timeline-card.sale-card');
    await expect(saleCard).toBeVisible();
    const saleText = await saleCard.textContent();
    expect(saleText).toContain('$125,000');
  });
});