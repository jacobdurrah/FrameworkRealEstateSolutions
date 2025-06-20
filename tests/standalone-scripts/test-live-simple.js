const { chromium } = require('@playwright/test');

(async () => {
    console.log('Simple test of property display on live site...\n');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        // Navigate to V3
        console.log('1. Going to Portfolio Simulator V3...');
        await page.goto('https://frameworkrealestatesolutions.com/portfolio-simulator-v3.html');
        await page.waitForLoadState('networkidle');
        
        // Add some manual timeline events
        console.log('2. Adding manual timeline events...');
        
        // Add first property
        await page.click('button:has-text("Add Event")');
        await page.waitForTimeout(500);
        
        // Check the timeline table
        console.log('3. Checking timeline table structure...');
        const hasTable = await page.locator('#timelineTable').isVisible();
        console.log('   Timeline table visible:', hasTable);
        
        // Check if there are any rows
        const rows = await page.locator('#timelineTable tbody tr').count();
        console.log('   Number of rows in timeline:', rows);
        
        // If there are rows, check property inputs
        if (rows > 0) {
            console.log('\n4. Checking property input fields...');
            const propertyInputs = await page.evaluate(() => {
                const inputs = document.querySelectorAll('#timelineTable input[placeholder="Property address"]');
                return Array.from(inputs).map((input, i) => ({
                    index: i,
                    value: input.value,
                    placeholder: input.placeholder,
                    type: input.type,
                    className: input.className
                }));
            });
            
            console.log('   Found', propertyInputs.length, 'property input fields');
            propertyInputs.forEach(input => {
                console.log(`   - Input ${input.index}: value="${input.value}", class="${input.className}"`);
            });
        }
        
        // Try the Find Actual Listings button
        console.log('\n5. Looking for Find Actual Listings button...');
        const findListingsBtn = await page.locator('button:has-text("Find Actual Listings")').isVisible();
        console.log('   Button visible:', findListingsBtn);
        
        if (findListingsBtn) {
            console.log('6. Clicking Find Actual Listings...');
            await page.click('button:has-text("Find Actual Listings")');
            await page.waitForTimeout(3000);
            
            // Check for any error messages
            const errors = await page.locator('.alert-danger').count();
            if (errors > 0) {
                const errorText = await page.locator('.alert-danger').first().textContent();
                console.log('   Error message:', errorText);
            }
        }
        
        // Take screenshot
        await page.screenshot({ path: 'live-site-state.png', fullPage: true });
        console.log('\nScreenshot saved as live-site-state.png');
        
        // Check console for errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('Console error:', msg.text());
            }
        });
        
        await page.waitForTimeout(2000);
        
    } catch (error) {
        console.error('Test error:', error.message);
        await page.screenshot({ path: 'test-error.png' });
    } finally {
        await browser.close();
    }
})();