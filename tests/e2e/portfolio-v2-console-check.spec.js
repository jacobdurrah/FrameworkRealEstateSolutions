/**
 * Console error check for Portfolio Simulator V2
 */
const { test, expect } = require('@playwright/test');

test.describe('Portfolio V2 Console Check', () => {
    test('should load without console errors', async ({ page }) => {
        const consoleMessages = [];
        const consoleErrors = [];
        
        // Listen to console events
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            
            consoleMessages.push({ type, text });
            
            if (type === 'error') {
                consoleErrors.push(text);
            }
        });
        
        // Also listen for page errors
        page.on('pageerror', error => {
            consoleErrors.push(`Page error: ${error.message}`);
        });
        
        // Navigate to the page
        await page.goto('/portfolio-simulator-v2.html');
        
        // Wait for page to fully load
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Check for errors
        if (consoleErrors.length > 0) {
            console.log('Console errors found:');
            consoleErrors.forEach(error => console.log('  - ' + error));
        }
        
        // Log all console messages for debugging
        console.log('\nAll console messages:');
        consoleMessages.forEach(msg => {
            console.log(`  [${msg.type}] ${msg.text}`);
        });
        
        // Test should pass if no errors
        expect(consoleErrors).toHaveLength(0);
        
        // Also check if key functions are available
        const functionsAvailable = await page.evaluate(() => {
            return {
                loanCalc: typeof window.LoanCalculator !== 'undefined',
                updateTimeline: typeof window.updateTimeline === 'function',
                timelineData: Array.isArray(window.timelineData),
                portfolioState: typeof window.portfolioState === 'object'
            };
        });
        
        console.log('\nFunction availability:');
        console.log(functionsAvailable);
        
        expect(functionsAvailable.loanCalc).toBe(true);
        expect(functionsAvailable.updateTimeline).toBe(true);
        expect(functionsAvailable.timelineData).toBe(true);
        expect(functionsAvailable.portfolioState).toBe(true);
    });
});