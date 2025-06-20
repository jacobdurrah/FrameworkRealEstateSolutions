const { chromium } = require('@playwright/test');

(async () => {
    console.log('Testing Portfolio Simulator V3 Property Address Feature...\n');
    
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // Navigate to the site
        console.log('1. Navigating to Portfolio Simulator V3...');
        await page.goto('https://frameworkrealestatesolutions.com/portfolio-simulator-v3.html');
        await page.waitForLoadState('networkidle');
        console.log('   ✓ Page loaded');
        
        // Method 1: Try manual timeline entry
        console.log('\n2. Testing manual timeline entry...');
        
        // Check if timeline table exists
        const tableExists = await page.locator('#timelineTable').isVisible();
        console.log(`   Timeline table visible: ${tableExists}`);
        
        if (tableExists) {
            // Count existing rows
            const initialRows = await page.locator('#timelineTable tbody tr').count();
            console.log(`   Initial rows in timeline: ${initialRows}`);
            
            // Try to add a manual event
            const addButtons = await page.locator('button').all();
            let addEventButton = null;
            
            for (const button of addButtons) {
                const text = await button.textContent();
                if (text && (text.includes('Add Event') || text.includes('Add Row'))) {
                    addEventButton = button;
                    break;
                }
            }
            
            if (addEventButton && await addEventButton.isVisible()) {
                console.log('   Found Add Event button, clicking...');
                await addEventButton.click();
                await page.waitForTimeout(1000);
                
                const newRows = await page.locator('#timelineTable tbody tr').count();
                console.log(`   Rows after clicking Add Event: ${newRows}`);
            }
        }
        
        // Method 2: Try AI generation
        console.log('\n3. Testing AI strategy generation...');
        
        const goalInput = await page.locator('#goalInput');
        if (await goalInput.isVisible()) {
            console.log('   Found goal input field');
            await goalInput.fill('Build a $5000/month rental portfolio in 3 years starting with $50,000');
            
            // Find generate button
            const generateButtons = await page.locator('button').all();
            let generateButton = null;
            
            for (const button of generateButtons) {
                const text = await button.textContent();
                if (text && text.includes('Generate')) {
                    generateButton = button;
                    break;
                }
            }
            
            if (generateButton && await generateButton.isVisible()) {
                console.log('   Clicking Generate Strategy button...');
                await generateButton.click();
                
                // Wait for strategy with a reasonable timeout
                console.log('   Waiting for strategy generation (max 20 seconds)...');
                try {
                    await page.waitForSelector('.strategy-display, .ai-response, [class*="strategy"]', { 
                        timeout: 20000,
                        state: 'visible' 
                    });
                    console.log('   ✓ Strategy generated');
                    
                    // Look for Apply to Timeline button
                    await page.waitForTimeout(2000);
                    const applyButtons = await page.locator('button').all();
                    
                    for (const button of applyButtons) {
                        const text = await button.textContent();
                        if (text && text.includes('Apply')) {
                            console.log('   Clicking Apply to Timeline...');
                            await button.click();
                            await page.waitForTimeout(2000);
                            console.log('   ✓ Applied to timeline');
                            break;
                        }
                    }
                } catch (e) {
                    console.log('   ⚠ Strategy generation timed out or failed');
                }
            }
        }
        
        // Check current timeline state
        console.log('\n4. Checking timeline state...');
        const timelineRows = await page.locator('#timelineTable tbody tr').count();
        console.log(`   Timeline has ${timelineRows} rows`);
        
        if (timelineRows > 0) {
            // Check for property inputs
            const propertyInputs = await page.locator('#timelineTable input[placeholder*="roperty"]').all();
            console.log(`   Found ${propertyInputs.length} property input fields`);
            
            // Check initial values
            console.log('   Initial property values:');
            for (let i = 0; i < propertyInputs.length && i < 5; i++) {
                const value = await propertyInputs[i].inputValue();
                console.log(`     Row ${i + 1}: "${value}"`);
            }
            
            // Test Find Actual Listings
            console.log('\n5. Testing Find Actual Listings feature...');
            const findButtons = await page.locator('button').all();
            let findListingsButton = null;
            
            for (const button of findButtons) {
                const text = await button.textContent();
                if (text && text.includes('Find Actual Listings')) {
                    findListingsButton = button;
                    break;
                }
            }
            
            if (findListingsButton && await findListingsButton.isVisible()) {
                console.log('   Clicking Find Actual Listings...');
                await findListingsButton.click();
                
                // Wait for properties to be matched
                console.log('   Waiting for property matching (5 seconds)...');
                await page.waitForTimeout(5000);
                
                // Check final property values
                console.log('\n6. Final property check:');
                const finalInputs = await page.locator('#timelineTable input[placeholder*="roperty"]').all();
                let propertiesWithValues = 0;
                
                for (let i = 0; i < finalInputs.length && i < 10; i++) {
                    const value = await finalInputs[i].inputValue();
                    if (value && value.length > 0) {
                        propertiesWithValues++;
                        console.log(`   ✓ Row ${i + 1}: "${value}"`);
                    } else {
                        console.log(`   ✗ Row ${i + 1}: [empty]`);
                    }
                }
                
                // Check for Zillow links
                const zillowLinks = await page.locator('#timelineTable a[href*="zillow"]').count();
                console.log(`\n   Zillow links found: ${zillowLinks}`);
                
                // Test results
                console.log('\n=== TEST RESULTS ===');
                if (propertiesWithValues > 0) {
                    console.log(`✅ SUCCESS: ${propertiesWithValues} properties have addresses populated`);
                    console.log(`✅ ${zillowLinks} properties have Zillow links`);
                } else {
                    console.log('❌ FAILED: No property addresses were populated');
                }
            } else {
                console.log('   ✗ Find Actual Listings button not found or not visible');
            }
        } else {
            console.log('   ⚠ No timeline rows to test');
        }
        
        // Take final screenshot
        await page.screenshot({ path: 'property-test-final.png', fullPage: true });
        console.log('\nScreenshot saved as property-test-final.png');
        
    } catch (error) {
        console.error('\nTest error:', error.message);
        await page.screenshot({ path: 'property-test-error.png', fullPage: true });
    } finally {
        await browser.close();
    }
})();