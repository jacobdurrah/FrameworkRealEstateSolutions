import { test, expect } from '@playwright/test';

test.describe('Sell Event Field Behavior', () => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  
  test.beforeEach(async ({ page }) => {
    // Navigate to Portfolio Simulator V2
    await page.goto(`${baseURL}/portfolio-simulator-v2.html`);
    await page.waitForLoadState('networkidle');
  });

  test('should reset and disable loan fields when changing to Sell action', async ({ page }) => {
    // Add a Buy event first
    await page.click('button:has-text("Add Event")');
    await page.waitForTimeout(500);
    
    // Fill in Buy event details
    const firstRow = page.locator('#timelineTable tbody tr').first();
    
    // Set as Buy with loan details
    await firstRow.locator('select').selectOption('buy');
    await firstRow.locator('input[placeholder="Property address"]').fill('123 Test St');
    await firstRow.locator('input').nth(2).fill('100000'); // Price
    await firstRow.locator('input').nth(3).fill('20'); // Down %
    await firstRow.locator('input').nth(5).fill('7'); // Rate
    await firstRow.locator('input').nth(6).fill('30'); // Term
    
    await page.waitForTimeout(1000);
    
    // Verify loan fields are populated
    const downAmount = await firstRow.locator('td').nth(5).textContent();
    const loanAmount = await firstRow.locator('td').nth(6).textContent();
    const payment = await firstRow.locator('td').nth(9).textContent();
    
    expect(downAmount).toBe('$20,000');
    expect(loanAmount).toBe('$80,000');
    expect(parseInt(payment.replace(/[^0-9]/g, ''))).toBeGreaterThan(0);
    
    // Change to Sell action
    await firstRow.locator('select').selectOption('sell');
    await page.waitForTimeout(1000);
    
    // Verify all loan fields are reset to 0
    const sellDownPercent = await firstRow.locator('input').nth(3).inputValue();
    const sellDownAmount = await firstRow.locator('td').nth(5).textContent();
    const sellLoanAmount = await firstRow.locator('td').nth(6).textContent();
    const sellRate = await firstRow.locator('input').nth(5).inputValue();
    const sellTerm = await firstRow.locator('input').nth(6).inputValue();
    const sellPayment = await firstRow.locator('td').nth(9).textContent();
    
    expect(sellDownPercent).toBe('0');
    expect(sellDownAmount).toBe('$0');
    expect(sellLoanAmount).toBe('$0');
    expect(sellRate).toBe('0');
    expect(sellTerm).toBe('0');
    expect(sellPayment).toBe('$0');
    
    // Verify fields are disabled
    await expect(firstRow.locator('input').nth(3)).toBeDisabled(); // Down %
    await expect(firstRow.locator('input').nth(5)).toBeDisabled(); // Rate
    await expect(firstRow.locator('input').nth(6)).toBeDisabled(); // Term
    await expect(firstRow.locator('input').nth(10)).toBeDisabled(); // Rent
    await expect(firstRow.locator('input').nth(11)).toBeDisabled(); // Monthly Expenses
  });

  test('should restore editable fields when changing back to Buy', async ({ page }) => {
    // Add a row and set to Sell
    await page.click('button:has-text("Add Event")');
    const firstRow = page.locator('#timelineTable tbody tr').first();
    
    await firstRow.locator('select').selectOption('sell');
    await page.waitForTimeout(500);
    
    // Verify fields are disabled
    await expect(firstRow.locator('input').nth(3)).toBeDisabled(); // Down %
    
    // Change back to Buy
    await firstRow.locator('select').selectOption('buy');
    await page.waitForTimeout(500);
    
    // Verify fields are enabled again
    await expect(firstRow.locator('input').nth(3)).toBeEnabled(); // Down %
    await expect(firstRow.locator('input').nth(5)).toBeEnabled(); // Rate
    await expect(firstRow.locator('input').nth(6)).toBeEnabled(); // Term
    await expect(firstRow.locator('input').nth(10)).toBeEnabled(); // Rent
    await expect(firstRow.locator('input').nth(11)).toBeEnabled(); // Monthly Expenses
  });

  test('should properly calculate Cash from Sales for sell events', async ({ page }) => {
    // Add a Buy event
    await page.click('button:has-text("Add Event")');
    const buyRow = page.locator('#timelineTable tbody tr').first();
    
    await buyRow.locator('input[placeholder="Property address"]').fill('456 Sale Property');
    await buyRow.locator('input').nth(2).fill('150000'); // Buy price
    await buyRow.locator('input').nth(3).fill('25'); // 25% down
    
    // Add a Sell event for the same property
    await page.click('button:has-text("Add Event")');
    const sellRow = page.locator('#timelineTable tbody tr').nth(1);
    
    await sellRow.locator('select').selectOption('sell');
    await sellRow.locator('input').nth(0).fill('6'); // Month 6
    await sellRow.locator('input[placeholder="Property address"]').fill('456 Sale Property');
    await sellRow.locator('input').nth(2).fill('180000'); // Sell price
    
    // Update view month to after the sale
    await page.fill('#summaryMonth', '7');
    await page.click('button:has-text("Refresh")');
    await page.waitForTimeout(1000);
    
    // Check Cash from Sales
    const cashFromSales = await page.locator('#cashFromSales').textContent();
    expect(cashFromSales).not.toBe('$0');
    
    // The cash from sale should be sell price minus remaining loan
    // Loan was 150000 * 0.75 = 112500
    // Expected cash ~= 180000 - 112500 = 67500 (minus some principal payments)
    const cashValue = parseInt(cashFromSales.replace(/[^0-9]/g, ''));
    expect(cashValue).toBeGreaterThan(60000);
    expect(cashValue).toBeLessThan(70000);
  });

  test('should work correctly with Portfolio Simulator V3', async ({ page }) => {
    // Navigate to V3
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    await page.waitForLoadState('networkidle');
    
    // Generate a strategy
    await page.fill('#goalInput', 'Buy and flip a property for $50K profit in 6 months');
    await page.click('button:has-text("Generate Strategy")');
    
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    await page.click('.strategy-card >> nth=0');
    
    await page.waitForSelector('#timelineTable tbody tr');
    
    // Find a sell event
    const sellRows = await page.locator('#timelineTable tbody tr').filter({ 
      has: page.locator('select option:has-text("Sell")[selected]') 
    }).all();
    
    if (sellRows.length > 0) {
      const sellRow = sellRows[0];
      
      // Verify loan fields are 0 and disabled
      const downPercent = await sellRow.locator('input').nth(3).inputValue();
      const rate = await sellRow.locator('input').nth(5).inputValue();
      const term = await sellRow.locator('input').nth(6).inputValue();
      
      expect(downPercent).toBe('0');
      expect(rate).toBe('0');
      expect(term).toBe('0');
      
      await expect(sellRow.locator('input').nth(3)).toBeDisabled();
      await expect(sellRow.locator('input').nth(5)).toBeDisabled();
      await expect(sellRow.locator('input').nth(6)).toBeDisabled();
    }
  });

  test('should handle multiple buy/sell pairs correctly', async ({ page }) => {
    // Add first buy
    await page.click('button:has-text("Add Event")');
    const buy1 = page.locator('#timelineTable tbody tr').nth(0);
    await buy1.locator('input[placeholder="Property address"]').fill('Property 1');
    await buy1.locator('input').nth(2).fill('100000');
    
    // Add first sell
    await page.click('button:has-text("Add Event")');
    const sell1 = page.locator('#timelineTable tbody tr').nth(1);
    await sell1.locator('select').selectOption('sell');
    await sell1.locator('input').nth(0).fill('6');
    await sell1.locator('input[placeholder="Property address"]').fill('Property 1');
    await sell1.locator('input').nth(2).fill('120000');
    
    // Add second buy
    await page.click('button:has-text("Add Event")');
    const buy2 = page.locator('#timelineTable tbody tr').nth(2);
    await buy2.locator('input').nth(0).fill('7');
    await buy2.locator('input[placeholder="Property address"]').fill('Property 2');
    await buy2.locator('input').nth(2).fill('80000');
    await buy2.locator('input').nth(3).fill('30'); // 30% down
    
    // Verify second buy has proper loan fields
    await page.waitForTimeout(500);
    const buy2DownPercent = await buy2.locator('input').nth(3).inputValue();
    expect(buy2DownPercent).toBe('30');
    
    // Verify sell still has 0 values
    const sellDownPercent = await sell1.locator('input').nth(3).inputValue();
    expect(sellDownPercent).toBe('0');
  });
});