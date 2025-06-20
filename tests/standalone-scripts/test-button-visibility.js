const { chromium } = require('@playwright/test');

(async () => {
    console.log('Testing Find Actual Listings button visibility...\n');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        await page.goto('https://frameworkrealestatesolutions.com/portfolio-simulator-v3.html');
        await page.waitForLoadState('networkidle');
        
        // Add events
        await page.evaluate(() => {
            if (typeof addTimelineRow === 'function') {
                addTimelineRow();
                addTimelineRow();
            }
        });
        
        await page.waitForTimeout(1000);
        
        // Check button visibility
        const buttonInfo = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const findBtn = buttons.find(b => b.textContent.includes('Find Actual Listings'));
            
            if (!findBtn) return { found: false };
            
            const rect = findBtn.getBoundingClientRect();
            const style = window.getComputedStyle(findBtn);
            
            return {
                found: true,
                text: findBtn.textContent.trim(),
                onclick: findBtn.onclick?.toString().substring(0, 50),
                visible: {
                    display: style.display,
                    visibility: style.visibility,
                    opacity: style.opacity,
                    position: style.position,
                    zIndex: style.zIndex
                },
                dimensions: {
                    width: rect.width,
                    height: rect.height,
                    top: rect.top,
                    left: rect.left
                },
                parent: {
                    tagName: findBtn.parentElement?.tagName,
                    className: findBtn.parentElement?.className,
                    display: findBtn.parentElement ? window.getComputedStyle(findBtn.parentElement).display : null
                }
            };
        });
        
        console.log('Button analysis:', JSON.stringify(buttonInfo, null, 2));
        
        if (buttonInfo.found) {
            // Try to click using JavaScript
            console.log('\nTrying to click button using JavaScript...');
            const clickResult = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const findBtn = buttons.find(b => b.textContent.includes('Find Actual Listings'));
                
                if (findBtn) {
                    try {
                        findBtn.click();
                        return 'Clicked successfully';
                    } catch (e) {
                        return `Click error: ${e.message}`;
                    }
                }
                return 'Button not found';
            });
            
            console.log('Click result:', clickResult);
            
            await page.waitForTimeout(5000);
            
            // Check if properties were populated
            const results = await page.evaluate(() => {
                const inputs = document.querySelectorAll('#timelineTable input[placeholder*="roperty"]');
                return Array.from(inputs).slice(0, 3).map((input, i) => ({
                    index: i + 1,
                    value: input.value
                }));
            });
            
            console.log('\nProperty values after click:');
            results.forEach(r => console.log(`  Row ${r.index}: "${r.value}"`));
        }
        
        await page.screenshot({ path: 'button-visibility-test.png' });
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await browser.close();
    }
})();