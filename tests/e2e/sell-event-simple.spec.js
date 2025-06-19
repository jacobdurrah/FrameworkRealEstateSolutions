import { test, expect } from '@playwright/test';

test.describe('Sell Event Field Reset - Core Functionality', () => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  
  test('should reset loan fields when changing Buy to Sell', async ({ page }) => {
    // Navigate to Portfolio Simulator V2
    await page.goto(`${baseURL}/portfolio-simulator-v2.html`);
    await page.waitForLoadState('networkidle');
    
    // Wait for the table to be ready
    await page.waitForSelector('#timelineTable', { timeout: 10000 });
    
    // The page starts with one empty row
    const firstRow = page.locator('#timelineTable tbody tr').first();
    
    // Fill in as a Buy event first
    await firstRow.locator('select').selectOption('buy');
    await firstRow.locator('input[placeholder="Property address"]').fill('123 Test St');
    
    // Set price and down payment
    const priceInput = firstRow.locator('input').nth(2); // Price is 3rd input
    await priceInput.click();
    await priceInput.fill('100000');
    
    const downPercentInput = firstRow.locator('input').nth(3); // Down % is 4th input
    await downPercentInput.click();
    await downPercentInput.fill('20');
    
    // Set rate and term
    const rateInput = firstRow.locator('input').nth(5); // Rate is 6th input
    await rateInput.click();
    await rateInput.fill('7');
    
    const termInput = firstRow.locator('input').nth(6); // Term is 7th input
    await termInput.click();
    await termInput.fill('30');
    
    // Wait for calculations
    await page.waitForTimeout(1000);
    
    // Now change to Sell
    await firstRow.locator('select').selectOption('sell');
    await page.waitForTimeout(1000);
    
    // Verify all loan fields are reset to 0
    const sellDownPercent = await downPercentInput.inputValue();
    const sellRate = await rateInput.inputValue();
    const sellTerm = await termInput.inputValue();
    
    expect(sellDownPercent).toBe('0');
    expect(sellRate).toBe('0');
    expect(sellTerm).toBe('0');
    
    // Verify fields are disabled
    await expect(downPercentInput).toBeDisabled();
    await expect(rateInput).toBeDisabled();
    await expect(termInput).toBeDisabled();
    
    // Verify display fields show $0
    const downAmountText = await firstRow.locator('td').nth(5).textContent();
    const loanAmountText = await firstRow.locator('td').nth(6).textContent();
    const paymentText = await firstRow.locator('td').nth(9).textContent();
    
    expect(downAmountText).toBe('$0');
    expect(loanAmountText).toBe('$0');
    expect(paymentText).toBe('$0');
    
    console.log('✅ All loan fields reset to 0 for Sell event');
    console.log('✅ All loan input fields disabled for Sell event');
  });

  test('should re-enable fields when changing back to Buy', async ({ page }) => {
    await page.goto(`${baseURL}/portfolio-simulator-v2.html`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#timelineTable');
    
    const firstRow = page.locator('#timelineTable tbody tr').first();
    
    // Start with Sell
    await firstRow.locator('select').selectOption('sell');
    await page.waitForTimeout(500);
    
    // Change back to Buy
    await firstRow.locator('select').selectOption('buy');
    await page.waitForTimeout(500);
    
    // Verify fields are enabled
    const downPercentInput = firstRow.locator('input').nth(3);
    const rateInput = firstRow.locator('input').nth(5);
    const termInput = firstRow.locator('input').nth(6);
    
    await expect(downPercentInput).toBeEnabled();
    await expect(rateInput).toBeEnabled();
    await expect(termInput).toBeEnabled();
    
    // Test that we can enter values
    await downPercentInput.click();
    await downPercentInput.fill('25');
    
    const value = await downPercentInput.inputValue();
    expect(value).toBe('25');
    
    console.log('✅ Fields re-enabled when switching back to Buy');
  });

  test('should work with Portfolio Simulator V3 generated strategies', async ({ page }) => {
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    await page.waitForLoadState('networkidle');
    
    // Use the quick example
    await page.click('.example-query >> nth=0');
    await page.click('button:has-text("Generate Strategy")');
    
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    await page.click('.strategy-card >> nth=0');
    
    await page.waitForSelector('#timelineTable tbody tr', { timeout: 10000 });
    
    // Look for any Sell events
    const rows = await page.locator('#timelineTable tbody tr').all();
    let foundSellEvent = false;
    
    for (const row of rows) {
      const actionValue = await row.locator('select').inputValue();
      if (actionValue === 'sell') {
        foundSellEvent = true;
        
        // Check loan fields are 0
        const downPercent = await row.locator('input').nth(3).inputValue();
        const rate = await row.locator('input').nth(5).inputValue();
        const term = await row.locator('input').nth(6).inputValue();
        
        expect(downPercent).toBe('0');
        expect(rate).toBe('0');
        expect(term).toBe('0');
        
        // Check fields are disabled
        await expect(row.locator('input').nth(3)).toBeDisabled();
        await expect(row.locator('input').nth(5)).toBeDisabled();
        await expect(row.locator('input').nth(6)).toBeDisabled();
        
        console.log('✅ V3 Sell event has correct field values and states');
        break;
      }
    }
    
    expect(foundSellEvent).toBe(true);
  });
});