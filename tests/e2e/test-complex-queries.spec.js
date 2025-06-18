const { test, expect } = require('@playwright/test');

test.describe('Complex Query Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to Market Analysis page
        await page.goto('https://frameworkrealestatesolutions.com/market-analysis.html');
        
        // Wait for page to load
        await page.waitForSelector('h2:has-text("Detroit Real Estate Market Analysis")');
        
        // Enable AI Mode
        await page.check('#aiModeToggle');
    });

    test('Should handle "most active participants" query without CASE statements', async ({ page }) => {
        // This type of query previously caused errors
        await page.fill('#queryInput', 'Who made the most transactions in 2024?');
        await page.click('button:has-text("Run Analysis")');
        
        // Wait for SQL preview
        await page.waitForSelector('#sqlPreviewSection', { state: 'visible', timeout: 15000 });
        
        // Get the generated SQL
        const sqlCode = await page.locator('#sqlCode').textContent();
        console.log('Generated SQL:', sqlCode);
        
        // Verify it doesn't use CASE in GROUP BY
        expect(sqlCode.toLowerCase()).not.toContain('case');
        expect(sqlCode.toLowerCase()).toContain('group by');
        
        // Should query either buyer_name or seller_name, not both in complex way
        const hasBuyerQuery = sqlCode.toLowerCase().includes('buyer_name');
        const hasSellerQuery = sqlCode.toLowerCase().includes('seller_name');
        
        // Should focus on one or the other, not try to combine with CASE
        if (hasBuyerQuery && hasSellerQuery) {
            // If both are present, ensure it's not using CASE
            expect(sqlCode.toLowerCase()).not.toContain('case when');
        }
        
        // Execute the query - should not get 500 error
        await page.click('button:has-text("Execute Query")');
        
        // Wait for results or specific error
        const response = await page.waitForResponse(response => 
            response.url().includes('execute-sql'), 
            { timeout: 10000 }
        );
        
        expect(response.status()).not.toBe(500);
        
        if (response.status() === 400) {
            const error = await response.json();
            console.log('Query failed with:', error);
            // Should not be a CASE statement error
            expect(error.error).not.toContain('CASE statement in GROUP BY');
        }
    });

    test('Should handle "most active buyers" query correctly', async ({ page }) => {
        await page.fill('#queryInput', 'Who are the most active buyers in 2024?');
        await page.click('button:has-text("Run Analysis")');
        
        await page.waitForSelector('#sqlCode');
        const sql = await page.locator('#sqlCode').textContent();
        
        // Should query buyer_name with GROUP BY
        expect(sql.toLowerCase()).toContain('buyer_name');
        expect(sql.toLowerCase()).toContain('group by buyer_name');
        expect(sql.toLowerCase()).toContain('count(*)');
        expect(sql.toLowerCase()).not.toContain('case');
    });

    test('Should handle "most active sellers" query correctly', async ({ page }) => {
        await page.fill('#queryInput', 'Who sold the most properties in 2024?');
        await page.click('button:has-text("Run Analysis")');
        
        await page.waitForSelector('#sqlCode');
        const sql = await page.locator('#sqlCode').textContent();
        
        // Should query seller_name with GROUP BY
        expect(sql.toLowerCase()).toContain('seller_name');
        expect(sql.toLowerCase()).toContain('group by seller_name');
        expect(sql.toLowerCase()).toContain('count(*)');
        expect(sql.toLowerCase()).not.toContain('case');
    });

    test('Should handle "top spenders" query', async ({ page }) => {
        await page.fill('#queryInput', 'Who spent the most money buying properties?');
        await page.click('button:has-text("Run Analysis")');
        
        await page.waitForSelector('#sqlCode');
        const sql = await page.locator('#sqlCode').textContent();
        
        // Should use SUM and GROUP BY
        expect(sql.toLowerCase()).toContain('sum(sale_price)');
        expect(sql.toLowerCase()).toContain('group by buyer_name');
        expect(sql.toLowerCase()).not.toContain('case');
    });

    test('Should successfully execute aggregate queries', async ({ page }) => {
        // Test a simple aggregate that should work
        await page.fill('#queryInput', 'Show me the top 5 buyers by number of purchases in 2024');
        await page.click('button:has-text("Run Analysis")');
        
        await page.waitForSelector('#sqlCode');
        
        // Execute the query
        await page.click('button:has-text("Execute Query")');
        
        // Should get results without error
        const errorVisible = await page.locator('.error-message').isVisible();
        if (errorVisible) {
            const error = await page.locator('.error-message').textContent();
            console.log('Error:', error);
            // Should not be database error
            expect(error).not.toContain('Database query failed');
            expect(error).not.toContain('CASE statement');
        }
    });
});