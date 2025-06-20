const { chromium } = require('@playwright/test');

(async () => {
    console.log('Testing current state of Portfolio Simulator V3...\n');
    
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Capture console errors
    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
    });
    
    try {
        console.log('1. Loading page with cache bypass...');
        await page.goto('https://frameworkrealestatesolutions.com/portfolio-simulator-v3.html', {
            waitUntil: 'networkidle',
            // Force reload to bypass cache
            bypassCSP: true
        });
        
        // Force reload to clear cache
        await page.reload({ waitUntil: 'networkidle' });
        
        console.log('2. Checking for JavaScript errors...');
        if (errors.length > 0) {
            console.log(`   Found ${errors.length} console errors:`);
            errors.slice(0, 5).forEach(err => console.log(`   - ${err.substring(0, 100)}...`));
        } else {
            console.log('   ✓ No console errors');
        }
        
        console.log('\n3. Testing quick property population flow...');
        
        // Enter goal
        await page.fill('#goalInput', 'Test $5000/month rental income');
        
        // Generate strategy
        const genBtn = await page.locator('button:has-text("Generate")').first();
        await genBtn.click();
        
        console.log('   Waiting for strategy...');
        await page.waitForSelector('.strategy-display, [class*="strategy"]', { timeout: 20000 });
        console.log('   ✓ Strategy generated');
        
        // Apply to timeline
        const applyBtn = await page.locator('button:has-text("Apply")').first();
        await applyBtn.click();
        await page.waitForTimeout(2000);
        console.log('   ✓ Applied to timeline');
        
        // Check table state
        const tableCheck = await page.evaluate(() => {
            const table = document.querySelector('#timelineTable');
            const rows = table ? table.querySelectorAll('tbody tr') : [];
            const inputs = table ? table.querySelectorAll('input[placeholder*="roperty"]') : [];
            
            return {
                tableExists: !!table,
                tableVisible: table ? window.getComputedStyle(table).display !== 'none' : false,
                rowCount: rows.length,
                propertyInputCount: inputs.length
            };
        });
        
        console.log('\n4. Table state:', tableCheck);
        
        // Find Actual Listings
        console.log('\n5. Clicking Find Actual Listings...');
        const findBtn = await page.locator('button:has-text("Find Actual Listings")').first();
        await findBtn.click();
        
        await page.waitForTimeout(5000);
        
        // Check final state
        const finalCheck = await page.evaluate(() => {
            const inputs = document.querySelectorAll('#timelineTable input[placeholder*="roperty"]');
            const results = [];
            
            inputs.forEach((input, i) => {
                if (i < 5) { // First 5 properties
                    results.push({
                        index: i + 1,
                        value: input.value,
                        hasValue: input.value.length > 0
                    });
                }
            });
            
            return results;
        });
        
        console.log('\n6. Property values after Find Actual Listings:');
        finalCheck.forEach(prop => {
            console.log(`   ${prop.hasValue ? '✓' : '✗'} Row ${prop.index}: "${prop.value}"`);
        });
        
        const successCount = finalCheck.filter(p => p.hasValue).length;
        console.log(`\n=== RESULT: ${successCount}/${finalCheck.length} properties have addresses ===`);
        
        await page.screenshot({ path: 'test-current-state.png', fullPage: true });
        
    } catch (error) {
        console.error('Test error:', error.message);
        console.log('\nConsole errors captured:', errors.length);
    } finally {
        await browser.close();
    }
})();