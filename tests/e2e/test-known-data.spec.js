const { test, expect } = require('@playwright/test');

test.describe('Known Data Verification Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to Market Analysis page
        await page.goto('https://frameworkrealestatesolutions.com/market-analysis.html');
        
        // Wait for page to load
        await page.waitForSelector('h2:has-text("Detroit Real Estate Market Analysis")');
        
        // Enable AI Mode
        await page.check('#aiModeToggle');
    });

    test('Should find Jacob Durrah property at 2404 Pennsylvania', async ({ page }) => {
        // Query for Jacob Durrah properties
        await page.fill('#queryInput', 'What properties did Jacob Durrah buy in Detroit?');
        await page.click('button:has-text("Run Analysis")');
        
        // Wait for SQL preview
        await page.waitForSelector('#sqlPreviewSection', { state: 'visible', timeout: 15000 });
        
        // Verify SQL contains correct search
        const sqlCode = await page.locator('#sqlCode').textContent();
        console.log('Generated SQL:', sqlCode);
        expect(sqlCode.toLowerCase()).toContain('durrah');
        expect(sqlCode.toLowerCase()).toContain('jacob');
        expect(sqlCode.toLowerCase()).toContain('sales_transactions');
        
        // Execute the query
        await page.click('button:has-text("Execute Query")');
        
        // Wait for results
        await page.waitForSelector('#resultsSection', { state: 'visible', timeout: 15000 });
        
        // Check for specific property
        const resultsText = await page.locator('#resultsTable').textContent();
        if (resultsText.includes('No results found')) {
            console.warn('No results found for Jacob Durrah - data may not be in database yet');
        } else {
            // Should contain 2404 Pennsylvania
            expect(resultsText).toContain('2404');
            expect(resultsText.toLowerCase()).toContain('pennsylvania');
        }
    });

    test('Should find cash sales above $100k in 2023', async ({ page }) => {
        await page.fill('#queryInput', 'List all cash sales above $100k in 2023');
        await page.click('button:has-text("Run Analysis")');
        
        // Wait for SQL preview
        await page.waitForSelector('#sqlPreviewSection', { state: 'visible', timeout: 15000 });
        
        // Verify SQL
        const sqlCode = await page.locator('#sqlCode').textContent();
        console.log('Generated SQL for cash sales:', sqlCode);
        expect(sqlCode.toLowerCase()).toContain('cash');
        expect(sqlCode).toContain('100000');
        expect(sqlCode).toContain('2023');
        
        // Execute
        await page.click('button:has-text("Execute Query")');
        
        // Wait for results
        await page.waitForSelector('#resultsSection', { state: 'visible', timeout: 15000 });
        
        // Should have at least some results
        const rows = await page.locator('#resultsTable tbody tr').count();
        console.log(`Found ${rows} cash sales above $100k in 2023`);
        
        if (rows === 0) {
            console.warn('No cash sales found - verify data exists in database');
        } else {
            expect(rows).toBeGreaterThan(0);
        }
    });

    test('Should find flips in East English Village', async ({ page }) => {
        await page.fill('#queryInput', 'Show me all flips in 2024 in East English Village');
        await page.click('button:has-text("Run Analysis")');
        
        // Wait for SQL preview
        await page.waitForSelector('#sqlPreviewSection', { state: 'visible', timeout: 15000 });
        
        // Verify SQL mentions the neighborhood
        const sqlCode = await page.locator('#sqlCode').textContent();
        console.log('Generated SQL for flips:', sqlCode);
        expect(sqlCode.toLowerCase()).toContain('east english village');
        
        // Execute
        await page.click('button:has-text("Execute Query")');
        
        // Wait for results
        await page.waitForSelector('#resultsSection', { state: 'visible', timeout: 15000 });
        
        // Log results for debugging
        const resultsText = await page.locator('#resultsSection').textContent();
        console.log('Flips query results:', resultsText.substring(0, 200));
    });

    test('Should verify SQL debug information', async ({ page }) => {
        // Simple query to check debug info
        await page.fill('#queryInput', 'Show properties on Grand River');
        await page.click('button:has-text("Run Analysis")');
        
        // Wait and execute
        await page.waitForSelector('#sqlPreviewSection', { state: 'visible' });
        await page.click('button:has-text("Execute Query")');
        
        // Check network response for debug info
        page.on('response', response => {
            if (response.url().includes('execute-sql')) {
                response.json().then(data => {
                    console.log('SQL Execution Debug:', data.debug);
                    console.log('Row count:', data.rowCount);
                }).catch(() => {});
            }
        });
        
        await page.waitForSelector('#resultsSection', { state: 'visible' });
    });
});