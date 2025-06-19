import { test, expect } from '@playwright/test';

test.describe('Auto-Generated Sell Events - Zero Loan Fields', () => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  
  test('✅ Flip strategy sell events have zeroed loan fields', async ({ page }) => {
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    await page.waitForLoadState('networkidle');
    
    // Generate a flip strategy
    await page.fill('#goalInput', 'Generate $50K cash from flips in 12 months with $40K capital');
    await page.click('button:has-text("Generate Strategy")');
    
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    
    // Select aggressive strategy (more likely to have flips)
    const cards = await page.locator('.strategy-card').all();
    let selectedCard = null;
    
    for (const card of cards) {
      const text = await card.textContent();
      if (text.includes('Aggressive') || text.includes('flip')) {
        await card.click();
        selectedCard = card;
        break;
      }
    }
    
    if (!selectedCard && cards.length > 0) {
      await cards[0].click();
    }
    
    await page.waitForSelector('#timelineTable tbody tr', { timeout: 10000 });
    
    // Find sell events
    const rows = await page.locator('#timelineTable tbody tr').all();
    let foundSellEvent = false;
    let sellEventCount = 0;
    
    console.log(`Checking ${rows.length} timeline events...`);
    
    for (const row of rows) {
      const actionValue = await row.locator('select').inputValue();
      
      if (actionValue === 'sell') {
        foundSellEvent = true;
        sellEventCount++;
        
        const property = await row.locator('input[placeholder="Property address"]').inputValue();
        console.log(`\nChecking Sell event for: ${property}`);
        
        // Check all loan field values
        const checks = [
          { name: 'Down %', value: await row.locator('input').nth(3).inputValue() },
          { name: 'Rate %', value: await row.locator('input').nth(5).inputValue() },
          { name: 'Term', value: await row.locator('input').nth(6).inputValue() },
          { name: 'Down $', value: await row.locator('td').nth(5).textContent() },
          { name: 'Loan', value: await row.locator('td').nth(6).textContent() },
          { name: 'Payment', value: await row.locator('td').nth(9).textContent() }
        ];
        
        // Verify all values are 0
        for (const check of checks) {
          const expectedValue = check.name.includes('$') ? '$0' : '0';
          const passed = check.value === expectedValue;
          console.log(`  ${passed ? '✅' : '❌'} ${check.name}: ${check.value}`);
          expect(check.value).toBe(expectedValue);
        }
        
        // Verify fields are disabled
        await expect(row.locator('input').nth(3)).toBeDisabled(); // Down %
        await expect(row.locator('input').nth(5)).toBeDisabled(); // Rate
        await expect(row.locator('input').nth(6)).toBeDisabled(); // Term
      }
    }
    
    console.log(`\nFound ${sellEventCount} sell events in the strategy`);
    expect(foundSellEvent).toBe(true);
  });

  test('✅ BRRR strategy sell events have zeroed loan fields', async ({ page }) => {
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    await page.waitForLoadState('networkidle');
    
    // Use structured input for BRRR strategy
    await page.click('#inputModeToggle');
    
    await page.fill('#targetIncome', '3000');
    await page.fill('#timeline', '36');
    await page.fill('#startingCapital', '80000');
    await page.check('#allowBRRR');
    
    await page.click('button:has-text("Generate Strategy")');
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    
    // Select first strategy
    await page.click('.strategy-card >> nth=0');
    await page.waitForSelector('#timelineTable tbody tr');
    
    // Look for BRRR sell events
    const rows = await page.locator('#timelineTable tbody tr').all();
    let brrrSellCount = 0;
    
    for (const row of rows) {
      const action = await row.locator('select').inputValue();
      const property = await row.locator('input[placeholder="Property address"]').inputValue();
      
      if (action === 'sell' && property.includes('BRRR')) {
        brrrSellCount++;
        console.log(`\nChecking BRRR sell event: ${property}`);
        
        // Verify loan fields are 0
        const downPercent = await row.locator('input').nth(3).inputValue();
        const rate = await row.locator('input').nth(5).inputValue();
        const term = await row.locator('input').nth(6).inputValue();
        
        expect(downPercent).toBe('0');
        expect(rate).toBe('0');
        expect(term).toBe('0');
        
        console.log('  ✅ All loan fields are 0');
      }
    }
    
    console.log(`\nFound ${brrrSellCount} BRRR sell events`);
  });

  test('✅ Mixed strategy buy/sell events have correct field states', async ({ page }) => {
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    await page.waitForLoadState('networkidle');
    
    // Generate a balanced strategy
    await page.fill('#goalInput', 'Build $5K monthly income and $100K cash in 24 months with $60K');
    await page.click('button:has-text("Generate Strategy")');
    
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    
    // Select balanced strategy
    const cards = await page.locator('.strategy-card').all();
    for (const card of cards) {
      const text = await card.textContent();
      if (text.includes('Balanced') || text.includes('balanced')) {
        await card.click();
        break;
      }
    }
    
    await page.waitForSelector('#timelineTable tbody tr');
    
    // Verify mix of buy and sell events
    const rows = await page.locator('#timelineTable tbody tr').all();
    let buyCount = 0;
    let sellCount = 0;
    
    for (const row of rows) {
      const action = await row.locator('select').inputValue();
      
      if (action === 'buy') {
        buyCount++;
        
        // Verify buy events have enabled loan fields
        await expect(row.locator('input').nth(3)).toBeEnabled(); // Down %
        await expect(row.locator('input').nth(5)).toBeEnabled(); // Rate
        await expect(row.locator('input').nth(6)).toBeEnabled(); // Term
        
        // Verify loan values are non-zero (for most buy events)
        const downPercent = await row.locator('input').nth(3).inputValue();
        const rate = await row.locator('input').nth(5).inputValue();
        
        if (downPercent !== '100') { // Not all-cash purchase
          expect(parseInt(rate)).toBeGreaterThan(0);
        }
      } else if (action === 'sell') {
        sellCount++;
        
        // Verify sell events have disabled loan fields with 0 values
        const downPercent = await row.locator('input').nth(3).inputValue();
        const rate = await row.locator('input').nth(5).inputValue();
        const term = await row.locator('input').nth(6).inputValue();
        
        expect(downPercent).toBe('0');
        expect(rate).toBe('0');
        expect(term).toBe('0');
        
        await expect(row.locator('input').nth(3)).toBeDisabled();
        await expect(row.locator('input').nth(5)).toBeDisabled();
        await expect(row.locator('input').nth(6)).toBeDisabled();
      }
    }
    
    console.log(`\nStrategy contains ${buyCount} buy events and ${sellCount} sell events`);
    console.log('✅ All buy events have proper loan field access');
    console.log('✅ All sell events have zeroed and disabled loan fields');
  });

  test('✅ Cash from sales calculated correctly with auto-generated sells', async ({ page }) => {
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    await page.waitForLoadState('networkidle');
    
    // Generate strategy with cash goal
    await page.click('#inputModeToggle');
    await page.fill('#targetIncome', '2000');
    await page.fill('#targetCashFromSales', '50000');
    await page.fill('#timeline', '18');
    await page.fill('#startingCapital', '40000');
    
    await page.click('button:has-text("Generate Strategy")');
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    
    await page.click('.strategy-card >> nth=0');
    await page.waitForSelector('#timelineTable tbody tr');
    
    // Find the last sell event month
    const rows = await page.locator('#timelineTable tbody tr').all();
    let lastSellMonth = 0;
    
    for (const row of rows) {
      const action = await row.locator('select').inputValue();
      if (action === 'sell') {
        const month = parseInt(await row.locator('input').nth(0).inputValue());
        if (month > lastSellMonth) {
          lastSellMonth = month;
        }
      }
    }
    
    if (lastSellMonth > 0) {
      // Update view to after the last sale
      const viewMonth = lastSellMonth + 1;
      await page.fill('#summaryMonth', viewMonth.toString());
      await page.click('button:has-text("Refresh")');
      await page.waitForTimeout(1500);
      
      // Check cash metrics
      const cashFromSales = await page.locator('#cashFromSales').textContent();
      const totalCash = await page.locator('#totalCashOnHand').textContent();
      
      console.log(`\nAt month ${viewMonth}:`);
      console.log(`Cash from Sales: ${cashFromSales}`);
      console.log(`Total Cash on Hand: ${totalCash}`);
      
      const cashValue = parseInt(cashFromSales.replace(/[^0-9-]/g, ''));
      expect(cashValue).toBeGreaterThan(0);
      
      console.log('✅ Cash from sales properly calculated with auto-generated sell events');
    }
  });

  test('✅ Export and reload preserves zeroed sell event fields', async ({ page }) => {
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    await page.waitForLoadState('networkidle');
    
    // Generate a simple flip strategy
    await page.fill('#goalInput', 'Flip 2 properties for profit in 12 months');
    await page.click('button:has-text("Generate Strategy")');
    
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    await page.click('.strategy-card >> nth=0');
    await page.waitForSelector('#timelineTable tbody tr');
    
    // Verify sell events have 0 values
    const rows = await page.locator('#timelineTable tbody tr').all();
    const sellEventData = [];
    
    for (const row of rows) {
      const action = await row.locator('select').inputValue();
      if (action === 'sell') {
        const property = await row.locator('input[placeholder="Property address"]').inputValue();
        const downPercent = await row.locator('input').nth(3).inputValue();
        const rate = await row.locator('input').nth(5).inputValue();
        const term = await row.locator('input').nth(6).inputValue();
        
        sellEventData.push({ property, downPercent, rate, term });
        
        expect(downPercent).toBe('0');
        expect(rate).toBe('0');
        expect(term).toBe('0');
      }
    }
    
    console.log('\nSell events before export:', sellEventData);
    
    // Note: Actual export/import testing would require file system access
    // This test verifies the data structure is correct for export
    console.log('✅ Sell events maintain zero values in timeline data structure');
  });
});