const { chromium } = require('@playwright/test');

(async () => {
    console.log('Verifying Property Address Fix on Live Site...\n');
    
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // Load page
        console.log('1. Loading Portfolio Simulator V3...');
        await page.goto('https://frameworkrealestatesolutions.com/portfolio-simulator-v3.html');
        await page.waitForLoadState('networkidle');
        
        // Hard refresh to clear cache
        await page.keyboard.press('Control+Shift+R');
        await page.waitForTimeout(2000);
        
        // Method 1: Manual timeline entry
        console.log('\n2. Adding manual timeline events...');
        
        // Look for the Add Event button using multiple strategies
        let addEventClicked = false;
        
        // Try clicking button by onclick attribute
        try {
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const addBtn = buttons.find(b => b.onclick?.toString().includes('addTimelineRow'));
                if (addBtn) addBtn.click();
            });
            await page.waitForTimeout(1000);
            addEventClicked = true;
            console.log('   ✓ Added event via addTimelineRow button');
        } catch (e) {
            console.log('   Could not find Add Event button');
        }
        
        // If no manual events, try AI generation
        if (!addEventClicked) {
            console.log('\n3. Using AI strategy generation instead...');
            
            await page.fill('#goalInput', 'Build rental income of $3000/month');
            
            // Find and click generate button
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const genBtn = buttons.find(b => 
                    b.textContent.includes('Generate') && 
                    !b.textContent.includes('Apply')
                );
                if (genBtn) genBtn.click();
            });
            
            console.log('   Waiting for strategy (20 seconds max)...');
            
            try {
                // Wait for strategy response
                await page.waitForFunction(() => {
                    const elements = document.querySelectorAll('.strategy-display, .ai-response, [class*="strategy"]');
                    return Array.from(elements).some(el => el.textContent.length > 100);
                }, { timeout: 20000 });
                
                console.log('   ✓ Strategy generated');
                
                // Apply strategy - click the Apply button
                await page.waitForTimeout(1000);
                const applied = await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const applyBtn = buttons.find(b => 
                        b.textContent.toLowerCase().includes('apply') &&
                        !b.disabled
                    );
                    if (applyBtn) {
                        applyBtn.click();
                        return true;
                    }
                    return false;
                });
                
                if (applied) {
                    console.log('   ✓ Applied strategy to timeline');
                    await page.waitForTimeout(2000);
                }
                
            } catch (e) {
                console.log('   ⚠ Strategy generation timeout');
            }
        }
        
        // Check if timeline has events
        const timelineState = await page.evaluate(() => {
            const table = document.querySelector('#timelineTable');
            if (!table) return { hasTable: false };
            
            const rows = table.querySelectorAll('tbody tr');
            const propertyInputs = table.querySelectorAll('input[placeholder*="roperty"]');
            
            return {
                hasTable: true,
                rowCount: rows.length,
                propertyInputs: Array.from(propertyInputs).slice(0, 5).map((input, i) => ({
                    index: i + 1,
                    currentValue: input.value,
                    placeholder: input.placeholder
                }))
            };
        });
        
        console.log('\n4. Timeline state:');
        console.log(`   Table exists: ${timelineState.hasTable}`);
        console.log(`   Rows: ${timelineState.rowCount}`);
        
        if (timelineState.rowCount > 0) {
            console.log('   Initial property values:');
            timelineState.propertyInputs.forEach(p => {
                console.log(`     Row ${p.index}: "${p.currentValue}"`);
            });
            
            // Find and click Find Actual Listings
            console.log('\n5. Finding and clicking "Find Actual Listings" button...');
            
            const findListingsClicked = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const findBtn = buttons.find(b => 
                    b.textContent.includes('Find Actual Listings') ||
                    b.textContent.includes('Match Properties')
                );
                if (findBtn && !findBtn.disabled) {
                    findBtn.click();
                    return true;
                }
                return false;
            });
            
            if (findListingsClicked) {
                console.log('   ✓ Clicked Find Actual Listings');
                console.log('   Waiting for properties to populate (7 seconds)...');
                await page.waitForTimeout(7000);
                
                // Check final values
                const finalState = await page.evaluate(() => {
                    const inputs = document.querySelectorAll('#timelineTable input[placeholder*="roperty"]');
                    const links = document.querySelectorAll('#timelineTable a[href*="zillow"]');
                    
                    return {
                        properties: Array.from(inputs).slice(0, 5).map((input, i) => ({
                            index: i + 1,
                            value: input.value,
                            hasAddress: input.value.includes(':') && input.value.length > 20
                        })),
                        zillowLinkCount: links.length
                    };
                });
                
                console.log('\n6. FINAL RESULTS:');
                console.log('   Property values after matching:');
                
                let successCount = 0;
                finalState.properties.forEach(p => {
                    const status = p.hasAddress ? '✅' : '❌';
                    console.log(`   ${status} Row ${p.index}: "${p.value}"`);
                    if (p.hasAddress) successCount++;
                });
                
                console.log(`\n   Zillow links: ${finalState.zillowLinkCount}`);
                console.log(`\n=== PROPERTY FIX STATUS: ${successCount > 0 ? 'WORKING ✅' : 'NOT WORKING ❌'} ===`);
                console.log(`   ${successCount}/${finalState.properties.length} properties have full addresses`);
                
            } else {
                console.log('   ❌ Could not find Find Actual Listings button');
            }
        } else {
            console.log('   ⚠ No timeline events to test');
        }
        
        await page.screenshot({ path: 'verify-property-fix-final.png', fullPage: true });
        console.log('\nScreenshot saved: verify-property-fix-final.png');
        
    } catch (error) {
        console.error('\nError:', error.message);
        await page.screenshot({ path: 'verify-property-fix-error.png' });
    } finally {
        await browser.close();
    }
})();