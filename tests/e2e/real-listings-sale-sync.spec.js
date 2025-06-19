const { test, expect } = require('@playwright/test');

test.describe('Real Listings Sale Event Sync', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/portfolio-simulator-v3.html');
        await page.waitForLoadState('networkidle');
    });

    test('sale events should sync with purchase events after real listings are applied', async ({ page }) => {
        // 1. Generate a strategy with flips (which have sales)
        // First switch to structured input mode
        await page.click('#inputModeToggle');
        await page.waitForTimeout(500);
        
        await page.fill('#targetIncome', '5000');
        await page.fill('#timeline', '24');
        await page.fill('#startingCapital', '100000');
        await page.fill('#monthlySavings', '2000');
        await page.selectOption('#strategyPreference', 'aggressive');
        
        await page.click('button:has-text("Generate Strategy")');
        await page.waitForSelector('.strategy-card', { timeout: 15000 });
        
        // Wait for timeline to load
        await page.waitForSelector('#timelineBody tr', { timeout: 10000 });
        
        // Get initial timeline data
        const initialEvents = await page.evaluate(() => {
            return window.timelineData.map(event => ({
                id: event.id,
                action: event.action,
                property: event.property,
                month: event.month,
                price: event.price
            }));
        });
        
        console.log('Initial events:', initialEvents);
        
        // Find flip events (buy and sell pairs)
        const flipBuyEvents = initialEvents.filter(e => e.action === 'buy' && e.property.includes('Flip'));
        const flipSellEvents = initialEvents.filter(e => e.action === 'sell' && e.property.includes('Flip'));
        
        expect(flipBuyEvents.length).toBeGreaterThan(0);
        expect(flipSellEvents.length).toBeGreaterThan(0);
        
        // Get initial cash from sales
        const initialCashFromSales = await page.textContent('#cashFromSales');
        console.log('Initial cash from sales:', initialCashFromSales);
        
        // 2. Apply real listings
        await page.check('#useRealListings');
        await page.waitForTimeout(5000); // Wait for listings to load
        
        // Get updated timeline data
        const updatedEvents = await page.evaluate(() => {
            return window.timelineData.map(event => ({
                id: event.id,
                action: event.action,
                property: event.property,
                month: event.month,
                price: event.price,
                realListing: event.realListing ? true : false
            }));
        });
        
        console.log('Updated events:', updatedEvents);
        
        // Check that buy events got real listings
        const updatedBuyEvents = updatedEvents.filter(e => e.action === 'buy' && e.property.includes('Flip'));
        const buyEventsWithListings = updatedBuyEvents.filter(e => e.realListing);
        
        console.log(`Buy events with real listings: ${buyEventsWithListings.length}/${updatedBuyEvents.length}`);
        
        // 3. Recalculate to see if sales still sync
        await page.click('button:has-text("Recalculate")');
        await page.waitForTimeout(1000);
        
        // Check cash from sales after recalculation
        const finalCashFromSales = await page.textContent('#cashFromSales');
        console.log('Final cash from sales:', finalCashFromSales);
        
        // Parse cash values
        const parseCash = (str) => parseInt(str.replace(/[^0-9-]/g, '')) || 0;
        const initialCash = parseCash(initialCashFromSales);
        const finalCash = parseCash(finalCashFromSales);
        
        // Test the issue: If property names changed but sale events don't update,
        // cash from sales will be 0 or different
        if (buyEventsWithListings.length > 0) {
            // If we have real listings, check if sales still work
            console.log('Testing sale sync with real listings...');
            
            // Check if sale events can still find their properties
            const saleResults = await page.evaluate(() => {
                const results = [];
                const sellEvents = window.timelineData.filter(e => e.action === 'sell');
                
                sellEvents.forEach(sellEvent => {
                    // Try to find matching property
                    const properties = Object.values(window.portfolioState?.properties || {});
                    const matchingProperty = properties.find(p => p.address === sellEvent.property);
                    
                    results.push({
                        sellProperty: sellEvent.property,
                        foundMatch: !!matchingProperty,
                        existingProperties: properties.map(p => p.address)
                    });
                });
                
                return results;
            });
            
            console.log('Sale matching results:', saleResults);
            
            // Verify the issue exists
            const unmatchedSales = saleResults.filter(r => !r.foundMatch);
            console.log(`Unmatched sales: ${unmatchedSales.length}/${saleResults.length}`);
            
            // This test demonstrates the bug: sales don't match after real listings
            expect(unmatchedSales.length).toBeGreaterThan(0);
            
            // And cash from sales is affected
            if (initialCash > 0) {
                expect(finalCash).toBeLessThan(initialCash);
            }
        }
    });

    test('verify property name mismatch after real listings', async ({ page }) => {
        // Quick focused test on the naming issue
        
        // Generate strategy with a flip
        await page.fill('#goalInput', 'Generate $5K/month in 24 months with $100K capital. Prefer flips.');
        await page.click('button:has-text("Generate Strategy")');
        await page.waitForSelector('.strategy-card', { timeout: 15000 });
        await page.waitForSelector('#timelineBody tr', { timeout: 10000 });
        
        // Get initial property names
        const initialNames = await page.evaluate(() => {
            return window.timelineData
                .filter(e => e.action === 'buy' && e.property.includes('Flip'))
                .map(e => ({ id: e.id, property: e.property }));
        });
        
        console.log('Initial flip names:', initialNames);
        expect(initialNames.length).toBeGreaterThan(0);
        
        // Apply real listings
        await page.check('#useRealListings');
        await page.waitForTimeout(5000);
        
        // Get updated property names
        const updatedNames = await page.evaluate(() => {
            return window.timelineData
                .filter(e => e.action === 'buy' && e.property.includes('Flip'))
                .map(e => ({ 
                    id: e.id, 
                    property: e.property,
                    hasAddress: e.property.includes(':')
                }));
        });
        
        console.log('Updated flip names:', updatedNames);
        
        // Verify that property names changed to include addresses
        const namesWithAddresses = updatedNames.filter(n => n.hasAddress);
        console.log(`Properties with addresses: ${namesWithAddresses.length}/${updatedNames.length}`);
        
        // Now check if sell events still reference old names
        const sellEventNames = await page.evaluate(() => {
            return window.timelineData
                .filter(e => e.action === 'sell' && e.property.includes('Flip'))
                .map(e => ({ 
                    property: e.property,
                    hasAddress: e.property.includes(':')
                }));
        });
        
        console.log('Sell event names:', sellEventNames);
        
        // The bug: sell events don't update their property references
        const sellsWithoutAddresses = sellEventNames.filter(n => !n.hasAddress);
        expect(sellsWithoutAddresses.length).toBe(sellEventNames.length);
        
        // This mismatch prevents proper cash tracking
    });
});