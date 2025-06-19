import { test, expect } from '@playwright/test';

test.describe('Sale Event Property Name Sync', () => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  
  test.beforeEach(async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        console.log(`Browser: ${msg.text()}`);
      }
    });
    
    // Navigate to Portfolio Simulator V3
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('h1:has-text("Portfolio Simulator V3")');
  });

  test('should sync sale event property names with real listings', async ({ page }) => {
    // Step 1: Generate a strategy with flips
    await page.click('#inputModeToggle'); // Structured input
    
    // Set up for aggressive strategy with flips
    await page.fill('#targetIncome', '2000');
    await page.fill('#targetCashFromSales', '100000');
    await page.fill('#timeline', '24');
    await page.fill('#startingCapital', '50000');
    await page.selectOption('#strategyPreference', 'aggressive');
    
    // Generate strategy
    await page.click('button:has-text("Generate Strategy")');
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    
    // Select aggressive strategy (should have flips)
    const strategyCards = await page.locator('.strategy-card').all();
    for (const card of strategyCards) {
      const text = await card.textContent();
      if (text.includes('Aggressive') || text.includes('flip')) {
        await card.click();
        break;
      }
    }
    
    await page.waitForSelector('#timelineTable tbody tr', { timeout: 10000 });
    
    // Find a flip buy/sell pair
    const buyEvents = await page.locator('#timelineTable tbody tr').filter({ 
      hasText: 'Buy' 
    }).filter({
      has: page.locator('input[placeholder="Property address"]').filter({ hasText: /Flip/ })
    }).all();
    
    const sellEvents = await page.locator('#timelineTable tbody tr').filter({ 
      hasText: 'Sell' 
    }).all();
    
    console.log(`Found ${buyEvents.length} flip buy events and ${sellEvents.length} sell events`);
    
    // Step 2: Enable real listings and find actual properties
    await page.check('#useRealListings');
    await page.click('button:has-text("Find Actual Listings")');
    
    // Wait for processing
    await page.waitForTimeout(5000);
    
    // Step 3: Check that buy and sell events have matching names
    const updatedBuyEvents = await page.locator('#timelineTable tbody tr').filter({ 
      hasText: 'Buy' 
    }).filter({
      has: page.locator('input[placeholder="Property address"]').filter({ hasText: /Flip.*:/ })
    }).all();
    
    const updatedSellEvents = await page.locator('#timelineTable tbody tr').filter({ 
      hasText: 'Sell' 
    }).all();
    
    // Get property names from buy events
    const buyPropertyNames = new Map();
    for (const buyRow of updatedBuyEvents) {
      const propertyInput = await buyRow.locator('input[placeholder="Property address"]');
      const propertyName = await propertyInput.inputValue();
      
      if (propertyName.includes('Flip') && propertyName.includes(':')) {
        const flipNumber = propertyName.match(/Flip (\d+)/)?.[1];
        if (flipNumber) {
          buyPropertyNames.set(`Flip ${flipNumber}`, propertyName);
          console.log(`Buy event: ${propertyName}`);
        }
      }
    }
    
    // Check sell events have matching names
    let matchedSellEvents = 0;
    for (const sellRow of updatedSellEvents) {
      const propertyInput = await sellRow.locator('input[placeholder="Property address"]');
      const propertyName = await propertyInput.inputValue();
      
      // Check if this is a flip sell event
      const flipMatch = propertyName.match(/Flip (\d+)/);
      if (flipMatch) {
        const baseFlipName = `Flip ${flipMatch[1]}`;
        const expectedName = buyPropertyNames.get(baseFlipName);
        
        if (expectedName && propertyName === expectedName) {
          matchedSellEvents++;
          console.log(`✓ Sell event matches: ${propertyName}`);
        } else {
          console.log(`✗ Sell event mismatch: ${propertyName} (expected: ${expectedName})`);
        }
      }
    }
    
    // Should have at least one matched sell event if flips exist
    if (buyPropertyNames.size > 0) {
      expect(matchedSellEvents).toBeGreaterThan(0);
    }
  });

  test('should calculate cash from sales correctly', async ({ page }) => {
    // Generate a simple flip strategy
    await page.fill('#goalInput', 'Generate $50K cash from sales in 12 months with $30K');
    await page.click('button:has-text("Generate Strategy")');
    
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    
    // Select a strategy with flips
    const cards = await page.locator('.strategy-card').all();
    let selectedCard = null;
    
    for (const card of cards) {
      const text = await card.textContent();
      if (text.includes('flip') || text.includes('Flip') || text.includes('cash')) {
        await card.click();
        selectedCard = card;
        break;
      }
    }
    
    if (!selectedCard) {
      // If no flip strategy, select first one
      await cards[0].click();
    }
    
    await page.waitForSelector('#timelineTable tbody tr');
    
    // Apply real listings
    await page.check('#useRealListings');
    await page.click('button:has-text("Find Actual Listings")');
    
    await page.waitForTimeout(5000);
    
    // Navigate to a month after a flip sale
    const sellEvents = await page.locator('#timelineTable tbody tr').filter({ 
      hasText: 'Sell' 
    }).all();
    
    if (sellEvents.length > 0) {
      // Get the month of the first sell event
      const monthInput = await sellEvents[0].locator('td:first-child input');
      const sellMonth = await monthInput.inputValue();
      const viewMonth = parseInt(sellMonth) + 1;
      
      // Update view month
      await page.fill('#viewMonth', viewMonth.toString());
      await page.click('button:has-text("Refresh")');
      
      await page.waitForTimeout(1000);
      
      // Check Cash from Sales value
      const cashFromSales = await page.locator('#cashFromSales').textContent();
      console.log(`Cash from Sales at month ${viewMonth}: ${cashFromSales}`);
      
      // Should not be $0 if there was a sale
      expect(cashFromSales).not.toBe('$0');
      
      // Check Total Cash on Hand includes the sale
      const totalCash = await page.locator('#totalCashOnHand').textContent();
      console.log(`Total Cash on Hand: ${totalCash}`);
      
      // Cash should be positive after a flip sale
      const cashValue = parseInt(totalCash.replace(/[^0-9-]/g, ''));
      expect(cashValue).toBeGreaterThan(0);
    }
  });

  test('should handle BRRR exit sales with real listings', async ({ page }) => {
    // Set up for BRRR with exit strategy
    await page.click('#inputModeToggle');
    
    await page.fill('#targetIncome', '3000');
    await page.fill('#targetCashFromSales', '75000');
    await page.fill('#timeline', '36');
    await page.fill('#startingCapital', '60000');
    
    // Make sure BRRR is enabled
    await page.check('#allowBRRR');
    
    // Generate strategy
    await page.click('button:has-text("Generate Strategy")');
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    
    // Select first strategy
    await page.click('.strategy-card >> nth=0');
    await page.waitForSelector('#timelineTable tbody tr');
    
    // Apply real listings
    await page.check('#useRealListings');
    await page.click('button:has-text("Find Actual Listings")');
    
    await page.waitForTimeout(5000);
    
    // Check for BRRR properties with matching buy/sell events
    const brrrBuys = await page.locator('#timelineTable tbody tr').filter({ 
      hasText: 'Buy' 
    }).filter({
      has: page.locator('input[placeholder="Property address"]').filter({ hasText: /BRRR/ })
    }).all();
    
    const brrrSells = await page.locator('#timelineTable tbody tr').filter({ 
      hasText: 'Sell' 
    }).filter({
      has: page.locator('input[placeholder="Property address"]').filter({ hasText: /BRRR/ })
    }).all();
    
    console.log(`Found ${brrrBuys.length} BRRR buys and ${brrrSells.length} BRRR sells`);
    
    // Verify property names match between buy and sell
    if (brrrBuys.length > 0 && brrrSells.length > 0) {
      const firstBuyName = await brrrBuys[0].locator('input[placeholder="Property address"]').inputValue();
      
      // Find corresponding sell
      let foundMatch = false;
      for (const sellRow of brrrSells) {
        const sellName = await sellRow.locator('input[placeholder="Property address"]').inputValue();
        if (sellName.includes(firstBuyName.split(':')[0])) {
          foundMatch = true;
          console.log(`✓ BRRR sell matches buy: ${sellName}`);
          break;
        }
      }
      
      expect(foundMatch).toBe(true);
    }
  });

  test('should maintain property continuity across multiple events', async ({ page }) => {
    // Generate a complex strategy
    await page.fill('#goalInput', 'Build $5K/month and $100K cash in 36 months with $80K');
    await page.click('button:has-text("Generate Strategy")');
    
    await page.waitForSelector('.strategy-card', { timeout: 15000 });
    await page.click('.strategy-card >> nth=0');
    await page.waitForSelector('#timelineTable tbody tr');
    
    // Get initial event count
    const initialEventCount = await page.locator('#timelineTable tbody tr').count();
    console.log(`Initial timeline has ${initialEventCount} events`);
    
    // Apply real listings
    await page.check('#useRealListings');
    await page.click('button:has-text("Find Actual Listings")');
    
    await page.waitForTimeout(5000);
    
    // Verify event count is preserved
    const finalEventCount = await page.locator('#timelineTable tbody tr').count();
    expect(finalEventCount).toBe(initialEventCount);
    
    // Check that all property references are consistent
    const allEvents = await page.locator('#timelineTable tbody tr').all();
    const propertyReferences = new Map();
    
    for (const row of allEvents) {
      const action = await row.locator('td:nth-child(2) select').inputValue();
      const propertyName = await row.locator('input[placeholder="Property address"]').inputValue();
      
      // Extract base property identifier (e.g., "Flip 1", "Rental 2")
      const baseMatch = propertyName.match(/((?:Flip|Rental|BRRR)\s+\d+)/);
      if (baseMatch) {
        const baseName = baseMatch[1];
        
        if (action === 'buy') {
          propertyReferences.set(baseName, propertyName);
        } else if (action === 'sell') {
          const expectedName = propertyReferences.get(baseName);
          if (expectedName) {
            expect(propertyName).toBe(expectedName);
            console.log(`✓ ${action} event matches: ${propertyName}`);
          }
        }
      }
    }
  });
});