const { chromium } = require('@playwright/test');

(async () => {
    console.log('Testing when Find Actual Listings becomes visible...\n');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        await page.goto('https://frameworkrealestatesolutions.com/portfolio-simulator-v3.html');
        await page.waitForLoadState('networkidle');
        
        // Check initial visibility
        console.log('1. Initial visibility of listings-toggle:');
        let visibility = await page.evaluate(() => {
            const toggle = document.querySelector('.listings-toggle');
            if (!toggle) return { exists: false };
            
            const style = window.getComputedStyle(toggle);
            const button = toggle.querySelector('button');
            
            return {
                exists: true,
                display: style.display,
                visibility: style.visibility,
                height: toggle.offsetHeight,
                buttonHeight: button ? button.offsetHeight : 0,
                parentDisplay: toggle.parentElement ? window.getComputedStyle(toggle.parentElement).display : null
            };
        });
        console.log(visibility);
        
        // Try different methods to make it visible
        console.log('\n2. Adding timeline events...');
        await page.evaluate(() => {
            if (typeof addTimelineRow === 'function') {
                addTimelineRow();
                addTimelineRow();
            }
        });
        
        await page.waitForTimeout(1000);
        
        // Check visibility again
        visibility = await page.evaluate(() => {
            const toggle = document.querySelector('.listings-toggle');
            const button = toggle?.querySelector('button');
            return {
                toggleHeight: toggle?.offsetHeight || 0,
                buttonHeight: button?.offsetHeight || 0,
                buttonWidth: button?.offsetWidth || 0
            };
        });
        console.log('After adding events:', visibility);
        
        // Try using AI strategy
        console.log('\n3. Generating AI strategy...');
        await page.fill('#goalInput', 'Build rental portfolio');
        
        // Click generate
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const genBtn = buttons.find(b => b.textContent.includes('Generate') && !b.textContent.includes('Apply'));
            if (genBtn) genBtn.click();
        });
        
        // Wait for strategy
        try {
            await page.waitForFunction(() => {
                const elements = document.querySelectorAll('.strategy-display, .ai-response, [class*="strategy"]');
                return Array.from(elements).some(el => el.textContent.length > 100);
            }, { timeout: 15000 });
            
            console.log('Strategy generated');
            
            // Apply strategy
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const applyBtn = buttons.find(b => b.textContent.toLowerCase().includes('apply'));
                if (applyBtn) applyBtn.click();
            });
            
            await page.waitForTimeout(2000);
        } catch (e) {
            console.log('Strategy generation timeout');
        }
        
        // Final visibility check
        console.log('\n4. Final visibility check:');
        const finalCheck = await page.evaluate(() => {
            const toggle = document.querySelector('.listings-toggle');
            const button = toggle?.querySelector('button');
            
            // Check if there's any parent element hiding it
            let element = toggle;
            const hiddenParents = [];
            
            while (element && element !== document.body) {
                const style = window.getComputedStyle(element);
                if (style.display === 'none' || style.visibility === 'hidden') {
                    hiddenParents.push({
                        tag: element.tagName,
                        class: element.className,
                        id: element.id,
                        display: style.display,
                        visibility: style.visibility
                    });
                }
                element = element.parentElement;
            }
            
            return {
                toggleExists: !!toggle,
                buttonExists: !!button,
                toggleDimensions: toggle ? {
                    width: toggle.offsetWidth,
                    height: toggle.offsetHeight,
                    clientHeight: toggle.clientHeight
                } : null,
                buttonDimensions: button ? {
                    width: button.offsetWidth,
                    height: button.offsetHeight,
                    clientHeight: button.clientHeight
                } : null,
                hiddenParents: hiddenParents,
                timelineRows: document.querySelectorAll('#timelineTable tbody tr').length
            };
        });
        
        console.log(JSON.stringify(finalCheck, null, 2));
        
        // If button still has no dimensions, try to fix it
        if (finalCheck.buttonDimensions && finalCheck.buttonDimensions.height === 0) {
            console.log('\n5. Attempting to fix button dimensions...');
            
            await page.evaluate(() => {
                const button = document.querySelector('.listings-toggle button');
                if (button) {
                    // Remove any styles that might be hiding it
                    button.style.display = 'inline-block';
                    button.style.visibility = 'visible';
                    button.style.height = 'auto';
                    button.style.width = 'auto';
                    button.style.padding = '0.5rem 1rem';
                }
            });
            
            // Try clicking now
            const clickResult = await page.evaluate(() => {
                const button = document.querySelector('.listings-toggle button');
                if (button) {
                    button.click();
                    return 'Clicked';
                }
                return 'Not found';
            });
            
            console.log('Click result after fix:', clickResult);
            
            await page.waitForTimeout(5000);
            
            // Check properties
            const props = await page.evaluate(() => {
                const inputs = document.querySelectorAll('#timelineTable input[placeholder*="roperty"]');
                return Array.from(inputs).slice(0, 3).map(i => i.value);
            });
            
            console.log('\nProperty values:', props);
        }
        
        await page.screenshot({ path: 'listings-visibility-test.png', fullPage: true });
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await browser.close();
    }
})();