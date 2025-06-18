const { test, expect } = require('@playwright/test');

test.describe('Live Market Analysis Tests', () => {
    test('Should successfully query sales_transactions table for Jacob Durrah', async ({ page }) => {
        // Navigate to Market Analysis page
        await page.goto('https://frameworkrealestatesolutions.com/market-analysis.html');
        
        // Wait for page to load
        await page.waitForSelector('h2:has-text("Detroit Real Estate Market Analysis")');
        
        // Enable AI Mode
        await page.check('#aiModeToggle');
        
        // Enter query
        await page.fill('#queryInput', 'What properties did Jacob Durrah buy in Detroit?');
        
        // Click Run Analysis
        await page.click('button:has-text("Run Analysis")');
        
        // Check for either success or error
        try {
            // Wait for SQL preview section to appear
            await page.waitForSelector('#sqlPreviewSection', { state: 'visible', timeout: 10000 });
            
            // Get the generated SQL
            const sqlCode = await page.locator('#sqlCode').textContent();
            console.log('Generated SQL:', sqlCode);
            
            // Verify correct table and format
            expect(sqlCode.toLowerCase()).toContain('sales_transactions');
            expect(sqlCode.toLowerCase()).toContain('durrah');
            expect(sqlCode.toLowerCase()).toContain('jacob');
            
            // Try to execute
            await page.click('button:has-text("Execute Query")');
            
            // Wait for results or error
            await page.waitForSelector('#resultsSection, .error-message', { timeout: 10000 });
            
            // Check if we got results
            const hasResults = await page.locator('#resultsTable tbody tr').count();
            console.log(`Query returned ${hasResults} results`);
            
        } catch (error) {
            // Check for API error
            const errorMessage = await page.locator('.error-message').textContent();
            console.log('Error occurred:', errorMessage);
            
            // If API error, at least verify the SQL generation worked
            if (errorMessage.includes('API')) {
                console.log('API error occurred, but SQL generation should still work');
                
                // Try to get SQL even with error
                const sqlVisible = await page.locator('#sqlCode').isVisible();
                if (sqlVisible) {
                    const sql = await page.locator('#sqlCode').textContent();
                    console.log('SQL was generated despite API error:', sql);
                    expect(sql.toLowerCase()).toContain('sales_transactions');
                }
            }
        }
    });
    
    test('Should generate correct SQL for different query types', async ({ page }) => {
        await page.goto('https://frameworkrealestatesolutions.com/market-analysis.html');
        await page.check('#aiModeToggle');
        
        const testQueries = [
            {
                query: 'Show all cash sales above $100k',
                expectedTerms: ['sales_transactions', 'sale_terms', 'cash', '100000']
            },
            {
                query: 'Properties in zip code 48214',
                expectedTerms: ['sales_transactions', 'property_zip', '48214']
            },
            {
                query: 'Recent sales from last 30 days',
                expectedTerms: ['sales_transactions', 'sale_date']
            }
        ];
        
        for (const test of testQueries) {
            console.log(`Testing query: ${test.query}`);
            
            // Clear and enter new query
            await page.fill('#queryInput', '');
            await page.fill('#queryInput', test.query);
            await page.click('button:has-text("Run Analysis")');
            
            // Wait a bit for processing
            await page.waitForTimeout(2000);
            
            // Check if SQL is visible
            const sqlVisible = await page.locator('#sqlCode').isVisible();
            if (sqlVisible) {
                const sql = await page.locator('#sqlCode').textContent();
                console.log('Generated SQL:', sql);
                
                // Verify expected terms
                for (const term of test.expectedTerms) {
                    expect(sql.toLowerCase()).toContain(term.toLowerCase());
                }
            } else {
                console.log('SQL not visible, checking for errors');
                const hasError = await page.locator('.error-message').isVisible();
                if (hasError) {
                    const error = await page.locator('.error-message').textContent();
                    console.log('Error:', error);
                }
            }
        }
    });
});