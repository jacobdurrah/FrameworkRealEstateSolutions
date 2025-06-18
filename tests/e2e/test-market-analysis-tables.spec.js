const { test, expect } = require('@playwright/test');

test.describe('Market Analysis Table Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to Market Analysis page
        await page.goto('https://frameworkrealestatesolutions.com/market-analysis.html');
        
        // Wait for page to load
        await page.waitForSelector('h2:has-text("Detroit Real Estate Market Analysis")');
        
        // Enable AI Mode
        await page.check('#aiModeToggle');
    });

    test('Should query sales_transactions table, not recent_sales', async ({ page }) => {
        // Listen for network requests to capture the SQL
        let capturedSQL = '';
        page.on('response', async response => {
            if (response.url().includes('execute-sql')) {
                try {
                    const json = await response.json();
                    capturedSQL = json.sql || '';
                    console.log('Captured SQL:', capturedSQL);
                } catch (e) {}
            }
        });

        // Query for Jacob Durrah
        await page.fill('#queryInput', 'What properties did Jacob Durrah buy in Detroit?');
        await page.click('button:has-text("Run Analysis")');
        
        // Wait for SQL preview
        await page.waitForSelector('#sqlPreviewSection', { state: 'visible' });
        
        // Get the generated SQL
        const sqlCode = await page.locator('#sqlCode').textContent();
        console.log('Generated SQL:', sqlCode);
        
        // Verify it uses sales_transactions, NOT recent_sales
        expect(sqlCode.toLowerCase()).toContain('from sales_transactions');
        expect(sqlCode.toLowerCase()).not.toContain('from recent_sales');
        
        // Execute the query
        await page.click('button:has-text("Execute Query")');
        
        // Wait for results
        await page.waitForSelector('#resultsSection', { state: 'visible' });
        
        // Verify the executed SQL also used sales_transactions
        expect(capturedSQL.toLowerCase()).toContain('sales_transactions');
        expect(capturedSQL.toLowerCase()).not.toContain('recent_sales');
    });

    test('Should use correct field names (buyer_name, seller_name)', async ({ page }) => {
        // Test buyer search
        await page.fill('#queryInput', 'Show all properties bought by Smith');
        await page.click('button:has-text("Run Analysis")');
        
        await page.waitForSelector('#sqlCode');
        const buyerSQL = await page.locator('#sqlCode').textContent();
        
        // Should use buyer_name, not grantee
        expect(buyerSQL.toLowerCase()).toContain('buyer_name');
        expect(buyerSQL.toLowerCase()).not.toContain('grantee');
        
        // Test seller search
        await page.fill('#queryInput', 'Properties sold by Johnson');
        await page.click('button:has-text("Run Analysis")');
        
        await page.waitForTimeout(500); // Wait for new SQL
        const sellerSQL = await page.locator('#sqlCode').textContent();
        
        // Should use seller_name, not grantor
        expect(sellerSQL.toLowerCase()).toContain('seller_name');
        expect(sellerSQL.toLowerCase()).not.toContain('grantor');
    });

    test('Should handle zip code queries correctly', async ({ page }) => {
        await page.fill('#queryInput', 'Show all sales in 48214');
        await page.click('button:has-text("Run Analysis")');
        
        await page.waitForSelector('#sqlCode');
        const sql = await page.locator('#sqlCode').textContent();
        
        // Should query property_zip field
        expect(sql.toLowerCase()).toContain('property_zip');
        expect(sql).toContain('48214');
    });

    test('Should handle date range queries', async ({ page }) => {
        await page.fill('#queryInput', 'Show recent sales from last 30 days');
        await page.click('button:has-text("Run Analysis")');
        
        await page.waitForSelector('#sqlCode');
        const sql = await page.locator('#sqlCode').textContent();
        
        // Should still use sales_transactions with date filter
        expect(sql.toLowerCase()).toContain('from sales_transactions');
        expect(sql.toLowerCase()).toContain('sale_date');
        expect(sql.toLowerCase()).toMatch(/current_date|interval|days/);
    });

    test('Should handle cash sales queries', async ({ page }) => {
        await page.fill('#queryInput', 'List all cash sales above $100k in 2023');
        await page.click('button:has-text("Run Analysis")');
        
        await page.waitForSelector('#sqlCode');
        const sql = await page.locator('#sqlCode').textContent();
        
        // Should use sale_terms field
        expect(sql.toLowerCase()).toContain('sale_terms');
        expect(sql.toLowerCase()).toContain('cash');
        expect(sql).toContain('100000');
        expect(sql).toContain('2023');
    });

    test('Should handle property type queries', async ({ page }) => {
        await page.fill('#queryInput', 'Show all residential properties sold in Detroit');
        await page.click('button:has-text("Run Analysis")');
        
        await page.waitForSelector('#sqlCode');
        const sql = await page.locator('#sqlCode').textContent();
        
        // Should query from sales_transactions
        expect(sql.toLowerCase()).toContain('from sales_transactions');
        expect(sql.toLowerCase()).toContain('property_');
    });

    test('Should include ORDER BY and LIMIT clauses', async ({ page }) => {
        await page.fill('#queryInput', 'What are the most expensive sales this year?');
        await page.click('button:has-text("Run Analysis")');
        
        await page.waitForSelector('#sqlCode');
        const sql = await page.locator('#sqlCode').textContent();
        
        // Should have proper ordering and limit
        expect(sql.toLowerCase()).toContain('order by');
        expect(sql.toLowerCase()).toContain('limit');
        expect(sql.toLowerCase()).toContain('sales_transactions');
    });
});