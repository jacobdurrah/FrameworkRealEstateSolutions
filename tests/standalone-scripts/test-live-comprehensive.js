const { chromium } = require('@playwright/test');

(async () => {
    console.log('Comprehensive test of Portfolio Simulator V3...\n');
    
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Listen for console messages and errors
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('Console Error:', msg.text());
        }
    });
    
    page.on('pageerror', error => {
        console.log('Page Error:', error.message);
    });
    
    try {
        // Navigate to the site
        console.log('1. Navigating to Portfolio Simulator V3...');
        await page.goto('https://frameworkrealestatesolutions.com/portfolio-simulator-v3.html');
        await page.waitForLoadState('networkidle');
        console.log('   ✓ Page loaded successfully');
        
        // Take initial screenshot
        await page.screenshot({ path: 'test-1-initial-page.png' });
        
        // Check page structure
        console.log('\n2. Checking page structure...');
        const pageStructure = await page.evaluate(() => {
            return {
                hasGoalInput: !!document.querySelector('#goalInput'),
                hasGenerateButton: !!document.querySelector('button:contains("Generate Strategy"), button:has-text("Generate Strategy")'),
                hasTimelineTable: !!document.querySelector('#timelineTable'),
                hasAddEventButton: !!document.querySelector('button[onclick*="addTimelineRow"]'),
                hasFindListingsButton: !!document.querySelector('button:contains("Find Actual Listings"), button:has-text("Find Actual Listings")')
            };
        });
        
        console.log('   Page elements found:', pageStructure);
        
        // Try manual approach first
        console.log('\n3. Testing manual timeline approach...');
        
        // Look for Add Event button more carefully
        const addEventButton = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const addButton = buttons.find(btn => 
                btn.textContent.includes('Add Event') || 
                btn.textContent.includes('Add Row') ||
                btn.onclick?.toString().includes('addTimelineRow')
            );
            return addButton ? {
                text: addButton.textContent,
                visible: window.getComputedStyle(addButton).display !== 'none',
                onclick: addButton.onclick?.toString()
            } : null;
        });
        
        if (addEventButton) {
            console.log('   Found Add Event button:', addEventButton);
            
            // Try to click it
            try {
                await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const addButton = buttons.find(btn => 
                        btn.textContent.includes('Add Event') || 
                        btn.textContent.includes('Add Row') ||
                        btn.onclick?.toString().includes('addTimelineRow')
                    );
                    if (addButton) addButton.click();
                });
                await page.waitForTimeout(1000);
                console.log('   ✓ Clicked Add Event button');
            } catch (e) {
                console.log('   ✗ Could not click Add Event button:', e.message);
            }
        }
        
        // Check timeline table rows
        console.log('\n4. Checking timeline table...');
        const tableInfo = await page.evaluate(() => {
            const table = document.querySelector('#timelineTable');
            if (!table) return { exists: false };
            
            const rows = table.querySelectorAll('tbody tr');
            const propertyInputs = table.querySelectorAll('input[placeholder*="Property"], input[placeholder*="property"]');
            
            return {
                exists: true,
                rowCount: rows.length,
                propertyInputCount: propertyInputs.length,
                propertyInputs: Array.from(propertyInputs).map(input => ({
                    placeholder: input.placeholder,
                    value: input.value,
                    id: input.id,
                    className: input.className
                }))
            };
        });
        
        console.log('   Timeline table info:', tableInfo);
        
        // Try strategy generation approach
        console.log('\n5. Testing AI strategy generation...');
        const goalInput = await page.locator('#goalInput');
        if (await goalInput.isVisible()) {
            await goalInput.fill('I want to build a $5,000/month rental portfolio in 3 years with $50,000 starting capital');
            console.log('   ✓ Filled goal input');
            
            // Look for generate button
            const generateBtn = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.find(btn => 
                    btn.textContent.includes('Generate Strategy') || 
                    btn.textContent.includes('Generate')
                );
            });
            
            if (generateBtn) {
                console.log('   Found Generate button, clicking...');
                await page.click('button:has-text("Generate")');
                
                // Wait for response with shorter timeout
                try {
                    await page.waitForSelector('.strategy-display, .strategy-output, .ai-response', { timeout: 15000 });
                    console.log('   ✓ Strategy generated');
                    
                    await page.screenshot({ path: 'test-2-strategy-generated.png' });
                    
                    // Look for Apply to Timeline button
                    const applyBtn = await page.locator('button:has-text("Apply to Timeline"), button:has-text("Apply")').first();
                    if (await applyBtn.isVisible()) {
                        await applyBtn.click();
                        await page.waitForTimeout(2000);
                        console.log('   ✓ Applied to timeline');
                    }
                } catch (e) {
                    console.log('   ✗ Strategy generation timeout or error:', e.message);
                }
            }
        }
        
        // Final check for Find Actual Listings
        console.log('\n6. Testing Find Actual Listings...');
        const findListingsButtons = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.filter(btn => 
                btn.textContent.includes('Find Actual Listings') ||
                btn.textContent.includes('Find Properties') ||
                btn.textContent.includes('Match Properties')
            ).map(btn => ({
                text: btn.textContent.trim(),
                visible: window.getComputedStyle(btn).display !== 'none',
                disabled: btn.disabled
            }));
        });
        
        console.log('   Find Listings buttons found:', findListingsButtons);
        
        if (findListingsButtons.length > 0 && findListingsButtons[0].visible) {
            try {
                await page.click('button:has-text("Find Actual Listings")');
                console.log('   ✓ Clicked Find Actual Listings');
                await page.waitForTimeout(5000);
                
                // Check final property values
                const finalProperties = await page.evaluate(() => {
                    const rows = document.querySelectorAll('#timelineTable tbody tr');
                    return Array.from(rows).map((row, index) => {
                        const input = row.querySelector('input[placeholder*="Property"], input[placeholder*="property"]');
                        const link = row.querySelector('a[href*="zillow"], .zillow-link');
                        return {
                            rowIndex: index + 1,
                            inputValue: input?.value || '',
                            hasZillowLink: !!link,
                            linkHref: link?.href || ''
                        };
                    });
                });
                
                console.log('\n7. Final property check results:');
                finalProperties.forEach(prop => {
                    console.log(`   Row ${prop.rowIndex}:`);
                    console.log(`     - Value: "${prop.inputValue}"`);
                    console.log(`     - Has Zillow link: ${prop.hasZillowLink}`);
                    if (prop.linkHref) {
                        console.log(`     - Link: ${prop.linkHref}`);
                    }
                });
                
                // Test success criteria
                const propertiesWithAddresses = finalProperties.filter(p => p.inputValue.length > 0);
                const propertiesWithLinks = finalProperties.filter(p => p.hasZillowLink);
                
                console.log('\n=== TEST RESULTS ===');
                console.log(`✓ Properties with addresses: ${propertiesWithAddresses.length}/${finalProperties.length}`);
                console.log(`✓ Properties with Zillow links: ${propertiesWithLinks.length}/${finalProperties.length}`);
                
                if (propertiesWithAddresses.length > 0) {
                    console.log('✅ Property address population is working!');
                } else {
                    console.log('❌ No property addresses found - needs investigation');
                }
                
            } catch (e) {
                console.log('   ✗ Error with Find Actual Listings:', e.message);
            }
        }
        
        // Take final screenshot
        await page.screenshot({ path: 'test-3-final-state.png', fullPage: true });
        console.log('\nScreenshots saved: test-1-initial-page.png, test-2-strategy-generated.png, test-3-final-state.png');
        
    } catch (error) {
        console.error('\nTest failed with error:', error.message);
        console.error('Stack:', error.stack);
        await page.screenshot({ path: 'test-error-state.png', fullPage: true });
    } finally {
        await browser.close();
    }
})();