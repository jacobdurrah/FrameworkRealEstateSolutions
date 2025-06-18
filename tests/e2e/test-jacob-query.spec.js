const { test, expect } = require('@playwright/test');

test.describe('Jacob Durrah Query Test', () => {
    test('Should successfully query properties bought by Jacob Durrah', async ({ page }) => {
        // Navigate to Market Analysis page
        await page.goto('https://frameworkrealestatesolutions.com/market-analysis.html');
        
        // Wait for page to load
        await page.waitForSelector('h1:has-text("Detroit Real Estate Market Analysis")');
        
        // Enable AI Mode
        await page.check('#aiModeToggle');
        
        // Enter the specific query
        await page.fill('#queryInput', 'What properties did Jacob Durrah buy in Detroit?');
        
        // Click Run Analysis
        await page.click('button:has-text("Run Analysis")');
        
        // Wait for results or error
        const resultContainer = page.locator('#resultsContainer');
        
        // Check if we get results or error
        try {
            // Wait for either success or error
            await page.waitForSelector('.results-table, .error-message', { timeout: 15000 });
            
            // Check if error occurred
            const errorElement = await page.$('.error-message');
            if (errorElement) {
                const errorText = await errorElement.textContent();
                console.error('Error occurred:', errorText);
                
                // Take screenshot of error
                await page.screenshot({ 
                    path: 'tests/screenshots/jacob-query-error.png',
                    fullPage: true 
                });
                
                // Fail the test with error details
                expect(errorText).not.toContain('API returned an HTML error page');
            } else {
                // Success - verify SQL was generated
                const sqlPreview = await page.$('#sqlPreview');
                expect(sqlPreview).toBeTruthy();
                
                const sqlText = await sqlPreview.textContent();
                expect(sqlText.toLowerCase()).toContain('jacob');
                expect(sqlText.toLowerCase()).toContain('durrah');
                
                // Verify results table exists
                const resultsTable = await page.$('.results-table');
                expect(resultsTable).toBeTruthy();
                
                console.log('SUCCESS: Query executed successfully');
            }
        } catch (error) {
            // Take screenshot on timeout
            await page.screenshot({ 
                path: 'tests/screenshots/jacob-query-timeout.png',
                fullPage: true 
            });
            throw error;
        }
    });
    
    test('Should handle API errors gracefully', async ({ page }) => {
        // Test with intercepted network error
        await page.route('**/api/market/generate-sql', route => {
            route.fulfill({
                status: 500,
                contentType: 'text/html',
                body: '<html><body>Internal Server Error</body></html>'
            });
        });
        
        await page.goto('https://frameworkrealestatesolutions.com/market-analysis.html');
        await page.check('#aiModeToggle');
        await page.fill('#queryInput', 'What properties did Jacob Durrah buy in Detroit?');
        await page.click('button:has-text("Run Analysis")');
        
        // Should show error message
        const errorMessage = await page.waitForSelector('.error-message');
        const errorText = await errorMessage.textContent();
        expect(errorText).toContain('API returned an HTML error page');
    });
});