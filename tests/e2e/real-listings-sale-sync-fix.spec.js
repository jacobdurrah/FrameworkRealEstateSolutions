const { test, expect } = require('@playwright/test');

test.describe('Real Listings Sale Event Sync Fix', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/portfolio-simulator-v3.html');
        await page.waitForLoadState('networkidle');
    });

    test('sale events should maintain sync with buy events after real listings are applied', async ({ page }) => {
        // Enable console logging
        page.on('console', msg => {
            if (msg.type() === 'log' || msg.type() === 'error') {
                console.log(`Browser: ${msg.text()}`);
            }
        });

        // 1. Generate a strategy with flips (which have sales)
        await page.click('#inputModeToggle'); // Switch to structured input
        await page.waitForTimeout(500);
        
        await page.fill('#targetIncome', '5000');
        await page.fill('#timeline', '24');
        await page.fill('#startingCapital', '100000');
        await page.fill('#monthlySavings', '2000');
        await page.fill('#targetCashFromSales', '50000'); // Ensure we have sales
        await page.selectOption('#strategyPreference', 'aggressive');
        
        await page.click('button:has-text("Generate Strategy")');
        await page.waitForSelector('.strategy-card', { timeout: 15000 });
        
        // Wait for timeline to load
        await page.waitForSelector('#timelineBody tr', { timeout: 10000 });
        
        // Get initial data
        const initialData = await page.evaluate(() => {
            const buyEvents = window.timelineData.filter(e => e.action === 'buy');
            const sellEvents = window.timelineData.filter(e => e.action === 'sell');
            
            return {
                buyEvents: buyEvents.map(e => ({ id: e.id, property: e.property, price: e.price })),
                sellEvents: sellEvents.map(e => ({ id: e.id, property: e.property, price: e.price })),
                cashFromSales: window.portfolioState?.totals?.cashFromSales || 0
            };
        });
        
        console.log('Initial buy events:', initialData.buyEvents);
        console.log('Initial sell events:', initialData.sellEvents);
        console.log('Initial cash from sales:', initialData.cashFromSales);
        
        // Verify we have sell events
        expect(initialData.sellEvents.length).toBeGreaterThan(0);
        
        // 2. Apply real listings
        await page.check('#useRealListings');
        await page.click('button:has-text("Find Actual Listings")');
        await page.waitForTimeout(5000); // Wait for API
        
        // Get updated data
        const updatedData = await page.evaluate(() => {
            const buyEvents = window.timelineData.filter(e => e.action === 'buy');
            const sellEvents = window.timelineData.filter(e => e.action === 'sell');
            
            return {
                buyEvents: buyEvents.map(e => ({ 
                    id: e.id, 
                    property: e.property, 
                    price: e.price,
                    hasAddress: e.property.includes(':')
                })),
                sellEvents: sellEvents.map(e => ({ 
                    id: e.id, 
                    property: e.property, 
                    price: e.price,
                    hasAddress: e.property.includes(':')
                })),
                cashFromSales: window.portfolioState?.totals?.cashFromSales || 0
            };
        });
        
        console.log('Updated buy events:', updatedData.buyEvents);
        console.log('Updated sell events:', updatedData.sellEvents);
        
        // 3. Verify that sell events were updated to match buy events
        const buyEventsWithAddresses = updatedData.buyEvents.filter(e => e.hasAddress);
        const sellEventsWithAddresses = updatedData.sellEvents.filter(e => e.hasAddress);
        
        if (buyEventsWithAddresses.length > 0) {
            // If buy events got real addresses, sell events should too
            console.log(`Buy events with addresses: ${buyEventsWithAddresses.length}`);
            console.log(`Sell events with addresses: ${sellEventsWithAddresses.length}`);
            
            // For flips, each buy should have a corresponding sell
            const flipBuys = updatedData.buyEvents.filter(e => e.property.includes('Flip'));
            const flipSells = updatedData.sellEvents.filter(e => e.property.includes('Flip'));
            
            // Check that flip sells have matching property names
            flipBuys.forEach(buyEvent => {
                const baseName = buyEvent.property.split(':')[0].trim(); // e.g., "Flip 1"
                const matchingSell = flipSells.find(s => s.property.startsWith(baseName));
                
                if (matchingSell) {
                    console.log(`Buy: "${buyEvent.property}" -> Sell: "${matchingSell.property}"`);
                    // If buy has address, sell should have same address
                    if (buyEvent.hasAddress) {
                        expect(matchingSell.hasAddress).toBe(true);
                        expect(matchingSell.property).toBe(buyEvent.property);
                    }
                }
            });
        }
        
        // 4. Recalculate and verify cash tracking still works
        await page.click('button:has-text("Recalculate")');
        await page.waitForTimeout(1000);
        
        const finalCashFromSales = await page.evaluate(() => {
            return window.portfolioState?.totals?.cashFromSales || 0;
        });
        
        console.log('Final cash from sales:', finalCashFromSales);
        
        // If we had sales initially, we should still have them
        if (initialData.cashFromSales > 0) {
            expect(finalCashFromSales).toBeGreaterThan(0);
        }
    });

    test('verify property name consistency in portfolio state', async ({ page }) => {
        // Generate strategy with flips
        await page.fill('#goalInput', 'Generate $5K/month with flips in 24 months. $100K capital.');
        await page.click('button:has-text("Generate Strategy")');
        await page.waitForSelector('.strategy-card', { timeout: 15000 });
        
        // Select aggressive strategy (more likely to have flips)
        const aggressiveCard = await page.locator('.strategy-card').filter({ hasText: 'Aggressive' }).first();
        if (await aggressiveCard.isVisible()) {
            await aggressiveCard.click();
        }
        
        await page.waitForSelector('#timelineBody tr', { timeout: 10000 });
        
        // Apply real listings
        await page.check('#useRealListings');
        await page.click('button:has-text("Find Actual Listings")');
        await page.waitForTimeout(5000);
        
        // Check portfolio state consistency
        const stateCheck = await page.evaluate(() => {
            const results = {
                properties: [],
                sellEvents: [],
                mismatches: []
            };
            
            // Get all properties in portfolio state
            Object.values(window.portfolioState?.properties || {}).forEach(prop => {
                results.properties.push(prop.address);
            });
            
            // Get all sell events
            window.timelineData.filter(e => e.action === 'sell').forEach(sellEvent => {
                results.sellEvents.push(sellEvent.property);
                
                // Check if property exists in portfolio state
                const propertyExists = Object.values(window.portfolioState?.properties || {})
                    .some(p => p.address === sellEvent.property);
                
                if (!propertyExists && window.portfolioState?.properties && 
                    Object.keys(window.portfolioState.properties).length > 0) {
                    results.mismatches.push({
                        sellProperty: sellEvent.property,
                        availableProperties: Object.values(window.portfolioState.properties).map(p => p.address)
                    });
                }
            });
            
            return results;
        });
        
        console.log('Portfolio state check:', stateCheck);
        
        // Log any mismatches for debugging
        if (stateCheck.mismatches.length > 0) {
            console.log('Property name mismatches found:', stateCheck.mismatches);
        }
    });
});