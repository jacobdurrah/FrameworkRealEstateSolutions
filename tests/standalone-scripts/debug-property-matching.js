const { chromium } = require('@playwright/test');

(async () => {
    console.log('Debugging Property Matching Feature...\n');
    
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true  // Open devtools
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Capture all console logs
    const logs = [];
    page.on('console', msg => {
        logs.push({
            type: msg.type(),
            text: msg.text()
        });
    });
    
    // Capture network requests
    const apiCalls = [];
    page.on('request', request => {
        if (request.url().includes('api') || request.url().includes('properties')) {
            apiCalls.push({
                url: request.url(),
                method: request.method(),
                postData: request.postData()
            });
        }
    });
    
    page.on('response', response => {
        if (response.url().includes('api') || response.url().includes('properties')) {
            console.log(`API Response: ${response.status()} ${response.url()}`);
        }
    });
    
    try {
        console.log('1. Loading page...');
        await page.goto('https://frameworkrealestatesolutions.com/portfolio-simulator-v3.html');
        await page.waitForLoadState('networkidle');
        
        // Force refresh
        await page.reload();
        await page.waitForTimeout(2000);
        
        console.log('\n2. Console logs after page load:');
        logs.slice(-10).forEach(log => {
            if (log.type === 'error') {
                console.log(`   ERROR: ${log.text}`);
            } else if (log.type === 'warning') {
                console.log(`   WARN: ${log.text}`);
            }
        });
        
        // Add manual events
        console.log('\n3. Adding manual timeline events...');
        
        // Try to add events using the function directly
        const eventsAdded = await page.evaluate(() => {
            try {
                // Add events manually
                if (typeof addTimelineRow === 'function') {
                    addTimelineRow();
                    addTimelineRow();
                    return true;
                }
                return false;
            } catch (e) {
                return `Error: ${e.message}`;
            }
        });
        
        console.log(`   Events added: ${eventsAdded}`);
        await page.waitForTimeout(1000);
        
        // Set property types
        console.log('\n4. Setting property types...');
        await page.evaluate(() => {
            const selects = document.querySelectorAll('#timelineTable select');
            if (selects.length >= 2) {
                selects[0].value = 'buy';
                selects[1].value = 'buy';
                // Trigger change events
                selects[0].dispatchEvent(new Event('change'));
                selects[1].dispatchEvent(new Event('change'));
            }
        });
        
        // Check if Find Actual Listings is available
        const findButtonInfo = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const findBtn = buttons.find(b => b.textContent.includes('Find Actual Listings'));
            
            if (findBtn) {
                return {
                    exists: true,
                    enabled: !findBtn.disabled,
                    text: findBtn.textContent,
                    onclick: findBtn.onclick ? 'has onclick' : 'no onclick'
                };
            }
            return { exists: false };
        });
        
        console.log('\n5. Find Actual Listings button:', findButtonInfo);
        
        if (findButtonInfo.exists && findButtonInfo.enabled) {
            console.log('\n6. Clicking Find Actual Listings...');
            
            // Clear logs before clicking
            logs.length = 0;
            apiCalls.length = 0;
            
            await page.click('button:has-text("Find Actual Listings")');
            
            // Wait and capture what happens
            await page.waitForTimeout(5000);
            
            console.log('\n7. Console logs after clicking:');
            logs.forEach(log => {
                console.log(`   [${log.type}] ${log.text.substring(0, 100)}`);
            });
            
            console.log('\n8. API calls made:');
            apiCalls.forEach(call => {
                console.log(`   ${call.method} ${call.url}`);
                if (call.postData) {
                    console.log(`   Body: ${call.postData.substring(0, 100)}...`);
                }
            });
            
            // Check final state
            const finalState = await page.evaluate(() => {
                const inputs = document.querySelectorAll('#timelineTable input[placeholder*="roperty"]');
                const results = [];
                
                for (let i = 0; i < Math.min(3, inputs.length); i++) {
                    results.push({
                        index: i + 1,
                        value: inputs[i].value,
                        dataset: Object.assign({}, inputs[i].dataset)
                    });
                }
                
                // Check if matchRealListings function exists
                const funcExists = typeof window.matchRealListings === 'function';
                
                return {
                    properties: results,
                    matchRealListingsExists: funcExists,
                    tableRowCount: document.querySelectorAll('#timelineTable tbody tr').length
                };
            });
            
            console.log('\n9. Final state check:');
            console.log(`   matchRealListings function exists: ${finalState.matchRealListingsExists}`);
            console.log(`   Table rows: ${finalState.tableRowCount}`);
            console.log('   Property values:');
            finalState.properties.forEach(p => {
                console.log(`     Row ${p.index}: "${p.value}"`);
            });
        }
        
        console.log('\n10. Checking for JavaScript errors in property matching...');
        
        // Try to call matchRealListings directly
        const directCallResult = await page.evaluate(() => {
            try {
                if (typeof matchRealListings === 'function') {
                    console.log('Calling matchRealListings directly...');
                    matchRealListings();
                    return 'Called successfully';
                } else {
                    return 'Function not found';
                }
            } catch (e) {
                return `Error: ${e.message}`;
            }
        });
        
        console.log(`   Direct call result: ${directCallResult}`);
        
        await page.screenshot({ path: 'debug-property-matching.png', fullPage: true });
        
    } catch (error) {
        console.error('\nError:', error.message);
    } finally {
        console.log('\nPress Enter to close browser...');
        await page.pause();  // Keep browser open for inspection
        await browser.close();
    }
})();