import { test, expect } from '@playwright/test';

test.describe('Portfolio Simulator V2 - View at Month Functionality', () => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  
  test.beforeEach(async ({ page }) => {
    // Navigate to Portfolio Simulator V2
    await page.goto(`${baseURL}/portfolio-simulator-v2.html`);
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("Portfolio Simulator V2")');
    
    // Handle confirm dialog
    page.on('dialog', dialog => dialog.accept());
    
    // Clear any existing data
    await page.click('button:has-text("New Simulation")');
    
    // Wait for the page to reset
    await page.waitForTimeout(500);
  });

  test('should update financial metrics when changing View at month', async ({ page }) => {
    // Add first property at month 0
    await page.fill('input[value="0"]', '0');
    await page.click('input[value="0"]'); // Blur to trigger update
    await page.fill('input[placeholder="Property address"]', 'Rental 1');
    await page.fill('input[value="0"][min="0"]:not([max])', '65780'); // Price
    await page.fill('input[value="20"][min="0"][max="100"]', '20'); // Down %
    await page.fill('input[value="0"][min="0"]:nth-of-type(1)', '1350'); // Rent
    await page.fill('input[value="0"][min="0"]:nth-of-type(2)', '500'); // Expenses
    
    // Add second property at month 2
    await page.click('button:has-text("Add Event")');
    await page.locator('tr:nth-child(2) input[value="1"]').fill('2');
    await page.locator('tr:nth-child(2) input[placeholder="Property address"]').fill('Rental 2');
    await page.locator('tr:nth-child(2) input[min="0"]:not([max])').first().fill('67640');
    await page.locator('tr:nth-child(2) input[value="0"][min="0"]:nth-of-type(1)').fill('1400');
    await page.locator('tr:nth-child(2) input[value="0"][min="0"]:nth-of-type(2)').fill('550');
    
    // Add third property at month 7
    await page.click('button:has-text("Add Event")');
    await page.locator('tr:nth-child(3) input[value="2"]').fill('7');
    await page.locator('tr:nth-child(3) input[placeholder="Property address"]').fill('Rental 3');
    await page.locator('tr:nth-child(3) input[min="0"]:not([max])').first().fill('56085');
    await page.locator('tr:nth-child(3) input[value="0"][min="0"]:nth-of-type(1)').fill('1250');
    await page.locator('tr:nth-child(3) input[value="0"][min="0"]:nth-of-type(2)').fill('475');
    
    // Test Case 1: View at month 0 (Today) - Only Rental 1 should be active
    await page.fill('#summaryMonth', '0');
    await page.keyboard.press('Tab'); // Trigger blur event
    await page.waitForTimeout(500); // Wait for calculations
    
    let totalProperties = await page.locator('#totalProperties').textContent();
    expect(totalProperties).toBe('1');
    
    let monthlyIncome = await page.locator('#monthlyIncome').textContent();
    expect(monthlyIncome).toBe('$1,350');
    
    // Test Case 2: View at month 2 - Rentals 1 and 2 should be active
    await page.fill('#summaryMonth', '2');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    
    totalProperties = await page.locator('#totalProperties').textContent();
    expect(totalProperties).toBe('2');
    
    monthlyIncome = await page.locator('#monthlyIncome').textContent();
    expect(monthlyIncome).toBe('$2,750'); // 1350 + 1400
    
    // Test Case 3: View at month 7 - All 3 rentals should be active
    await page.fill('#summaryMonth', '7');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    
    totalProperties = await page.locator('#totalProperties').textContent();
    expect(totalProperties).toBe('3');
    
    monthlyIncome = await page.locator('#monthlyIncome').textContent();
    expect(monthlyIncome).toBe('$4,000'); // 1350 + 1400 + 1250
    
    // Test Case 4: View at month 34 - All properties active with appreciation
    await page.fill('#summaryMonth', '34');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    
    totalProperties = await page.locator('#totalProperties').textContent();
    expect(totalProperties).toBe('3');
    
    // Portfolio value should be higher due to appreciation
    const portfolioValue = await page.locator('#portfolioValue').textContent();
    const valueNumber = parseInt(portfolioValue.replace(/[^0-9]/g, ''));
    expect(valueNumber).toBeGreaterThan(189505); // Sum of purchase prices
  });

  test('should show correct cash flow progression over time', async ({ page }) => {
    // Set up a single property
    await page.fill('input[placeholder="Property address"]', 'Test Property');
    await page.fill('input[value="0"][min="0"]:not([max])', '80000'); // Price
    await page.fill('input[value="20"][min="0"][max="100"]', '20'); // Down %
    await page.fill('input[value="0"][min="0"]:nth-of-type(1)', '1500'); // Rent
    await page.fill('input[value="0"][min="0"]:nth-of-type(2)', '300'); // Expenses
    
    // View at month 0
    await page.fill('#summaryMonth', '0');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    
    const netCashFlowMonth0 = await page.locator('#netCashFlow').textContent();
    // Should be positive (rent - expenses - mortgage)
    
    // View at month 12
    await page.fill('#summaryMonth', '12');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    
    const rentalIncomeYear1 = await page.locator('#rentalIncome').textContent();
    // Should show accumulated rental income over 12 months
    const incomeNumber = parseInt(rentalIncomeYear1.replace(/[^0-9]/g, ''));
    expect(incomeNumber).toBeGreaterThan(0);
  });

  test('should handle edge cases correctly', async ({ page }) => {
    // Add property at month 5
    await page.fill('input[value="0"]', '5');
    await page.fill('input[placeholder="Property address"]', 'Future Property');
    await page.fill('input[value="0"][min="0"]:not([max])', '75000');
    
    // View at month 4 - Property should not be included
    await page.fill('#summaryMonth', '4');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    
    const totalProperties = await page.locator('#totalProperties').textContent();
    expect(totalProperties).toBe('0');
    
    // View at month 5 - Property should now be included
    await page.fill('#summaryMonth', '5');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    
    const totalPropertiesAt5 = await page.locator('#totalProperties').textContent();
    expect(totalPropertiesAt5).toBe('1');
  });

  test('should update timeline status indicators', async ({ page }) => {
    // Add property at month 0
    await page.fill('input[placeholder="Property address"]', 'Status Test Property');
    await page.fill('input[value="0"][min="0"]:not([max])', '60000');
    
    // View at month 10
    await page.fill('#summaryMonth', '10');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    
    // Check for timeline status in property breakdown
    const propertyStatus = await page.locator('.timeline-status').first();
    await expect(propertyStatus).toContainText('On timeline as of Month 10');
  });
});

// Quick smoke test
test('Portfolio V2 viewAtMonth controls work', async ({ page }) => {
  await page.goto('https://frameworkrealestatesolutions.com/portfolio-simulator-v2.html');
  
  // Check viewAtMonth input exists
  await expect(page.locator('#summaryMonth')).toBeVisible();
  
  // Check years display updates
  await page.fill('#summaryMonth', '24');
  await page.keyboard.press('Tab');
  
  const yearsText = await page.locator('#summaryYears').textContent();
  expect(yearsText).toContain('2.0 years');
});