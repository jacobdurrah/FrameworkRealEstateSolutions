const { chromium } = require('@playwright/test');

(async () => {
    console.log('Testing property address population on live site...\n');
    
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // Navigate to the site
        console.log('1. Navigating to Portfolio Simulator V3...');
        await page.goto('https://frameworkrealestatesolutions.com/portfolio-simulator-v3.html');
        await page.waitForLoadState('networkidle');
        
        // Enter a goal
        console.log('2. Entering investment goal...');
        await page.fill('#goalInput', 'I want to build a $10,000/month rental portfolio in 5 years');
        
        // Generate strategy
        console.log('3. Clicking Generate Strategy...');
        await page.click('button:has-text("Generate Strategy")');
        
        // Wait for strategy to be generated
        console.log('4. Waiting for strategy generation...');
        await page.waitForSelector('.strategy-display', { timeout: 30000 });
        console.log('   ✓ Strategy generated successfully');
        
        // Apply to timeline
        console.log('5. Applying strategy to timeline...');
        await page.click('button:has-text("Apply to Timeline")');
        await page.waitForTimeout(2000);
        
        // Check initial property values
        console.log('6. Checking initial property values...');
        const initialProperties = await page.evaluate(() => {
            const inputs = document.querySelectorAll('#timelineTable input[placeholder="Property address"]');
            return Array.from(inputs).map((input, index) => ({
                index: index + 1,
                value: input.value,
                hasValue: input.value.length > 0
            }));
        });
        
        console.log('   Initial property values:');
        initialProperties.forEach(prop => {
            console.log(`   - Row ${prop.index}: "${prop.value}" (Has value: ${prop.hasValue})`);
        });
        
        // Click Find Actual Listings
        console.log('\n7. Clicking Find Actual Listings...');
        await page.click('button:has-text("Find Actual Listings")');
        
        // Wait for listings to be applied
        console.log('8. Waiting for real listings to be matched...');
        await page.waitForTimeout(5000);
        
        // Check property values after matching
        console.log('9. Checking property values after matching...');
        const matchedProperties = await page.evaluate(() => {
            const rows = document.querySelectorAll('#timelineTable tbody tr');
            return Array.from(rows).map((row, index) => {
                const input = row.querySelector('input[placeholder="Property address"]');
                const link = row.querySelector('.zillow-link');
                return {
                    index: index + 1,
                    value: input ? input.value : '',
                    hasLink: !!link,
                    linkHref: link ? link.href : null
                };
            });
        });
        
        console.log('   Property values after matching:');
        matchedProperties.forEach(prop => {
            console.log(`   - Row ${prop.index}: "${prop.value}"`);
            if (prop.hasLink) {
                console.log(`     ✓ Has Zillow link: ${prop.linkHref}`);
            }
        });
        
        // Verify the fix
        console.log('\n10. Verifying the fix...');
        let allTestsPassed = true;
        
        // Test 1: Check if properties have addresses
        const propertiesWithAddresses = matchedProperties.filter(p => 
            p.value && p.value.includes(':') && p.value.match(/^(Rental|Flip|Property) \d+: .+$/)
        );
        
        if (propertiesWithAddresses.length > 0) {
            console.log(`   ✓ ${propertiesWithAddresses.length} properties have properly formatted addresses`);
        } else {
            console.log('   ✗ No properties have properly formatted addresses');
            allTestsPassed = false;
        }
        
        // Test 2: Check if Zillow links are present
        const propertiesWithLinks = matchedProperties.filter(p => p.hasLink);
        if (propertiesWithLinks.length > 0) {
            console.log(`   ✓ ${propertiesWithLinks.length} properties have Zillow links`);
        } else {
            console.log('   ✗ No properties have Zillow links');
            allTestsPassed = false;
        }
        
        // Test 3: Check if addresses are visible in input fields
        const visibleAddresses = matchedProperties.filter(p => p.value && p.value.length > 0);
        if (visibleAddresses.length === matchedProperties.length) {
            console.log(`   ✓ All ${visibleAddresses.length} property inputs have visible values`);
        } else {
            console.log(`   ✗ Only ${visibleAddresses.length} of ${matchedProperties.length} inputs have values`);
            allTestsPassed = false;
        }
        
        // Final result
        console.log('\n=== TEST RESULT ===');
        if (allTestsPassed) {
            console.log('✅ All tests PASSED! Property addresses are populating correctly.');
        } else {
            console.log('❌ Some tests FAILED. Property address population needs investigation.');
        }
        
        // Take a screenshot
        await page.screenshot({ path: 'property-fix-test-result.png', fullPage: true });
        console.log('\nScreenshot saved as property-fix-test-result.png');
        
    } catch (error) {
        console.error('Error during test:', error.message);
        await page.screenshot({ path: 'property-fix-test-error.png', fullPage: true });
    } finally {
        await browser.close();
    }
})();