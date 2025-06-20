const { chromium } = require('@playwright/test');

(async () => {
    console.log('Testing Complete Property Matching Workflow...\n');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        // Load page
        console.log('1. Loading Portfolio Simulator V3...');
        await page.goto('https://frameworkrealestatesolutions.com/portfolio-simulator-v3.html');
        await page.waitForLoadState('networkidle');
        
        // Generate AI strategy
        console.log('2. Generating AI strategy...');
        await page.fill('#goalInput', 'I want to build a $5,000/month rental portfolio in Detroit');
        
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const genBtn = buttons.find(b => b.textContent.includes('Generate') && !b.textContent.includes('Apply'));
            if (genBtn) genBtn.click();
        });
        
        // Wait for strategy
        console.log('3. Waiting for strategy generation...');
        await page.waitForFunction(() => {
            const elements = document.querySelectorAll('.strategy-display, .ai-response, [class*="strategy"]');
            return Array.from(elements).some(el => el.textContent.length > 100);
        }, { timeout: 20000 });
        
        console.log('   ✓ Strategy generated');
        
        // Apply to timeline
        console.log('4. Applying strategy to timeline...');
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const applyBtn = buttons.find(b => b.textContent.toLowerCase().includes('apply'));
            if (applyBtn) applyBtn.click();
        });
        
        await page.waitForTimeout(2000);
        console.log('   ✓ Applied to timeline');
        
        // Check timeline
        const timelineInfo = await page.evaluate(() => {
            const rows = document.querySelectorAll('#timelineTable tbody tr');
            const propertyInputs = document.querySelectorAll('#timelineTable input[placeholder*="roperty"]');
            
            return {
                rowCount: rows.length,
                propertyCount: propertyInputs.length,
                initialValues: Array.from(propertyInputs).slice(0, 3).map(i => i.value)
            };
        });
        
        console.log(`5. Timeline has ${timelineInfo.rowCount} rows with ${timelineInfo.propertyCount} properties`);
        console.log('   Initial property values:', timelineInfo.initialValues);
        
        // Find and click Find Actual Listings
        console.log('\n6. Clicking Find Actual Listings...');
        
        // First check if button is visible
        const buttonCheck = await page.evaluate(() => {
            const button = document.querySelector('.listings-toggle button');
            return {
                exists: !!button,
                visible: button ? button.offsetHeight > 0 : false,
                text: button?.textContent || ''
            };
        });
        
        console.log('   Button status:', buttonCheck);
        
        if (buttonCheck.visible) {
            // Click using JavaScript to ensure it works
            await page.evaluate(() => {
                const button = document.querySelector('.listings-toggle button');
                if (button) button.click();
            });
            
            console.log('   ✓ Clicked Find Actual Listings');
            console.log('   Waiting for property matching (7 seconds)...');
            
            await page.waitForTimeout(7000);
            
            // Check final results
            const finalResults = await page.evaluate(() => {
                const propertyInputs = document.querySelectorAll('#timelineTable input[placeholder*="roperty"]');
                const zillowLinks = document.querySelectorAll('#timelineTable a[href*="zillow"]');
                
                const properties = Array.from(propertyInputs).slice(0, 5).map((input, i) => ({
                    index: i + 1,
                    value: input.value,
                    hasAddress: input.value.includes(':') && input.value.length > 20
                }));
                
                return {
                    properties: properties,
                    zillowLinkCount: zillowLinks.length,
                    successCount: properties.filter(p => p.hasAddress).length
                };
            });
            
            console.log('\n7. FINAL RESULTS:');
            finalResults.properties.forEach(p => {
                const status = p.hasAddress ? '✅' : '❌';
                console.log(`   ${status} Property ${p.index}: "${p.value}"`);
            });
            
            console.log(`\n   Zillow links found: ${finalResults.zillowLinkCount}`);
            console.log(`\n=== TEST RESULT: ${finalResults.successCount > 0 ? 'PASSED ✅' : 'FAILED ❌'} ===`);
            console.log(`   ${finalResults.successCount}/${finalResults.properties.length} properties have full addresses`);
            
        } else {
            console.log('   ❌ Find Actual Listings button not visible');
        }
        
        await page.screenshot({ path: 'complete-workflow-test.png', fullPage: true });
        console.log('\nScreenshot saved: complete-workflow-test.png');
        
    } catch (error) {
        console.error('\nError:', error.message);
    } finally {
        await browser.close();
    }
})();