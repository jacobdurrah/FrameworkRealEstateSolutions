import { test, expect } from '@playwright/test';

test.describe('Jacob Durrah Property Search', () => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  const localURL = 'http://localhost:5500';
  
  // Use production URL by default, fallback to local
  const testURL = process.env.TEST_ENV === 'local' ? localURL : baseURL;
  
  test('should find Jacob Durrah properties including 2404 Pennsylvania', async ({ page }) => {
    // Navigate to Market Analysis page
    await page.goto(`${testURL}/market-analysis.html`);
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("Detroit Real Estate Market Analysis")');
    
    // Enter the search query
    const queryInput = page.locator('textarea[placeholder*="What properties"]');
    await queryInput.fill('What properties did Jacob Durrah buy in Detroit?');
    
    // Click Run Analysis button
    await page.click('button:has-text("Run Analysis")');
    
    // Wait for results to load
    await page.waitForSelector('text=Found', { timeout: 30000 });
    
    // Check that results were returned
    const resultsText = await page.textContent('body');
    expect(resultsText).toContain('results for');
    
    // Verify the table has data
    const tableRows = page.locator('table tbody tr');
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThan(0);
    
    // Check for 2404 Pennsylvania specifically
    const pennsylvaniaRow = page.locator('tr:has-text("2404") :has-text("PENNSYLVANIA")');
    await expect(pennsylvaniaRow).toBeVisible({ timeout: 10000 });
    
    // Verify buyer name contains DURRAH
    const buyerCells = await page.locator('td:has-text("DURRAH")').count();
    expect(buyerCells).toBeGreaterThan(0);
    
    // Additional checks
    const addresses = await page.locator('table tbody tr td:nth-child(2)').allTextContents();
    console.log(`Found ${addresses.length} properties for Jacob Durrah`);
    
    // Log all addresses for debugging
    const durrahProperties = addresses.filter(addr => addr.includes('DURRAH'));
    console.log('Properties with DURRAH in buyer name:', durrahProperties);
    
    // Verify 2404 Pennsylvania is in the results
    const has2404Pennsylvania = addresses.some(addr => 
      addr.includes('2404') && addr.toUpperCase().includes('PENNSYLVANIA')
    );
    expect(has2404Pennsylvania).toBeTruthy();
  });

  test('should generate correct SQL for Jacob Durrah search', async ({ page }) => {
    // Make API call directly to test SQL generation
    const response = await page.request.post(`${testURL}/api/market/generate-sql`, {
      data: {
        prompt: 'What properties did Jacob Durrah buy in Detroit?'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    
    // Check generated SQL
    expect(result.sql).toBeDefined();
    console.log('Generated SQL:', result.sql);
    
    // Verify SQL uses correct pattern
    const sql = result.sql.toUpperCase();
    expect(sql).toContain('BUYER_NAME');
    expect(sql).toContain('ILIKE');
    
    // Should search for DURRAH or JACOB (flexible matching)
    const hasDurrah = sql.includes('%DURRAH%');
    const hasJacob = sql.includes('%JACOB%');
    expect(hasDurrah || hasJacob).toBeTruthy();
    
    // Should use OR for flexible matching
    if (hasDurrah && hasJacob) {
      expect(sql).toContain(' OR ');
    }
  });

  test('should execute SQL and return Jacob Durrah properties', async ({ page }) => {
    // First generate the SQL
    const generateResponse = await page.request.post(`${testURL}/api/market/generate-sql`, {
      data: {
        prompt: 'What properties did Jacob Durrah buy in Detroit?'
      }
    });
    
    const { sql } = await generateResponse.json();
    
    // Execute the SQL
    const executeResponse = await page.request.post(`${testURL}/api/market/execute-sql`, {
      data: { sql }
    });
    
    expect(executeResponse.ok()).toBeTruthy();
    const result = await executeResponse.json();
    
    // Verify results
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBeTruthy();
    expect(result.rowCount).toBeGreaterThan(0);
    
    // Check for 2404 Pennsylvania
    const has2404Pennsylvania = result.data.some(row => 
      row.property_address?.includes('2404') && 
      row.property_address?.toUpperCase().includes('PENNSYLVANIA')
    );
    
    expect(has2404Pennsylvania).toBeTruthy();
    
    // Log results for debugging
    console.log(`Total properties found: ${result.rowCount}`);
    const pennsylvaniaProperties = result.data.filter(row => 
      row.property_address?.toUpperCase().includes('PENNSYLVANIA')
    );
    console.log(`Pennsylvania properties: ${pennsylvaniaProperties.length}`);
  });
});