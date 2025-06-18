const { test, expect } = require('@playwright/test');

test.describe('AI Market Analysis Queries', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to Market Analysis page
        await page.goto('https://frameworkrealestatesolutions.com/market-analysis.html');
        
        // Wait for page to load
        await page.waitForSelector('h2:has-text("Detroit Real Estate Market Analysis")');
        
        // Enable AI Mode
        await page.check('#aiModeToggle');
    });

    test('Should handle queries with no results', async ({ page }) => {
        // Query for a name that likely doesn't exist
        await page.fill('#queryInput', 'What properties did Jacob Durrah buy in Detroit?');
        await page.click('button:has-text("Run Analysis")');
        
        // Wait for SQL preview
        await page.waitForSelector('#sqlPreview:not(:empty)', { timeout: 15000 });
        
        // Verify SQL was generated
        const sqlText = await page.locator('#sqlPreview').textContent();
        expect(sqlText.toLowerCase()).toContain('jacob');
        expect(sqlText.toLowerCase()).toContain('durrah');
        
        // Should show "No results found" message
        await page.waitForSelector('text=No results found', { timeout: 10000 });
        console.log('SUCCESS: Handled query with no results correctly');
    });

    test('Should return results for cash sales query', async ({ page }) => {
        // Query for cash sales which should have results
        await page.fill('#queryInput', 'Show me all cash sales above $100k in 2023');
        await page.click('button:has-text("Run Analysis")');
        
        // Wait for SQL preview
        await page.waitForSelector('#sqlPreview:not(:empty)', { timeout: 15000 });
        
        // Verify SQL was generated
        const sqlText = await page.locator('#sqlPreview').textContent();
        expect(sqlText.toLowerCase()).toContain('cash');
        expect(sqlText.toLowerCase()).toContain('100000');
        
        // Should show results table with data
        await page.waitForSelector('.results-table tbody tr', { timeout: 15000 });
        
        // Count results
        const rowCount = await page.locator('.results-table tbody tr').count();
        console.log(`SUCCESS: Found ${rowCount} cash sales above $100k`);
        expect(rowCount).toBeGreaterThan(0);
    });

    test('Should handle top buyers query', async ({ page }) => {
        // Query for top buyers
        await page.fill('#queryInput', 'Who are the top 10 buyers in 2024?');
        await page.click('button:has-text("Run Analysis")');
        
        // Wait for SQL preview
        await page.waitForSelector('#sqlPreview:not(:empty)', { timeout: 15000 });
        
        // Verify SQL was generated with GROUP BY
        const sqlText = await page.locator('#sqlPreview').textContent();
        expect(sqlText.toLowerCase()).toContain('group by');
        expect(sqlText.toLowerCase()).toContain('count');
        expect(sqlText.toLowerCase()).toContain('limit 10');
        
        // Should show results
        await page.waitForSelector('.results-table tbody tr', { timeout: 15000 });
        
        const rowCount = await page.locator('.results-table tbody tr').count();
        console.log(`SUCCESS: Found ${rowCount} top buyers`);
        expect(rowCount).toBeGreaterThanOrEqual(1);
        expect(rowCount).toBeLessThanOrEqual(10);
    });

    test('Should handle property address search', async ({ page }) => {
        // Query for properties on a specific street
        await page.fill('#queryInput', 'Show all properties on Grand River');
        await page.click('button:has-text("Run Analysis")');
        
        // Wait for SQL preview
        await page.waitForSelector('#sqlPreview:not(:empty)', { timeout: 15000 });
        
        // Verify SQL was generated
        const sqlText = await page.locator('#sqlPreview').textContent();
        expect(sqlText.toLowerCase()).toContain('grand river');
        expect(sqlText.toLowerCase()).toContain('ilike');
        
        // Wait for either results or no results message
        await Promise.race([
            page.waitForSelector('.results-table tbody tr', { timeout: 15000 }),
            page.waitForSelector('text=No results found', { timeout: 15000 })
        ]);
        
        console.log('SUCCESS: Property address search completed');
    });

    test('Should handle date range queries', async ({ page }) => {
        // Query for recent flips
        await page.fill('#queryInput', 'List all flips in the past year');
        await page.click('button:has-text("Run Analysis")');
        
        // Wait for SQL preview
        await page.waitForSelector('#sqlPreview:not(:empty)', { timeout: 15000 });
        
        // Verify SQL was generated with date logic
        const sqlText = await page.locator('#sqlPreview').textContent();
        expect(sqlText.toLowerCase()).toContain('date');
        
        // Wait for response
        await Promise.race([
            page.waitForSelector('.results-table tbody tr', { timeout: 15000 }),
            page.waitForSelector('text=No results found', { timeout: 15000 })
        ]);
        
        console.log('SUCCESS: Date range query completed');
    });
});